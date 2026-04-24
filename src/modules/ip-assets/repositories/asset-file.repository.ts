import { Repository } from 'typeorm';
import { AppDataSource } from '@infrastructure/database';
import { AssetDocument } from '@models/asset-document.entity';
import { AssetImage } from '@models/asset-image.entity';

export class AssetFileRepository {
  private imageRepo: Repository<AssetImage>;
  private documentRepo: Repository<AssetDocument>;

  constructor() {
    this.imageRepo = AppDataSource.getRepository(AssetImage);
    this.documentRepo = AppDataSource.getRepository(AssetDocument);
  }

  async clearPrimaryImage(assetId: string): Promise<void> {
    await this.imageRepo
      .createQueryBuilder()
      .update(AssetImage)
      .set({ is_primary: false })
      .where('asset_id = :assetId', { assetId })
      .execute();
  }

  async createImage(data: Partial<AssetImage>): Promise<AssetImage> {
    const entity = this.imageRepo.create(data);
    return this.imageRepo.save(entity);
  }

  async findImageById(imageId: string): Promise<AssetImage | null> {
    return this.imageRepo.findOne({ where: { id: imageId } });
  }

  async deleteImage(imageId: string): Promise<void> {
    await this.imageRepo.delete(imageId);
  }

  async createDocument(data: Partial<AssetDocument>): Promise<AssetDocument> {
    const entity = this.documentRepo.create(data);
    return this.documentRepo.save(entity);
  }

  async findDocumentById(documentId: string): Promise<AssetDocument | null> {
    return this.documentRepo.findOne({ where: { id: documentId } });
  }

  async deleteDocument(documentId: string): Promise<void> {
    await this.documentRepo.delete(documentId);
  }

  async findImagesByAssetId(assetId: string): Promise<AssetImage[]> {
    return this.imageRepo.find({
      where: { asset_id: assetId },
      order: { sort_order: 'ASC', created_at: 'ASC' },
    });
  }

  async findDocumentsByAssetId(assetId: string): Promise<AssetDocument[]> {
    return this.documentRepo.find({
      where: { asset_id: assetId },
      order: { created_at: 'ASC' },
    });
  }
}
