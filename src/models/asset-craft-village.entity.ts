import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('asset_craft_villages')
@Index(['village_id'])
export class AssetCraftVillage {
  @PrimaryColumn({ type: 'varchar', length: 36, comment: 'FK → ip_assets.id' })
  asset_id: string;

  @PrimaryColumn({ type: 'varchar', length: 36, comment: 'FK → craft_villages.id' })
  village_id: string;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: 'Ghi chú mối quan hệ' })
  relation_note?: string;
}
