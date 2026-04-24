import * as bcrypt from 'bcryptjs';
import { User } from '@models/user.entity';
import { AppError } from '@shared/helpers/app-error';
import { ErrorCode } from '@shared/constants/error-codes';
import { AuditAction } from '@shared/constants/enums';
import { buildPaginationMeta } from '@shared/helpers/pagination.helper';
import { writeAuditLog } from '@middleware/audit-log.middleware';
import { UserRepository } from '../repositories/user.repository';
import { CreateUserDto, UpdateUserDto, ResetPasswordDto } from '../dto/user.dto';
import { QueryUserDto } from '../dto/query-user.dto';

const BCRYPT_ROUNDS = 12;

function toSafeUser(user: User): Omit<User, 'password_hash' | 'refresh_tokens'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash: _ph, refresh_tokens: _rt, ...safe } = user;
  return safe;
}

export class UserService {
  private repo = new UserRepository();

  async list(query: QueryUserDto, page: number, limit: number) {
    const [items, total] = await this.repo.findMany(query, page, limit);
    return {
      items: items.map(toSafeUser),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getById(id: string) {
    const user = await this.repo.findById(id);
    if (!user) throw new AppError(ErrorCode.USER_NOT_FOUND, 404, 'Không tìm thấy tài khoản');
    return toSafeUser(user);
  }

  async create(dto: CreateUserDto, currentUserId: string, ipAddress?: string) {
    const [existingByUsername, existingByEmail] = await Promise.all([
      this.repo.findByUsername(dto.username),
      this.repo.findByEmail(dto.email),
    ]);

    if (existingByUsername) {
      throw new AppError(ErrorCode.USER_USERNAME_EXISTS, 409, 'Username đã được sử dụng');
    }
    if (existingByEmail) {
      throw new AppError(ErrorCode.USER_EMAIL_EXISTS, 409, 'Email đã được sử dụng');
    }

    const password_hash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.repo.create({
      username: dto.username,
      email: dto.email,
      password_hash,
      full_name: dto.full_name,
      role: dto.role,
      is_active: true,
      created_by: currentUserId,
      updated_by: currentUserId,
    });

    await writeAuditLog({
      userId: currentUserId,
      action: AuditAction.CREATE,
      entityType: 'users',
      entityId: user.id,
      newValue: toSafeUser(user) as unknown as Record<string, unknown>,
      ipAddress,
    });

    return toSafeUser(user);
  }

  async update(id: string, dto: UpdateUserDto, currentUserId: string, ipAddress?: string) {
    const before = await this.repo.findById(id);
    if (!before) throw new AppError(ErrorCode.USER_NOT_FOUND, 404, 'Không tìm thấy tài khoản');

    if (dto.email && dto.email !== before.email) {
      const existing = await this.repo.findByEmail(dto.email);
      if (existing && existing.id !== id) {
        throw new AppError(ErrorCode.USER_EMAIL_EXISTS, 409, 'Email đã được sử dụng');
      }
    }

    const updated = await this.repo.update(id, {
      ...(dto.full_name !== undefined && { full_name: dto.full_name }),
      ...(dto.email !== undefined && { email: dto.email }),
      ...(dto.role !== undefined && { role: dto.role }),
      ...(dto.is_active !== undefined && { is_active: dto.is_active }),
      updated_by: currentUserId,
    });
    if (!updated) throw new AppError(ErrorCode.USER_NOT_FOUND, 404, 'Không tìm thấy tài khoản');

    await writeAuditLog({
      userId: currentUserId,
      action: AuditAction.UPDATE,
      entityType: 'users',
      entityId: id,
      oldValue: toSafeUser(before) as unknown as Record<string, unknown>,
      newValue: toSafeUser(updated) as unknown as Record<string, unknown>,
      ipAddress,
    });

    return toSafeUser(updated);
  }

  async toggleActive(id: string, currentUserId: string, ipAddress?: string) {
    if (id === currentUserId) {
      throw new AppError(ErrorCode.UNPROCESSABLE_ENTITY, 422, 'Admin không thể tự khóa chính mình');
    }

    const user = await this.repo.findById(id);
    if (!user) throw new AppError(ErrorCode.USER_NOT_FOUND, 404, 'Không tìm thấy tài khoản');

    const newActiveState = !user.is_active;
    const updated = await this.repo.update(id, {
      is_active: newActiveState,
      updated_by: currentUserId,
    });

    await writeAuditLog({
      userId: currentUserId,
      action: AuditAction.UPDATE,
      entityType: 'users',
      entityId: id,
      oldValue: { is_active: user.is_active } as Record<string, unknown>,
      newValue: { is_active: newActiveState } as Record<string, unknown>,
      ipAddress,
    });

    return {
      id,
      is_active: newActiveState,
      message: newActiveState ? 'Tài khoản đã được mở khóa' : 'Tài khoản đã bị khóa',
    };
  }

  async resetPassword(id: string, dto: ResetPasswordDto, currentUserId: string, ipAddress?: string) {
    const user = await this.repo.findById(id);
    if (!user) throw new AppError(ErrorCode.USER_NOT_FOUND, 404, 'Không tìm thấy tài khoản');

    const password_hash = await bcrypt.hash(dto.new_password, BCRYPT_ROUNDS);

    await this.repo.update(id, { password_hash, updated_by: currentUserId });

    await writeAuditLog({
      userId: currentUserId,
      action: AuditAction.UPDATE,
      entityType: 'users',
      entityId: id,
      newValue: { action: 'reset_password' } as Record<string, unknown>,
      ipAddress,
    });

    return { message: 'Đặt lại mật khẩu thành công' };
  }
}
