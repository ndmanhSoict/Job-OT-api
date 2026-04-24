import { Router } from 'express';
import multer from 'multer';
import { validateBody, validateQuery } from '@middleware/validate.middleware';
import { authenticateJWT, requireAuth, authorizeRoles } from '@middleware/auth.middleware';
import {
  guestRateLimit,
  authRateLimit,
  exportPdfRateLimit,
} from '@middleware/rate-limit.middleware';
import { UserRole } from '@shared/constants/enums';
import { IpAssetController } from '../controllers/ip-asset.controller';
import { AssetFileController } from '../controllers/asset-file.controller';
import { AssetCraftVillageController } from '../controllers/asset-craft-village.controller';
import { QueryIpAssetDto } from '../dto/query-ip-asset.dto';
import { CreateIpAssetDto, UpdateIpAssetDto } from '../dto/create-ip-asset.dto';
import { UploadAssetImageDto } from '../dto/upload-asset-image.dto';
import { UploadAssetDocumentDto } from '../dto/upload-asset-document.dto';

export const ipAssetRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

// List images (public)
ipAssetRouter.get(
  '/:id/images',
  guestRateLimit,
  authenticateJWT,
  AssetFileController.listImages
);

// List documents (Staff/Admin only – tài liệu nhạy cảm hơn ảnh)
ipAssetRouter.get(
  '/:id/documents',
  authRateLimit,
  authenticateJWT,
  requireAuth,
  AssetFileController.listDocuments
);

// Public routes – Guest/Staff/Admin đều truy cập được
// authenticateJWT là optional: nếu có token thì giải mã, không có thì bỏ qua (req.user = undefined)
ipAssetRouter.get(
  '/',
  guestRateLimit,
  authenticateJWT,
  validateQuery(QueryIpAssetDto),
  IpAssetController.list
);

ipAssetRouter.get(
  '/:id',
  guestRateLimit,
  authenticateJWT,
  IpAssetController.getById
);

ipAssetRouter.get(
  '/:id/export-pdf',
  exportPdfRateLimit,
  authenticateJWT,
  IpAssetController.exportPdf
);

// Protected routes – Staff hoặc Admin
ipAssetRouter.post(
  '/',
  authRateLimit,
  authenticateJWT,
  requireAuth,
  validateBody(CreateIpAssetDto),
  IpAssetController.create
);

ipAssetRouter.patch(
  '/:id',
  authRateLimit,
  authenticateJWT,
  requireAuth,
  validateBody(UpdateIpAssetDto),
  IpAssetController.update
);

ipAssetRouter.post(
  '/:id/images',
  authRateLimit,
  authenticateJWT,
  requireAuth,
  upload.single('file'),
  validateBody(UploadAssetImageDto),
  AssetFileController.uploadImage
);

ipAssetRouter.post(
  '/:id/documents',
  authRateLimit,
  authenticateJWT,
  requireAuth,
  upload.single('file'),
  validateBody(UploadAssetDocumentDto),
  AssetFileController.uploadDocument
);

ipAssetRouter.delete(
  '/:id',
  authRateLimit,
  authenticateJWT,
  requireAuth,
  IpAssetController.remove
);

ipAssetRouter.delete(
  '/:id/images/:imageId',
  authRateLimit,
  authenticateJWT,
  requireAuth,
  AssetFileController.deleteImage
);

ipAssetRouter.delete(
  '/:id/documents/:docId',
  authRateLimit,
  authenticateJWT,
  requireAuth,
  AssetFileController.deleteDocument
);

// Admin-only routes
ipAssetRouter.delete(
  '/:id/hard',
  authRateLimit,
  authenticateJWT,
  requireAuth,
  authorizeRoles(UserRole.ADMIN),
  IpAssetController.hardDelete
);

ipAssetRouter.post(
  '/:id/restore',
  authRateLimit,
  authenticateJWT,
  requireAuth,
  authorizeRoles(UserRole.ADMIN),
  IpAssetController.restore
);

// Asset ↔ CraftVillage linking
ipAssetRouter.get(
  '/:id/craft-villages',
  guestRateLimit,
  authenticateJWT,
  AssetCraftVillageController.listVillages
);

ipAssetRouter.post(
  '/:id/craft-villages/:villageId',
  authRateLimit,
  authenticateJWT,
  requireAuth,
  AssetCraftVillageController.linkVillage
);

ipAssetRouter.delete(
  '/:id/craft-villages/:villageId',
  authRateLimit,
  authenticateJWT,
  requireAuth,
  AssetCraftVillageController.unlinkVillage
);
