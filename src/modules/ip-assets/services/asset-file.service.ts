import { Express } from 'express';
import { AppError } from '@shared/helpers/app-error';
import { ErrorCode } from '@shared/constants/error-codes';
import {
  assertDocumentMagicBytes,
  assertImageMagicBytes,
  deleteStoredFile,
  getImageDimensions,
  storeUploadedBuffer,
} from '@shared/helpers/file-storage.helper';
import { AuditAction } from '@shared/constants/enums';
import { writeAuditLog } from '@middleware/audit-log.middleware';
import { UploadAssetDocumentDto } from '../dto/upload-asset-document.dto';
import { UploadAssetImageDto } from '../dto/upload-asset-image.dto';
import { AssetFileRepository } from '../repositories/asset-file.repository';
import { IpAssetRepository } from '../repositories/ip-asset.repository';

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export class AssetFileService {
  private assetRepo = new IpAssetRepository();
  private fileRepo = new AssetFileRepository();

  private async ensureAssetExists(assetId: string): Promise<void> {
    const asset = await this.assetRepo.findById(assetId);
    if (!asset) {
      throw new AppError(ErrorCode.ASSET_NOT_FOUND, 404, 'Không tìm thấy đối tượng SHTT');
    }
  }

  async uploadImage(
    assetId: string,
    dto: UploadAssetImageDto,
    file: Express.Multer.File | undefined,
    userId: string,
    reqProtocol: string,
    reqHost: string,
    ipAddress?: string
  ) {
    await this.ensureAssetExists(assetId);
    if (!file) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 400, 'Thiếu file upload');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new AppError(ErrorCode.UPLOAD_FILE_TOO_LARGE, 400, 'File ảnh vượt quá 5MB');
    }
    if (!IMAGE_MIME_TYPES.includes(file.mimetype)) {
      throw new AppError(
        ErrorCode.UPLOAD_FILE_TYPE_INVALID,
        400,
        'Chỉ chấp nhận ảnh JPEG, PNG hoặc WEBP'
      );
    }

    assertImageMagicBytes(file.buffer);
    const stored = await storeUploadedBuffer(file.buffer, 'images', file.originalname, reqProtocol, reqHost);
    const dimensions = getImageDimensions(file.buffer);

    if (dto.is_primary) {
      await this.fileRepo.clearPrimaryImage(assetId);
    }

    const image = await this.fileRepo.createImage({
      asset_id: assetId,
      image_url: stored.publicUrl,
      original_filename: file.originalname,
      mime_type: file.mimetype,
      file_size: file.size,
      view_angle: dto.image_type,
      is_primary: dto.is_primary ?? false,
      uploaded_by: userId,
    });

    await writeAuditLog({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'asset_images',
      entityId: image.id,
      newValue: image as unknown as Record<string, unknown>,
      ipAddress,
    });

    return {
      id: image.id,
      asset_id: image.asset_id,
      image_url: image.image_url,
      image_type: image.view_angle,
      file_name: image.original_filename,
      file_size_kb: image.file_size ? Math.ceil(image.file_size / 1024) : 0,
      mime_type: image.mime_type,
      width_px: dimensions?.width,
      height_px: dimensions?.height,
    };
  }

  async uploadDocument(
    assetId: string,
    dto: UploadAssetDocumentDto,
    file: Express.Multer.File | undefined,
    userId: string,
    reqProtocol: string,
    reqHost: string,
    ipAddress?: string
  ) {
    await this.ensureAssetExists(assetId);
    if (!file) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 400, 'Thiếu file upload');
    }
    if (file.size > 20 * 1024 * 1024) {
      throw new AppError(ErrorCode.UPLOAD_FILE_TOO_LARGE, 400, 'File tài liệu vượt quá 20MB');
    }
    if (!DOCUMENT_MIME_TYPES.includes(file.mimetype)) {
      throw new AppError(
        ErrorCode.UPLOAD_FILE_TYPE_INVALID,
        400,
        'Chỉ chấp nhận PDF, DOC hoặc DOCX'
      );
    }

    assertDocumentMagicBytes(file.buffer, file.mimetype);
    const stored = await storeUploadedBuffer(
      file.buffer,
      'documents',
      file.originalname,
      reqProtocol,
      reqHost
    );

    const document = await this.fileRepo.createDocument({
      asset_id: assetId,
      doc_url: stored.publicUrl,
      doc_type: dto.doc_type,
      original_filename: file.originalname,
      mime_type: file.mimetype,
      file_size: file.size,
      uploaded_by: userId,
    });

    await writeAuditLog({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'asset_documents',
      entityId: document.id,
      newValue: document as unknown as Record<string, unknown>,
      ipAddress,
    });

    return {
      id: document.id,
      asset_id: document.asset_id,
      doc_url: document.doc_url,
      doc_type: document.doc_type,
      file_name: document.original_filename,
      file_size_kb: document.file_size ? Math.ceil(document.file_size / 1024) : 0,
    };
  }

  async deleteImage(assetId: string, imageId: string, userId: string, ipAddress?: string): Promise<void> {
    await this.ensureAssetExists(assetId);
    const image = await this.fileRepo.findImageById(imageId);
    if (!image || image.asset_id !== assetId) {
      throw new AppError(ErrorCode.NOT_FOUND, 404, 'Không tìm thấy ảnh đính kèm');
    }

    await this.fileRepo.deleteImage(imageId);
    await deleteStoredFile(image.image_url);

    await writeAuditLog({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'asset_images',
      entityId: imageId,
      oldValue: image as unknown as Record<string, unknown>,
      ipAddress,
    });
  }

  async listImages(assetId: string) {
    await this.ensureAssetExists(assetId);
    const images = await this.fileRepo.findImagesByAssetId(assetId);
    return images.map((img) => ({
      id: img.id,
      asset_id: img.asset_id,
      image_url: img.image_url,
      image_type: img.view_angle,
      is_primary: img.is_primary,
      file_name: img.original_filename,
      file_size_kb: img.file_size ? Math.ceil(img.file_size / 1024) : 0,
      mime_type: img.mime_type,
      sort_order: img.sort_order,
    }));
  }

  async listDocuments(assetId: string) {
    await this.ensureAssetExists(assetId);
    const docs = await this.fileRepo.findDocumentsByAssetId(assetId);
    return docs.map((doc) => ({
      id: doc.id,
      asset_id: doc.asset_id,
      doc_url: doc.doc_url,
      doc_type: doc.doc_type,
      file_name: doc.original_filename,
      file_size_kb: doc.file_size ? Math.ceil(doc.file_size / 1024) : 0,
      mime_type: doc.mime_type,
    }));
  }

  async deleteDocument(
    assetId: string,
    documentId: string,
    userId: string,
    ipAddress?: string
  ): Promise<void> {
    await this.ensureAssetExists(assetId);
    const document = await this.fileRepo.findDocumentById(documentId);
    if (!document || document.asset_id !== assetId) {
      throw new AppError(ErrorCode.NOT_FOUND, 404, 'Không tìm thấy tài liệu đính kèm');
    }

    await this.fileRepo.deleteDocument(documentId);
    await deleteStoredFile(document.doc_url);

    await writeAuditLog({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'asset_documents',
      entityId: documentId,
      oldValue: document as unknown as Record<string, unknown>,
      ipAddress,
    });
  }
}
