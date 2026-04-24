import { IsEnum, IsIn } from 'class-validator';
import { AssetType } from '@shared/constants/enums';

export class ImportAssetDto {
  @IsEnum(AssetType)
  asset_type: AssetType;

  @IsIn(['skip', 'update'])
  on_duplicate: 'skip' | 'update' = 'skip';
}
