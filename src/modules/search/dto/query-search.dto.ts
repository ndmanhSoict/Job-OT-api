import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { AssetStatus, AssetType } from '@shared/constants/enums';

export class QuerySearchDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(AssetType, { each: true, message: 'asset_type không hợp lệ' })
  asset_type?: AssetType | AssetType[];

  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @IsOptional()
  @IsString()
  district_code?: string;

  @IsOptional()
  @IsDateString()
  application_date_from?: string;

  @IsOptional()
  @IsDateString()
  application_date_to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
