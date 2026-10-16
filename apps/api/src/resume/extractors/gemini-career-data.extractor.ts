import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CareerDataExtractor } from '../career-data-extractor.interface.js';
import {
  type ExtractedCareerData,
  validateExtractedCareerData,
} from '../dto/extracted-career-data.dto.js';
import { DeterministicCareerDataExtractor } from './deterministic-career-data.extractor.js';

const EXTRACTION_SYSTEM_PROMPT = `You are a high-precision resume parsing engine for Career Switch Assistant.
Analyze the provided resume text and extract career information into a JSON object matching this schema:
{
  "name": string | null,
  "currentRole": string | null,
  "yearsOfExperience": number | null,
  "skills": string[],
  "workExperience": [
    {
      "company": string | null,
      "role": string | null,
      "description": string | null,
      "startDate": string | null,
      "endDate": string | null
    }
  ],
  "education": [
    {
      "institution": string | null,
      "qualification": string | null,
      "graduationYear": number | null
    }
  ],
  "projects": [
    {
      "name": string | null,
      "description": string | null,
      "technologies": string[]
    }
  ]
}

STRICT SAFETY AND GROUNDING RULES:
1. Extract ONLY information explicitly present in the resume text.
2. Do NOT invent, assume, or hallucinate companies, skills, roles, or graduation dates.
3. If a field is missing, not mentioned, or ambiguous, return null (or [] for arrays).
4. For yearsOfExperience, output the total cumulative professional software/tech experience in years (e.g. 3.5), or null if not calculable from employment history or explicit statements.
5. Standardize skill names (e.g. 'React.js' -> 'React', 'TS' -> 'TypeScript').`;

@Injectable()
export class GeminiCareerDataExtractor implements CareerDataExtractor {
  private readonly logger = new Logger(GeminiCareerDataExtractor.name);
  private readonly apiKey?: string;
  private readonly model: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly fallbackExtractor: DeterministicCareerDataExtractor,
  ) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.model =
      this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.5-flash';
  }

  async extract(resumeText: string): Promise<ExtractedCareerData> {
    if (!this.apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY is not configured. Using deterministic heuristic extractor.',
      );
      return this.fallbackExtractor.extract(resumeText);
    }

    this.logger.debug(
      `Sending extraction prompt to Gemini API (model: ${this.model})`,
    );

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${EXTRACTION_SYSTEM_PROMPT}\n\nRESUME TEXT TO PARSE:\n${resumeText}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(15000), // 15-second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Gemini API HTTP ${response.status}: ${errorText.slice(0, 300)}`,
        );
      }

      const jsonResponse = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
      };

      const rawContent =
        jsonResponse.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawContent) {
        throw new Error('Gemini API returned empty candidate response.');
      }

      const parsedJson = JSON.parse(rawContent) as unknown;
      const validated = validateExtractedCareerData(parsedJson);

      this.logger.log(
        `Gemini extracted ${validated.skills.length} skills, ${validated.workExperience.length} work entries.`,
      );

      return validated;
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || String(err);
      this.logger.warn(
        `Gemini structured extraction failed: ${errorMsg}. Falling back to deterministic extractor.`,
      );
      const fallbackResult = await this.fallbackExtractor.extract(resumeText);
      return {
        ...fallbackResult,
        warnings: [
          ...(fallbackResult.warnings || []),
          `AI extraction failed (${errorMsg.slice(0, 100)}); used deterministic heuristic fallback.`,
        ],
      };
    }
  }
}
