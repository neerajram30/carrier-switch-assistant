'use client';

import { useState } from 'react';
import type {
  ExtractedCareerData,
  FileValidationError,
  ProcessedResumeResult,
  ProcessingFailureType,
  UploadProcessingState,
  UploadedResumeInfo,
} from '../types';
import {
  processResume,
  uploadResumeDirectly,
  type UploadResumeResult,
} from '../services/resume-storage.service';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_EXTENSIONS = ['.pdf', '.docx'];

export function useResumeUpload(
  onSuccess?: (file: File, resumeInfo: UploadedResumeInfo) => void,
  uploadFn: (file: File) => Promise<UploadResumeResult> = uploadResumeDirectly,
  processFn: (resumeId: string) => Promise<ProcessedResumeResult> = processResume,
  onProcessed?: (
    data: ExtractedCareerData,
    result: ProcessedResumeResult,
  ) => void,
  autoProcess = false,
) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] =
    useState<FileValidationError | null>(null);
  const [uploadState, setUploadState] = useState<UploadProcessingState>('idle');
  const [uploadedResume, setUploadedResume] =
    useState<UploadedResumeInfo | null>(null);
  const [failureType, setFailureType] = useState<ProcessingFailureType | null>(
    null,
  );
  const [processedResult, setProcessedResult] =
    useState<ProcessedResumeResult | null>(null);

  const isProcessing =
    uploadState === 'validating' ||
    uploadState === 'uploading' ||
    uploadState === 'processing';

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

  const startProcessing = async (targetResumeId?: string) => {
    const resumeId = targetResumeId || uploadedResume?.resumeId;
    if (!resumeId) return;

    setUploadState('processing');
    setValidationError(null);
    setFailureType(null);

    try {
      const result = await processFn(resumeId);
      setProcessedResult(result);
      setUploadState('processed');

      const extractedData: ExtractedCareerData = result.structuredData || {
        name: null,
        currentRole: null,
        yearsOfExperience: null,
        skills: [],
        workExperience: [],
        education: [],
        projects: [],
      };

      onProcessed?.(extractedData, result);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to analyze resume with AI. Please try again.';
      setValidationError({
        fileName: selectedFile?.name || 'Resume',
        message,
        reason: 'processing_failed',
      });
      setFailureType('processing_failed');
      setUploadState('failed');
    }
  };

  const retryProcessing = async () => {
    await startProcessing();
  };

  const handleFileChange = async (fileOrFiles: File | File[] | null) => {
    const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles;
    if (!file) {
      setSelectedFile(null);
      setValidationError(null);
      setUploadedResume(null);
      setProcessedResult(null);
      setFailureType(null);
      setUploadState('idle');
      return;
    }

    const error = validateFile(file);
    if (error) {
      setSelectedFile(null);
      setValidationError(error);
      setUploadedResume(null);
      setProcessedResult(null);
      setFailureType(null);
      setUploadState('idle');
      return;
    }

    setValidationError(null);
    setFailureType(null);
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

      if (autoProcess) {
        await startProcessing(result.resumeId);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to upload resume. Please try again.';
      setSelectedFile(null);
      setUploadedResume(null);
      setProcessedResult(null);
      setFailureType('upload_failed');
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
    setFailureType(null);
    setSelectedFile(null);
    setUploadedResume(null);
    setProcessedResult(null);
    setUploadState('idle');
  };

  return {
    selectedFile,
    validationError,
    uploadState,
    uploadedResume,
    processedResult,
    failureType,
    isProcessing,
    handleFileChange,
    startProcessing,
    retryProcessing,
    clearError,
  };
}
