import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '@shared/helpers/response.helper';
import { getClientIp } from '@middleware/audit-log.middleware';
import { ImportExportService } from '../services/import-export.service';

const service = new ImportExportService();

export const ImportExportController = {
  async downloadTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fileName, buffer } = service.buildTemplate(req.query as never);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.status(200).send(buffer);
    } catch (error) {
      next(error);
    }
  },

  async importExcel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.importFromExcel(
        req.body,
        req.file,
        req.user!.id,
        getClientIp(req)
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async exportAssets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.exportAssets(req.query as never, req.user!.id, getClientIp(req));
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
      res.status(200).send(result.buffer);
    } catch (error) {
      next(error);
    }
  },

  async exportPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await service.exportPublic(req.query as never);
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
      res.status(200).send(result.buffer);
    } catch (error) {
      next(error);
    }
  },
};
