import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vercelBlobClient from '@vercel/blob/client';
import { ResumeUploadStep } from './ResumeUploadStep';

vi.mock('@vercel/blob/client', () => ({
  put: vi.fn(),
}));

describe('ResumeUploadStep Component', () => {
  const defaultMockResult = {
    resumeId: 'res-123',
    blobUrl: 'https://blob.example.com/resumes/res-123.pdf',
    storageKey: 'users/u1/resumes/res-123/original.pdf',
    status: 'UPLOADED' as const,
  };

  it('renders empty state', () => {
    render(<ResumeUploadStep onSuccess={vi.fn()} onSwitchToManual={vi.fn()} />);

    // Heading and instructions
    expect(screen.getByText('Build your career baseline')).toBeInTheDocument();
    expect(
      screen.getByText(/Upload your resume to automatically extract your skills/i),
    ).toBeInTheDocument();

    // Dropzone placeholder and file format specification
    expect(screen.getByText(/Supports PDF or DOCX \(Max 5 MB\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Drop your resume here, or browse files/i)).toBeInTheDocument();

    // Trust & privacy copy
    expect(
      screen.getByText(/Your resume is used to build your career profile/i),
    ).toBeInTheDocument();

    // Manual entry alternative button
    expect(
      screen.getByRole('button', { name: /Enter details manually →/i }),
    ).toBeInTheDocument();

    // Verify rejection alert is NOT visible initially
    expect(screen.queryByText("Resume couldn't be uploaded")).not.toBeInTheDocument();
  });

  it('accepts PDF and shows uploading then uploaded state', async () => {
    let resolveUpload!: (value: typeof defaultMockResult) => void;
    const mockUploadPromise = new Promise<typeof defaultMockResult>((resolve) => {
      resolveUpload = resolve;
    });
    const mockUploadFn = vi.fn().mockReturnValue(mockUploadPromise);

    render(
      <ResumeUploadStep
        onSuccess={vi.fn()}
        onSwitchToManual={vi.fn()}
        uploadFn={mockUploadFn}
      />,
    );

    const input = document.querySelector('input[type="file"]')!;
    expect(input).toBeInTheDocument();

    const validPdf = new File(['%PDF-1.4 mock content'], 'sample-resume.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(input, { target: { files: [validPdf] } });

    // Transition to uploading state
    expect(screen.getByText('Uploading your resume...')).toBeInTheDocument();
    expect(
      screen.getByText('Uploading your resume to secure storage...'),
    ).toBeInTheDocument();
    expect(screen.queryByText("Resume couldn't be uploaded")).not.toBeInTheDocument();

    // Resolve upload
    resolveUpload(defaultMockResult);

    await waitFor(() => {
      expect(screen.getByText('Resume uploaded')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Your resume has been securely uploaded/i),
    ).toBeInTheDocument();
  });

  it('accepts DOCX and completes upload', async () => {
    const mockUploadFn = vi.fn().mockResolvedValue(defaultMockResult);

    render(
      <ResumeUploadStep
        onSuccess={vi.fn()}
        onSwitchToManual={vi.fn()}
        uploadFn={mockUploadFn}
      />,
    );

    const input = document.querySelector('input[type="file"]')!;
    const validDocx = new File(['mock docx content'], 'sample-resume.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    fireEvent.change(input, { target: { files: [validDocx] } });

    await waitFor(() => {
      expect(screen.getByText('Resume uploaded')).toBeInTheDocument();
    });

    expect(mockUploadFn).toHaveBeenCalledWith(validDocx);
  });

  it('rejects unsupported file', () => {
    const mockUploadFn = vi.fn();
    render(
      <ResumeUploadStep
        onSuccess={vi.fn()}
        onSwitchToManual={vi.fn()}
        uploadFn={mockUploadFn}
      />,
    );

    const input = document.querySelector('input[type="file"]')!;
    const unsupportedFile = new File(['image bytes'], 'picture.png', {
      type: 'image/png',
    });

    fireEvent.change(input, { target: { files: [unsupportedFile] } });

    expect(screen.getByText("Resume couldn't be uploaded")).toBeInTheDocument();
    expect(
      screen.getByText(/is not supported\. Please upload a PDF or DOCX\./i),
    ).toBeInTheDocument();
    expect(mockUploadFn).not.toHaveBeenCalled();
  });

  it('rejects >5 MB', () => {
    const mockUploadFn = vi.fn();
    render(
      <ResumeUploadStep
        onSuccess={vi.fn()}
        onSwitchToManual={vi.fn()}
        uploadFn={mockUploadFn}
      />,
    );

    const input = document.querySelector('input[type="file"]')!;
    const largeBuffer = new Uint8Array(6 * 1024 * 1024);
    const oversizedFile = new File([largeBuffer], 'large-resume.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(input, { target: { files: [oversizedFile] } });

    expect(screen.getByText("Resume couldn't be uploaded")).toBeInTheDocument();
    expect(screen.getByText(/larger than 5 MB/i)).toBeInTheDocument();
    expect(mockUploadFn).not.toHaveBeenCalled();
  });

  it('displays validation error and dismisses on Choose another file', () => {
    render(<ResumeUploadStep onSuccess={vi.fn()} onSwitchToManual={vi.fn()} />);

    const input = document.querySelector('input[type="file"]')!;
    const invalidFile = new File(['text'], 'notes.txt', { type: 'text/plain' });

    fireEvent.change(input, { target: { files: [invalidFile] } });

    expect(screen.getByText("Resume couldn't be uploaded")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Choose another file/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Enter details manually$/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Choose another file/i }));

    expect(screen.queryByText("Resume couldn't be uploaded")).not.toBeInTheDocument();
    expect(screen.getByText(/Supports PDF or DOCX \(Max 5 MB\)/i)).toBeInTheDocument();
  });

  it('displays error card when backend upload fails', async () => {
    const mockUploadFn = vi
      .fn()
      .mockRejectedValue(new Error('Server storage connection timed out'));

    render(
      <ResumeUploadStep
        onSuccess={vi.fn()}
        onSwitchToManual={vi.fn()}
        uploadFn={mockUploadFn}
      />,
    );

    const input = document.querySelector('input[type="file"]')!;
    const validPdf = new File(['%PDF content'], 'my-resume.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(input, { target: { files: [validPdf] } });

    await waitFor(() => {
      expect(screen.getByText("Resume couldn't be uploaded")).toBeInTheDocument();
    });

    expect(
      screen.getByText('Server storage connection timed out'),
    ).toBeInTheDocument();
  });

  it('handles drag-over', () => {
    render(<ResumeUploadStep onSuccess={vi.fn()} onSwitchToManual={vi.fn()} />);

    const dropzone =
      screen.getByText(/Drop your resume here/i).closest('div') ||
      screen.getByText(/Upload your resume/i);

    expect(dropzone).toBeInTheDocument();

    fireEvent.dragOver(dropzone);
    fireEvent.dragEnter(dropzone);

    expect(dropzone).toBeInTheDocument();
  });

  it('handles keyboard activation for manual entry button', () => {
    const onSwitchToManual = vi.fn();
    render(<ResumeUploadStep onSuccess={vi.fn()} onSwitchToManual={onSwitchToManual} />);

    const manualBtn = screen.getByRole('button', { name: /Enter details manually →/i });

    manualBtn.focus();
    expect(manualBtn).toHaveFocus();

    fireEvent.click(manualBtn);

    expect(onSwitchToManual).toHaveBeenCalledTimes(1);
  });

  it('manual entry action works from error recovery card', () => {
    const onSwitchToManual = vi.fn();
    render(<ResumeUploadStep onSuccess={vi.fn()} onSwitchToManual={onSwitchToManual} />);

    const input = document.querySelector('input[type="file"]')!;
    const invalidFile = new File(['text'], 'notes.txt', { type: 'text/plain' });

    fireEvent.change(input, { target: { files: [invalidFile] } });

    const manualBtn = screen.getByRole('button', { name: /^Enter details manually$/i });
    fireEvent.click(manualBtn);

    expect(onSwitchToManual).toHaveBeenCalledTimes(1);
  });

  describe('Direct upload pipeline integration (Step 14)', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('completes the full flow: valid file -> upload intent requested -> upload performed -> success state', async () => {
      const mockFetch = vi
        .fn()
        // Step 1: upload intent response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            resumeId: 'res-intent-101',
            clientToken: 'client-token-abc',
            storageKey: 'users/u1/resumes/res-intent-101/original.pdf',
          }),
        })
        // Step 3: complete verification response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'res-intent-101',
            status: 'UPLOADED',
          }),
        });

      global.fetch = mockFetch;

      vi.mocked(vercelBlobClient.put).mockResolvedValueOnce({
        url: 'https://store.public.blob.vercel-storage.com/uploaded.pdf',
        downloadUrl:
          'https://store.public.blob.vercel-storage.com/uploaded.pdf?download=1',
        pathname: 'users/u1/resumes/res-intent-101/original.pdf',
        contentType: 'application/pdf',
        contentDisposition: 'inline',
        etag: 'mock-etag',
      });

      render(<ResumeUploadStep onSuccess={vi.fn()} onSwitchToManual={vi.fn()} />);

      const input = document.querySelector('input[type="file"]')!;
      const validPdf = new File(['%PDF content'], 'my-resume.pdf', {
        type: 'application/pdf',
      });

      fireEvent.change(input, { target: { files: [validPdf] } });

      // In flight: uploading UI shown
      expect(screen.getByText('Uploading your resume...')).toBeInTheDocument();

      // Successful completion: success state rendered
      await waitFor(() => {
        expect(screen.getByText('Resume uploaded')).toBeInTheDocument();
      });

      // 1. Intent requested from backend API
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('/api/v1/resumes/upload-intent'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        }),
      );

      // 2. Direct Blob upload performed with clientToken and storageKey
      expect(vercelBlobClient.put).toHaveBeenCalledWith(
        'users/u1/resumes/res-intent-101/original.pdf',
        validPdf,
        expect.objectContaining({
          access: 'private',
          token: 'client-token-abc',
        }),
      );

      // 3. Complete verification requested from backend API
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('/api/v1/resumes/res-intent-101/complete'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({}),
        }),
      );
    });

    it('handles API failure during upload-intent and displays error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          message: 'Upload intent service temporarily unavailable',
        }),
      });

      render(<ResumeUploadStep onSuccess={vi.fn()} onSwitchToManual={vi.fn()} />);

      const input = document.querySelector('input[type="file"]')!;
      const validPdf = new File(['%PDF content'], 'my-resume.pdf', {
        type: 'application/pdf',
      });

      fireEvent.change(input, { target: { files: [validPdf] } });

      await waitFor(() => {
        expect(screen.getByText("Resume couldn't be uploaded")).toBeInTheDocument();
      });

      expect(
        screen.getByText('Upload intent service temporarily unavailable'),
      ).toBeInTheDocument();
      expect(vercelBlobClient.put).not.toHaveBeenCalled();
    });

    it('handles Blob upload failure and displays error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          resumeId: 'res-intent-101',
          clientToken: 'client-token-abc',
          storageKey: 'users/u1/resumes/res-intent-101/original.pdf',
        }),
      });

      vi.mocked(vercelBlobClient.put).mockRejectedValueOnce(
        new Error('Network error uploading to Vercel Blob'),
      );

      render(<ResumeUploadStep onSuccess={vi.fn()} onSwitchToManual={vi.fn()} />);

      const input = document.querySelector('input[type="file"]')!;
      const validPdf = new File(['%PDF content'], 'my-resume.pdf', {
        type: 'application/pdf',
      });

      fireEvent.change(input, { target: { files: [validPdf] } });

      await waitFor(() => {
        expect(screen.getByText("Resume couldn't be uploaded")).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Network error uploading to Vercel Blob/i),
      ).toBeInTheDocument();
    });

    it('handles server verification failure in step 3 and displays error in UI', async () => {
      global.fetch = vi
        .fn()
        // Step 1: intent succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            resumeId: 'res-intent-101',
            clientToken: 'client-token-abc',
            storageKey: 'users/u1/resumes/res-intent-101/original.pdf',
          }),
        })
        // Step 3: complete verification fails
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            message: 'Stored object size does not match expected file size',
          }),
        });

      // Step 2: blob upload succeeds
      vi.mocked(vercelBlobClient.put).mockResolvedValueOnce({
        url: 'https://store.public.blob.vercel-storage.com/uploaded.pdf',
        downloadUrl:
          'https://store.public.blob.vercel-storage.com/uploaded.pdf?download=1',
        pathname: 'users/u1/resumes/res-intent-101/original.pdf',
        contentType: 'application/pdf',
        contentDisposition: 'inline',
        etag: 'mock-etag',
      });

      render(<ResumeUploadStep onSuccess={vi.fn()} onSwitchToManual={vi.fn()} />);

      const input = document.querySelector('input[type="file"]')!;
      const validPdf = new File(['%PDF content'], 'my-resume.pdf', {
        type: 'application/pdf',
      });

      fireEvent.change(input, { target: { files: [validPdf] } });

      await waitFor(() => {
        expect(screen.getByText("Resume couldn't be uploaded")).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Stored object size does not match expected file size/i),
      ).toBeInTheDocument();
      expect(screen.queryByText('Resume uploaded')).not.toBeInTheDocument();
    });
  });
});
