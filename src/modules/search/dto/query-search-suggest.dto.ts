import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AssetType } from '@shared/constants/enums';

export class QuerySearchSuggestDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(AssetType)
  asset_type?: AssetType;
}
