import { Router } from 'express';
import { authenticateJWT, requireAuth, authorizeRoles } from '@middleware/auth.middleware';
import { guestRateLimit, authRateLimit } from '@middleware/rate-limit.middleware';
import { validateBody, validateQuery } from '@middleware/validate.middleware';
import { UserRole } from '@shared/constants/enums';
import { PersonController } from '../controllers/person.controller';
import { CreatePersonDto, UpdatePersonDto, QueryPersonDto } from '../dto/person.dto';

export const personRouter = Router();

const staffGuard = [authRateLimit, authenticateJWT, requireAuth];
const adminGuard = [authRateLimit, authenticateJWT, requireAuth, authorizeRoles(UserRole.ADMIN)];

// Public – Guest xem danh sách (các trường nhạy cảm bị ẩn)
personRouter.get('/', guestRateLimit, authenticateJWT, validateQuery(QueryPersonDto), PersonController.list);
personRouter.get('/:id', guestRateLimit, authenticateJWT, PersonController.getById);

// Staff+ – tạo / cập nhật
personRouter.post('/', ...staffGuard, validateBody(CreatePersonDto), PersonController.create);
personRouter.patch('/:id', ...staffGuard, validateBody(UpdatePersonDto), PersonController.update);

// Admin – xóa
personRouter.delete('/:id', ...adminGuard, PersonController.remove);
