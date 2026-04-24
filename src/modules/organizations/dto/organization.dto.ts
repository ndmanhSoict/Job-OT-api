import { IsString, IsNotEmpty, IsOptional, MaxLength, IsEmail, IsIn } from 'class-validator';

const ORG_TYPES = ['company', 'cooperative', 'association', 'state_agency', 'other'] as const;

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty({ message: 'org_name không được để trống' })
  @MaxLength(500)
  org_name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  org_name_en?: string;

  @IsOptional()
  @IsIn(ORG_TYPES, { message: 'org_type không hợp lệ' })
  org_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  tax_code?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  district_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  province_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'email không hợp lệ' })
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string;
}

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  org_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  org_name_en?: string;

  @IsOptional()
  @IsIn(ORG_TYPES, { message: 'org_type không hợp lệ' })
  org_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  tax_code?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  district_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  province_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'email không hợp lệ' })
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string;
}

export class QueryOrganizationDto {
  q?: string;
  org_type?: string;
  province_code?: string;
  page?: number;
  limit?: number;
}
