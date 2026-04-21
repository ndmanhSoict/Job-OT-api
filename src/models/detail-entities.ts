import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { IpAsset } from './ip-asset.entity';
import { CopyrightWorkType, TrademarkApplicationType, PatentType } from '@shared/constants/enums';

// ─────────────────────────────────────────────────
// Bản quyền tác giả
// ─────────────────────────────────────────────────
@Entity('copyright_details')
export class CopyrightDetail {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  asset_id: string;

  @OneToOne(() => IpAsset)
  @JoinColumn({ name: 'asset_id' })
  asset: IpAsset;

  @Column({ type: 'enum', enum: CopyrightWorkType, nullable: true })
  work_type?: CopyrightWorkType;

  @Column({ type: 'text', nullable: true, comment: 'Tên các tác giả (có thể nhiều)' })
  authors?: string;

  @Column({ type: 'text', nullable: true })
  author_address?: string;

  @Column({ type: 'text', nullable: true })
  owner_name?: string;

  @Column({ type: 'text', nullable: true })
  owner_address?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: 'URL file tác phẩm mẫu (MinIO)' })
  work_sample_url?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: 'Số giấy chứng nhận' })
  certificate_number?: string;

  @Column({ type: 'date', nullable: true })
  certificate_date?: Date;
}

// ─────────────────────────────────────────────────
// Nhãn hiệu
// ─────────────────────────────────────────────────
@Entity('trademark_details')
export class TrademarkDetail {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  asset_id: string;

  @OneToOne(() => IpAsset)
  @JoinColumn({ name: 'asset_id' })
  asset: IpAsset;

  @Column({ type: 'enum', enum: TrademarkApplicationType, nullable: true })
  application_type?: TrademarkApplicationType;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: 'URL ảnh logo nhãn hiệu' })
  logo_image_url?: string;

  @Column({ type: 'json', nullable: true, comment: 'Mảng mã Vienna Classification' })
  vienna_codes?: string[];

  @Column({ type: 'json', nullable: true, comment: 'Mảng số nhóm Nice (1-45)' })
  nice_classes?: number[];

  @Column({ type: 'text', nullable: true, comment: 'Mô tả hàng hóa/dịch vụ' })
  goods_services_description?: string;

  @Column({ type: 'boolean', default: false, comment: 'Nhãn hiệu màu sắc?' })
  is_colored?: boolean;
}

// ─────────────────────────────────────────────────
// Sáng chế / Giải pháp hữu ích
// ─────────────────────────────────────────────────
@Entity('patent_details')
export class PatentDetail {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  asset_id: string;

  @OneToOne(() => IpAsset)
  @JoinColumn({ name: 'asset_id' })
  asset: IpAsset;

  @Column({ type: 'enum', enum: PatentType, default: PatentType.INVENTION })
  patent_type: PatentType;

  @Column({ type: 'json', nullable: true, comment: 'Mảng tên tác giả/nhà sáng chế' })
  inventors?: string[];

  @Column({ type: 'json', nullable: true, comment: 'Mảng mã IPC (vd: A61K 31/00)' })
  ipc_codes?: string[];

  @Column({ type: 'longtext', nullable: true, comment: 'Tóm tắt sáng chế' })
  abstract_text?: string;

  @Column({ type: 'longtext', nullable: true, comment: 'Yêu cầu bảo hộ' })
  claims?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: 'URL file mô tả toàn văn' })
  full_text_url?: string;

  @Column({ type: 'int', nullable: true, comment: 'Số lượng yêu cầu bảo hộ độc lập' })
  independent_claims_count?: number;
}

// ─────────────────────────────────────────────────
// Kiểu dáng công nghiệp
// ─────────────────────────────────────────────────
@Entity('design_details')
export class DesignDetail {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  asset_id: string;

  @OneToOne(() => IpAsset)
  @JoinColumn({ name: 'asset_id' })
  asset: IpAsset;

  @Column({ type: 'json', nullable: true, comment: 'Mảng tên tác giả kiểu dáng' })
  creators?: string[];

  @Column({ type: 'json', nullable: true, comment: 'Mảng mã Locarno (vd: 14-01)' })
  locarno_codes?: string[];

  @Column({ type: 'text', nullable: true, comment: 'Mô tả kiểu dáng' })
  description?: string;

  @Column({ type: 'int', nullable: true, comment: 'Số phương án kiểu dáng' })
  design_variants_count?: number;

  @Column({ type: 'int', nullable: true, comment: 'Lần gia hạn hiệu lực (max 2)' })
  renewal_count?: number;
}

// ─────────────────────────────────────────────────
// Chỉ dẫn địa lý
// ─────────────────────────────────────────────────
@Entity('gi_details')
export class GiDetail {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  asset_id: string;

  @OneToOne(() => IpAsset)
  @JoinColumn({ name: 'asset_id' })
  asset: IpAsset;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: 'Tên sản phẩm mang CDĐL' })
  product_name?: string;

  @Column({ type: 'text', nullable: true, comment: 'Mô tả khu vực địa lý' })
  geographical_area?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: 'Tên tổ chức quản lý CDĐL' })
  managing_org?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: 'URL file bản mô tả đính kèm' })
  description_doc_url?: string;

  @Column({ type: 'text', nullable: true })
  quality_characteristics?: string;
}