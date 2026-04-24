import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendCreated, sendNoContent } from '@shared/helpers/response.helper';
import { parsePagination } from '@shared/helpers/pagination.helper';
import { AppError } from '@shared/helpers/app-error';
import { ErrorCode } from '@shared/constants/error-codes';
import { OrganizationService } from '../services/organization.service';

const service = new OrganizationService();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateUUID(id: string): void {
  if (!UUID_REGEX.test(id)) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, 400, 'ID không hợp lệ, phải là UUID');
  }
}

export const OrganizationController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const result = await service.list(req.query as never, page, limit);
      sendSuccess(res, result.items, 200, result.meta);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const org = await service.create(req.body);
      sendCreated(res, org);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      validateUUID(req.params.id);
      const org = await service.getById(req.params.id);
      sendSuccess(res, org);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      validateUUID(req.params.id);
      const org = await service.update(req.params.id, req.body);
      sendSuccess(res, org);
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
