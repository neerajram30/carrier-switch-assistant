export type OnboardingStep = 'upload' | 'manual';

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
  reason: 'size' | 'format';
}
