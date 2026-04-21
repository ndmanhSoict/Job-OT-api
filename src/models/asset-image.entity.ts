import { Entity, Column, Index, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('asset_images')
@Index(['asset_id'])
export class AssetImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  asset_id: string;

  @Column({ type: 'varchar', length: 500, comment: 'URL file trên MinIO/local' })
  image_url: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: 'Tên file gốc' })
  original_filename?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: 'MIME type' })
  mime_type?: string;

  @Column({ type: 'int', nullable: true, comment: 'Kích thước file (bytes)' })
  file_size?: number;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: 'Góc chiếu (front, back, side...)' })
  view_angle?: string;

  @Column({ type: 'int', default: 0, comment: 'Thứ tự hiển thị' })
  sort_order: number;

  @Column({ type: 'boolean', default: false, comment: 'Ảnh đại diện?' })
  is_primary: boolean;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'varchar', length: 36, nullable: true })
  uploaded_by?: string;
}