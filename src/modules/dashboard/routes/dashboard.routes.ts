import { Router } from 'express';
import { authenticateJWT, requireAuth } from '@middleware/auth.middleware';
import { authRateLimit } from '@middleware/rate-limit.middleware';
import { DashboardController } from '../controllers/dashboard.controller';

export const dashboardRouter = Router();

// Tất cả dashboard routes yêu cầu đăng nhập (Staff hoặc Admin)
const authGuard = [authRateLimit, authenticateJWT, requireAuth];

dashboardRouter.get('/stats', ...authGuard, DashboardController.stats);
dashboardRouter.get('/expiring', ...authGuard, DashboardController.expiring);
dashboardRouter.get('/timeline', ...authGuard, DashboardController.timeline);
dashboardRouter.get('/top-applicants', ...authGuard, DashboardController.topApplicants);
dashboardRouter.get('/top-groups', ...authGuard, DashboardController.topGroups);
