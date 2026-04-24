import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendCreated, sendNoContent } from '@shared/helpers/response.helper';
import { parsePagination } from '@shared/helpers/pagination.helper';
import { AppError } from '@shared/helpers/app-error';
import { ErrorCode } from '@shared/constants/error-codes';
import { UserRole } from '@shared/constants/enums';
import { PersonService } from '../services/person.service';

const service = new PersonService();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateUUID(id: string): void {
  if (!UUID_REGEX.test(id)) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, 400, 'ID không hợp lệ, phải là UUID');
  }
}

function isStaff(req: Request): boolean {
  return req.user !== undefined && (req.user.role === UserRole.STAFF || req.user.role === UserRole.ADMIN);
}

export const PersonController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const result = await service.list(req.query as never, page, limit, isStaff(req));
      sendSuccess(res, result.items, 200, result.meta);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const person = await service.create(req.body);
      sendCreated(res, person);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      validateUUID(req.params.id);
      const person = await service.getById(req.params.id, isStaff(req));
      sendSuccess(res, person);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      validateUUID(req.params.id);
      const person = await service.update(req.params.id, req.body);
      sendSuccess(res, person);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      validateUUID(req.params.id);
      await service.remove(req.params.id);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  },
};
