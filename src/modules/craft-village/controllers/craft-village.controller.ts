import { Request, Response, NextFunction } from 'express';
import { CraftVillageService } from '../services/craft-village.service';
import { sendSuccess, sendCreated, sendNoContent } from '@shared/helpers/response.helper';
import { parsePagination } from '@shared/helpers/pagination.helper';
import { getClientIp } from '@middleware/audit-log.middleware';
import { AppError } from '@shared/helpers/app-error';
import { ErrorCode } from '@shared/constants/error-codes';

const service = new CraftVillageService();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateUUID(id: string): void {
  if (!UUID_REGEX.test(id)) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, 400, 'ID không hợp lệ, phải là UUID');
  }
}

export const CraftVillageController = {
  /** GET /craft-villages – public */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const result = await service.list(req.query as never, page, limit);
      sendSuccess(res, result.items, 200, result.meta);
    } catch (err) {
      next(err);
    }
  },

  /** GET /craft-villages/:id – public */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      validateUUID(req.params.id);
      const village = await service.getById(req.params.id);
      sendSuccess(res, village);
    } catch (err) {
      next(err);
    }
  },

  /** POST /craft-villages – Staff/Admin */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const village = await service.create(req.body, req.user!.id, getClientIp(req));
      sendCreated(res, village);
    } catch (err) {
      next(err);
    }
  },

  /** PATCH /craft-villages/:id – Staff/Admin */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      validateUUID(req.params.id);
      const village = await service.update(req.params.id, req.body, req.user!.id, getClientIp(req));
      sendSuccess(res, village);
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /craft-villages/:id – Staff/Admin */
  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      validateUUID(req.params.id);
      await service.softDelete(req.params.id, req.user!.id, getClientIp(req));
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /craft-villages/:id/hard – Admin only */
  async hardDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      validateUUID(req.params.id);
      await service.hardDelete(req.params.id, req.user!.id, getClientIp(req));
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  },

  /** POST /craft-villages/:id/restore – Admin only */
  async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      validateUUID(req.params.id);
      const village = await service.restore(req.params.id, req.user!.id, getClientIp(req));
      sendSuccess(res, village);
    } catch (err) {
      next(err);
    }
  },
};
