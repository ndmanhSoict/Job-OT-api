import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { sendSuccess, sendCreated } from '@shared/helpers/response.helper';
import { parsePagination } from '@shared/helpers/pagination.helper';
import { getClientIp } from '@middleware/audit-log.middleware';
import { AppError } from '@shared/helpers/app-error';
import { ErrorCode } from '@shared/constants/error-codes';

const service = new UserService();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateUUID(id: string): void {
  if (!UUID_REGEX.test(id)) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, 400, 'ID không hợp lệ, phải là UUID');
  }
}

export const UserController = {
  /** GET /users – Admin only */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const result = await service.list(req.query as never, page, limit);
      sendSuccess(res, result.items, 200, result.meta);
    } catch (err) {
      next(err);
    }
  },

  /** POST /users – Admin only */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await service.create(req.body, req.user!.id, getClientIp(req));
      sendCreated(res, user);
    } catch (err) {
      next(err);
    }
  },

  /** GET /users/:id – Admin only */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      validateUUID(req.params.id);
      const user = await service.getById(req.params.id);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  },

  /** PATCH /users/:id – Admin only */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      validateUUID(req.params.id);
      const user = await service.update(req.params.id, req.body, req.user!.id, getClientIp(req));
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  },

  /** PATCH /users/:id/toggle-active – Admin only */
  async toggleActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      validateUUID(req.params.id);
      const result = await service.toggleActive(req.params.id, req.user!.id, getClientIp(req));
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  /** POST /users/:id/reset-password – Admin only */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      validateUUID(req.params.id);
      const result = await service.resetPassword(req.params.id, req.body, req.user!.id, getClientIp(req));
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
};
