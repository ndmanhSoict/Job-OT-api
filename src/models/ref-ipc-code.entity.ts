import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('ref_ipc_classification')
export class RefIpcCode {
  @PrimaryColumn({ type: 'varchar', length: 20 })
  code: string;

  @Column({ type: 'tinyint' })
  level: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  parent_code?: string;

  @Column({ type: 'varchar', length: 2000 })
  description_vi: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  description_en?: string;
}
