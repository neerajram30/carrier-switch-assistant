export type OnboardingStep = 'upload' | 'manual';

export type UploadState = 'idle' | 'validating' | 'uploading' | 'uploaded';

export interface UploadedResumeInfo {
  resumeId: string;
  storageKey: string;
  status: 'UPLOADED';
}

export interface CareerProfileData {
  id?: string;
  currentRole: string;
  yearsOfExperience: string;
  skills: string[];
  summary: string;
  targetRole?: string;
}

export interface CareerProfileApiResponse {
  id: string;
  userId: string;
  currentRole: string;
  yearsOfExperience: number;
  skills: string[];
  summary?: string | null;
  targetRole?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CareerGoal {
  targetRole: string;
}

export interface FileValidationError {
  fileName: string;
  message: string;
  reason: 'size' | 'format' | 'upload_failed';
}
