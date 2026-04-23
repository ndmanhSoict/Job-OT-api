import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserRole } from '../shared/constants/enums';
import { RefreshToken } from './refresh-token.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true, comment: 'Tên đăng nhập' })
  username: string;

  @Column({ type: 'varchar', length: 255, unique: true, comment: 'Email' })
  email: string;

  @Column({ type: 'varchar', length: 255, comment: 'Mật khẩu đã hash (bcrypt)' })
  password_hash: string;

  @Column({ type: 'varchar', length: 255, comment: 'Họ và tên đầy đủ' })
  full_name: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STAFF, comment: 'Vai trò: admin | staff' })
  role: UserRole;

  @Column({ type: 'tinyint', default: 1, comment: 'Tài khoản hoạt động' })
  is_active: boolean;

  @Column({ type: 'tinyint', default: 0, comment: 'Số lần đăng nhập sai liên tiếp' })
  failed_login_count: number;

  @Column({ type: 'datetime', nullable: true, comment: 'Khóa tài khoản đến thời điểm này' })
  locked_until?: Date;

  @Column({ type: 'datetime', nullable: true, comment: 'Lần đăng nhập cuối' })
  last_login_at?: Date;

  @OneToMany(() => RefreshToken, (rt) => rt.user)
  refresh_tokens: RefreshToken[];
}