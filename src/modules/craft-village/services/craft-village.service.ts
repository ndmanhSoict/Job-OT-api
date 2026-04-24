import { CraftVillage } from '@models/craft-village.entity';
import { AppError } from '@shared/helpers/app-error';
import { ErrorCode } from '@shared/constants/error-codes';
import { AuditAction } from '@shared/constants/enums';
import { buildPaginationMeta } from '@shared/helpers/pagination.helper';
import { writeAuditLog } from '@middleware/audit-log.middleware';
import { CraftVillageRepository } from '../repositories/craft-village.repository';
import { CreateCraftVillageDto, UpdateCraftVillageDto } from '../dto/craft-village.dto';
import { QueryCraftVillageDto } from '../dto/query-craft-village.dto';

export class CraftVillageService {
  private repo = new CraftVillageRepository();

  async list(query: QueryCraftVillageDto, page: number, limit: number) {
    const [items, total] = await this.repo.findMany(query, page, limit);
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async getById(id: string) {
    const village = await this.repo.findById(id);
    if (!village) throw new AppError(ErrorCode.NOT_FOUND, 404, 'Không tìm thấy làng nghề');

    const related_assets = await this.repo.findRelatedAssets(village.district_code ?? '');

    return { ...village, related_assets };
  }

  async create(dto: CreateCraftVillageDto, userId: string, ipAddress?: string): Promise<CraftVillage> {
    const village = await this.repo.create({
      village_name: dto.village_name,
      products: dto.products,
      address: dto.address,
      district_code: dto.district_code,
      recognition_number: dto.recognition_number,
      recognition_date: dto.recognition_date ? new Date(dto.recognition_date) : undefined,
      description: dto.description,
      representative_image: dto.representative_image,
      created_by: userId,
      updated_by: userId,
    });

    await writeAuditLog({
      userId,
      action: AuditAction.CREATE,
      entityType: 'craft_villages',
      entityId: village.id,
      newValue: village as unknown as Record<string, unknown>,
      ipAddress,
    });

    return village;
  }

  async update(id: string, dto: UpdateCraftVillageDto, userId: string, ipAddress?: string): Promise<CraftVillage> {
    const before = await this.repo.findById(id);
    if (!before) throw new AppError(ErrorCode.NOT_FOUND, 404, 'Không tìm thấy làng nghề');

    const updated = await this.repo.update(id, {
      ...(dto.village_name !== undefined && { village_name: dto.village_name }),
      ...(dto.products !== undefined && { products: dto.products }),
      ...(dto.address !== undefined && { address: dto.address }),
      ...(dto.recognition_number !== undefined && { recognition_number: dto.recognition_number }),
      ...(dto.recognition_date !== undefined && { recognition_date: new Date(dto.recognition_date) }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.representative_image !== undefined && { representative_image: dto.representative_image }),
      updated_by: userId,
    });
    if (!updated) throw new AppError(ErrorCode.NOT_FOUND, 404, 'Không tìm thấy làng nghề');

    await writeAuditLog({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'craft_villages',
      entityId: id,
      oldValue: before as unknown as Record<string, unknown>,
      newValue: updated as unknown as Record<string, unknown>,
      ipAddress,
    });

    return updated;
  }

  async softDelete(id: string, userId: string, ipAddress?: string): Promise<void> {
    const village = await this.repo.findById(id);
    if (!village) throw new AppError(ErrorCode.NOT_FOUND, 404, 'Không tìm thấy làng nghề');

    await this.repo.softDelete(id, userId);

    await writeAuditLog({
      userId,
      action: AuditAction.SOFT_DELETE,
      entityType: 'craft_villages',
      entityId: id,
      oldValue: village as unknown as Record<string, unknown>,
      ipAddress,
    });
  }

  async hardDelete(id: string, userId: string, ipAddress?: string): Promise<void> {
    const village = await this.repo.findByIdWithDeleted(id);
    if (!village) throw new AppError(ErrorCode.NOT_FOUND, 404, 'Không tìm thấy làng nghề');

    await this.repo.hardDelete(id);

    await writeAuditLog({
      userId,
      action: AuditAction.HARD_DELETE,
      entityType: 'craft_villages',
      entityId: id,
      oldValue: village as unknown as Record<string, unknown>,
      ipAddress,
    });
  }

  async restore(id: string, userId: string, ipAddress?: string): Promise<CraftVillage> {
    const village = await this.repo.findByIdWithDeleted(id);
    if (!village) throw new AppError(ErrorCode.NOT_FOUND, 404, 'Không tìm thấy làng nghề');
    if (!village.deleted_at) throw new AppError(ErrorCode.UNPROCESSABLE_ENTITY, 422, 'Làng nghề chưa bị xóa');

    const restored = await this.repo.restore(id);
    if (!restored) throw new AppError(ErrorCode.NOT_FOUND, 404, 'Khôi phục thất bại');

    await writeAuditLog({
      userId,
      action: AuditAction.RESTORE,
      entityType: 'craft_villages',
      entityId: id,
      newValue: restored as unknown as Record<string, unknown>,
      ipAddress,
    });

    return restored;
  }
}
