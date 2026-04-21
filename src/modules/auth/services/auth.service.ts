import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '@infrastructure/database';
import { User } from '@models/user.entity';
import { RefreshToken } from '@models/refresh-token.entity';
import { env } from '@config/env.config';
import { AppError } from '@shared/helpers/app-error';
import { ErrorCode } from '@shared/constants/error-codes';
import { AuditAction } from '@shared/constants/enums';
import { writeAuditLog } from '@middleware/audit-log.middleware';
import { logger } from '@infrastructure/logger/logger';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 phút

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
}

export class AuthService {
  private userRepo = AppDataSource.getRepository(User);
  private refreshRepo = AppDataSource.getRepository(RefreshToken);

  /**
   * Đăng nhập bằng username/email + password
   * - Kiểm tra tài khoản tồn tại, active, không bị khóa
   * - Verify password (bcrypt)
   * - Tạo JWT access + refresh token
   * - Ghi audit log
   */
  async login(identifier: string, password: string, ipAddress?: string, userAgent?: string): Promise<TokenPair> {
    // Tìm user theo username hoặc email
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.password_hash')
      .where('u.username = :id OR u.email = :id', { id: identifier })
      .getOne();

    if (!user) {
      throw new AppError(ErrorCode.AUTH_INVALID_CREDENTIALS, 401, 'Thông tin đăng nhập không chính xác');
    }

    if (!user.is_active) {
      throw new AppError(ErrorCode.AUTH_ACCOUNT_INACTIVE, 401, 'Tài khoản đã bị vô hiệu hóa');
    }

    if (user.isLocked()) {
      throw new AppError(ErrorCode.AUTH_ACCOUNT_LOCKED, 401, 'Tài khoản đang bị khóa tạm thời, vui lòng thử lại sau');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      await this.handleFailedLogin(user);
      throw new AppError(ErrorCode.AUTH_INVALID_CREDENTIALS, 401, 'Thông tin đăng nhập không chính xác');
    }

    // Reset failed count
    await this.userRepo.update(user.id, {
      failed_login_count: 0,
      locked_until: undefined,
      last_login_at: new Date(),
    });

    const tokenPair = await this.generateTokenPair(user, ipAddress, userAgent);

    await writeAuditLog({
      userId: user.id,
      action: AuditAction.LOGIN,
      entityType: 'users',
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    logger.info('User logged in', { context: 'AuthService', userId: user.id, ip: ipAddress });
    return tokenPair;
  }

  /**
   * Refresh access token bằng refresh token hợp lệ
   * - Verify refresh token signature
   * - Kiểm tra DB: not revoked, not expired
   * - Rotate: revoke cũ, tạo mới
   */
  async refreshTokens(oldRefreshToken: string, ipAddress?: string, userAgent?: string): Promise<TokenPair> {
    // Verify JWT signature trước
    let payload: { sub: string } & Record<string, unknown>;
    try {
      payload = jwt.verify(oldRefreshToken, env.jwt.publicKey, { algorithms: ['RS256'] }) as typeof payload;
    } catch {
      throw new AppError(ErrorCode.AUTH_REFRESH_TOKEN_INVALID, 401, 'Refresh token không hợp lệ');
    }

    // Kiểm tra DB
    const tokenRecord = await this.refreshRepo.findOne({ where: { token: oldRefreshToken } });
    if (!tokenRecord || !tokenRecord.isValid()) {
      throw new AppError(ErrorCode.AUTH_REFRESH_TOKEN_INVALID, 401, 'Refresh token đã hết hạn hoặc bị thu hồi');
    }

    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user || !user.is_active) {
      throw new AppError(ErrorCode.AUTH_ACCOUNT_INACTIVE, 401, 'Tài khoản không hợp lệ');
    }

    // Revoke token cũ
    await this.refreshRepo.update(tokenRecord.id, { is_revoked: true });

    return this.generateTokenPair(user, ipAddress, userAgent);
  }

  /**
   * Logout – revoke refresh token
   */
  async logout(refreshToken: string, userId: string, ipAddress?: string): Promise<void> {
    await this.refreshRepo.update({ token: refreshToken }, { is_revoked: true });
    await writeAuditLog({
      userId,
      action: AuditAction.LOGOUT,
      entityType: 'users',
      entityId: userId,
      ipAddress,
    });
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async generateTokenPair(user: User, ipAddress?: string, userAgent?: string): Promise<TokenPair> {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const signOptions: jwt.SignOptions = {
      algorithm: 'RS256',
      expiresIn: env.jwt.accessExpires,
    };
    const access_token = jwt.sign(payload, env.jwt.privateKey, signOptions);

    const refreshPayload = { sub: user.id, jti: uuidv4() };
    const refreshSignOptions: jwt.SignOptions = {
      algorithm: 'RS256',
      expiresIn: env.jwt.refreshExpires,
    };
    const refresh_token = jwt.sign(refreshPayload, env.jwt.privateKey, refreshSignOptions);

    // Parse expiry (7d → ms)
    const refreshMs = this.parseExpiry(env.jwt.refreshExpires);
    const refreshRecord = this.refreshRepo.create({
      user_id: user.id,
      token: refresh_token,
      expires_at: new Date(Date.now() + refreshMs),
      ip_address: ipAddress,
      user_agent: userAgent,
    });
    await this.refreshRepo.save(refreshRecord);

    return { access_token, refresh_token, expires_in: 900 }; // 15min in seconds
  }

  private async handleFailedLogin(user: User): Promise<void> {
    const newCount = user.failed_login_count + 1;
    const update: Partial<User> = { failed_login_count: newCount };

    if (newCount >= MAX_FAILED_ATTEMPTS) {
      update.locked_until = new Date(Date.now() + LOCK_DURATION_MS);
      logger.warn('Account locked after failed attempts', { context: 'AuthService', userId: user.id });
    }

    await this.userRepo.update(user.id, update);
  }

  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const [, num, unit] = match;
    const n = parseInt(num, 10);
    const units: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return n * units[unit];
  }
}