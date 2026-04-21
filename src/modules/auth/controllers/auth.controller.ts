import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess } from '@shared/helpers/response.helper';
import { getClientIp } from '@middleware/audit-log.middleware';

const authService = new AuthService();

export const AuthController = {
  /**
   * POST /auth/login
   * Body: { identifier, password }
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { identifier, password } = req.body;
      const ip = getClientIp(req);
      const ua = req.headers['user-agent'];

      const tokens = await authService.login(identifier, password, ip, ua);
      sendSuccess(res, tokens);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/refresh
   * Body: { refresh_token }
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refresh_token } = req.body;
      const ip = getClientIp(req);
      const ua = req.headers['user-agent'];

      const tokens = await authService.refreshTokens(refresh_token, ip, ua);
      sendSuccess(res, tokens);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/logout
   * Requires: Bearer token
   * Body: { refresh_token }
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refresh_token } = req.body;
      const ip = getClientIp(req);

      await authService.logout(refresh_token, req.user!.id, ip);
      sendSuccess(res, { message: 'Đăng xuất thành công' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /auth/me
   * Trả về thông tin user hiện tại từ token
   */
  me(req: Request, res: Response): void {
    sendSuccess(res, req.user);
  },
};