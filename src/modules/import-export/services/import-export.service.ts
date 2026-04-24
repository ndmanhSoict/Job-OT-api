import { Express } from 'express';
import { AppError } from '@shared/helpers/app-error';
import { ErrorCode } from '@shared/constants/error-codes';
import { AuditAction, AssetType } from '@shared/constants/enums';
import { assertSpreadsheetMagicBytes } from '@shared/helpers/file-storage.helper';
import { createCsvBuffer, createXlsxBuffer, parseXlsxBuffer } from '@shared/helpers/spreadsheet.helper';
import { writeAuditLog } from '@middleware/audit-log.middleware';
import { QueryImportTemplateDto } from '../dto/query-import-template.dto';
import { ImportAssetDto } from '../dto/import-asset.dto';
import { QueryExportDto } from '../dto/query-export.dto';
import { ImportExportRepository } from '../repositories/import-export.repository';

const TEMPLATE_HEADERS = [
  'title',
  'application_number',
  'application_date',
  'publication_number',
  'publication_date',
  'grant_number',
  'grant_date',
  'expiry_date',
  'status',
  'applicant_name',
  'province_code',
  'district_code',
];

function valueOrEmpty(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function parseIds(ids?: string): string[] | undefined {
  if (!ids?.trim()) return undefined;
  const values = ids
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (values.some((item) => !uuidRegex.test(item))) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, 400, 'Danh sách ids chứa UUID không hợp lệ');
  }

  return values;
}

export class ImportExportService {
  private repo = new ImportExportRepository();

  buildTemplate(dto: QueryImportTemplateDto) {
    const rows = [
      TEMPLATE_HEADERS,
      ['', '', '', '', '', '', '', '', '', '', 'BN', ''],
    ];

    return {
      fileName: `template_${dto.asset_type}.xlsx`,
      buffer: createXlsxBuffer(`${dto.asset_type}_template`, rows),
    };
  }

