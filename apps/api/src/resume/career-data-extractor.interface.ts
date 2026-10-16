import type { ExtractedCareerData } from './dto/extracted-career-data.dto.js';

export const CAREER_DATA_EXTRACTOR = Symbol('CAREER_DATA_EXTRACTOR');

export interface CareerDataExtractor {
  extract(resumeText: string): Promise<ExtractedCareerData>;
}
