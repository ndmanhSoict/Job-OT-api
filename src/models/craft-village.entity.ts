import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('craft_villages')
@Index(['district_code'])
@Index(['village_name'])
export class CraftVillage extends BaseEntity {
  @Column({ type: 'varchar', length: 255, comment: 'Tên làng nghề' })
  village_name: string;

  @Column({ type: 'json', nullable: true, comment: 'Mảng sản phẩm đặc trưng' })
  products?: string[];

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 10, nullable: true, comment: 'FK → ref_districts.code' })
  district_code?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: 'Số bằng công nhận làng nghề' })
  recognition_number?: string;

  @Column({ type: 'date', nullable: true, comment: 'Ngày công nhận' })
  recognition_date?: Date;

  @Column({ type: 'longtext', nullable: true, comment: 'Lịch sử, đặc trưng' })
  description?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: 'URL ảnh đại diện' })
  representative_image?: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;
}