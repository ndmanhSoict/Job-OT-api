import { IpAsset } from '@models/ip-asset.entity';
import { IpAssetRepository } from '../repositories/ip-asset.repository';
import { CreateIpAssetDto, UpdateIpAssetDto } from '../dto/create-ip-asset.dto';
import { QueryIpAssetDto } from '../dto/query-ip-asset.dto';
import { AppError } from '@shared/helpers/app-error';
import { ErrorCode } from '@shared/constants/error-codes';
import { AuditAction } from '@shared/constants/enums';
import { buildPaginationMeta } from '@shared/helpers/pagination.helper';
import { writeAuditLog } from '@middleware/audit-log.middleware';

/** Convert ISO date string → Date object, hoặc trả undefined nếu không có giá trị */
function toDate(value?: string): Date | undefined {
  return value ? new Date(value) : undefined;
}

export class IpAssetService {
  private repo = new IpAssetRepository();

  async list(query: QueryIpAssetDto, page: number, limit: number) {
    const [items, total] = await this.repo.findMany(query, page, limit);
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async getById(id: string): Promise<IpAsset> {
    const asset = await this.repo.findById(id);
    if (!asset) throw new AppError(ErrorCode.ASSET_NOT_FOUND, 404, 'Không tìm thấy đối tượng SHTT');
    return asset;
  }

  async create(dto: CreateIpAssetDto, userId: string, ipAddress?: string): Promise<IpAsset> {
    // Check duplicate application number
    if (dto.application_number) {
      const existing = await this.repo.findByApplicationNumber(dto.application_number);
      if (existing) {
        throw new AppError(ErrorCode.ASSET_NUMBER_EXISTS, 409, 'Số đơn đã tồn tại trong hệ thống');
      }
    }

    // Convert date strings → Date objects trước khi lưu vào DB
    const asset = await this.repo.create({
      asset_type: dto.asset_type,
      title: dto.title,
      application_number: dto.application_number,
      application_date: toDate(dto.application_date),
      publication_number: dto.publication_number,
      publication_date: toDate(dto.publication_date),
      grant_number: dto.grant_number,
      grant_date: toDate(dto.grant_date),
      expiry_date: toDate(dto.expiry_date),
      status: dto.status,
      applicant_org_id: dto.applicant_org_id,
      applicant_person_id: dto.applicant_person_id,
      applicant_name: dto.applicant_name,
      province_code: dto.province_code ?? 'BN',
      district_code: dto.district_code,
      internal_notes: dto.internal_notes,
      meta: dto.meta,
      created_by: userId,
      updated_by: userId,
    });

    await writeAuditLog({
      userId,
      action: AuditAction.CREATE,
      entityType: 'ip_assets',
      entityId: asset.id,
      newValue: asset as unknown as Record<string, unknown>,
      ipAddress,
    });

    return asset;
  }

  async update(
    id: string,
    dto: UpdateIpAssetDto,
    userId: string,
    ipAddress?: string
  ): Promise<IpAsset> {
    const before = await this.getById(id);

    // Convert date strings → Date objects trước khi update
    const updated = await this.repo.update(id, {
      title: dto.title,
      application_number: dto.application_number,
      application_date: toDate(dto.application_date),
      grant_number: dto.grant_number,
      grant_date: toDate(dto.grant_date),
      expiry_date: toDate(dto.expiry_date),
      status: dto.status,
      applicant_name: dto.applicant_name,
      district_code: dto.district_code,
      internal_notes: dto.internal_notes,
      meta: dto.meta,
      updated_by: userId,
    });
    if (!updated) throw new AppError(ErrorCode.ASSET_NOT_FOUND, 404, 'Không tìm thấy đối tượng SHTT');

    await writeAuditLog({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'ip_assets',
      entityId: id,
      oldValue: before as unknown as Record<string, unknown>,
      newValue: updated as unknown as Record<string, unknown>,
      ipAddress,
    });

    return updated;
  }

  async softDelete(id: string, userId: string, ipAddress?: string): Promise<void> {
    const asset = await this.getById(id);
    await this.repo.softDelete(id, userId);

    await writeAuditLog({
      userId,
      action: AuditAction.SOFT_DELETE,
      entityType: 'ip_assets',
      entityId: id,
      oldValue: asset as unknown as Record<string, unknown>,
      ipAddress,
    });
  }

  async hardDelete(id: string, userId: string, ipAddress?: string): Promise<void> {
    const asset = await this.getById(id);
    await this.repo.hardDelete(id);

    await writeAuditLog({
      userId,
      action: AuditAction.HARD_DELETE,
      entityType: 'ip_assets',
      entityId: id,
      oldValue: asset as unknown as Record<string, unknown>,
      ipAddress,
    });
  }

  async restore(id: string, userId: string, ipAddress?: string): Promise<void> {
    await this.repo.restore(id);
    await writeAuditLog({
      userId,
      action: AuditAction.RESTORE,
      entityType: 'ip_assets',
      entityId: id,
      ipAddress,
    });
  }
}