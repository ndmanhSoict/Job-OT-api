import { IpAsset } from '@models/ip-asset.entity';
import { IpAssetRepository } from '../repositories/ip-asset.repository';
import { CreateIpAssetDto, UpdateIpAssetDto } from '../dto/create-ip-asset.dto';
import { QueryIpAssetDto } from '../dto/query-ip-asset.dto';
import { AppError } from '@shared/helpers/app-error';
import { ErrorCode } from '@shared/constants/error-codes';
import { AuditAction } from '@shared/constants/enums';
import { buildPaginationMeta } from '@shared/helpers/pagination.helper';
import { writeAuditLog } from '@middleware/audit-log.middleware';

function toDate(value?: string): Date | undefined {
  return value ? new Date(value) : undefined;
}

/**
 * Validate thứ tự các mốc ngày theo nghiệp vụ SHTT:
 * publication_date >= application_date >= grant_date >= expiry_date
 */
function validateDateOrder(dto: {
  application_date?: string;
  publication_date?: string;
  grant_date?: string;
  expiry_date?: string;
}): void {
  if (dto.application_date && new Date(dto.application_date) > new Date()) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, 400, 'Ngày nộp đơn không được là ngày trong tương lai');
  }
  if (dto.publication_date && dto.application_date) {
    if (new Date(dto.publication_date) < new Date(dto.application_date)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 400, 'Ngày công bố phải >= ngày nộp đơn');
    }
  }
  if (dto.grant_date && dto.publication_date) {
    if (new Date(dto.grant_date) < new Date(dto.publication_date)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 400, 'Ngày cấp bằng phải >= ngày công bố');
    }
  }
  if (dto.expiry_date && dto.grant_date) {
    if (new Date(dto.expiry_date) <= new Date(dto.grant_date)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 400, 'Ngày hết hạn phải > ngày cấp bằng');
    }
  }
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
    // Validate date order
    validateDateOrder(dto);

    // Kiểm tra số đơn trùng
    if (dto.application_number) {
      const existing = await this.repo.findByApplicationNumber(dto.application_number);
      if (existing) {
        throw new AppError(ErrorCode.ASSET_NUMBER_EXISTS, 409, 'Số đơn đã tồn tại trong hệ thống');
      }
    }

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

    // Validate date order với giá trị mới, fallback về giá trị cũ nếu không thay đổi
    validateDateOrder({
      application_date: dto.application_date ?? before.application_date?.toISOString(),
      publication_date: dto.publication_date ?? before.publication_date?.toISOString(),
      grant_date: dto.grant_date ?? before.grant_date?.toISOString(),
      expiry_date: dto.expiry_date ?? before.expiry_date?.toISOString(),
    });

    // Kiểm tra số đơn mới nếu thay đổi
    if (dto.application_number && dto.application_number !== before.application_number) {
      const existing = await this.repo.findByApplicationNumber(dto.application_number);
      if (existing && existing.id !== id) {
        throw new AppError(ErrorCode.ASSET_NUMBER_EXISTS, 409, 'Số đơn đã tồn tại trong hệ thống');
      }
    }

    const updated = await this.repo.update(id, {
      title: dto.title,
      application_number: dto.application_number,
      application_date: toDate(dto.application_date),
      publication_number: dto.publication_number,
      publication_date: toDate(dto.publication_date),
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

  /** Hard delete – tìm kể cả bản ghi đã soft-delete */
  async hardDelete(id: string, userId: string, ipAddress?: string): Promise<void> {
    const asset = await this.repo.findByIdIncludingDeleted(id);
    if (!asset) throw new AppError(ErrorCode.ASSET_NOT_FOUND, 404, 'Không tìm thấy đối tượng SHTT');

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

  /** Restore – chỉ áp dụng được khi bản ghi đang ở trạng thái soft-deleted */
  async restore(id: string, userId: string, ipAddress?: string): Promise<void> {
    const asset = await this.repo.findByIdIncludingDeleted(id);
    if (!asset) throw new AppError(ErrorCode.ASSET_NOT_FOUND, 404, 'Không tìm thấy đối tượng SHTT');
    if (!asset.deleted_at) {
      throw new AppError(ErrorCode.UNPROCESSABLE_ENTITY, 422, 'Bản ghi chưa bị xóa mềm, không thể khôi phục');
    }

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
