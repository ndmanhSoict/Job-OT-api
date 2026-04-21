import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AppError } from '@shared/helpers/app-error';
import { ErrorCode } from '@shared/constants/error-codes';

type ClassConstructor<T> = { new (): T };

function formatErrors(errors: ValidationError[]): Record<string, string[]> {
  return errors.reduce(
    (acc, err) => {
      if (err.constraints) {
        acc[err.property] = Object.values(err.constraints);
      }
      if (err.children?.length) {
        acc[err.property] = ['Invalid nested object'];
      }
      return acc;
    },
    {} as Record<string, string[]>
  );
}

/**
 * Middleware factory để validate request body theo DTO class
 * @example router.post('/', validateBody(CreateIpAssetDto), controller.create)
 */
export function validateBody<T extends object>(DtoClass: ClassConstructor<T>) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const dto = plainToInstance(DtoClass, req.body);
    const errors = await validate(dto as object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
    });

    if (errors.length > 0) {
      return next(
        new AppError(ErrorCode.VALIDATION_ERROR, 422, 'Dữ liệu đầu vào không hợp lệ', {
          fields: formatErrors(errors),
        })
      );
    }

    req.body = dto;
    next();
  };
}

/**
 * Validate query params
 */
export function validateQuery<T extends object>(DtoClass: ClassConstructor<T>) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const dto = plainToInstance(DtoClass, req.query);
    const errors = await validate(dto as object, {
      whitelist: true,
      skipMissingProperties: true,
    });

    if (errors.length > 0) {
      return next(
        new AppError(ErrorCode.VALIDATION_ERROR, 422, 'Query params không hợp lệ', {
          fields: formatErrors(errors),
        })
      );
    }

    req.query = dto as Record<string, string>;
    next();
  };
}