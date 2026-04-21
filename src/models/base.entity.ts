import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
} from 'typeorm';

/**
 * Base entity kế thừa bởi mọi entity SHTT
 * Cung cấp: UUID PK, audit columns, soft delete
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'datetime', comment: 'Thời điểm tạo bản ghi' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime', comment: 'Thời điểm cập nhật cuối' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true, comment: 'Soft delete timestamp' })
  deleted_at?: Date;

  @Column({ type: 'varchar', length: 36, nullable: true, comment: 'ID người tạo' })
  created_by?: string;

  @Column({ type: 'varchar', length: 36, nullable: true, comment: 'ID người cập nhật cuối' })
  updated_by?: string;
}