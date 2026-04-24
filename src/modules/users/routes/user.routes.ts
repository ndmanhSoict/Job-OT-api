import { Router } from 'express';
import { authenticateJWT, requireAuth, authorizeRoles } from '@middleware/auth.middleware';
import { authRateLimit } from '@middleware/rate-limit.middleware';
import { validateBody, validateQuery } from '@middleware/validate.middleware';
import { UserRole } from '@shared/constants/enums';
import { UserController } from '../controllers/user.controller';
import { QueryUserDto } from '../dto/query-user.dto';
import { CreateUserDto, UpdateUserDto, ResetPasswordDto } from '../dto/user.dto';

export const userRouter = Router();

// Tất cả /users routes đều yêu cầu Admin
const adminGuard = [authRateLimit, authenticateJWT, requireAuth, authorizeRoles(UserRole.ADMIN)];

userRouter.get(
  '/',
  ...adminGuard,
  validateQuery(QueryUserDto),
  UserController.list
);

userRouter.post(
  '/',
  ...adminGuard,
  validateBody(CreateUserDto),
  UserController.create
);

userRouter.get(
  '/:id',
  ...adminGuard,
  UserController.getById
);

userRouter.patch(
  '/:id',
  ...adminGuard,
  validateBody(UpdateUserDto),
  UserController.update
);

userRouter.patch(
  '/:id/toggle-active',
  ...adminGuard,
  UserController.toggleActive
);

userRouter.post(
  '/:id/reset-password',
  ...adminGuard,
  validateBody(ResetPasswordDto),
  UserController.resetPassword
);
