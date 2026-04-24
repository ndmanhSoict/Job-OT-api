import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ fulltext: true })
  @Column({ type: 'varchar', length: 500, comment: 'Tên tổ chức/doanh nghiệp' })
  org_name: string;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: 'Tên tiếng Anh' })
  org_name_en?: string;

  @Column({
    type: 'enum',
    enum: ['company', 'cooperative', 'association', 'state_agency', 'other'],
    default: 'company',
    comment: 'Loại tổ chức',
  })
  org_type: string;

  @Column({ type: 'varchar', length: 20, nullable: true, comment: 'Mã số thuế' })
  tax_code?: string;

  @Column({ type: 'text', nullable: true, comment: 'Địa chỉ đầy đủ' })
  address?: string;

  @Column({ type: 'varchar', length: 10, nullable: true, comment: 'FK → ref_districts' })
  district_code?: string;

  @Column({ type: 'varchar', length: 10, nullable: true, default: 'BN', comment: 'FK → ref_provinces' })
  province_code?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  website?: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deleted_at?: Date;
}
