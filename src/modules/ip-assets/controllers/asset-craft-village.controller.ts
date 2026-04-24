import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendCreated, sendNoContent } from '@shared/helpers/response.helper';
import { AssetCraftVillageService } from '../services/asset-craft-village.service';

const service = new AssetCraftVillageService();

export const AssetCraftVillageController = {
  async listVillages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await service.listVillages(req.params.id);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  },

  async linkVillage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { relation_note } = req.body as { relation_note?: string };
      const data = await service.linkVillage(req.params.id, req.params.villageId, relation_note);
      sendCreated(res, data);
    } catch (error) {
      next(error);
    }
  },

  async unlinkVillage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await service.unlinkVillage(req.params.id, req.params.villageId);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  },
};
