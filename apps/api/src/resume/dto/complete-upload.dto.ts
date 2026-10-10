import { IsOptional, IsString } from 'class-validator';

export class CompleteResumeUploadDto {
  @IsOptional()
  @IsString()
  blobUrl?: string;
}
