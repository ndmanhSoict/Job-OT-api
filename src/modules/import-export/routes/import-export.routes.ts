import { Router } from 'express';
import multer from 'multer';
import { authenticateJWT, requireAuth } from '@middleware/auth.middleware';
import { authRateLimit, publicExportRateLimit } from '@middleware/rate-limit.middleware';
import { validateBody, validateQuery } from '@middleware/validate.middleware';
import { ImportExportController } from '../controllers/import-export.controller';
import { QueryImportTemplateDto } from '../dto/query-import-template.dto';
import { ImportAssetDto } from '../dto/import-asset.dto';
import { QueryExportDto } from '../dto/query-export.dto';

const upload = multer({ storage: multer.memoryStorage() });

export const importExportRouter = Router();

importExportRouter.get(
  '/import/template',
  authRateLimit,
  authenticateJWT,
  requireAuth,
  validateQuery(QueryImportTemplateDto),
  ImportExportController.downloadTemplate
);

importExportRouter.post(
  '/import',
  authRateLimit,
  authenticateJWT,
  requireAuth,
  upload.single('file'),
  validateBody(ImportAssetDto),
  ImportExportController.importExcel
);

importExportRouter.get(
  '/export',
  authRateLimit,
  authenticateJWT,
  requireAuth,
  validateQuery(QueryExportDto),
  ImportExportController.exportAssets
);

// Public export – không cần auth, tối đa 100 bản ghi, rate limit nghiêm ngặt
importExportRouter.get(
  '/export/public',
  publicExportRateLimit,
  validateQuery(QueryExportDto),
  ImportExportController.exportPublic
);
