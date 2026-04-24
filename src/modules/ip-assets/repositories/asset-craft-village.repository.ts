import { Repository } from 'typeorm';
import { AppDataSource } from '@infrastructure/database';
import { AssetCraftVillage } from '@models/asset-craft-village.entity';
import { CraftVillage } from '@models/craft-village.entity';

export class AssetCraftVillageRepository {
  private repo: Repository<AssetCraftVillage>;
  private villageRepo: Repository<CraftVillage>;

  constructor() {
    this.repo = AppDataSource.getRepository(AssetCraftVillage);
    this.villageRepo = AppDataSource.getRepository(CraftVillage);
  }

  async findByAssetId(assetId: string): Promise<CraftVillage[]> {
    const links = await this.repo.find({ where: { asset_id: assetId } });
    if (links.length === 0) return [];
    const villageIds = links.map((l) => l.village_id);
    return this.villageRepo
      .createQueryBuilder('cv')
      .where('cv.id IN (:...ids)', { ids: villageIds })
      .andWhere('cv.deleted_at IS NULL')
      .getMany();
  }

  async findLink(assetId: string, villageId: string): Promise<AssetCraftVillage | null> {
    return this.repo.findOne({ where: { asset_id: assetId, village_id: villageId } });
  }

  async findVillageById(villageId: string): Promise<CraftVillage | null> {
    return this.villageRepo.findOne({ where: { id: villageId } });
  }

  async createLink(assetId: string, villageId: string, relationNote?: string): Promise<AssetCraftVillage> {
    const entity = this.repo.create({ asset_id: assetId, village_id: villageId, relation_note: relationNote });
    return this.repo.save(entity);
  }

  async deleteLink(assetId: string, villageId: string): Promise<void> {
    await this.repo.delete({ asset_id: assetId, village_id: villageId });
  }
}
