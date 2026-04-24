import { IsIn, IsOptional, IsString } from 'class-validator';

const DOCUMENT_TYPES = ['description', 'claim', 'work_sample', 'certificate', 'other'] as const;

export class UploadAssetDocumentDto {
  @IsOptional()
  @IsString()
  @IsIn(DOCUMENT_TYPES)
  doc_type?: string;
}
