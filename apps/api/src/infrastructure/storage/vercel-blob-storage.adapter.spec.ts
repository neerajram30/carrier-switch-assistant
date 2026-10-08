import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VercelBlobStorageAdapter } from './vercel-blob-storage.adapter.js';
import * as vercelBlob from '@vercel/blob';

vi.mock('@vercel/blob', () => ({
  put: vi.fn(),
  del: vi.fn(),
}));

describe('VercelBlobStorageAdapter', () => {
  let adapter: VercelBlobStorageAdapter;
  let configService: ConfigService;

  beforeEach(() => {
    vi.clearAllMocks();
    configService = new ConfigService({
      BLOB_READ_WRITE_TOKEN: 'mock-token-xyz',
    });
    adapter = new VercelBlobStorageAdapter(configService);
  });

  describe('upload', () => {
    it('uploads a file with configured token and default public access', async () => {
      // 1. ARRANGE
      const mockResult = {
        url: 'https://store.public.blob.vercel-storage.com/resumes/my-resume.pdf',
        pathname: 'resumes/my-resume.pdf',
        contentType: 'application/pdf',
      };
      vi.mocked(vercelBlob.put).mockResolvedValue(mockResult as never);

      const buffer = Buffer.from('test pdf content');

      // 2. ACT
      const result = await adapter.upload('resumes/my-resume.pdf', buffer, {
        contentType: 'application/pdf',
      });

      // 3. ASSERT
      expect(vercelBlob.put).toHaveBeenCalledWith(
        'resumes/my-resume.pdf',
        buffer,
        {
          access: 'public',
          contentType: 'application/pdf',
          token: 'mock-token-xyz',
        },
      );
      expect(result).toEqual({
        url: mockResult.url,
        pathname: mockResult.pathname,
        contentType: 'application/pdf',
      });
    });

    it('throws and propagates error when upload operation fails', async () => {
      // 1. ARRANGE
      const uploadError = new Error('Vercel Blob upload failed: Network Error');
      vi.mocked(vercelBlob.put).mockRejectedValue(uploadError as never);

      const buffer = Buffer.from('test pdf content');

      // 2. ACT & ASSERT
      await expect(
        adapter.upload('resumes/my-resume.pdf', buffer, {
          contentType: 'application/pdf',
        }),
      ).rejects.toThrow('Vercel Blob upload failed: Network Error');

      expect(vercelBlob.put).toHaveBeenCalledWith(
        'resumes/my-resume.pdf',
        buffer,
        {
          access: 'public',
          contentType: 'application/pdf',
          token: 'mock-token-xyz',
        },
      );
    });
  });

  describe('delete', () => {
    it('deletes a file with the configured token', async () => {
      // 1. ARRANGE
      vi.mocked(vercelBlob.del).mockResolvedValue(undefined as never);
      const url = 'https://store.public.blob.vercel-storage.com/resumes/my-resume.pdf';

      // 2. ACT
      await adapter.delete(url);

      // 3. ASSERT
      expect(vercelBlob.del).toHaveBeenCalledWith(url, {
        token: 'mock-token-xyz',
      });
    });

    it('throws and propagates error when delete operation fails', async () => {
      // 1. ARRANGE
      const deleteError = new Error('Vercel Blob delete failed: Blob not found');
      vi.mocked(vercelBlob.del).mockRejectedValue(deleteError as never);
      const url = 'https://store.public.blob.vercel-storage.com/resumes/my-resume.pdf';

      // 2. ACT & ASSERT
      await expect(adapter.delete(url)).rejects.toThrow(
        'Vercel Blob delete failed: Blob not found',
      );

      expect(vercelBlob.del).toHaveBeenCalledWith(url, {
        token: 'mock-token-xyz',
      });
    });
  });
});
