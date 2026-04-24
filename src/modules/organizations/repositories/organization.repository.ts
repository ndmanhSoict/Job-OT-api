import { Repository } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { AppDataSource } from '@infrastructure/database';
import { Organization } from '@models/organization.entity';
import { QueryOrganizationDto } from '../dto/organization.dto';

export class OrganizationRepository {
  private repo: Repository<Organization>;

  constructor() {
    this.repo = AppDataSource.getRepository(Organization);
  }

  async findById(id: string): Promise<Organization | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findMany(query: QueryOrganizationDto, page: number, limit: number): Promise<[Organization[], number]> {
    const qb = this.repo.createQueryBuilder('org').where('org.deleted_at IS NULL');

    if (query.q) {
      qb.andWhere('(org.org_name LIKE :q OR org.org_name_en LIKE :q OR org.tax_code LIKE :q)', { q: `%${query.q}%` });
    }
    if (query.org_type) {
      qb.andWhere('org.org_type = :org_type', { org_type: query.org_type });
    }
    if (query.province_code) {
      qb.andWhere('org.province_code = :province_code', { province_code: query.province_code });
    }

    qb.orderBy('org.org_name', 'ASC').skip((page - 1) * limit).take(limit);

    return qb.getManyAndCount();
  }

  async create(data: Partial<Organization>): Promise<Organization> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Organization>): Promise<Organization | null> {
    await this.repo.update(id, data as QueryDeepPartialEntity<Organization>);
    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
