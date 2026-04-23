import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@config/env.config';
import { UserRole } from '@shared/constants/enums';
import { ErrorCode } from '@shared/constants/error-codes';
import { AppError } from '@shared/helpers/app-error';

interface JwtPayload {
  sub: string;       // user id
  username: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

/**
 * Middleware xác thực JWT – optional: nếu không có token thì req.user = undefined
 * Dùng cho public routes cần biết user info (nếu có)
 */
export function authenticateJWT(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.jwt.secret) as JwtPayload;

    req.user = {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AppError(ErrorCode.AUTH_TOKEN_EXPIRED, 401, 'Access token đã hết hạn'));
    }
    return next(new AppError(ErrorCode.AUTH_TOKEN_INVALID, 401, 'Access token không hợp lệ'));
  }
}

/**
 * Middleware bắt buộc phải có token hợp lệ
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new AppError(ErrorCode.UNAUTHORIZED, 401, 'Yêu cầu đăng nhập'));
  }
  next();
}

/**
 * RBAC – kiểm tra role
 * @example router.delete('/:id', requireAuth, authorizeRoles(UserRole.ADMIN), handler)
 */
export function authorizeRoles(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(ErrorCode.UNAUTHORIZED, 401, 'Yêu cầu đăng nhập'));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(ErrorCode.FORBIDDEN, 403, 'Bạn không có quyền thực hiện thao tác này')
      );
    }
    next();
  };
}
