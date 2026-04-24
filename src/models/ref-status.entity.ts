import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('ref_status')
export class RefStatus {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name_vi: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name_en?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'tinyint', default: 0 })
  sort_order: number;
}
