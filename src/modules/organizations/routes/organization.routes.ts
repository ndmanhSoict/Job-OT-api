import { Router } from 'express';
import { authenticateJWT, requireAuth, authorizeRoles } from '@middleware/auth.middleware';
import { guestRateLimit, authRateLimit } from '@middleware/rate-limit.middleware';
import { validateBody, validateQuery } from '@middleware/validate.middleware';
import { UserRole } from '@shared/constants/enums';
import { OrganizationController } from '../controllers/organization.controller';
import { CreateOrganizationDto, UpdateOrganizationDto, QueryOrganizationDto } from '../dto/organization.dto';

export const organizationRouter = Router();

const staffGuard = [authRateLimit, authenticateJWT, requireAuth];
const adminGuard = [authRateLimit, authenticateJWT, requireAuth, authorizeRoles(UserRole.ADMIN)];

// Public – Guest có thể xem danh sách tổ chức
organizationRouter.get('/', guestRateLimit, authenticateJWT, validateQuery(QueryOrganizationDto), OrganizationController.list);
organizationRouter.get('/:id', guestRateLimit, authenticateJWT, OrganizationController.getById);

// Staff+ – tạo / cập nhật
organizationRouter.post('/', ...staffGuard, validateBody(CreateOrganizationDto), OrganizationController.create);
organizationRouter.patch('/:id', ...staffGuard, validateBody(UpdateOrganizationDto), OrganizationController.update);

// Admin – xóa
organizationRouter.delete('/:id', ...adminGuard, OrganizationController.remove);
