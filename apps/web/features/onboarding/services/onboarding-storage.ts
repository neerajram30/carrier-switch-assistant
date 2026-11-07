import type { ExtractedCareerData } from '../types';

const STORAGE_KEY = 'csa_extracted_resume_data';

/**
 * Persists parsed resume data to sessionStorage so it survives
 * route transitions between /onboarding and /onboarding/review.
 */
export function saveExtractedDataToStorage(data: ExtractedCareerData): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save extracted career data to sessionStorage', err);
  }
}

/**
 * Retrieves parsed resume data from sessionStorage.
 */
export function getExtractedDataFromStorage(): ExtractedCareerData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn('Failed to parse extracted career data from sessionStorage', err);
    return null;
  }
}

/**
 * Clears parsed resume data from sessionStorage after save.
 */
export function clearExtractedDataFromStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore error
  }
}
