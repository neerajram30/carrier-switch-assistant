'use client';

import { useState } from 'react';
import type { FileValidationError, UploadState, UploadedResumeInfo } from '../types';
import {
  uploadResumeDirectly,
  type UploadResumeResult,
} from '../services/resume-storage.service';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_EXTENSIONS = ['.pdf', '.docx'];

export function useResumeUpload(
  onSuccess?: (file: File, resumeInfo: UploadedResumeInfo) => void,
  uploadFn: (file: File) => Promise<UploadResumeResult> = uploadResumeDirectly,
) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<FileValidationError | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadedResume, setUploadedResume] = useState<UploadedResumeInfo | null>(null);

  const isProcessing = uploadState === 'validating' || uploadState === 'uploading';

  const validateFile = (file: File): FileValidationError | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return {
        fileName: file.name,
        message: `The file "${file.name}" is not supported. Please upload a PDF or DOCX.`,
        reason: 'format',
      };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        fileName: file.name,
        message: `The file "${file.name}" is larger than 5 MB. Please choose a smaller file or enter details manually.`,
        reason: 'size',
      };
    }

    return null;
  };

  const handleFileChange = async (fileOrFiles: File | File[] | null) => {
    const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles;
    if (!file) {
      setSelectedFile(null);
      setValidationError(null);
      setUploadedResume(null);
      setUploadState('idle');
      return;
    }

    const error = validateFile(file);
    if (error) {
      setSelectedFile(null);
      setValidationError(error);
      setUploadedResume(null);
      setUploadState('idle');
      return;
    }

    setValidationError(null);
    setSelectedFile(file);
    setUploadState('uploading');

    try {
      const result = await uploadFn(file);
      const resumeInfo: UploadedResumeInfo = {
        resumeId: result.resumeId,
        storageKey: result.storageKey,
        status: 'UPLOADED',
      };
      setUploadedResume(resumeInfo);
      setUploadState('uploaded');
      onSuccess?.(file, resumeInfo);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to upload resume. Please try again.';
      setSelectedFile(null);
      setUploadedResume(null);
      setValidationError({
        fileName: file.name,
        message,
        reason: 'upload_failed',
      });
      setUploadState('idle');
    }
  };

  const clearError = () => {
    setValidationError(null);
    setSelectedFile(null);
    setUploadedResume(null);
    setUploadState('idle');
  };

  return {
    selectedFile,
    validationError,
    uploadState,
    uploadedResume,
    isProcessing,
    handleFileChange,
    clearError,
  };
}
