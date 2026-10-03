import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useResumeUpload } from './useResumeUpload';

describe('useResumeUpload Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('accepts PDF files within size limits', () => {
    // -------------------------------------------------------------------------
    // 1. Arrange: Render hook with mock callback and create a valid PDF file mock
    // -------------------------------------------------------------------------
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useResumeUpload(onSuccess));

    const validPdf = new File(['mock content'], 'test.pdf', {
      type: 'application/pdf',
    });

    // -------------------------------------------------------------------------
    // 2. Act: Pass valid PDF to handleFileChange handler
    // -------------------------------------------------------------------------
    act(() => {
      result.current.handleFileChange(validPdf);
    });

    // -------------------------------------------------------------------------
    // 3. Assert: Verify validation passes, file is stored, and processing starts
    // -------------------------------------------------------------------------
    expect(result.current.validationError).toBeNull();
    expect(result.current.selectedFile).toBe(validPdf);
    expect(result.current.isProcessing).toBe(true);
  });

  it('accepts DOCX files within size limits', () => {
    // -------------------------------------------------------------------------
    // 1. Arrange: Render hook with mock callback and create a valid DOCX file mock
    // -------------------------------------------------------------------------
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useResumeUpload(onSuccess));

    const validDocx = new File(['mock content'], 'test.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    // -------------------------------------------------------------------------
    // 2. Act: Pass valid DOCX to handleFileChange handler
    // -------------------------------------------------------------------------
    act(() => {
      result.current.handleFileChange(validDocx);
    });

    // -------------------------------------------------------------------------
    // 3. Assert: Verify validation passes, file is stored, and processing starts
    // -------------------------------------------------------------------------
    expect(result.current.validationError).toBeNull();
    expect(result.current.selectedFile).toBe(validDocx);
    expect(result.current.isProcessing).toBe(true);
  });

  it('rejects unsupported extensions', () => {
    // -------------------------------------------------------------------------
    // 1. Arrange: Render hook and create an unsupported file (.js)
    // -------------------------------------------------------------------------
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useResumeUpload(onSuccess));

    const badFile = new File(['bad'], 'script.js', { type: 'text/javascript' });

    // -------------------------------------------------------------------------
    // 2. Act: Pass unsupported file to handleFileChange handler
    // -------------------------------------------------------------------------
    act(() => {
      result.current.handleFileChange(badFile);
    });

    // -------------------------------------------------------------------------
    // 3. Assert: Verify file is rejected and format validation error is set
    // -------------------------------------------------------------------------
    expect(result.current.selectedFile).toBeNull();
    expect(result.current.validationError?.reason).toBe('format');
  });

  it('rejects files exceeding 5 MB limit', () => {
    // -------------------------------------------------------------------------
    // 1. Arrange: Render hook and create a 6 MB oversized file
    // -------------------------------------------------------------------------
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useResumeUpload(onSuccess));

    const largeFile = new File([new Uint8Array(6 * 1024 * 1024)], 'too-big.pdf', {
      type: 'application/pdf',
    });

    // -------------------------------------------------------------------------
    // 2. Act: Pass oversized file to handleFileChange handler
    // -------------------------------------------------------------------------
    act(() => {
      result.current.handleFileChange(largeFile);
    });

    // -------------------------------------------------------------------------
    // 3. Assert: Verify file is rejected and size validation error is set
    // -------------------------------------------------------------------------
    expect(result.current.selectedFile).toBeNull();
    expect(result.current.validationError?.reason).toBe('size');
  });

  it('triggers extraction completion after simulated delay', () => {
    // -------------------------------------------------------------------------
    // 1. Arrange: Render hook with mock callback and create a valid file
    // -------------------------------------------------------------------------
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useResumeUpload(onSuccess));

    const file = new File(['valid'], 'resume.pdf', { type: 'application/pdf' });

    // -------------------------------------------------------------------------
    // 2. Act: Trigger file change and fast-forward fake timers past delay
    // -------------------------------------------------------------------------
    act(() => {
      result.current.handleFileChange(file);
    });

    expect(result.current.isProcessing).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // -------------------------------------------------------------------------
    // 3. Assert: Verify processing flag cleared and onSuccess called with extracted data
    // -------------------------------------------------------------------------
    expect(result.current.isProcessing).toBe(false);
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        currentRole: 'Frontend Developer',
        source: 'ai_extracted',
      }),
    );
  });

  it('clears error state when requested', () => {
    // -------------------------------------------------------------------------
    // 1. Arrange: Render hook and trigger initial validation error
    // -------------------------------------------------------------------------
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useResumeUpload(onSuccess));

    const badFile = new File(['bad'], 'bad.txt', { type: 'text/plain' });
    act(() => {
      result.current.handleFileChange(badFile);
    });

    expect(result.current.validationError).not.toBeNull();

    // -------------------------------------------------------------------------
    // 2. Act: Call clearError action
    // -------------------------------------------------------------------------
    act(() => {
      result.current.clearError();
    });

    // -------------------------------------------------------------------------
    // 3. Assert: Verify error state and file reference are reset to null
    // -------------------------------------------------------------------------
    expect(result.current.validationError).toBeNull();
    expect(result.current.selectedFile).toBeNull();
  });
});
