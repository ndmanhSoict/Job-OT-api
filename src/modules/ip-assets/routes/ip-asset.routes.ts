import { Router } from 'express';
import { validateBody, validateQuery } from '@middleware/validate.middleware';
import { authenticateJWT, requireAuth, authorizeRoles } from '@middleware/auth.middleware';
import { UserRole } from '@shared/constants/enums';
import { IpAssetController } from '../controllers/ip-asset.controller';
import { QueryIpAssetDto } from '../dto/query-ip-asset.dto';
import { CreateIpAssetDto, UpdateIpAssetDto } from '../dto/create-ip-asset.dto';

export const ipAssetRouter = Router();

// Yêu cầu đăng nhập cho tất cả route bên dưới
ipAssetRouter.use(authenticateJWT, requireAuth);

ipAssetRouter.get('/', validateQuery(QueryIpAssetDto), IpAssetController.list);
ipAssetRouter.get('/:id', IpAssetController.getById);
ipAssetRouter.post('/', validateBody(CreateIpAssetDto), IpAssetController.create);
ipAssetRouter.patch('/:id', validateBody(UpdateIpAssetDto), IpAssetController.update);
ipAssetRouter.delete('/:id', IpAssetController.remove);
ipAssetRouter.delete('/:id/hard', authorizeRoles(UserRole.ADMIN), IpAssetController.hardDelete);
ipAssetRouter.post('/:id/restore', authorizeRoles(UserRole.ADMIN), IpAssetController.restore);