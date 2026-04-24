import {
  IsArray, IsDateString, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength, MinLength,
} from 'class-validator';

export class CreateCraftVillageDto {
  @IsString()
  @IsNotEmpty({ message: 'village_name không được để trống' })
  @MaxLength(255)
  village_name: string;

  @IsArray({ message: 'products phải là mảng' })
  @MinLength(1, { each: true, message: 'Mỗi sản phẩm không được rỗng' })
  products: string[];

  @IsString()
  @IsNotEmpty({ message: 'address không được để trống' })
  address: string;

  @IsString()
  @IsNotEmpty({ message: 'district_code không được để trống' })
  @MaxLength(10)
  district_code: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  recognition_number?: string;

  @IsOptional()
  @IsDateString()
  recognition_date?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl({}, { message: 'representative_image phải là URL hợp lệ' })
  representative_image?: string;
}

export class UpdateCraftVillageDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'village_name không được để trống' })
  @MaxLength(255)
  village_name?: string;

  @IsOptional()
  @IsArray()
  @MinLength(1, { each: true })
  products?: string[];

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  recognition_number?: string;

  @IsOptional()
  @IsDateString()
  recognition_date?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl({}, { message: 'representative_image phải là URL hợp lệ' })
  representative_image?: string;
}
