import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('ref_copyright_work_types')
export class RefCopyrightWorkType {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name_vi: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name_en?: string;
}
