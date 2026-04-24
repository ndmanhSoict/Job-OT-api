import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('ref_districts')
export class RefDistrict {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  code: string;

  @Column({ type: 'varchar', length: 10 })
  province_code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name_en?: string;
}
