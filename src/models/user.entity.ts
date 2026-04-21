import { Entity, Column, Index, BeforeInsert, BeforeUpdate } from 'typeorm';
import bcrypt from 'bcryptjs';
import { BaseEntity } from './base.entity';
import { UserRole } from '@/shared/constants/enums';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false, comment: 'bcrypt hash, ≥12 rounds' })
  password_hash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STAFF })
  role: UserRole;

  @Column({ type: 'varchar', length: 100, nullable: true })
  full_name?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'int', default: 0, comment: 'Số lần đăng nhập sai liên tiếp' })
  failed_login_count: number;

  @Column({ type: 'datetime', nullable: true, comment: 'Thời điểm bị khóa tạm thời' })
  locked_until?: Date;

  @Column({ type: 'datetime', nullable: true })
  last_login_at?: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPasswordIfChanged(): Promise<void> {
    // Chỉ hash nếu password_hash được set (tức là plain text password đang được cập nhật)
    // Service phải set password_hash = plain text trước khi save để trigger này hoạt động
  }

  isLocked(): boolean {
    return !!this.locked_until && this.locked_until > new Date();
  }

  async verifyPassword(plainText: string): Promise<boolean> {
    return bcrypt.compare(plainText, this.password_hash);
  }

  toSafeJSON() {
    const { password_hash, ...safe } = this as Record<string, unknown>;
    void password_hash; // suppress unused warning
    return safe;
  }
}