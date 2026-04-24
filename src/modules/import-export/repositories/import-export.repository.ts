import { Brackets, In, Repository, SelectQueryBuilder } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { AppDataSource } from '@infrastructure/database';
import { IpAsset } from '@models/ip-asset.entity';
import { QueryExportDto } from '../dto/query-export.dto';

export class ImportExportRepository {
  private repo: Repository<IpAsset>;

  constructor() {
    this.repo = AppDataSource.getRepository(IpAsset);
  }

  async findManyForExport(query: QueryExportDto, ids?: string[]): Promise<IpAsset[]> {
    const qb = this.buildQuery(query, ids);
    return qb.orderBy('asset.updated_at', 'DESC').take(5001).getMany();
  }

  async findByApplicationNumber(applicationNumber: string): Promise<IpAsset | null> {
    return this.repo.findOne({ where: { application_number: applicationNumber } });
  }

  async create(data: Partial<IpAsset>): Promise<IpAsset> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<IpAsset>): Promise<IpAsset | null> {
    await this.repo.update(id, data as QueryDeepPartialEntity<IpAsset>);
    return this.repo.findOne({ where: { id } });
  }

  private buildQuery(query: QueryExportDto, ids?: string[]): SelectQueryBuilder<IpAsset> {
    const qb = this.repo.createQueryBuilder('asset').where('asset.deleted_at IS NULL');

    if (ids?.length) {
      qb.andWhere({ id: In(ids) });
    }

    if (query.asset_type) {
      const types = Array.isArray(query.asset_type) ? query.asset_type : [query.asset_type];
      qb.andWhere('asset.asset_type IN (:...types)', { types });
    }

    if (query.status) {
      qb.andWhere('asset.status = :status', { status: query.status });
    }

    if (query.q) {
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where('asset.title LIKE :q', { q: `%${query.q}%` })
            .orWhere('asset.application_number LIKE :q', { q: `%${query.q}%` })
            .orWhere('asset.grant_number LIKE :q', { q: `%${query.q}%` })
            .orWhere('asset.applicant_name LIKE :q', { q: `%${query.q}%` });
        })
      );
    }

    if (query.district_code) {
      qb.andWhere('asset.district_code = :districtCode', { districtCode: query.district_code });
    }

    if (query.application_date_from) {
      qb.andWhere('asset.application_date >= :applicationDateFrom', {
        applicationDateFrom: query.application_date_from,
      });
    }

    if (query.application_date_to) {
      qb.andWhere('asset.application_date <= :applicationDateTo', {
        applicationDateTo: query.application_date_to,
      });
    }

    return qb;
  }
}
