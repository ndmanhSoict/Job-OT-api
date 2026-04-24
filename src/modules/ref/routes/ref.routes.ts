import { Router } from 'express';
import { guestRateLimit } from '@middleware/rate-limit.middleware';
import { RefController } from '../controllers/ref.controller';

export const refRouter = Router();

// Tất cả /ref endpoints là public, không cần auth
refRouter.get('/provinces', guestRateLimit, RefController.provinces);
refRouter.get('/districts', guestRateLimit, RefController.districts);
refRouter.get('/statuses', guestRateLimit, RefController.statuses);
refRouter.get('/nice-classes', guestRateLimit, RefController.niceClasses);
refRouter.get('/ipc-codes', guestRateLimit, RefController.ipcCodes);
refRouter.get('/locarno-codes', guestRateLimit, RefController.locarnoCodes);
refRouter.get('/vienna-codes', guestRateLimit, RefController.viennaCodes);
refRouter.get('/copyright-work-types', guestRateLimit, RefController.copyrightWorkTypes);
