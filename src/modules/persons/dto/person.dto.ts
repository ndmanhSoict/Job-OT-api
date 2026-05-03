import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, MaxLength, IsEmail, IsInt, Min, Max } from 'class-validator';

export class CreatePersonDto {
  @IsString()
  @IsNotEmpty({ message: 'full_name không được để trống' })
  @MaxLength(255)
  full_name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  full_name_en?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  id_number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationality?: string;

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
}

export class UpdatePersonDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  full_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  full_name_en?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  id_number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationality?: string;

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
}

export class QueryPersonDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationality?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  province_code?: string;

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
