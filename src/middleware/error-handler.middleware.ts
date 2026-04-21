import { Request, Response, NextFunction } from 'express';
import { QueryFailedError } from 'typeorm';
import { AppError } from '@shared/helpers/app-error';
import { ErrorCode } from '@shared/constants/error-codes';
import { logger } from '@infrastructure/logger/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // --- AppError (operational) ---
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, {
        context: 'ErrorHandler',
        code: err.code,
        stack: err.stack,
        path: req.path,
      });
    }
    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  // --- TypeORM QueryFailedError ---
  if (err instanceof QueryFailedError) {
    const mysqlErr = err as QueryFailedError & { code?: string; sqlMessage?: string };

    if (mysqlErr.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        success: false,
        error: {
          code: ErrorCode.CONFLICT,
          message: 'Dữ liệu bị trùng lặp',
          details: {},
        },
      });
      return;
    }

    logger.error('Database query failed', {
      context: 'ErrorHandler',
      sqlMessage: mysqlErr.sqlMessage,
      stack: err.stack,
      path: req.path,
    });

    res.status(500).json({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Lỗi cơ sở dữ liệu',
        details: {},
      },
    });
    return;
  }

  // --- Unexpected errors ---
  logger.error('Unhandled error', {
    context: 'ErrorHandler',
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Lỗi hệ thống, vui lòng thử lại sau',
      details: {},
    },
  });
}

/** 404 handler – đặt sau tất cả routes */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(ErrorCode.NOT_FOUND, 404, `Route không tồn tại: ${req.method} ${req.path}`));
}