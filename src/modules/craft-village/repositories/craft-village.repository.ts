import { Repository } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { AppDataSource } from '@infrastructure/database';
import { CraftVillage } from '@models/craft-village.entity';
import { IpAsset } from '@models/ip-asset.entity';
import { QueryCraftVillageDto } from '../dto/query-craft-village.dto';

export class CraftVillageRepository {
  private repo: Repository<CraftVillage>;
  private assetRepo: Repository<IpAsset>;

  constructor() {
    this.repo = AppDataSource.getRepository(CraftVillage);
    this.assetRepo = AppDataSource.getRepository(IpAsset);
  }

  async findMany(query: QueryCraftVillageDto, page: number, limit: number): Promise<[CraftVillage[], number]> {
    const qb = this.repo
      .createQueryBuilder('cv')
      .where('cv.deleted_at IS NULL');

    if (query.q) {
      qb.andWhere(
        '(cv.village_name LIKE :q OR JSON_SEARCH(cv.products, "one", :qExact) IS NOT NULL)',
        { q: `%${query.q}%`, qExact: `%${query.q}%` }
      );
    }

    if (query.district_code) {
      qb.andWhere('cv.district_code = :district', { district: query.district_code });
    }

    qb.orderBy('cv.created_at', 'DESC').skip((page - 1) * limit).take(limit);

    return qb.getManyAndCount();
  }

  async findById(id: string): Promise<CraftVillage | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findRelatedAssets(districtCode: string): Promise<Pick<IpAsset, 'id' | 'title' | 'asset_type'>[]> {
    if (!districtCode) return [];
    return this.assetRepo
      .createQueryBuilder('a')
      .select(['a.id', 'a.title', 'a.asset_type'])
      .where('a.district_code = :districtCode', { districtCode })
      .andWhere('a.deleted_at IS NULL')
      .orderBy('a.created_at', 'DESC')
      .limit(10)
      .getMany();
  }

  async create(data: Partial<CraftVillage>): Promise<CraftVillage> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<CraftVillage>): Promise<CraftVillage | null> {
    await this.repo.update(id, data as QueryDeepPartialEntity<CraftVillage>);
    return this.findById(id);
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    await this.repo.update(id, { updated_by: deletedBy });
    await this.repo.softDelete(id);
  }

  async hardDelete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async restore(id: string): Promise<CraftVillage | null> {
    await this.repo.restore(id);
    return this.repo.findOne({ where: { id }, withDeleted: false });
  }

  async findByIdWithDeleted(id: string): Promise<CraftVillage | null> {
    return this.repo.findOne({ where: { id }, withDeleted: true });
  }
}
