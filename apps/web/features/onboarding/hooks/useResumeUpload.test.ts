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

  it('rejects files with unsupported extensions', () => {
    // -------------------------------------------------------------------------
    // 1. Arrange: Render hook with mock callback and create an invalid text file mock
    // -------------------------------------------------------------------------
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useResumeUpload(onSuccess));

    const invalidFile = new File(['mock content'], 'resume.txt', {
      type: 'text/plain',
    });

    // -------------------------------------------------------------------------
    // 2. Act: Pass invalid file to handleFileChange handler
    // -------------------------------------------------------------------------
    act(() => {
      result.current.handleFileChange(invalidFile);
    });

    // -------------------------------------------------------------------------
    // 3. Assert: Verify validation error is generated and file reference is cleared
    // -------------------------------------------------------------------------
    expect(result.current.selectedFile).toBeNull();
    expect(result.current.validationError?.reason).toBe('format');
    expect(result.current.validationError?.message).toContain('not supported');
  });

  it('rejects files exceeding size limits', () => {
    // -------------------------------------------------------------------------
    // 1. Arrange: Render hook and create a 6 MB oversized PDF file mock (>5 MB)
    // -------------------------------------------------------------------------
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useResumeUpload(onSuccess));

    const oversizedBuffer = new ArrayBuffer(6 * 1024 * 1024);
    const oversizedFile = new File([oversizedBuffer], 'huge-resume.pdf', {
      type: 'application/pdf',
    });

    // -------------------------------------------------------------------------
    // 2. Act: Pass oversized file to handleFileChange handler
    // -------------------------------------------------------------------------
    act(() => {
      result.current.handleFileChange(oversizedFile);
    });

    // -------------------------------------------------------------------------
    // 3. Assert: Verify size validation error is returned and file is not stored
    // -------------------------------------------------------------------------
    expect(result.current.selectedFile).toBeNull();
    expect(result.current.validationError?.reason).toBe('size');
  });

  it('accepts file and invokes onSuccess callback with uploaded file', () => {
    // -------------------------------------------------------------------------
    // 1. Arrange: Render hook with mock callback and create a valid file
    // -------------------------------------------------------------------------
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useResumeUpload(onSuccess));

    const file = new File(['valid'], 'resume.pdf', { type: 'application/pdf' });

    // -------------------------------------------------------------------------
    // 2. Act: Trigger file change
    // -------------------------------------------------------------------------
    act(() => {
      result.current.handleFileChange(file);
    });

    // -------------------------------------------------------------------------
    // 3. Assert: Verify processing flag is set and onSuccess called with the file
    // -------------------------------------------------------------------------
    expect(result.current.isProcessing).toBe(true);
    expect(result.current.selectedFile).toBe(file);
    expect(onSuccess).toHaveBeenCalledWith(file);
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
