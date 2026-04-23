import { Router } from 'express';
import { validateBody } from '@middleware/validate.middleware';
import { requireAuth, authenticateJWT } from '@middleware/auth.middleware';
import { loginRateLimit } from '@middleware/rate-limit.middleware';
import { LoginDto, RefreshTokenDto } from '../dto/auth.dto';
import { AuthController } from '../controllers/auth.controller';

export const authRouter = Router();

authRouter.post('/login', loginRateLimit, validateBody(LoginDto), AuthController.login);
authRouter.post('/refresh', validateBody(RefreshTokenDto), AuthController.refresh);
authRouter.post('/logout', authenticateJWT, requireAuth, validateBody(RefreshTokenDto), AuthController.logout);
authRouter.get('/me', authenticateJWT, requireAuth, AuthController.me);