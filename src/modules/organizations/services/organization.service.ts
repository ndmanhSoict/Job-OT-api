import { AppError } from '@shared/helpers/app-error';
import { ErrorCode } from '@shared/constants/error-codes';
import { buildPaginationMeta } from '@shared/helpers/pagination.helper';
import { OrganizationRepository } from '../repositories/organization.repository';
import { CreateOrganizationDto, UpdateOrganizationDto, QueryOrganizationDto } from '../dto/organization.dto';

export class OrganizationService {
  private repo = new OrganizationRepository();

  async list(query: QueryOrganizationDto, page: number, limit: number) {
    const [items, total] = await this.repo.findMany(query, page, limit);
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async getById(id: string) {
    const org = await this.repo.findById(id);
    if (!org) throw new AppError(ErrorCode.ORGANIZATION_NOT_FOUND, 404, 'Không tìm thấy tổ chức');
    return org;
  }

  async create(dto: CreateOrganizationDto) {
    return this.repo.create({
      org_name: dto.org_name,
      org_name_en: dto.org_name_en,
      org_type: dto.org_type ?? 'company',
      tax_code: dto.tax_code,
      address: dto.address,
      district_code: dto.district_code,
      province_code: dto.province_code ?? 'BN',
      phone: dto.phone,
      email: dto.email,
      website: dto.website,
    });
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    const org = await this.repo.findById(id);
    if (!org) throw new AppError(ErrorCode.ORGANIZATION_NOT_FOUND, 404, 'Không tìm thấy tổ chức');

    const updated = await this.repo.update(id, {
      ...(dto.org_name !== undefined && { org_name: dto.org_name }),
      ...(dto.org_name_en !== undefined && { org_name_en: dto.org_name_en }),
      ...(dto.org_type !== undefined && { org_type: dto.org_type }),
      ...(dto.tax_code !== undefined && { tax_code: dto.tax_code }),
      ...(dto.address !== undefined && { address: dto.address }),
      ...(dto.district_code !== undefined && { district_code: dto.district_code }),
      ...(dto.province_code !== undefined && { province_code: dto.province_code }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.email !== undefined && { email: dto.email }),
      ...(dto.website !== undefined && { website: dto.website }),
    });

    return updated!;
  }

  async remove(id: string): Promise<void> {
    const org = await this.repo.findById(id);
    if (!org) throw new AppError(ErrorCode.ORGANIZATION_NOT_FOUND, 404, 'Không tìm thấy tổ chức');
    await this.repo.softDelete(id);
  }
}
