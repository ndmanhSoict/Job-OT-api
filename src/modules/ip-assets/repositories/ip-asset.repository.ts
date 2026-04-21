import { Repository, SelectQueryBuilder } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { AppDataSource } from '@infrastructure/database';
import { IpAsset } from '@models/ip-asset.entity';
import { QueryIpAssetDto } from '../dto/query-ip-asset.dto';
import { SortOrder } from '@shared/constants/enums';

export class IpAssetRepository {
  private repo: Repository<IpAsset>;

  constructor() {
    this.repo = AppDataSource.getRepository(IpAsset);
  }

  async findById(id: string): Promise<IpAsset | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByApplicationNumber(applicationNumber: string): Promise<IpAsset | null> {
    return this.repo.findOne({ where: { application_number: applicationNumber } });
  }

  async findMany(
    query: QueryIpAssetDto,
    page: number,
    limit: number
  ): Promise<[IpAsset[], number]> {
    const qb = this.buildQueryBuilder(query);

    const sortBy = query.sort_by ?? 'created_at';
    const sortOrder = query.sort_order ?? SortOrder.DESC;
    qb.orderBy(`asset.${sortBy}`, sortOrder);

    qb.skip((page - 1) * limit).take(limit);

    return qb.getManyAndCount();
  }

  async create(data: Partial<IpAsset>): Promise<IpAsset> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<IpAsset>): Promise<IpAsset | null> {
    await this.repo.update(id, data as QueryDeepPartialEntity<IpAsset>);
    return this.findById(id);
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    await this.repo.update(id, { updated_by: deletedBy });
    await this.repo.softDelete(id);
  }

  async hardDelete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async restore(id: string): Promise<void> {
    await this.repo.restore(id);
  }

  async countByType(): Promise<Record<string, number>> {
    const result = await this.repo
      .createQueryBuilder('asset')
      .select('asset.asset_type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('asset.asset_type')
      .getRawMany<{ type: string; count: string }>();

    return result.reduce(
      (acc, row) => ({ ...acc, [row.type]: parseInt(row.count, 10) }),
      {} as Record<string, number>
    );
  }

  async findExpiringSoon(daysAhead = 90): Promise<IpAsset[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.repo
      .createQueryBuilder('asset')
      .where('asset.expiry_date IS NOT NULL')
      .andWhere('asset.expiry_date BETWEEN :now AND :future', {
        now: new Date(),
        future: futureDate,
      })
      .andWhere('asset.deleted_at IS NULL')
      .orderBy('asset.expiry_date', 'ASC')
      .getMany();
  }

  // ─── Query builder helper ───────────────────────────────────────────────────

  private buildQueryBuilder(query: QueryIpAssetDto): SelectQueryBuilder<IpAsset> {
    const qb = this.repo.createQueryBuilder('asset');

    if (query.asset_type) {
      const types = Array.isArray(query.asset_type) ? query.asset_type : [query.asset_type];
      qb.andWhere('asset.asset_type IN (:...types)', { types });
    }

    if (query.status) {
      qb.andWhere('asset.status = :status', { status: query.status });
    }

    if (query.q) {
      qb.andWhere(
        '(asset.title LIKE :q OR asset.application_number LIKE :q OR asset.grant_number LIKE :q OR asset.applicant_name LIKE :q)',
        { q: `%${query.q}%` }
      );
    }

    if (query.application_number) {
      qb.andWhere('asset.application_number = :appNum', { appNum: query.application_number });
    }

    if (query.grant_number) {
      qb.andWhere('asset.grant_number = :grantNum', { grantNum: query.grant_number });
    }

    if (query.applicant_name) {
      qb.andWhere('asset.applicant_name LIKE :applicant', {
        applicant: `%${query.applicant_name}%`,
      });
    }

    if (query.province_code) {
      qb.andWhere('asset.province_code = :province', { province: query.province_code });
    }

    if (query.district_code) {
      qb.andWhere('asset.district_code = :district', { district: query.district_code });
    }

    if (query.application_date_from) {
      qb.andWhere('asset.application_date >= :appDateFrom', {
        appDateFrom: query.application_date_from,
      });
    }

    if (query.application_date_to) {
      qb.andWhere('asset.application_date <= :appDateTo', {
        appDateTo: query.application_date_to,
      });
    }

    if (query.grant_date_from) {
      qb.andWhere('asset.grant_date >= :grantDateFrom', {
        grantDateFrom: query.grant_date_from,
      });
    }

    if (query.grant_date_to) {
      qb.andWhere('asset.grant_date <= :grantDateTo', { grantDateTo: query.grant_date_to });
    }

    if (query.expiry_date_from) {
      qb.andWhere('asset.expiry_date >= :expiryFrom', { expiryFrom: query.expiry_date_from });
    }

    if (query.expiry_date_to) {
      qb.andWhere('asset.expiry_date <= :expiryTo', { expiryTo: query.expiry_date_to });
    }

    return qb;
  }
}