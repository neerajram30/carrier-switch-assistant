import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { put, del } from '@vercel/blob';
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client';
import type {
  GenerateUploadTokenOptions,
  ObjectStoragePort,
  UploadFileBody,
  UploadFileOptions,
  UploadFileResult,
  UploadTokenResult,
} from './object-storage.port.js';

@Injectable()
export class VercelBlobStorageAdapter implements ObjectStoragePort {
  private readonly logger = new Logger(VercelBlobStorageAdapter.name);
  private readonly token?: string;

  constructor(private readonly configService: ConfigService) {
    this.token = this.configService.get<string>('BLOB_READ_WRITE_TOKEN');
  }

  async upload(
    pathname: string,
    body: UploadFileBody,
    options?: UploadFileOptions,
  ): Promise<UploadFileResult> {
    this.logger.debug(`Uploading file to Vercel Blob: ${pathname}`);

    try {
      const blob = await put(pathname, body as Parameters<typeof put>[1], {
        access: options?.access ?? 'public',
        contentType: options?.contentType,
        token: this.token,
      });

      return {
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType,
      };
    } catch (error) {
      this.logger.error(
        `Failed to upload file to Vercel Blob at "${pathname}": ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async delete(url: string): Promise<void> {
    this.logger.debug(`Deleting file from Vercel Blob: ${url}`);

    try {
      await del(url, {
        token: this.token,
      });
    } catch (error) {
      this.logger.error(
        `Failed to delete file from Vercel Blob at "${url}": ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async generateUploadToken(
    options: GenerateUploadTokenOptions,
  ): Promise<UploadTokenResult> {
    this.logger.debug(`Generating upload token for Vercel Blob: ${options.pathname}`);

    try {
      const clientToken = await generateClientTokenFromReadWriteToken({
        pathname: options.pathname,
        token: this.token,
        maximumSizeInBytes: options.maximumSizeInBytes,
        allowedContentTypes: [options.contentType],
      });

      return { clientToken };
    } catch (error) {
      this.logger.error(
        `Failed to generate upload token for Vercel Blob at "${options.pathname}": ${(error as Error).message}`,
      );
      throw error;
    }
  }
}
