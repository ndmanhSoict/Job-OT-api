import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('persons')
export class Person {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 255, comment: 'Họ và tên đầy đủ' })
  full_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: 'Tên tiếng Anh' })
  full_name_en?: string;

  @Column({ type: 'varchar', length: 20, nullable: true, comment: 'CMND/CCCD (ẩn ở public portal)' })
  id_number?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, default: 'Việt Nam', comment: 'Quốc tịch' })
  nationality?: string;

  @Column({ type: 'text', nullable: true, comment: 'Địa chỉ đầy đủ' })
  address?: string;

  @Column({ type: 'varchar', length: 10, nullable: true, comment: 'FK → ref_districts' })
  district_code?: string;

  @Column({ type: 'varchar', length: 10, nullable: true, default: 'BN', comment: 'FK → ref_provinces' })
  province_code?: string;

  @Column({ type: 'varchar', length: 20, nullable: true, comment: 'Số điện thoại (ẩn ở public portal)' })
  phone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: 'Email (ẩn ở public portal)' })
  email?: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deleted_at?: Date;
}
