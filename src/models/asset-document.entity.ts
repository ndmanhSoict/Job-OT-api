import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('asset_documents')
@Index(['asset_id'])
export class AssetDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  asset_id: string;

  @Column({ type: 'varchar', length: 500, comment: 'URL file tài liệu trên local/MinIO' })
  doc_url: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: 'Loại tài liệu' })
  doc_type?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: 'Tên file gốc' })
  original_filename?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: 'MIME type' })
  mime_type?: string;

  @Column({ type: 'int', nullable: true, comment: 'Kích thước file (bytes)' })
  file_size?: number;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'varchar', length: 36, nullable: true })
  uploaded_by?: string;
}