  async importFromExcel(
    dto: ImportAssetDto,
    file: Express.Multer.File | undefined,
    userId: string,
    ipAddress?: string
  ) {
    if (!file) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 400, 'Thiếu file import');
    }
    if (file.size > 50 * 1024 * 1024) {
      throw new AppError(ErrorCode.UPLOAD_FILE_TOO_LARGE, 400, 'File import vượt quá 50MB');
    }
    assertSpreadsheetMagicBytes(file.buffer);

    const rows = parseXlsxBuffer(file.buffer);
    if (rows.length < 1) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 400, 'File import không có dữ liệu');
    }

    const headers = rows[0].map((header) => header.trim());
    const dataRows = rows.slice(1).filter((row) => row.some((cell) => String(cell ?? '').trim()));
    const result = {
      total_rows: dataRows.length,
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [] as Array<{ row: number; message: string }>,
    };

    for (let index = 0; index < dataRows.length; index += 1) {
      const row = dataRows[index];
      const rowNumber = index + 2;
      const payload = headers.reduce<Record<string, string>>((acc, header, headerIndex) => {
        acc[header] = row[headerIndex] ?? '';
        return acc;
      }, {});

      if (!payload.title?.trim()) {
        result.failed += 1;
        result.errors.push({ row: rowNumber, message: "Thiếu trường 'title'" });
        continue;
      }

      try {
        const existing = payload.application_number
          ? await this.repo.findByApplicationNumber(payload.application_number)
          : null;

        if (existing && dto.on_duplicate === 'skip') {
          result.skipped += 1;
          continue;
        }

        const upsertData = {
          asset_type: dto.asset_type as AssetType,
          title: payload.title,
          application_number: payload.application_number || undefined,
          application_date: payload.application_date ? new Date(payload.application_date) : undefined,
          publication_number: payload.publication_number || undefined,
          publication_date: payload.publication_date ? new Date(payload.publication_date) : undefined,
          grant_number: payload.grant_number || undefined,
          grant_date: payload.grant_date ? new Date(payload.grant_date) : undefined,
          expiry_date: payload.expiry_date ? new Date(payload.expiry_date) : undefined,
          status: (payload.status as never) || undefined,
          applicant_name: payload.applicant_name || undefined,
          province_code: payload.province_code || 'BN',
          district_code: payload.district_code || undefined,
          updated_by: userId,
          created_by: userId,
        };

        if (existing) {
          await this.repo.update(existing.id, upsertData);
        } else {
          await this.repo.create(upsertData);
        }

        result.imported += 1;
      } catch (error) {
        result.failed += 1;
        result.errors.push({
          row: rowNumber,
          message: error instanceof Error ? error.message : 'Import thất bại',
        });
      }
    }

    await writeAuditLog({
      userId,
      action: AuditAction.IMPORT,
      entityType: 'ip_assets',
      newValue: result as unknown as Record<string, unknown>,
      ipAddress,
    });

    return result;
  }

  async exportPublic(query: QueryExportDto) {
    const ids = parseIds(query.ids);
    const assets = await this.repo.findManyForExport(query, ids);

    if (assets.length > 100) {
      throw new AppError(
        ErrorCode.UNPROCESSABLE_ENTITY,
        422,
        'Guest export giới hạn tối đa 100 bản ghi. Vui lòng lọc dữ liệu cụ thể hơn.'
      );
    }

    const rows = [
      ['id', 'asset_type', 'title', 'application_number', 'application_date',
        'grant_number', 'grant_date', 'expiry_date', 'status', 'applicant_name', 'province_code'],
      ...assets.map((asset) => [
        asset.id,
        asset.asset_type,
        valueOrEmpty(asset.title),
        valueOrEmpty(asset.application_number),
        valueOrEmpty(asset.application_date),
        valueOrEmpty(asset.grant_number),
        valueOrEmpty(asset.grant_date),
        valueOrEmpty(asset.expiry_date),
        valueOrEmpty(asset.status),
        valueOrEmpty(asset.applicant_name),
        valueOrEmpty(asset.province_code),
      ]),
    ];

    const format = query.format ?? 'excel';
    const fileName = format === 'csv' ? 'ip_assets_public.csv' : 'ip_assets_public.xlsx';
    const buffer = format === 'csv' ? createCsvBuffer(rows) : createXlsxBuffer('ip_assets', rows);
    const contentType =
      format === 'csv'
        ? 'text/csv; charset=utf-8'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    return { fileName, buffer, contentType };
  }

  async exportAssets(query: QueryExportDto, userId: string, ipAddress?: string) {
    const ids = parseIds(query.ids);
    const assets = await this.repo.findManyForExport(query, ids);
    if (assets.length > 5000) {
      throw new AppError(
        ErrorCode.UNPROCESSABLE_ENTITY,
        422,
        'Số lượng bản ghi export vượt quá giới hạn 5000'
      );
    }

    const rows = [
      ['id', 'asset_type', ...TEMPLATE_HEADERS],
      ...assets.map((asset) => [
        asset.id,
        asset.asset_type,
        valueOrEmpty(asset.title),
        valueOrEmpty(asset.application_number),
        valueOrEmpty(asset.application_date),
        valueOrEmpty(asset.publication_number),
        valueOrEmpty(asset.publication_date),
        valueOrEmpty(asset.grant_number),
        valueOrEmpty(asset.grant_date),
        valueOrEmpty(asset.expiry_date),
        valueOrEmpty(asset.status),
        valueOrEmpty(asset.applicant_name),
        valueOrEmpty(asset.province_code),
        valueOrEmpty(asset.district_code),
      ]),
    ];

    const format = query.format ?? 'excel';
    const fileName = format === 'csv' ? 'ip_assets_export.csv' : 'ip_assets_export.xlsx';
    const buffer = format === 'csv' ? createCsvBuffer(rows) : createXlsxBuffer('ip_assets', rows);
    const contentType =
      format === 'csv'
        ? 'text/csv; charset=utf-8'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    await writeAuditLog({
      userId,
      action: AuditAction.EXPORT,
      entityType: 'ip_assets',
      newValue: {
        format,
        total: assets.length,
        ids: ids ?? [],
      },
      ipAddress,
    });

    return { fileName, buffer, contentType };
  }
}
