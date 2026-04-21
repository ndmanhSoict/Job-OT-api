import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@infrastructure/database';
import { AuditLog } from '@models/audit-log.entity';
import { AuditAction } from '@shared/constants/enums';
import { logger } from '@infrastructure/logger/logger';

export interface AuditLogPayload {
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Standalone service để ghi audit log từ bất kỳ service nào
 */
export async function writeAuditLog(payload: AuditLogPayload): Promise<void> {
  try {
    const repo = AppDataSource.getRepository(AuditLog);
    const log = repo.create({
      user_id: payload.userId,
      action: payload.action,
      entity_type: payload.entityType,
      entity_id: payload.entityId,
      old_value: payload.oldValue,
      new_value: payload.newValue,
      ip_address: payload.ipAddress,
      user_agent: payload.userAgent,
    });
    await repo.save(log);
  } catch (err) {
    // Audit log failure không được làm crash request
    logger.error('Failed to write audit log', { context: 'AuditLog', error: err });
  }
}

/**
 * Helper để lấy IP từ request (xuyên qua proxy)
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.ip ?? 'unknown';
}