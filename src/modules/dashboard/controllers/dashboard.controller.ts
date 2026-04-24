import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { sendSuccess } from '@shared/helpers/response.helper';

const service = new DashboardService();

export const DashboardController = {
  /** GET /dashboard/stats – Staff/Admin */
  async stats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await service.getStats();
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  /** GET /dashboard/expiring?days=90 – Staff/Admin */
  async expiring(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const days = req.query.days ? parseInt(String(req.query.days), 10) : 90;
      const result = await service.getExpiring(days);
      res.status(200).json({ success: true, data: result.data, meta: result.meta });
    } catch (err) {
      next(err);
    }
  },

  /** GET /dashboard/top-applicants?limit=10&asset_type=trademark – Staff/Admin */
  async topApplicants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
      const assetType = req.query.asset_type as string | undefined;
      const data = await service.getTopApplicants(limit, assetType);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  /** GET /dashboard/top-groups?limit=10 – Staff/Admin */
  async topGroups(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
      const data = await service.getTopGroups(limit);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  /** GET /dashboard/timeline?year=2025&groupBy=month&asset_type=trademark – Staff/Admin */
  async timeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const year = req.query.year ? parseInt(String(req.query.year), 10) : undefined;
      const groupBy = (req.query.groupBy as 'month' | 'quarter') ?? 'month';
      const assetType = req.query.asset_type as string | undefined;
      const data = await service.getTimeline(year, groupBy, assetType);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },
};
