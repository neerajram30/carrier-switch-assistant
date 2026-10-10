import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vercelBlobClient from '@vercel/blob/client';
import Home from '../app/page';

// Controlled test adapter / mock for external Vercel Blob client boundary
vi.mock('@vercel/blob/client', () => ({
  put: vi.fn(),
}));

describe('Resume Upload E2E Journey', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('completes the full end-to-end user journey: Open / -> Select resume -> Upload -> Resume successfully uploaded', async () => {
    // -------------------------------------------------------------------------
    // 1. Arrange: Setup controlled backend and storage boundaries
    // -------------------------------------------------------------------------
    const mockIntentResponse = {
      resumeId: 'resume-e2e-uuid-42',
      clientToken: 'scoped-client-token-xyz',
      storageKey: 'users/dev-user-123/resumes/resume-e2e-uuid-42/original',
      status: 'UPLOADING' as const,
    };

    const mockCompleteResponse = {
      id: 'resume-e2e-uuid-42',
      userId: 'dev-user-123',
      originalFileName: 'neeraj-resume.pdf',
      contentType: 'application/pdf',
      fileSize: 183421,
      storageKey:
        'https://store.public.blob.vercel-storage.com/users/dev-user-123/resumes/resume-e2e-uuid-42/original',
      status: 'UPLOADED' as const,
    };

    const mockFetch = vi
      .fn()
      // Step 1: Backend upload intent
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockIntentResponse,
      })
      // Step 3: Backend complete verification
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCompleteResponse,
      });

    global.fetch = mockFetch;

    // Step 2: Controlled Blob Storage upload adapter
    vi.mocked(vercelBlobClient.put).mockResolvedValueOnce({
      url: 'https://store.public.blob.vercel-storage.com/users/dev-user-123/resumes/resume-e2e-uuid-42/original',
      downloadUrl:
        'https://store.public.blob.vercel-storage.com/users/dev-user-123/resumes/resume-e2e-uuid-42/original?download=1',
      pathname: 'users/dev-user-123/resumes/resume-e2e-uuid-42/original',
      contentType: 'application/pdf',
      contentDisposition: 'inline',
      etag: 'mock-etag-e2e',
    });

    // -------------------------------------------------------------------------
    // Step 1: Open / (Mount root Next.js page)
    // -------------------------------------------------------------------------
    render(<Home />);

    // Verify initial wireframe is present
    expect(
      screen.getByRole('heading', { level: 1, name: 'Build your career baseline' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Upload your resume to automatically extract your skills, experience, and current role.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Drop your resume here, or browse files'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Supports PDF or DOCX \(Max 5 MB\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Enter details manually →/i }),
    ).toBeInTheDocument();

    // -------------------------------------------------------------------------
    // Step 2: Select resume
    // -------------------------------------------------------------------------
    const fileInput = document.querySelector('input[type="file"]')!;
    expect(fileInput).toBeInTheDocument();

    const resumeFile = new File(
      ['%PDF-1.4 mock binary resume data for testing'],
      'neeraj-resume.pdf',
      { type: 'application/pdf' },
    );

    fireEvent.change(fileInput, { target: { files: [resumeFile] } });

    // -------------------------------------------------------------------------
    // Step 3: Upload in progress
    // -------------------------------------------------------------------------
    expect(
      screen.getByRole('heading', { level: 3, name: 'Uploading your resume...' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Uploading your resume to secure storage...'),
    ).toBeInTheDocument();
    expect(screen.getByText(/File: neeraj-resume.pdf/i)).toBeInTheDocument();

    // -------------------------------------------------------------------------
    // Step 4: Resume successfully uploaded
    // -------------------------------------------------------------------------
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 3, name: 'Resume uploaded' }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        'Your resume has been securely uploaded and is ready for analysis.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/File: neeraj-resume.pdf/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose another file' })).toBeInTheDocument();

    // -------------------------------------------------------------------------
    // Step 5: Verify integration contracts across boundaries
    // -------------------------------------------------------------------------
    // 5A: POST upload-intent contract
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/api/v1/resumes/upload-intent'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-user-id': '00000000-0000-0000-0000-000000000001',
        }),
        body: JSON.stringify({
          fileName: 'neeraj-resume.pdf',
          contentType: 'application/pdf',
          fileSize: resumeFile.size,
        }),
      }),
    );

    // 5B: Direct Vercel Blob client upload contract
    expect(vercelBlobClient.put).toHaveBeenCalledWith(
      'users/dev-user-123/resumes/resume-e2e-uuid-42/original',
      resumeFile,
      {
        access: 'public',
        token: 'scoped-client-token-xyz',
      },
    );

    // 5C: POST complete contract
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/api/v1/resumes/resume-e2e-uuid-42/complete'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-user-id': '00000000-0000-0000-0000-000000000001',
        }),
        body: JSON.stringify({
          blobUrl:
            'https://store.public.blob.vercel-storage.com/users/dev-user-123/resumes/resume-e2e-uuid-42/original',
        }),
      }),
    );
  });
});
