import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('ref_nice_classification')
export class RefNiceClass {
  @PrimaryColumn({ type: 'tinyint', unsigned: true })
  class_no: number;

  @Column({ type: 'text' })
  description_vi: string;

  @Column({ type: 'text', nullable: true })
  description_en?: string;
}
