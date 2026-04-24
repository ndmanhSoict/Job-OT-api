import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('ref_provinces')
export class RefProvince {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name_en?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  region?: string;
}
