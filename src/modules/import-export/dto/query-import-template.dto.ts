import { IsEnum } from 'class-validator';
import { AssetType } from '@shared/constants/enums';

export class QueryImportTemplateDto {
  @IsEnum(AssetType)
  asset_type: AssetType;
}
