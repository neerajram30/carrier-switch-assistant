import {
  BadGatewayException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface DailyTaskTemplate {
  id: string;
  dayNumber: number;
  dayLabel: string;
  title: string;
  learningFocus: string;
  actionItem: string;
  duration: string;
  isCompleted: boolean;
  completedAt?: string | null;
}

export interface MilestoneSprintTemplate {
  weekRange: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  dailyTasks: DailyTaskTemplate[];
}

export interface DynamicCareerPath {
  id: string;
  title: string;
  category: string;
  matchScore: number;
  timeline: string;
  marketDemand: 'Explosive' | 'Very High' | 'High' | 'Moderate';
  salaryRange: string;
  description: string;
  bridgeSkills: string[];
}

const ROADMAP_GENERATION_SYSTEM_PROMPT = `
You are a Staff Technical Career Architect and Senior Engineering Director.
Your task is to design a realistic, rigorous, 10-week career transition roadmap (structured into 5 two-week sprints) for a software professional transitioning from their current baseline role to a target destination role.

OUTPUT REQUIREMENTS:
Output strictly a valid JSON object with the key "milestones" matching this exact TypeScript structure:
{
  "milestones": [
    {
      "weekRange": "Week 1 - 2",
      "title": "string (Focus of Sprint 1)",
      "description": "string (2-sentence strategic rationale covering architecture trade-offs)",
      "category": "string (e.g. 'Foundations', 'Systems', 'Cloud', 'Security', 'Capstone')",
      "duration": "string (e.g. '14 hrs')",
      "dailyTasks": [
        {
          "id": "d1",
          "dayNumber": 1,
          "dayLabel": "Day 1",
          "title": "string",
          "learningFocus": "string (deep architectural concepts, patterns, or specifications)",
          "actionItem": "string (hands-on coding exercise, diagram, or benchmark challenge)",
          "duration": "string (e.g. '2.5 hrs')",
          "isCompleted": false
        },
        ... exactly 5 daily tasks per sprint (d1 to d5)
      ]
    },
    ... exactly 5 sprints (Week 1 - 2, Week 3 - 4, Week 5 - 6, Week 7 - 8, Week 9 - 10)
  ]
}

STRICT RULES:
1. Every sprint MUST contain exactly 5 daily tasks.
2. Ground the tasks in real production software engineering principles, toolings, and paradigms.
3. Bridge the candidate's existing skills with the target role's critical competencies.
4. DO NOT return markdown fences like \`\`\`json. Output ONLY raw parseable JSON.
`;

const PATHS_GENERATION_SYSTEM_PROMPT = `
You are an Executive Technology Talent Advisor and Engineering Career Strategist.
Given a software professional's verified current baseline (role, years of experience, current skills, and summary), generate 6 to 8 realistic, compelling, and high-impact target career transition pathways.

OUTPUT REQUIREMENTS:
Output strictly a valid JSON object with the key "paths" matching this exact TypeScript structure:
{
  "paths": [
    {
      "id": "string (kebab-case identifier, e.g. 'cloud-solutions-architect')",
      "title": "string (e.g. 'Cloud Solutions Architect')",
      "category": "string (e.g. 'Architecture & Cloud', 'AI Systems', 'Security', 'Data Engineering')",
      "matchScore": integer between 40 and 95,
      "timeline": "string (e.g. '4 - 6 Months')",
      "marketDemand": "Explosive" | "Very High" | "High" | "Moderate",
      "salaryRange": "string (e.g. '$170k - $230k')",
      "description": "string (2-sentence strategic description of the role and fit)",
      "bridgeSkills": ["string", "string", "string", "string"] // exactly 3 to 5 critical bridge skills
    }
  ]
}

STRICT RULES:
1. Return between 6 and 8 distinct, realistic target roles.
2. Bridge skills must specify the key competencies needed to bridge the gap from the current role.
3. Output ONLY raw parseable JSON without markdown ticks.
`;

@Injectable()
export class DynamicRoadmapGeneratorService {
  private readonly logger = new Logger(DynamicRoadmapGeneratorService.name);
  private readonly apiKey?: string;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey =
      this.configService.get<string>('GEMINI_API_KEY') ||
      process.env.GEMINI_API_KEY;
    this.model =
      this.configService.get<string>('GEMINI_MODEL') ||
      process.env.GEMINI_MODEL ||
      'gemini-2.5-flash';
  }

  /**
   * Dynamically generates a tailored 5-sprint curriculum with 25 daily tasks via LLM.
   * Throws BadGatewayException with the exact error message if generation fails.
   */
  async generateRoadmapForRole(params: {
    currentRole: string;
    yearsOfExperience: number;
    currentSkills: string[];
    targetRole: string;
    bridgeSkills?: string[];
    summary?: string | null;
  }): Promise<MilestoneSprintTemplate[]> {
    if (!this.apiKey) {
      throw new BadGatewayException(
        'GEMINI_API_KEY is not configured on the server. AI roadmap generation requires a valid Gemini API key.',
      );
    }

    const candidateModels = Array.from(
      new Set([
        this.model,
        'gemini-2.5-flash',
        'gemini-3.5-flash-lite',
        'gemini-3.6-flash',
      ]),
    );

    const promptText = `
Candidate Current Baseline:
- Current Role: ${params.currentRole} (${params.yearsOfExperience} years of experience)
- Existing Verified Skills: ${params.currentSkills.join(', ') || 'General Software Engineering'}
- Career Summary: ${params.summary || 'None provided'}

Target Destination Role:
- Desired Target Role: ${params.targetRole}
- Identified Competency Bridge Skills: ${params.bridgeSkills?.join(', ') || 'Core domain competencies for ' + params.targetRole}

Generate a comprehensive, realistic, 10-week curriculum (5 sprints of 5 daily tasks each) addressing this transition.
`;

    const requestBody = {
      systemInstruction: {
        parts: [{ text: ROADMAP_GENERATION_SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: promptText }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    };

    let lastError: Error | null = null;

    for (const modelName of candidateModels) {
      try {
        this.logger.log(
          `Generating dynamic roadmap for "${params.targetRole}" using model ${modelName}...`,
        );

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(25000),
        });

        if (!response.ok) {
          const errBody = await response.text().catch(() => '');
          throw new Error(
            `Gemini API HTTP ${response.status} (${response.statusText}): ${errBody}`,
          );
        }

        const data = await response.json();
        const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawContent) {
          throw new Error(
            `Gemini API returned an empty response (finishReason: ${data?.candidates?.[0]?.finishReason || 'UNKNOWN'})`,
          );
        }

        const parsed = JSON.parse(rawContent.trim());
        const milestones = parsed.milestones;

        if (!Array.isArray(milestones) || milestones.length === 0) {
          throw new Error(
            'LLM response did not contain a valid milestones array.',
          );
        }

        // Validate and clean structure
        const validatedSprints: MilestoneSprintTemplate[] = milestones.map(
          (m: any, sprintIdx: number) => {
            const rawDaily = Array.isArray(m.dailyTasks) ? m.dailyTasks : [];
            const dailyTasks: DailyTaskTemplate[] = rawDaily.map(
              (d: any, dIdx: number) => ({
                id: d.id || `d${dIdx + 1}`,
                dayNumber: typeof d.dayNumber === 'number' ? d.dayNumber : dIdx + 1,
                dayLabel: d.dayLabel || `Day ${dIdx + 1}`,
                title: d.title || `Day ${dIdx + 1} Deep Dive`,
                learningFocus: d.learningFocus || d.title || '',
                actionItem: d.actionItem || 'Complete hands-on engineering lab challenge.',
                duration: d.duration || '2.5 hrs',
                isCompleted: false,
              }),
            );

            return {
              weekRange: m.weekRange || `Week ${sprintIdx * 2 + 1} - ${sprintIdx * 2 + 2}`,
              title: m.title || `Sprint ${sprintIdx + 1}`,
              description: m.description || '',
              category: m.category || 'Architecture',
              duration: m.duration || '15 hrs',
              dailyTasks,
            };
          },
        );

        this.logger.log(
          `Successfully generated dynamic roadmap for "${params.targetRole}" with ${validatedSprints.length} sprints using ${modelName}.`,
        );

        return validatedSprints;
      } catch (err: unknown) {
        lastError = err as Error;
        this.logger.warn(
          `Roadmap generation attempt with model ${modelName} failed: ${(err as Error)?.message}. Trying next candidate...`,
        );
      }
    }

    // No fallback data: surface the real error directly to maintain transparency
    throw new BadGatewayException(
      `AI roadmap generation failed: ${lastError?.message || 'Unable to connect to Gemini API'}. Please check your connection and retry.`,
    );
  }

  /**
   * Dynamically generates 6 to 8 tailored career paths from a candidate's profile.
   * Throws BadGatewayException with the exact error message if generation fails.
   */
  async generateCareerPathsForProfile(params: {
    currentRole: string;
    yearsOfExperience: number;
    currentSkills: string[];
    summary?: string | null;
  }): Promise<DynamicCareerPath[]> {
    if (!this.apiKey) {
      throw new BadGatewayException(
        'GEMINI_API_KEY is not configured on the server. Dynamic path generation requires a valid Gemini API key.',
      );
    }

    const candidateModels = Array.from(
      new Set([
        this.model,
        'gemini-2.5-flash',
        'gemini-3.5-flash-lite',
        'gemini-3.6-flash',
      ]),
    );

    const promptText = `
Candidate Profile:
- Current Role: ${params.currentRole}
- Years of Experience: ${params.yearsOfExperience}
- Verified Skills: ${params.currentSkills.join(', ') || 'Software Development'}
- Profile Summary: ${params.summary || 'None provided'}

Generate between 6 and 8 realistic, ambitious, and tailored career trajectories for this professional.
`;

    const requestBody = {
      systemInstruction: {
        parts: [{ text: PATHS_GENERATION_SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: promptText }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.25,
      },
    };

    let lastError: Error | null = null;

    for (const modelName of candidateModels) {
      try {
        this.logger.log(
          `Generating dynamic career paths using model ${modelName}...`,
        );

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(25000),
        });

        if (!response.ok) {
          const errBody = await response.text().catch(() => '');
          throw new Error(
            `Gemini API HTTP ${response.status} (${response.statusText}): ${errBody}`,
          );
        }

        const data = await response.json();
        const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawContent) {
          throw new Error(
            `Gemini API returned an empty response (finishReason: ${data?.candidates?.[0]?.finishReason || 'UNKNOWN'})`,
          );
        }

        const parsed = JSON.parse(rawContent.trim());
        const paths = parsed.paths;

        if (!Array.isArray(paths) || paths.length === 0) {
          throw new Error('LLM response did not contain a valid paths array.');
        }

        const validatedPaths: DynamicCareerPath[] = paths.map((p: any) => ({
          id: String(p.id || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
          title: String(p.title),
          category: String(p.category || 'Engineering'),
          matchScore: typeof p.matchScore === 'number' ? Math.min(100, Math.max(0, p.matchScore)) : 75,
          timeline: String(p.timeline || '4 - 6 Months'),
          marketDemand: ['Explosive', 'Very High', 'High', 'Moderate'].includes(p.marketDemand)
            ? p.marketDemand
            : 'Very High',
          salaryRange: String(p.salaryRange || '$160k - $220k'),
          description: String(p.description || ''),
          bridgeSkills: Array.isArray(p.bridgeSkills) ? p.bridgeSkills.map(String) : [],
        }));

        this.logger.log(
          `Successfully generated ${validatedPaths.length} dynamic career paths using ${modelName}.`,
        );

        return validatedPaths;
      } catch (err: unknown) {
        lastError = err as Error;
        this.logger.warn(
          `Path generation attempt with model ${modelName} failed: ${(err as Error)?.message}. Trying next candidate...`,
        );
      }
    }

    throw new BadGatewayException(
      `AI career path calibration failed: ${lastError?.message || 'Unable to connect to Gemini API'}. Please check your connection and retry.`,
    );
  }
}

