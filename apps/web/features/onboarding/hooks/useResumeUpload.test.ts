import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useResumeUpload } from './useResumeUpload';

describe('useResumeUpload Hook', () => {
  const defaultMockResult = {
    resumeId: 'res-test-123',
    blobUrl: 'https://blob.example.com/resumes/res-test-123.pdf',
    storageKey: 'users/u1/resumes/res-test-123/original.pdf',
    status: 'UPLOADED' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes in idle state', () => {
    const { result } = renderHook(() => useResumeUpload());

    expect(result.current.uploadState).toBe('idle');
    expect(result.current.selectedFile).toBeNull();
    expect(result.current.uploadedResume).toBeNull();
    expect(result.current.validationError).toBeNull();
    expect(result.current.isProcessing).toBe(false);
  });

  it('accepts PDF files within size limits and completes upload', async () => {
    const onSuccess = vi.fn();
    const mockUploadFn = vi.fn().mockResolvedValue(defaultMockResult);
    const { result } = renderHook(() => useResumeUpload(onSuccess, mockUploadFn));

    const validPdf = new File(['%PDF-1.4 mock content'], 'test.pdf', {
      type: 'application/pdf',
    });

    await act(async () => {
      await result.current.handleFileChange(validPdf);
    });

    expect(result.current.validationError).toBeNull();
    expect(result.current.selectedFile).toBe(validPdf);
    expect(result.current.uploadState).toBe('uploaded');
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.uploadedResume).toEqual({
      resumeId: 'res-test-123',
      storageKey: 'users/u1/resumes/res-test-123/original.pdf',
      status: 'UPLOADED',
    });
    expect(mockUploadFn).toHaveBeenCalledWith(validPdf);
    expect(onSuccess).toHaveBeenCalledWith(validPdf, {
      resumeId: 'res-test-123',
      storageKey: 'users/u1/resumes/res-test-123/original.pdf',
      status: 'UPLOADED',
    });
  });

  it('accepts DOCX files within size limits and completes upload', async () => {
    const onSuccess = vi.fn();
    const mockUploadFn = vi.fn().mockResolvedValue(defaultMockResult);
    const { result } = renderHook(() => useResumeUpload(onSuccess, mockUploadFn));

    const validDocx = new File(['mock content'], 'test.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    await act(async () => {
      await result.current.handleFileChange(validDocx);
    });

    expect(result.current.validationError).toBeNull();
    expect(result.current.selectedFile).toBe(validDocx);
    expect(result.current.uploadState).toBe('uploaded');
    expect(result.current.uploadedResume).toEqual({
      resumeId: 'res-test-123',
      storageKey: 'users/u1/resumes/res-test-123/original.pdf',
      status: 'UPLOADED',
    });
    expect(mockUploadFn).toHaveBeenCalledWith(validDocx);
    expect(onSuccess).toHaveBeenCalledWith(validDocx, expect.objectContaining({
      resumeId: 'res-test-123',
      status: 'UPLOADED',
    }));
  });

  it('rejects files with unsupported extensions', async () => {
    const onSuccess = vi.fn();
    const mockUploadFn = vi.fn();
    const { result } = renderHook(() => useResumeUpload(onSuccess, mockUploadFn));

    const invalidFile = new File(['mock content'], 'resume.txt', {
      type: 'text/plain',
    });

    await act(async () => {
      await result.current.handleFileChange(invalidFile);
    });

    expect(result.current.selectedFile).toBeNull();
    expect(result.current.uploadState).toBe('idle');
    expect(result.current.uploadedResume).toBeNull();
    expect(result.current.validationError?.reason).toBe('format');
    expect(result.current.validationError?.message).toContain('not supported');
    expect(mockUploadFn).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('rejects files exceeding size limits', async () => {
    const onSuccess = vi.fn();
    const mockUploadFn = vi.fn();
    const { result } = renderHook(() => useResumeUpload(onSuccess, mockUploadFn));

    const oversizedBuffer = new ArrayBuffer(6 * 1024 * 1024);
    const oversizedFile = new File([oversizedBuffer], 'huge-resume.pdf', {
      type: 'application/pdf',
    });

    await act(async () => {
      await result.current.handleFileChange(oversizedFile);
    });

    expect(result.current.selectedFile).toBeNull();
    expect(result.current.uploadState).toBe('idle');
    expect(result.current.uploadedResume).toBeNull();
    expect(result.current.validationError?.reason).toBe('size');
    expect(mockUploadFn).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('transitions to idle and sets validationError when upload fails', async () => {
    const onSuccess = vi.fn();
    const mockUploadFn = vi
      .fn()
      .mockRejectedValue(new Error('Storage quota exceeded'));
    const { result } = renderHook(() => useResumeUpload(onSuccess, mockUploadFn));

    const validPdf = new File(['%PDF content'], 'resume.pdf', {
      type: 'application/pdf',
    });

    await act(async () => {
      await result.current.handleFileChange(validPdf);
    });

    expect(result.current.uploadState).toBe('idle');
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.selectedFile).toBeNull();
    expect(result.current.uploadedResume).toBeNull();
    expect(result.current.validationError).toEqual({
      fileName: 'resume.pdf',
      message: 'Storage quota exceeded',
      reason: 'upload_failed',
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('clears error state and resets to idle when requested', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useResumeUpload(onSuccess));

    const badFile = new File(['bad'], 'bad.txt', { type: 'text/plain' });
    await act(async () => {
      await result.current.handleFileChange(badFile);
    });

    expect(result.current.validationError).not.toBeNull();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.validationError).toBeNull();
    expect(result.current.selectedFile).toBeNull();
    expect(result.current.uploadedResume).toBeNull();
    expect(result.current.uploadState).toBe('idle');
  });

  it('triggers startProcessing and transitions to processed state on success', async () => {
    const onSuccess = vi.fn();
    const onProcessed = vi.fn();
    const mockUploadFn = vi.fn().mockResolvedValue(defaultMockResult);
    const mockProcessResult = {
      id: 'res-test-123',
      userId: 'u1',
      originalFileName: 'test.pdf',
      status: 'PROCESSED',
      extractedText: 'Plain text',
      characterCount: 10,
      structuredData: {
        name: 'Jane Doe',
        currentRole: 'Backend Dev',
        yearsOfExperience: 4,
        skills: ['Go', 'PostgreSQL'],
        workExperience: [],
        education: [],
        projects: [],
      },
    };
    const mockProcessFn = vi.fn().mockResolvedValue(mockProcessResult);

    const { result } = renderHook(() =>
      useResumeUpload(onSuccess, mockUploadFn, mockProcessFn, onProcessed),
    );

    const validPdf = new File(['%PDF content'], 'test.pdf', {
      type: 'application/pdf',
    });

    await act(async () => {
      await result.current.handleFileChange(validPdf);
    });

    expect(result.current.uploadState).toBe('uploaded');

    await act(async () => {
      await result.current.startProcessing();
    });

    expect(result.current.uploadState).toBe('processed');
    expect(result.current.processedResult).toEqual(mockProcessResult);
    expect(mockProcessFn).toHaveBeenCalledWith('res-test-123');
    expect(onProcessed).toHaveBeenCalledWith(
      mockProcessResult.structuredData,
      mockProcessResult,
    );
  });

  it('handles processing failure and allows retry', async () => {
    const onSuccess = vi.fn();
    const mockUploadFn = vi.fn().mockResolvedValue(defaultMockResult);
    const mockProcessFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('AI extraction rate limited'))
      .mockResolvedValueOnce({
        id: 'res-test-123',
        userId: 'u1',
        originalFileName: 'test.pdf',
        status: 'PROCESSED',
        extractedText: 'Text',
        characterCount: 4,
        structuredData: {
          name: 'Jane',
          currentRole: 'Engineer',
          yearsOfExperience: 2,
          skills: ['TypeScript'],
          workExperience: [],
          education: [],
          projects: [],
        },
      });

    const { result } = renderHook(() =>
      useResumeUpload(onSuccess, mockUploadFn, mockProcessFn),
    );

    const validPdf = new File(['%PDF content'], 'test.pdf', {
      type: 'application/pdf',
    });

    await act(async () => {
      await result.current.handleFileChange(validPdf);
    });

    // First attempt fails
    await act(async () => {
      await result.current.startProcessing();
    });

    expect(result.current.uploadState).toBe('failed');
    expect(result.current.failureType).toBe('processing_failed');
    expect(result.current.validationError?.message).toBe(
      'AI extraction rate limited',
    );

    // Retry succeeds
    await act(async () => {
      await result.current.retryProcessing();
    });

    expect(result.current.uploadState).toBe('processed');
    expect(result.current.failureType).toBeNull();
    expect(result.current.validationError).toBeNull();
  });
});
