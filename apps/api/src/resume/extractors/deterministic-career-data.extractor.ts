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
  'System Design',
  'PyTorch',
  'Kafka',
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

export const DEFAULT_TEMPLATE_PATHS = [
  {
    id: 'cloud-architect',
    title: 'Cloud Solutions Architect',
    matchScore: 84,
    category: 'Architecture & Cloud',
    timeline: '4 - 6 Months',
    marketDemand: 'Very High',
    salaryRange: '$175k - $235k',
    description:
      'Design fault-tolerant, scalable multi-region architectures on AWS/GCP with Well-Architected governance and infrastructure automation.',
    bridgeSkills: [
      'Distributed Consensus',
      'AWS Well-Architected',
      'Terraform IaC',
      'System Design',
    ],
  },
  {
    id: 'ai-ml-engineer',
    title: 'AI / ML Platform Engineer',
    matchScore: 72,
    category: 'AI & Systems',
    timeline: '6 - 9 Months',
    marketDemand: 'Explosive',
    salaryRange: '$185k - $250k',
    description:
      'Build infrastructure for LLM deployment, fine-tuning pipelines, vector stores, and model evaluation telemetry for generative AI products.',
    bridgeSkills: [
      'Python & PyTorch',
      'Vector DBs (Pinecone/Milvus)',
      'vLLM / Triton Inference',
      'LangChain / Agents',
    ],
  },
  {
    id: 'staff-engineer',
    title: 'Staff Software Engineer',
    matchScore: 88,
    category: 'Technical Leadership',
    timeline: '3 - 5 Months',
    marketDemand: 'Very High',
    salaryRange: '$190k - $260k',
    description:
      'Set cross-organization architectural direction, solve ambiguous technical bottlenecks, and act as a leadership force multiplier.',
    bridgeSkills: [
      'Cross-System RFCs',
      'High-Scale Data Pipelines',
      'Engineering Strategy',
      'Mentorship & Alignment',
    ],
  },
  {
    id: 'sre-engineer',
    title: 'Site Reliability Engineer',
    matchScore: 80,
    category: 'Reliability & Infra',
    timeline: '4 - 6 Months',
    marketDemand: 'Very High',
    salaryRange: '$170k - $225k',
    description:
      'Ensure 99.99% system availability, automate chaos experiments, engineer incident observability, and eliminate operational toil.',
    bridgeSkills: [
      'Prometheus / OpenTelemetry',
      'Kubernetes Internals',
      'SLO / Error Budgets',
      'Chaos Engineering',
    ],
  },
  {
    id: 'devops-architect',
    title: 'DevOps & Platform Specialist',
    matchScore: 82,
    category: 'Platform Engineering',
    timeline: '4 - 6 Months',
    marketDemand: 'High',
    salaryRange: '$165k - $220k',
    description:
      'Build internal developer platforms (IDP), optimize zero-downtime CI/CD workflows, and govern containerized fleet orchestration.',
    bridgeSkills: [
      'ArgoCD / GitOps',
      'Docker Fleet Security',
      'Helm Charts',
      'GitHub Actions Workflows',
    ],
  },
  {
    id: 'data-architect',
    title: 'Data Systems Architect',
    matchScore: 70,
    category: 'Data & Analytics',
    timeline: '6 - 8 Months',
    marketDemand: 'High',
    salaryRange: '$175k - $230k',
    description:
      'Architect real-time event streaming architectures, lakehouse query engines, data mesh governance, and analytical schemas.',
    bridgeSkills: [
      'Apache Kafka',
      'DuckDB / ClickHouse',
      'Data Modeling',
      'Event-Driven Systems',
    ],
  },
  {
    id: 'security-specialist',
    title: 'Security & DevSecOps Engineer',
    matchScore: 66,
    category: 'Cybersecurity',
    timeline: '6 - 9 Months',
    marketDemand: 'Very High',
    salaryRange: '$170k - $230k',
    description:
      'Implement zero-trust security postures, automated static/dynamic scanning, cryptographic key hygiene, and container runtime auditing.',
    bridgeSkills: [
      'OAuth 2.1 & OIDC',
      'Zero-Trust Architecture',
      'Trivy / Snyk Scanning',
      'CloudTrail / SIEM Audit',
    ],
  },
  {
    id: 'engineering-manager',
    title: 'Engineering Manager / Lead',
    matchScore: 86,
    category: 'People & Delivery',
    timeline: '3 - 6 Months',
    marketDemand: 'High',
    salaryRange: '$180k - $240k',
    description:
      'Lead high-performing software squads, calibrate engineering velocity with product ROI, and guide long-term career growth.',
    bridgeSkills: [
      'Agile Sprint Calibration',
      'Stakeholder Alignment',
      'Tech Debt Prioritization',
      'Talent Development',
    ],
  },
];

@Injectable()
export class DeterministicCareerDataExtractor implements CareerDataExtractor {
  private readonly logger = new Logger(DeterministicCareerDataExtractor.name);

  async extract(resumeText: string, userPrompt?: string): Promise<ExtractedCareerData> {
    this.logger.debug(
      'Extracting structured career data using deterministic heuristics',
    );

    const combinedText = `${userPrompt || ''}\n${resumeText || ''}`.trim();

    if (!combinedText) {
      return validateExtractedCareerData({
        extractionMethod: 'heuristic',
        suggestedPaths: DEFAULT_TEMPLATE_PATHS,
        warnings: ['Empty input provided to heuristic extractor.'],
      });
    }

    const lines = combinedText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // 1. Candidate Name (heuristic: first line if 2-4 capitalized words)
    let name: string | null = null;
    if (lines.length > 0 && resumeText) {
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
      if (regex.test(combinedText)) {
        currentRole = role;
        break;
      }
    }

    // 3. Years of Experience
    let yearsOfExperience: number | null = null;
    const expRegex = /(\d+(?:\.\d+)?)\+?\s*years?(?:\s+of)?(?:\s+professional|\s+software|\s+technical|\s+work)?\s+experience/i;
    const match = combinedText.match(expRegex);
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
      if (skillRegex.test(combinedText)) {
        skills.push(skill);
      }
    }

    const workExperience: any[] = [];
    const education: any[] = [];
    const projects: any[] = [];

    const summary =
      userPrompt ||
      (currentRole && yearsOfExperience
        ? `${currentRole} with ${yearsOfExperience} years of experience.`
        : currentRole
          ? `${currentRole} exploring career transition.`
          : null);

    return validateExtractedCareerData({
      name,
      currentRole,
      yearsOfExperience,
      skills,
      summary,
      workExperience,
      education,
      projects,
      suggestedPaths: currentRole ? DEFAULT_TEMPLATE_PATHS : [],
      extractionMethod: 'heuristic',
      warnings: [
        'Extracted via deterministic heuristic fallback.',
      ],
    });
  }
}
