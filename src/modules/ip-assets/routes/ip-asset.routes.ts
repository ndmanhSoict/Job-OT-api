import { Router } from 'express';
import { validateBody, validateQuery } from '@middleware/validate.middleware';
import { authenticateJWT, requireAuth, authorizeRoles } from '@middleware/auth.middleware';
import { guestRateLimit, authRateLimit } from '@middleware/rate-limit.middleware';
import { UserRole } from '@shared/constants/enums';
import { IpAssetController } from '../controllers/ip-asset.controller';
import { QueryIpAssetDto } from '../dto/query-ip-asset.dto';
import { CreateIpAssetDto, UpdateIpAssetDto } from '../dto/create-ip-asset.dto';

export const ipAssetRouter = Router();

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

ipAssetRouter.delete(
  '/:id',
  authRateLimit,
  authenticateJWT,
  requireAuth,
  IpAssetController.remove
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
