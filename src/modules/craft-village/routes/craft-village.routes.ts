import { Router } from 'express';
import { authenticateJWT, requireAuth, authorizeRoles } from '@middleware/auth.middleware';
import { guestRateLimit, authRateLimit } from '@middleware/rate-limit.middleware';
import { UserRole } from '@shared/constants/enums';
import { validateBody, validateQuery } from '@middleware/validate.middleware';
import { CraftVillageController } from '../controllers/craft-village.controller';
import { QueryCraftVillageDto } from '../dto/query-craft-village.dto';
import { CreateCraftVillageDto, UpdateCraftVillageDto } from '../dto/craft-village.dto';

export const craftVillageRouter = Router();

// Public
craftVillageRouter.get(
  '/',
  guestRateLimit,
  authenticateJWT,
  validateQuery(QueryCraftVillageDto),
  CraftVillageController.list
);

craftVillageRouter.get(
  '/:id',
  guestRateLimit,
  authenticateJWT,
  CraftVillageController.getById
);

// Staff/Admin
craftVillageRouter.post(
  '/',
  authRateLimit,
  authenticateJWT,
  requireAuth,
  validateBody(CreateCraftVillageDto),
  CraftVillageController.create
);

craftVillageRouter.patch(
  '/:id',
  authRateLimit,
  authenticateJWT,
  requireAuth,
  validateBody(UpdateCraftVillageDto),
  CraftVillageController.update
);

craftVillageRouter.delete(
  '/:id',
  authRateLimit,
  authenticateJWT,
  requireAuth,
  CraftVillageController.remove
);

// Admin-only
craftVillageRouter.delete(
  '/:id/hard',
  authRateLimit,
  authenticateJWT,
  requireAuth,
  authorizeRoles(UserRole.ADMIN),
  CraftVillageController.hardDelete
);

craftVillageRouter.post(
  '/:id/restore',
  authRateLimit,
  authenticateJWT,
  requireAuth,
  authorizeRoles(UserRole.ADMIN),
  CraftVillageController.restore
);
