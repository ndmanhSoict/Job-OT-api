import { Request, Response, NextFunction } from 'express';
import { IpAssetService } from '../services/ip-asset.service';
import { sendSuccess, sendCreated, sendNoContent } from '@shared/helpers/response.helper';
import { parsePagination } from '@shared/helpers/pagination.helper';
import { getClientIp } from '@middleware/audit-log.middleware';
import { AppError } from '@shared/helpers/app-error';
import { ErrorCode } from '@shared/constants/error-codes';

const service = new IpAssetService();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateUUID(id: string): void {
  if (!UUID_REGEX.test(id)) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, 400, 'ID không hợp lệ, phải là UUID');
  }
}

/** Xóa internal_notes khỏi object – dùng cho response của Guest */
function stripInternalNotes<T extends { internal_notes?: string }>(
  item: T
): Omit<T, 'internal_notes'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { internal_notes: _omitted, ...rest } = item;
  return rest as Omit<T, 'internal_notes'>;
}

export const IpAssetController = {
  /** GET /ip-assets – công khai; Guest không thấy internal_notes */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const result = await service.list(req.query as never, page, limit);
      const isGuest = !req.user;
      const data = isGuest ? result.items.map(stripInternalNotes) : result.items;
      sendSuccess(res, data, 200, result.meta);
    } catch (err) {
      next(err);
    }
  },

  /** GET /ip-assets/:id – công khai; Guest không thấy internal_notes */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      validateUUID(req.params.id);
      const asset = await service.getById(req.params.id);
      const isGuest = !req.user;
      sendSuccess(res, isGuest ? stripInternalNotes(asset) : asset);
    } catch (err) {
      next(err);
    }
  },

  /** POST /ip-assets – Staff/Admin */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const asset = await service.create(req.body, req.user!.id, getClientIp(req));
      sendCreated(res, asset);
    } catch (err) {
      next(err);
    }
  },

  /** PATCH /ip-assets/:id – Staff/Admin */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      validateUUID(req.params.id);
      const asset = await service.update(req.params.id, req.body, req.user!.id, getClientIp(req));
      sendSuccess(res, asset);
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /ip-assets/:id – Soft delete, Staff/Admin */
  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await service.softDelete(req.params.id, req.user!.id, getClientIp(req));
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /ip-assets/:id/hard – Hard delete, Admin only */
  async hardDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await service.hardDelete(req.params.id, req.user!.id, getClientIp(req));
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  },

  /** POST /ip-assets/:id/restore – Admin only */
  async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await service.restore(req.params.id, req.user!.id, getClientIp(req));
      sendSuccess(res, { message: 'Khôi phục bản ghi thành công' });
    } catch (err) {
      next(err);
    }
  },
};
