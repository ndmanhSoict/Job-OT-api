import rateLimit from 'express-rate-limit';
import { env } from '@config/env.config';
import { ErrorCode } from '@shared/constants/error-codes';

const rateLimitResponse = (code: string, message: string) => ({
  success: false,
  error: { code, message, details: {} },
});

/** Public / Guest: 60 req/phút/IP */
export const guestRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: env.rateLimit.guest,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(ErrorCode.TOO_MANY_REQUESTS, 'Quá nhiều yêu cầu, vui lòng thử lại sau'),
});

/** Authenticated: 300 req/phút/IP */
export const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: env.rateLimit.auth,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(ErrorCode.TOO_MANY_REQUESTS, 'Quá nhiều yêu cầu, vui lòng thử lại sau'),
});

/** Login endpoint: 10 req/15 phút/IP – chống brute force */
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.rateLimit.login,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: rateLimitResponse(
    ErrorCode.TOO_MANY_REQUESTS,
    'Quá nhiều lần thử đăng nhập, vui lòng thử lại sau 15 phút'
  ),
});

/** Export PDF public: 10 req/phút/IP */
export const exportPdfRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(
    ErrorCode.TOO_MANY_REQUESTS,
    'Quá nhiều lần xuất PDF, vui lòng thử lại sau'
  ),
});

/** Public export: 5 req/phút/IP – giới hạn nghiêm ngặt cho guest export */
export const publicExportRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(
    ErrorCode.TOO_MANY_REQUESTS,
    'Quá nhiều lần xuất dữ liệu, vui lòng thử lại sau'
  ),
});
