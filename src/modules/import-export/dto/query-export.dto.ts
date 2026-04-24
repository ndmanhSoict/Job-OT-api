import { IsIn, IsOptional, IsString } from 'class-validator';
import { QueryIpAssetDto } from '@modules/ip-assets/dto/query-ip-asset.dto';

export class QueryExportDto extends QueryIpAssetDto {
  @IsOptional()
  @IsIn(['excel', 'csv'])
  format?: 'excel' | 'csv';

  @IsOptional()
  @IsString()
  ids?: string;
}
