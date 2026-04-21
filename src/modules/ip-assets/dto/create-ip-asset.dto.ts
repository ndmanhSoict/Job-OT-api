import {
  IsEnum, IsString, IsNotEmpty, IsOptional,
  IsDateString, MaxLength, IsObject,
} from 'class-validator';
import { AssetType, AssetStatus } from '@shared/constants/enums';

export class CreateIpAssetDto {
  @IsEnum(AssetType, { message: 'asset_type không hợp lệ' })
  asset_type: AssetType;

  @IsString()
  @IsNotEmpty({ message: 'Tên đối tượng không được để trống' })
  @MaxLength(500)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  application_number?: string;

  @IsOptional()
  @IsDateString()
  application_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  publication_number?: string;

  @IsOptional()
  @IsDateString()
  publication_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  grant_number?: string;

  @IsOptional()
  @IsDateString()
  grant_date?: string;

  @IsOptional()
  @IsDateString()
  expiry_date?: string;

  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  applicant_org_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  applicant_person_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  applicant_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  province_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  district_code?: string;

  @IsOptional()
  @IsString()
  internal_notes?: string;

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}

export class UpdateIpAssetDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  application_number?: string;

  @IsOptional()
  @IsDateString()
  application_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  grant_number?: string;

  @IsOptional()
  @IsDateString()
  grant_date?: string;

  @IsOptional()
  @IsDateString()
  expiry_date?: string;

  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  applicant_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  district_code?: string;

  @IsOptional()
  @IsString()
  internal_notes?: string;

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}