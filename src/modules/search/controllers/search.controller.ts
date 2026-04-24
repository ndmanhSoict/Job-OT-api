import { NextFunction, Request, Response } from 'express';
import { parsePagination } from '@shared/helpers/pagination.helper';
import { sendSuccess } from '@shared/helpers/response.helper';
import { SearchService } from '../services/search.service';

const service = new SearchService();

export const SearchController = {
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const result = await service.search(req.query as never, page, limit);
      res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
        facets: result.facets,
      });
    } catch (error) {
      next(error);
    }
  },

  async suggest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await service.suggest(req.query as never);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  },
};
