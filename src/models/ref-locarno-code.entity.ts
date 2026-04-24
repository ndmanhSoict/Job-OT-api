import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('ref_locarno_classification')
export class RefLocarnoCode {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  code: string;

  @Column({ type: 'tinyint' })
  level: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  parent_code?: string;

  @Column({ type: 'varchar', length: 1000 })
  description_vi: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  description_en?: string;
}
