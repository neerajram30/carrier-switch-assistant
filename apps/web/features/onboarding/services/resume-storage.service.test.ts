import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vercelBlobClient from '@vercel/blob/client';
import { uploadResumeDirectly } from './resume-storage.service';

vi.mock('@vercel/blob/client', () => ({
  put: vi.fn(),
}));

describe('uploadResumeDirectly Service', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('completes the 3-step direct upload flow successfully', async () => {
    const mockFile = new File(['content'], 'my-resume.pdf', {
      type: 'application/pdf',
    });

    const mockFetch = vi
      .fn()
      // Step 1: upload-intent response
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          resumeId: 'res-uuid-1',
          clientToken: 'mock-token-xyz',
          storageKey: 'users/u1/resumes/res-uuid-1/original',
        }),
      })
      // Step 3: complete response
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'res-uuid-1',
          status: 'UPLOADED',
        }),
      });

    global.fetch = mockFetch;

    vi.mocked(vercelBlobClient.put).mockResolvedValueOnce({
      url: 'https://store.public.blob.vercel-storage.com/uploaded.pdf',
      downloadUrl:
        'https://store.public.blob.vercel-storage.com/uploaded.pdf?download=1',
      pathname: 'users/u1/resumes/res-uuid-1/original',
      contentType: 'application/pdf',
      contentDisposition: 'inline',
      etag: 'mock-etag',
    });

    const result = await uploadResumeDirectly(
      mockFile,
      'http://localhost:3001',
      'dev-user-123',
    );

    // Verify Step 1: upload intent call
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3001/api/v1/resumes/upload-intent',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'dev-user-123',
        },
        body: JSON.stringify({
          fileName: 'my-resume.pdf',
          contentType: 'application/pdf',
          fileSize: mockFile.size,
        }),
      }),
    );

    // Verify Step 2: Vercel Blob client upload
    expect(vercelBlobClient.put).toHaveBeenCalledWith(
      'users/u1/resumes/res-uuid-1/original',
      mockFile,
      {
        access: 'public',
        token: 'mock-token-xyz',
      },
    );

    // Verify Step 3: complete verification call
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3001/api/v1/resumes/res-uuid-1/complete',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'dev-user-123',
        },
        body: JSON.stringify({
          blobUrl: 'https://store.public.blob.vercel-storage.com/uploaded.pdf',
        }),
      }),
    );

    expect(result).toEqual({
      resumeId: 'res-uuid-1',
      blobUrl: 'https://store.public.blob.vercel-storage.com/uploaded.pdf',
      storageKey: 'users/u1/resumes/res-uuid-1/original',
      status: 'UPLOADED',
    });
  });

  it('throws error when upload-intent fails', async () => {
    const mockFile = new File(['content'], 'my-resume.pdf', {
      type: 'application/pdf',
    });

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        message: 'Invalid file size',
      }),
    });

    await expect(uploadResumeDirectly(mockFile)).rejects.toThrow(
      'Invalid file size',
    );

    expect(vercelBlobClient.put).not.toHaveBeenCalled();
  });

  it('throws error when server verification fails in step 3', async () => {
    const mockFile = new File(['content'], 'my-resume.pdf', {
      type: 'application/pdf',
    });

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          resumeId: 'res-uuid-1',
          clientToken: 'token',
          storageKey: 'key',
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          message: 'Object does not exist in storage',
        }),
      });

    vi.mocked(vercelBlobClient.put).mockResolvedValueOnce({
      url: 'https://store.public.blob.vercel-storage.com/uploaded.pdf',
      downloadUrl:
        'https://store.public.blob.vercel-storage.com/uploaded.pdf?download=1',
      pathname: 'key',
      contentType: 'application/pdf',
      contentDisposition: 'inline',
      etag: 'mock-etag',
    });

    await expect(uploadResumeDirectly(mockFile)).rejects.toThrow(
      'Object does not exist in storage',
    );
  });
});
