import { AppError } from '@shared/helpers/app-error';
import { ErrorCode } from '@shared/constants/error-codes';
import { IpAssetRepository } from '../repositories/ip-asset.repository';
import { AssetCraftVillageRepository } from '../repositories/asset-craft-village.repository';

export class AssetCraftVillageService {
  private assetRepo = new IpAssetRepository();
  private linkRepo = new AssetCraftVillageRepository();

  private async ensureAssetExists(assetId: string): Promise<void> {
    const asset = await this.assetRepo.findById(assetId);
    if (!asset) throw new AppError(ErrorCode.ASSET_NOT_FOUND, 404, 'Không tìm thấy đối tượng SHTT');
  }

  async listVillages(assetId: string) {
    await this.ensureAssetExists(assetId);
    return this.linkRepo.findByAssetId(assetId);
  }

  async linkVillage(assetId: string, villageId: string, relationNote?: string) {
    await this.ensureAssetExists(assetId);

    const village = await this.linkRepo.findVillageById(villageId);
    if (!village) throw new AppError(ErrorCode.CRAFT_VILLAGE_NOT_FOUND, 404, 'Không tìm thấy làng nghề');

    const existing = await this.linkRepo.findLink(assetId, villageId);
    if (existing) throw new AppError(ErrorCode.ASSET_CRAFT_VILLAGE_ALREADY_LINKED, 409, 'Đã liên kết làng nghề này rồi');

    return this.linkRepo.createLink(assetId, villageId, relationNote);
  }

  async unlinkVillage(assetId: string, villageId: string): Promise<void> {
    await this.ensureAssetExists(assetId);

    const existing = await this.linkRepo.findLink(assetId, villageId);
    if (!existing) throw new AppError(ErrorCode.ASSET_CRAFT_VILLAGE_NOT_LINKED, 404, 'Chưa liên kết làng nghề này');

    await this.linkRepo.deleteLink(assetId, villageId);
  }
}
