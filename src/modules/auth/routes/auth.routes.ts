import { Router } from 'express';
import { loginRateLimit, authRateLimit } from '../../../middleware/rate-limit.middleware';
import { authenticateJWT, requireAuth } from '../../../middleware/auth.middleware';
import { validateBody } from '../../../middleware/validate.middleware';
import { AuthController } from '../controllers/auth.controller';
import { LoginDto, RefreshTokenDto, LogoutDto } from '../dto/auth.dto';

const router = Router();

/**
 * POST /auth/login
 * Thứ tự: loginRateLimit → validateBody → controller
 * Không cần token
 */
router.post(
  '/login',
  loginRateLimit,
  validateBody(LoginDto),
  AuthController.login,
);

/**
 * POST /auth/refresh
 * Thứ tự: authRateLimit → validateBody → controller
 * Không cần access token (dùng refresh token)
 */
router.post(
  '/refresh',
  authRateLimit,
  validateBody(RefreshTokenDto),
  AuthController.refresh,
);

router.post('/logout',
  authRateLimit,
  authenticateJWT,   // ← thêm dòng này
  requireAuth,
  validateBody(LogoutDto),
  AuthController.logout,
);

router.get('/me',
  authRateLimit,
  authenticateJWT,   // ← thêm dòng này
  requireAuth,
  AuthController.me,
);

export { router as authRouter };