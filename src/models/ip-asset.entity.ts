import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { AssetStatus, AssetType } from '@/shared/constants/enums';

@Entity('ip_assets')
@Index(['asset_type'])
@Index(['status'])
@Index(['application_number'])
@Index(['grant_number'])
@Index(['province_code', 'district_code'])
@Index(['applicant_org_id'])
export class IpAsset extends BaseEntity {
  @Column({ type: 'enum', enum: AssetType, comment: 'Loại đối tượng SHTT' })
  asset_type: AssetType;

  @Column({ type: 'varchar', length: 500, comment: 'Tên đối tượng SHTT' })
  title: string;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  application_number?: string;

  @Column({ type: 'date', nullable: true, comment: 'Ngày nộp đơn' })
  application_date?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  publication_number?: string;

  @Column({ type: 'date', nullable: true, comment: 'Ngày công bố' })
  publication_date?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  grant_number?: string;

  @Column({ type: 'date', nullable: true, comment: 'Ngày cấp bằng/GCN' })
  grant_date?: Date;

  @Column({ type: 'date', nullable: true, comment: 'Ngày hết hạn (tính toán tự động)' })
  expiry_date?: Date;

  @Column({ type: 'varchar', length: 50, default: AssetStatus.PENDING_FORMAL, comment: 'FK → ref_status' })
  status: AssetStatus;

  // Chủ đơn / chủ bằng (FK tới organizations hoặc persons – dùng polymorphic đơn giản)
  @Column({ type: 'varchar', length: 36, nullable: true, comment: 'FK → organizations.id' })
  applicant_org_id?: string;

  @Column({ type: 'varchar', length: 36, nullable: true, comment: 'FK → persons.id' })
  applicant_person_id?: string;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: 'Tên chủ đơn (denormalized để search nhanh)' })
  applicant_name?: string;

  @Column({ type: 'varchar', length: 10, default: 'BN', comment: 'Mã tỉnh (mặc định BN)' })
  province_code: string;

  @Column({ type: 'varchar', length: 10, nullable: true, comment: 'Mã huyện' })
  district_code?: string;

  @Column({ type: 'text', nullable: true, comment: 'Ghi chú nội bộ' })
  internal_notes?: string;

  @Column({ type: 'json', nullable: true, comment: 'Metadata mở rộng (bán cấu trúc)' })
  meta?: Record<string, unknown>;
}