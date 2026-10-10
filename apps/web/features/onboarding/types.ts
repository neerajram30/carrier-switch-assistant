export type OnboardingStep = 'upload' | 'manual';

export type UploadState = 'idle' | 'validating' | 'uploading' | 'uploaded';

export interface UploadedResumeInfo {
  resumeId: string;
  storageKey: string;
  status: 'UPLOADED';
}

export interface CareerProfileData {
  currentRole: string;
  yearsOfExperience: string;
  skills: string[];
  summary: string;
}

export interface CareerGoal {
  targetRole: string;
}

export interface FileValidationError {
  fileName: string;
  message: string;
  reason: 'size' | 'format' | 'upload_failed';
}
