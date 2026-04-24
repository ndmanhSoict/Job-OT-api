import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { AppDataSource } from '@infrastructure/database';
import { IpAsset } from '@models/ip-asset.entity';
import { AssetStatus, AssetType } from '@shared/constants/enums';
import { QuerySearchDto } from '../dto/query-search.dto';
import { QuerySearchSuggestDto } from '../dto/query-search-suggest.dto';

export interface SearchFacetCounts {
  asset_type: Record<string, number>;
  status: Record<string, number>;
}

export class SearchRepository {
  private repo: Repository<IpAsset>;

  constructor() {
    this.repo = AppDataSource.getRepository(IpAsset);
  }

  async search(query: QuerySearchDto, page: number, limit: number): Promise<[IpAsset[], number]> {
    const qb = this.buildSearchQuery(query);
    qb.orderBy('asset.updated_at', 'DESC').skip((page - 1) * limit).take(limit);
    return qb.getManyAndCount();
  }

  async countFacets(query: QuerySearchDto): Promise<SearchFacetCounts> {
    const [assetTypeCounts, statusCounts] = await Promise.all([
      this.countGroupBy('asset.asset_type', query, ['asset_type']),
      this.countGroupBy('asset.status', query, ['status']),
    ]);

    return {
      asset_type: assetTypeCounts,
      status: statusCounts,
    };
  }

  async suggest(query: QuerySearchSuggestDto, limit = 10): Promise<IpAsset[]> {
    const keyword = query.q?.trim() ?? '';
    const qb = this.repo
      .createQueryBuilder('asset')
      .select([
        'asset.id',
        'asset.title',
        'asset.asset_type',
        'asset.updated_at',
      ])
      .where('asset.deleted_at IS NULL')
      .andWhere('LOWER(asset.title) LIKE LOWER(:keyword)', { keyword: `${keyword}%` });

    if (query.asset_type) {
      qb.andWhere('asset.asset_type = :assetType', { assetType: query.asset_type });
    }

    return qb.orderBy('asset.updated_at', 'DESC').take(limit).getMany();
  }

  private async countGroupBy(
    column: string,
    query: QuerySearchDto,
    excludedFilters: Array<'asset_type' | 'status'>
  ): Promise<Record<string, number>> {
    const qb = this.buildSearchQuery(query, excludedFilters)
      .select(column, 'value')
      .addSelect('COUNT(*)', 'count')
      .groupBy(column);

    const rows = await qb.getRawMany<{ value: AssetType | AssetStatus; count: string }>();

    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.value] = parseInt(row.count, 10);
      return acc;
    }, {});
  }

  private buildSearchQuery(
    query: QuerySearchDto,
    excludedFilters: Array<'asset_type' | 'status'> = []
  ): SelectQueryBuilder<IpAsset> {
    const qb = this.repo.createQueryBuilder('asset').where('asset.deleted_at IS NULL');
    const keyword = query.q?.trim() ?? '';

    qb.andWhere(
      new Brackets((subQb) => {
        subQb
          .where('LOWER(asset.title) LIKE LOWER(:keyword)', { keyword: `%${keyword}%` })
          .orWhere('LOWER(asset.application_number) LIKE LOWER(:keyword)', {
            keyword: `%${keyword}%`,
          })
          .orWhere('LOWER(asset.grant_number) LIKE LOWER(:keyword)', { keyword: `%${keyword}%` })
          .orWhere('LOWER(asset.applicant_name) LIKE LOWER(:keyword)', {
            keyword: `%${keyword}%`,
          });
      })
    );

    if (!excludedFilters.includes('asset_type') && query.asset_type) {
      const assetTypes = Array.isArray(query.asset_type) ? query.asset_type : [query.asset_type];
      qb.andWhere('asset.asset_type IN (:...assetTypes)', { assetTypes });
    }

    if (!excludedFilters.includes('status') && query.status) {
      qb.andWhere('asset.status = :status', { status: query.status });
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
