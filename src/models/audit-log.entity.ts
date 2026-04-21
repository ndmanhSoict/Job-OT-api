import { AuditAction } from '@/shared/constants/enums';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * Audit log – append-only. KHÔNG có update/delete endpoint.
 */
@Entity('audit_logs')
@Index(['user_id'])
@Index(['entity_type', 'entity_id'])
@Index(['created_at'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, nullable: true, comment: 'FK → users.id (null nếu guest)' })
  user_id?: string;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ type: 'varchar', length: 100, comment: 'Tên bảng / entity bị tác động' })
  entity_type: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  entity_id?: string;

  @Column({ type: 'json', nullable: true, comment: 'Giá trị trước khi thay đổi' })
  old_value?: Record<string, unknown>;

  @Column({ type: 'json', nullable: true, comment: 'Giá trị sau khi thay đổi' })
  new_value?: Record<string, unknown>;

  @Column({ type: 'varchar', length: 45, nullable: true, comment: 'IP address của request' })
  ip_address?: string;

  @Column({ type: 'text', nullable: true, comment: 'User-Agent header' })
  user_agent?: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;
}