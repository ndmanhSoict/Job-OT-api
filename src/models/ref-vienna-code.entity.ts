import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('ref_vienna_classification')
export class RefViennaCode {
  @PrimaryColumn({ type: 'varchar', length: 20 })
  code: string;

  @Column({ type: 'tinyint' })
  level: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  parent_code?: string;

  @Column({ type: 'varchar', length: 1000 })
  description_vi: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  description_en?: string;
}
