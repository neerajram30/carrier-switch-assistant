'use client';

import { useState } from 'react';
import type { CareerProfileData, FileValidationError } from '../types';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_EXTENSIONS = ['.pdf', '.docx'];

export function useResumeUpload(onSuccess: (extractedData: CareerProfileData) => void) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<FileValidationError | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleFileChange = (fileOrFiles: File | File[] | null) => {
    const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles;
    if (!file) {
      setSelectedFile(null);
      setValidationError(null);
      return;
    }

    const error = validateFile(file);
    if (error) {
      setSelectedFile(null);
      setValidationError(error);
      return;
    }

    setValidationError(null);
    setSelectedFile(file);
    setIsProcessing(true);

    // Simulate standard asynchronous AI extraction for UI testing
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess({
        currentRole: 'Frontend Developer',
        yearsOfExperience: '3.4',
        skills: ['React', 'TypeScript', 'Next.js', 'CSS', 'REST APIs'],
        summary: 'Frontend specialist focusing on modern React apps and responsive web interfaces.',
        targetRole: '',
        source: 'ai_extracted',
      });
    }, 1800);
  };

  const clearError = () => {
    setValidationError(null);
    setSelectedFile(null);
  };

  return {
    selectedFile,
    validationError,
    isProcessing,
    handleFileChange,
    clearError,
  };
}
