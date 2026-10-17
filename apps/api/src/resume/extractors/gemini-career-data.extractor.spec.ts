import { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DeterministicCareerDataExtractor } from './deterministic-career-data.extractor.js';
import { GeminiCareerDataExtractor } from './gemini-career-data.extractor.js';

describe('GeminiCareerDataExtractor', () => {
  let extractor: GeminiCareerDataExtractor;
  let mockConfigService: any;
  let mockFallback: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockConfigService = {
      get: vi.fn((key: string) => {
        if (key === 'GEMINI_API_KEY') return 'test-gemini-key';
        if (key === 'GEMINI_MODEL') return 'gemini-2.5-flash';
        return null;
      }),
    };

    mockFallback = {
      extract: vi.fn().mockResolvedValue({
        name: 'Fallback Name',
        currentRole: 'Software Engineer',
        yearsOfExperience: 3,
        skills: ['TypeScript'],
        workExperience: [],
        education: [],
        projects: [],
        warnings: ['Fallback warning'],
      }),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delegates directly to fallback when GEMINI_API_KEY is not configured', async () => {
    mockConfigService.get.mockReturnValue(undefined);
    extractor = new GeminiCareerDataExtractor(
      mockConfigService as ConfigService,
      mockFallback as DeterministicCareerDataExtractor,
    );

    const result = await extractor.extract('Some resume text');

    expect(mockFallback.extract).toHaveBeenCalledWith('Some resume text');
    expect(result.name).toBe('Fallback Name');
  });

  it('successfully extracts and validates structured data when Gemini API returns valid JSON', async () => {
    extractor = new GeminiCareerDataExtractor(
      mockConfigService as ConfigService,
      mockFallback as DeterministicCareerDataExtractor,
    );

    const mockAiPayload = {
      name: 'Alice Cooper',
      currentRole: 'Lead Architect',
      yearsOfExperience: 7.5,
      skills: ['Go', 'Kubernetes', 'TypeScript'],
      workExperience: [
        {
          company: 'Acme Corp',
          role: 'Staff Engineer',
          description: 'Designed distributed services',
          startDate: '2021-01',
          endDate: 'Present',
        },
      ],
      education: [
        {
          institution: 'MIT',
          qualification: 'B.S. Computer Science',
          graduationYear: 2017,
        },
      ],
      projects: [
        {
          name: 'CloudRouter',
          description: 'Mesh networking tool',
          technologies: ['Go', 'eBPF'],
        },
      ],
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(mockAiPayload) }],
            },
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await extractor.extract('Alice Cooper - Lead Architect with 7.5 years...');

    expect(result.name).toBe('Alice Cooper');
    expect(result.currentRole).toBe('Lead Architect');
    expect(result.yearsOfExperience).toBe(7.5);
    expect(result.skills).toEqual(['Go', 'Kubernetes', 'TypeScript']);
    expect(result.workExperience).toHaveLength(1);
    expect(result.workExperience[0].company).toBe('Acme Corp');
    expect(result.education).toHaveLength(1);
    expect(result.education[0].graduationYear).toBe(2017);
    expect(result.projects).toHaveLength(1);
    expect(result.projects[0].technologies).toEqual(['Go', 'eBPF']);
    expect(result.extractionMethod).toBe('ai');
    expect(mockFallback.extract).not.toHaveBeenCalled();

    // Verify separation of trusted instructions and untrusted content
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sentBody.systemInstruction).toBeDefined();
    expect(sentBody.systemInstruction.parts[0].text).toContain('You are a high-precision resume parsing engine');
    expect(sentBody.contents[0].parts[0].text).toContain('<<<UNTRUSTED_RESUME_TEXT_START>>>');
    expect(sentBody.contents[0].parts[0].text).not.toContain('You are a high-precision resume parsing engine');
  });

  it('falls back to deterministic extractor when Gemini API returns an HTTP error', async () => {
    extractor = new GeminiCareerDataExtractor(
      mockConfigService as ConfigService,
      mockFallback as DeterministicCareerDataExtractor,
    );

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'Resource exhausted (quota exceeded)',
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await extractor.extract('Resume content');

    expect(mockFallback.extract).toHaveBeenCalledWith('Resume content');
    expect(result.name).toBe('Fallback Name');
    expect(result.warnings).toBeDefined();
    expect(result.warnings?.some((w) => w.includes('HTTP 429'))).toBe(true);
  });

  it('falls back to deterministic extractor when network fetch throws or times out', async () => {
    extractor = new GeminiCareerDataExtractor(
      mockConfigService as ConfigService,
      mockFallback as DeterministicCareerDataExtractor,
    );

    const mockFetch = vi.fn().mockRejectedValue(new Error('Connection timed out'));
    vi.stubGlobal('fetch', mockFetch);

    const result = await extractor.extract('Resume content');

    expect(mockFallback.extract).toHaveBeenCalledWith('Resume content');
    expect(result.name).toBe('Fallback Name');
    expect(result.warnings?.some((w) => w.includes('Connection timed out'))).toBe(true);
  });
});
