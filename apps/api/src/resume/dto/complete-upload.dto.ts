import { IsNotEmpty, IsUrl } from 'class-validator';

export class CompleteResumeUploadDto {
  @IsUrl(
    { require_protocol: true },
    { message: 'blobUrl must be a valid absolute URL' },
  )
  @IsNotEmpty({ message: 'blobUrl is required' })
  blobUrl: string;
}
