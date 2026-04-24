import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess } from '../../../shared/helpers/response.helper';
import { getClientIp } from '../../../middleware/audit-log.middleware';

const service = new AuthService();

export const AuthController = {
  /**
   * POST /auth/login
   * req.body đã được validate bởi validateBody(LoginDto)
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { identifier, password } = req.body as { identifier: string; password: string };
      const data = await service.login(
        identifier,
        password,
        getClientIp(req),
        req.headers['user-agent'],
      );
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/refresh
   * req.body đã được validate bởi validateBody(RefreshTokenDto)
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refresh_token } = req.body as { refresh_token: string };
      const data = await service.refresh(refresh_token);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/logout
   * req.user luôn tồn tại (đã qua requireAuth)
   * req.body đã được validate bởi validateBody(LogoutDto)
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refresh_token } = req.body as { refresh_token: string };
      await service.logout(
        req.user!.id,
        refresh_token,
        getClientIp(req),
        req.headers['user-agent'],
      );
      sendSuccess(res, { message: 'Đăng xuất thành công' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /auth/me
   * req.user luôn tồn tại (đã qua requireAuth)
   */
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await service.me(req.user!.id);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/change-password
   * req.user luôn tồn tại (đã qua requireAuth)
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { current_password, new_password } = req.body as { current_password: string; new_password: string };
      await service.changePassword(req.user!.id, current_password, new_password);
      sendSuccess(res, { message: 'Đổi mật khẩu thành công' });
    } catch (err) {
      next(err);
    }
  },
};