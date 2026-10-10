import { IsIn, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export class CreateUploadIntentDto {
  @IsString({ message: 'fileName must be a string' })
  @IsNotEmpty({ message: 'fileName is required' })
  fileName: string;

  @IsString({ message: 'contentType must be a string' })
  @IsNotEmpty({ message: 'contentType is required' })
  @IsIn(ALLOWED_MIME_TYPES, {
    message:
      'Unsupported contentType. Allowed types: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
  contentType: string;

  @IsInt({ message: 'fileSize must be an integer' })
  @Min(1, { message: 'fileSize must be at least 1 byte' })
  @Max(MAX_FILE_SIZE_BYTES, {
    message: `fileSize cannot exceed maximum limit of 5 MB (${MAX_FILE_SIZE_BYTES} bytes)`,
  })
  fileSize: number;
}
