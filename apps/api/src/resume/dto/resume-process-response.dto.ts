import type { ExtractedCareerData } from './extracted-career-data.dto.js';

export interface ResumeProcessResponseDto {
  id: string;
  userId: string;
  originalFileName: string;
  status: string;
  extractedText: string | null;
  characterCount: number;
  structuredData?: ExtractedCareerData | null;
  processedAt: Date | null;
  processingError?: string | null;
}
