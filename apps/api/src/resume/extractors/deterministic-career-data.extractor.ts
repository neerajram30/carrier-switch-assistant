import { Injectable, Logger } from '@nestjs/common';
import type { CareerDataExtractor } from '../career-data-extractor.interface.js';
import {
  type ExtractedCareerData,
  validateExtractedCareerData,
} from '../dto/extracted-career-data.dto.js';

const KNOWN_SKILLS = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'C++',
  'C#',
  'Go',
  'Rust',
  'PHP',
  'Ruby',
  'React',
  'Next.js',
  'Vue',
  'Angular',
  'Svelte',
  'Node.js',
  'NestJS',
  'Express',
  'Django',
  'Flask',
  'FastAPI',
  'Spring Boot',
  'PostgreSQL',
  'MySQL',
  'MongoDB',
  'Redis',
  'SQLite',
  'Docker',
  'Kubernetes',
  'AWS',
  'GCP',
  'Azure',
  'Git',
  'GitHub',
  'CI/CD',
  'GraphQL',
  'REST',
  'gRPC',
  'Tailwind CSS',
  'HTML',
  'CSS',
  'Terraform',
  'Linux',
];

const KNOWN_ROLES = [
  'Senior Software Engineer',
  'Software Engineer',
  'Staff Engineer',
  'Lead Developer',
  'Frontend Developer',
  'Frontend Engineer',
  'Backend Developer',
  'Backend Engineer',
  'Full Stack Developer',
  'Full Stack Engineer',
  'DevOps Engineer',
  'Site Reliability Engineer',
  'Cloud Architect',
  'Data Engineer',
  'Machine Learning Engineer',
  'Mobile Developer',
  'iOS Developer',
  'Android Developer',
  'QA Engineer',
];

@Injectable()
export class DeterministicCareerDataExtractor implements CareerDataExtractor {
  private readonly logger = new Logger(DeterministicCareerDataExtractor.name);

  async extract(resumeText: string): Promise<ExtractedCareerData> {
    this.logger.debug(
      'Extracting structured career data using deterministic heuristics',
    );

    if (!resumeText || !resumeText.trim()) {
      return validateExtractedCareerData({
        extractionMethod: 'heuristic',
        warnings: ['Empty document provided to heuristic extractor.'],
      });
    }

    const lines = resumeText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // 1. Candidate Name (heuristic: first line if 2-4 capitalized words)
    let name: string | null = null;
    if (lines.length > 0) {
      const candidate = lines[0];
      const words = candidate.split(/\s+/);
      const isHeaderWord = /^(resume|curriculum|vitae|profile|experience|skills|contact)/i.test(
        candidate,
      );
      if (
        words.length >= 2 &&
        words.length <= 4 &&
        !isHeaderWord &&
        candidate.length < 50 &&
        !/[@:/\\0-9]/.test(candidate)
      ) {
        name = candidate;
      }
    }

    // 2. Current Role
    let currentRole: string | null = null;
    for (const role of KNOWN_ROLES) {
      const regex = new RegExp(`\\b${role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(resumeText)) {
        currentRole = role;
        break;
      }
    }

    // 3. Years of Experience
    let yearsOfExperience: number | null = null;
    const expRegex = /(\d+(?:\.\d+)?)\+?\s*years?(?:\s+of)?(?:\s+professional|\s+software|\s+technical|\s+work)?\s+experience/i;
    const match = resumeText.match(expRegex);
    if (match && match[1]) {
      const num = Number.parseFloat(match[1]);
      if (!Number.isNaN(num) && num >= 0 && num <= 50) {
        yearsOfExperience = Math.round(num * 10) / 10;
      }
    }

    // 4. Skills extraction
    const skills: string[] = [];
    for (const skill of KNOWN_SKILLS) {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const skillRegex = new RegExp(`(^|[^a-zA-Z0-9_])${escaped}($|[^a-zA-Z0-9_])`, 'i');
      if (skillRegex.test(resumeText)) {
        skills.push(skill);
      }
    }

    return validateExtractedCareerData({
      name,
      currentRole,
      yearsOfExperience,
      skills,
      workExperience: [],
      education: [],
      projects: [],
      extractionMethod: 'heuristic',
      warnings: [
        'Extracted via deterministic heuristic fallback. Work experience, education, and projects could not be extracted automatically.',
      ],
    });
  }
}
