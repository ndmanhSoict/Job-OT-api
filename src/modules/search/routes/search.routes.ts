import { Router } from 'express';
import { authenticateJWT } from '@middleware/auth.middleware';
import { guestRateLimit } from '@middleware/rate-limit.middleware';
import { validateQuery } from '@middleware/validate.middleware';
import { SearchController } from '../controllers/search.controller';
import { QuerySearchDto } from '../dto/query-search.dto';
import { QuerySearchSuggestDto } from '../dto/query-search-suggest.dto';

export const searchRouter = Router();

/**
 * @openapi
 * /search:
 *   get:
 *     summary: Tìm kiếm toàn văn đối tượng SHTT
 *     tags:
 *       - Search
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Từ khóa tìm kiếm
 *       - in: query
 *         name: asset_type
 *         schema:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: district_code
 *         schema:
 *           type: string
 *       - in: query
 *         name: application_date_from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: application_date_to
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Search results with highlights and facets
 */
searchRouter.get(
  '/',
  guestRateLimit,
  authenticateJWT,
  validateQuery(QuerySearchDto),
  SearchController.search
);

/**
 * @openapi
 * /search/suggest:
 *   get:
 *     summary: Gợi ý tự động theo prefix
 *     tags:
 *       - Search
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Prefix tối thiểu 3 ký tự
 *       - in: query
 *         name: asset_type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Suggestion list
 */
searchRouter.get(
  '/suggest',
  guestRateLimit,
  authenticateJWT,
  validateQuery(QuerySearchSuggestDto),
  SearchController.suggest
);
