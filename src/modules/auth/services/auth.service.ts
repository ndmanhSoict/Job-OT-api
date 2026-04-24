import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { AppError } from '../../../shared/helpers/app-error';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { AuditAction } from '../../../shared/constants/enums';
import { writeAuditLog } from '../../../middleware/audit-log.middleware';
import { logger } from '../../../infrastructure/logger/logger';
import { AuthRepository } from '../repositories/auth.repository';
import { User } from '../../../models/user.entity';
import { env } from '../../../config/env.config';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;
const ACCESS_TOKEN_TTL = 900;           // 15 phút (giây)
const REFRESH_TOKEN_TTL_DAYS = 7;

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------
export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface MeResponse {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
}

// ---------------------------------------------------------------------------
// Helper – hash SHA-256 của raw refresh token (không lưu plaintext vào DB)
// ---------------------------------------------------------------------------
function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

// ---------------------------------------------------------------------------
// Helper – sign JWT (RS256)
// ---------------------------------------------------------------------------
// Helper – sign JWT (HS256 là mặc định)
function signAccessToken(user: User): string {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    env.jwt.secret, // Thay thế env.jwt.privateKey
    {
      expiresIn: ACCESS_TOKEN_TTL,
      // Đã xóa algorithm: 'RS256'
    },
  );
}

// ---------------------------------------------------------------------------
// Helper – tạo opaque refresh token (UUID-like random string)
// ---------------------------------------------------------------------------
function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex'); // 96 ký tự hex
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------
export class AuthService {
  private repo = new AuthRepository();

  // =========================================================================
  // 4.1 Login
  // =========================================================================
  async login(
    identifier: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    // 1. Tìm user
    const user = await this.repo.findByIdentifier(identifier);
    if (!user) {
      throw new AppError(ErrorCode.AUTH_INVALID_CREDENTIALS, 401, 'Thông tin đăng nhập không hợp lệ');
    }

    // 2. Kiểm tra tài khoản inactive
    if (!user.is_active) {
      throw new AppError(ErrorCode.AUTH_ACCOUNT_INACTIVE, 401, 'Tài khoản đã bị vô hiệu hóa');
    }

    // 3. Kiểm tra tài khoản đang bị khóa
    if (user.locked_until && user.locked_until > new Date()) {
      logger.warn('Login blocked – account locked', {
        context: 'AuthService',
        userId: user.id,
        locked_until: user.locked_until,
      });
      throw new AppError(ErrorCode.AUTH_ACCOUNT_LOCKED, 401, 'Tài khoản tạm thời bị khóa do đăng nhập sai quá nhiều lần');
    }

    // 4. Kiểm tra password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      await this.handleFailedLogin(user);
      throw new AppError(ErrorCode.AUTH_INVALID_CREDENTIALS, 401, 'Thông tin đăng nhập không hợp lệ');
    }

    // 5. Đăng nhập thành công → reset failed count, cập nhật last_login_at
    await this.repo.updateLoginMeta(user.id, {
      failed_login_count: 0,
      locked_until: undefined,
      last_login_at: new Date(),
    });

    // 6. Cấp token pair
    const tokenPair = await this.issueTokenPair(user);

    // 7. Audit log
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

  // =========================================================================
  // 4.2 Refresh token
  // =========================================================================
  async refresh(rawRefreshToken: string): Promise<TokenPair> {
    const tokenHash = hashToken(rawRefreshToken);
    const record = await this.repo.findValidRefreshToken(tokenHash);

    if (!record) {
      throw new AppError(ErrorCode.AUTH_REFRESH_TOKEN_INVALID, 401, 'Refresh token không hợp lệ hoặc đã hết hạn');
    }

    const user = record.user;

    // Kiểm tra user vẫn active
    if (!user.is_active) {
      await this.repo.revokeToken(tokenHash);
      throw new AppError(ErrorCode.AUTH_ACCOUNT_INACTIVE, 401, 'Tài khoản đã bị vô hiệu hóa');
    }

    // Token rotation: revoke token cũ
    await this.repo.revokeToken(tokenHash);

    // Cấp pair mới
    const tokenPair = await this.issueTokenPair(user);

    logger.info('Token refreshed', { context: 'AuthService', userId: user.id });

    return tokenPair;
  }

  // =========================================================================
  // 4.3 Logout
  // =========================================================================
  async logout(
    userId: string,
    rawRefreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const tokenHash = hashToken(rawRefreshToken);
    await this.repo.revokeToken(tokenHash);

    await writeAuditLog({
      userId,
      action: AuditAction.LOGOUT,
      entityType: 'users',
      entityId: userId,
      ipAddress,
      userAgent,
    });

    logger.info('User logged out', { context: 'AuthService', userId, ip: ipAddress });
  }

  // =========================================================================
  // 4.4 Me
  // =========================================================================
  async me(userId: string): Promise<MeResponse> {
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw new AppError(ErrorCode.USER_NOT_FOUND, 404, 'Không tìm thấy người dùng');
    }
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
      last_login_at: user.last_login_at ? user.last_login_at.toISOString() : null,
    };
  }

  // =========================================================================
  // change-password
  // =========================================================================
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw new AppError(ErrorCode.USER_NOT_FOUND, 404, 'Không tìm thấy người dùng');
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      throw new AppError(ErrorCode.AUTH_INVALID_CREDENTIALS, 401, 'Mật khẩu hiện tại không đúng');
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await this.repo.updatePasswordHash(userId, newHash);
    await this.repo.revokeAllUserTokens(userId);

    logger.info('Password changed', { context: 'AuthService', userId });
  }

  // =========================================================================
  // Private helpers
  // =========================================================================

  /** Xử lý đăng nhập sai: tăng failed_count, khóa nếu đạt ngưỡng */
  private async handleFailedLogin(user: User): Promise<void> {
    const newCount = (user.failed_login_count ?? 0) + 1;
    const update: Partial<Pick<User, 'failed_login_count' | 'locked_until'>> = {
      failed_login_count: newCount,
    };

    if (newCount >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCK_DURATION_MINUTES);
      update.locked_until = lockedUntil;
      logger.warn('Account locked after too many failed attempts', {
        context: 'AuthService',
        userId: user.id,
        attempts: newCount,
      });
    }

    await this.repo.updateLoginMeta(user.id, update);
  }

  /** Tạo access token + refresh token và lưu hash vào DB */
  private async issueTokenPair(user: User): Promise<TokenPair> {
    const accessToken = signAccessToken(user);

    const rawRefresh = generateRefreshToken();
    const refreshHash = hashToken(rawRefresh);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    await this.repo.saveRefreshToken({
      user_id: user.id,
      token_hash: refreshHash,
      expires_at: expiresAt,
    });

    return {
      access_token: accessToken,
      refresh_token: rawRefresh,
      expires_in: ACCESS_TOKEN_TTL,
    };
  }
}