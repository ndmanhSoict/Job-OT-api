import { Entity, Column, CreateDateColumn, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Lưu refresh tokens – rotate mỗi lần dùng, revoke khi logout
 */
@Entity('refresh_tokens')
@Index(['token'], { unique: true })
@Index(['user_id'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  user_id: string;

  @Column({ type: 'varchar', length: 512, unique: true })
  token: string;

  @Column({ type: 'datetime', comment: 'Thời điểm hết hạn' })
  expires_at: Date;

  @Column({ type: 'boolean', default: false })
  is_revoked: boolean;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address?: string;

  @Column({ type: 'text', nullable: true })
  user_agent?: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  isExpired(): boolean {
    return new Date() > this.expires_at;
  }

  isValid(): boolean {
    return !this.is_revoked && !this.isExpired();
  }
}