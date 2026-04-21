import { Request, Response, NextFunction } from 'express';
import { IpAssetService } from '../services/ip-asset.service';
import { sendSuccess, sendCreated, sendNoContent } from '@shared/helpers/response.helper';
import { parsePagination } from '@shared/helpers/pagination.helper';
import { getClientIp } from '@middleware/audit-log.middleware';

const service = new IpAssetService();

export const IpAssetController = {
  /** GET /ip-assets */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const result = await service.list(req.query as never, page, limit);
      sendSuccess(res, result.items, 200, result.meta);
    } catch (err) { next(err); }
  },

  /** GET /ip-assets/:id */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const asset = await service.getById(req.params.id);
      sendSuccess(res, asset);
    } catch (err) { next(err); }
  },

  /** POST /ip-assets */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const asset = await service.create(req.body, req.user!.id, getClientIp(req));
      sendCreated(res, asset);
    } catch (err) { next(err); }
  },

  /** PATCH /ip-assets/:id */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const asset = await service.update(req.params.id, req.body, req.user!.id, getClientIp(req));
      sendSuccess(res, asset);
    } catch (err) { next(err); }
  },

  /** DELETE /ip-assets/:id (soft delete cho Staff, hard delete cho Admin via query param) */
  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await service.softDelete(req.params.id, req.user!.id, getClientIp(req));
      sendNoContent(res);
    } catch (err) { next(err); }
  },

  /** DELETE /ip-assets/:id/hard – Admin only */
  async hardDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await service.hardDelete(req.params.id, req.user!.id, getClientIp(req));
      sendNoContent(res);
    } catch (err) { next(err); }
  },

  /** POST /ip-assets/:id/restore – Admin only */
  async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await service.restore(req.params.id, req.user!.id, getClientIp(req));
      sendSuccess(res, { message: 'Khôi phục bản ghi thành công' });
    } catch (err) { next(err); }
  },
};