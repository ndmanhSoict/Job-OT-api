import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

const IMAGE_TYPES = [
  'logo',
  'main',
  'front',
  'back',
  'top',
  'bottom',
  'side_left',
  'side_right',
  'perspective',
  'cross_section',
  'detail',
  'other',
] as const;

export class UploadAssetImageDto {
  @IsOptional()
  @IsString()
  @IsIn(IMAGE_TYPES)
  image_type?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_primary?: boolean;
}
