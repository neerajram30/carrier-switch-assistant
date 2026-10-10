import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { del, head, put } from '@vercel/blob';
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client';
import type {
  GenerateUploadTokenOptions,
  ObjectStoragePort,
  StorageMetadata,
  UploadFileBody,
  UploadFileOptions,
  UploadFileResult,
  UploadTokenResult,
} from './object-storage.port.js';

@Injectable()
export class VercelBlobStorageAdapter
  implements ObjectStoragePort, OnModuleInit
{
  private readonly logger = new Logger(VercelBlobStorageAdapter.name);
  private readonly token?: string;

  constructor(private readonly configService: ConfigService) {
    this.token = this.configService.get<string>('BLOB_READ_WRITE_TOKEN');
  }

  onModuleInit(): void {
    const isTestEnv =
      process.env.NODE_ENV === 'test' ||
      this.configService.get<string>('NODE_ENV') === 'test';

    if (!isTestEnv && !this.token) {
      throw new Error(
        'BLOB_READ_WRITE_TOKEN environment variable is required when VercelBlobStorageAdapter is enabled.',
      );
    }
  }

  async upload(
    pathname: string,
    body: UploadFileBody,
    options?: UploadFileOptions,
  ): Promise<UploadFileResult> {
    this.logger.debug(`Uploading file to Vercel Blob: ${pathname}`);

    try {
      const blob = await put(pathname, body as Parameters<typeof put>[1], {
        access: options?.access ?? 'private',
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

  async delete(storageKey: string): Promise<void> {
    this.logger.debug(`Deleting file from Vercel Blob: ${storageKey}`);

    try {
      await del(storageKey, {
        token: this.token,
      });
    } catch (error) {
      this.logger.error(
        `Failed to delete file from Vercel Blob at "${storageKey}": ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async generateUploadToken(
    options: GenerateUploadTokenOptions,
  ): Promise<UploadTokenResult> {
    this.logger.debug(
      `Generating upload token for Vercel Blob: ${options.pathname}`,
    );

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

  async head(storageKey: string): Promise<StorageMetadata | null> {
    this.logger.debug(`Fetching metadata for Vercel Blob: ${storageKey}`);

    try {
      const metadata = await head(storageKey, {
        token: this.token,
      });

      return {
        url: metadata.url,
        pathname: metadata.pathname,
        size: metadata.size,
        contentType: metadata.contentType,
        uploadedAt: metadata.uploadedAt,
      };
    } catch (error) {
      if (
        (error as Error).name === 'BlobNotFoundError' ||
        (error as Error).message?.includes('could not find') ||
        (error as Error).message?.toLowerCase().includes('not found')
      ) {
        return null;
      }
      this.logger.error(
        `Failed to fetch metadata for Vercel Blob at "${storageKey}": ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async exists(storageKey: string): Promise<boolean> {
    const metadata = await this.head(storageKey);
    return metadata !== null;
  }
}
