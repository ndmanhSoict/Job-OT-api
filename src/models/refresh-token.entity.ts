import { Column, Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

/**
 * Bảng lưu refresh token (hash) – hỗ trợ token rotation & revoke.
 * Không kế thừa BaseEntity vì không cần soft-delete và audit columns.
 */
@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** SHA-256 hash của refresh token thực; không lưu plaintext */
  @Column({ type: 'varchar', length: 255, unique: true, comment: 'SHA-256 hash của refresh token' })
  token_hash: string;

  @Column({ type: 'char', length: 36, comment: 'FK → users.id' })
  user_id: string;

  @ManyToOne(() => User, (u) => u.refresh_tokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'datetime', comment: 'Thời điểm hết hạn' })
  expires_at: Date;

  @Column({ type: 'tinyint', default: 0, comment: '1 = đã bị revoke' })
  is_revoked: boolean;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;
}