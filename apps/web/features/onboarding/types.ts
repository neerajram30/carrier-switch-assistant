export type OnboardingStep = 'upload' | 'manual';

export interface CareerProfileData {
  currentRole: string;
  yearsOfExperience: string;
  skills: string[];
  summary: string;
  targetRole: string;
  source: 'ai_extracted' | 'manual';
}

export interface FileValidationError {
  fileName: string;
  message: string;
  reason: 'size' | 'format';
}
