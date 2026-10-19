export type OnboardingStep = 'upload' | 'review' | 'manual';

export type UploadProcessingState =
  | 'idle'
  | 'validating'
  | 'uploading'
  | 'uploaded'
  | 'processing'
  | 'processed'
  | 'failed';

export type ProcessingFailureType = 'upload_failed' | 'processing_failed';

export interface UploadedResumeInfo {
  resumeId: string;
  storageKey: string;
  status: 'UPLOADED';
}

export interface WorkExperienceItem {
  company: string | null;
  role: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface EducationItem {
  institution: string | null;
  qualification: string | null;
  graduationYear: number | null;
}

export interface ProjectItem {
  name: string | null;
  description: string | null;
  technologies: string[];
}

export interface ExtractedCareerData {
  name: string | null;
  currentRole: string | null;
  yearsOfExperience: number | null;
  skills: string[];
  workExperience: WorkExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  extractionMethod?: 'ai' | 'heuristic';
  warnings?: string[];
}

export interface ProcessedResumeResult {
  id: string;
  userId: string;
  originalFileName: string;
  status: string;
  extractedText: string | null;
  characterCount: number;
  structuredData?: ExtractedCareerData | null;
  processedAt?: string | null;
  processingError?: string | null;
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
  reason: 'size' | 'format' | 'upload_failed' | 'processing_failed';
}
