import {
  IsOptional, IsEnum, IsString, IsDateString,
  IsInt, Min, Max, IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssetType, AssetStatus, SortOrder } from '@shared/constants/enums';

export class QueryIpAssetDto {
  @IsOptional()
  @IsEnum(AssetType, { each: true, message: 'asset_type không hợp lệ' })
  asset_type?: AssetType | AssetType[];

  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @IsOptional()
  @IsString()
  q?: string; // full-text search keyword

  @IsOptional()
  @IsString()
  application_number?: string;

  @IsOptional()
  @IsString()
  grant_number?: string;

  @IsOptional()
  @IsString()
  applicant_name?: string;

  @IsOptional()
  @IsString()
  province_code?: string;

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
  @IsDateString()
  grant_date_from?: string;

  @IsOptional()
  @IsDateString()
  grant_date_to?: string;

  @IsOptional()
  @IsDateString()
  expiry_date_from?: string;

  @IsOptional()
  @IsDateString()
  expiry_date_to?: string;

  @IsOptional()
  @IsIn(['title', 'application_date', 'grant_date', 'expiry_date', 'created_at'])
  sort_by?: string;

  @IsOptional()
  @IsEnum(SortOrder)
  sort_order?: SortOrder;

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