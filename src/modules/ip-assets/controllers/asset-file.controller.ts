import { NextFunction, Request, Response } from 'express';
import { sendCreated, sendNoContent, sendSuccess } from '@shared/helpers/response.helper';
import { getClientIp } from '@middleware/audit-log.middleware';
import { AssetFileService } from '../services/asset-file.service';

const service = new AssetFileService();

export const AssetFileController = {
  async listImages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await service.listImages(req.params.id);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  },

  async listDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await service.listDocuments(req.params.id);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  },

  async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await service.uploadImage(
        req.params.id,
        req.body,
        req.file,
        req.user!.id,
        req.protocol,
        req.get('host') ?? 'localhost',
        getClientIp(req)
      );
      sendCreated(res, data);
    } catch (error) {
      next(error);
    }
  },

  async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await service.uploadDocument(
        req.params.id,
        req.body,
        req.file,
        req.user!.id,
        req.protocol,
        req.get('host') ?? 'localhost',
        getClientIp(req)
      );
      sendCreated(res, data);
    } catch (error) {
      next(error);
    }
  },

  async deleteImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await service.deleteImage(req.params.id, req.params.imageId, req.user!.id, getClientIp(req));
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  },

  async deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await service.deleteDocument(req.params.id, req.params.docId, req.user!.id, getClientIp(req));
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  },
};
