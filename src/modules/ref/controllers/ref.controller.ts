import { Request, Response, NextFunction } from 'express';
import { RefService } from '../services/ref.service';
import { sendSuccess } from '@shared/helpers/response.helper';

const service = new RefService();

export const RefController = {
  /** GET /ref/provinces */
  async provinces(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await service.getProvinces();
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  /** GET /ref/districts?province_code=BN */
  async districts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provinceCode = req.query.province_code as string | undefined;
      const data = await service.getDistricts(provinceCode);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  /** GET /ref/statuses */
  async statuses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await service.getStatuses();
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  /** GET /ref/nice-classes */
  async niceClasses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await service.getNiceClasses();
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  /** GET /ref/ipc-codes?q=&parent= */
  async ipcCodes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.query.q as string | undefined;
      const parent = req.query.parent as string | undefined;
      const data = await service.getIpcCodes(q, parent);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  /** GET /ref/locarno-codes?parent= */
  async locarnoCodes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parent = req.query.parent as string | undefined;
      const data = await service.getLocarnoCodes(parent);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  /** GET /ref/vienna-codes?parent= */
  async viennaCodes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parent = req.query.parent as string | undefined;
      const data = await service.getViennaCodes(parent);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  /** GET /ref/copyright-work-types */
  async copyrightWorkTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await service.getCopyrightWorkTypes();
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },
};
