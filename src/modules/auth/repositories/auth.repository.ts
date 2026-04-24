import { Repository } from 'typeorm';
import { AppDataSource } from '../../../infrastructure/database';
import { User } from '../../../models/user.entity';
import { RefreshToken } from '../../../models/refresh-token.entity';

export class AuthRepository {
  private userRepo: Repository<User>;
  private tokenRepo: Repository<RefreshToken>;

  constructor() {
    this.userRepo = AppDataSource.getRepository(User);
    this.tokenRepo = AppDataSource.getRepository(RefreshToken);
  }

  // -------------------------------------------------------------------------
  // User queries
  // -------------------------------------------------------------------------

  /** Tìm user theo username hoặc email (bao gồm cả soft-deleted để kiểm tra) */
  async findByIdentifier(identifier: string): Promise<User | null> {
    return this.userRepo
      .createQueryBuilder('u')
      .where('(u.username = :id OR u.email = :id)', { id: identifier })
      .andWhere('u.deleted_at IS NULL')
      .getOne();
  }

  /** Tìm user theo PK */
  async findUserById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  /** Cập nhật thông tin login: reset/increment failed count, locked_until, last_login_at */
  async updateLoginMeta(
    id: string,
    data: Partial<Pick<User, 'failed_login_count' | 'locked_until' | 'last_login_at'>>,
  ): Promise<void> {
    await this.userRepo.update(id, data as Partial<User>);
  }

  // -------------------------------------------------------------------------
  // RefreshToken queries
  // -------------------------------------------------------------------------

  /** Lưu refresh token mới */
  async saveRefreshToken(payload: {
    user_id: string;
    token_hash: string;
    expires_at: Date;
  }): Promise<RefreshToken> {
    const entity = this.tokenRepo.create({
      user_id: payload.user_id,
      token_hash: payload.token_hash,
      expires_at: payload.expires_at,
    });
    return this.tokenRepo.save(entity);
  }

  /** Tìm refresh token theo hash (chỉ lấy token chưa revoke và chưa hết hạn) */
  async findValidRefreshToken(tokenHash: string): Promise<RefreshToken | null> {
    return this.tokenRepo
      .createQueryBuilder('rt')
      .leftJoinAndSelect('rt.user', 'u')
      .where('rt.token_hash = :hash', { hash: tokenHash })
      .andWhere('rt.is_revoked = 0')
      .andWhere('rt.expires_at > NOW()')
      .getOne();
  }

  /** Revoke một token cụ thể theo hash */
  async revokeToken(tokenHash: string): Promise<void> {
    await this.tokenRepo.update({ token_hash: tokenHash }, { is_revoked: true });
  }

  /** Revoke tất cả token của một user (dùng khi user bị khóa / đổi mật khẩu) */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.tokenRepo.update({ user_id: userId }, { is_revoked: true });
  }

  async updatePasswordHash(userId: string, newHash: string): Promise<void> {
    await this.userRepo.update(userId, { password_hash: newHash });
  }
}