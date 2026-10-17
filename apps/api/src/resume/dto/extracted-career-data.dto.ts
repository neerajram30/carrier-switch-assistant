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

export const CONSTRAINTS = {
  MAX_YEARS_EXPERIENCE: 70,
  MIN_GRADUATION_YEAR: 1950,
  MAX_GRADUATION_YEAR: new Date().getFullYear() + 10,
  MAX_NAME_LENGTH: 100,
  MAX_ROLE_LENGTH: 120,
  MAX_COMPANY_LENGTH: 120,
  MAX_QUALIFICATION_LENGTH: 120,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_DATE_LENGTH: 30,
  MAX_SKILL_LENGTH: 60,
  MAX_SKILLS_COUNT: 100,
  MAX_WORK_ENTRIES: 30,
  MAX_EDUCATION_ENTRIES: 20,
  MAX_PROJECT_ENTRIES: 20,
  MAX_PROJECT_TECH_COUNT: 30,
} as const;

function sanitizeString(val: unknown, maxLength: number): string | null {
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function parseYearsOfExperience(val: unknown): number | null {
  if (typeof val === 'number') {
    if (Number.isFinite(val) && val >= 0 && val <= CONSTRAINTS.MAX_YEARS_EXPERIENCE) {
      return Math.round(val * 10) / 10;
    }
    return null;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    // Strict numeric pattern: digits with optional single decimal dot, no alpha prefix or suffix
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      const num = Number(trimmed);
      if (Number.isFinite(num) && num >= 0 && num <= CONSTRAINTS.MAX_YEARS_EXPERIENCE) {
        return Math.round(num * 10) / 10;
      }
    }
  }
  return null;
}

function parseGraduationYear(val: unknown): number | null {
  let year: number | null = null;
  if (typeof val === 'number') {
    if (Number.isFinite(val)) {
      year = Math.floor(val);
    }
  } else if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^\d{4}$/.test(trimmed)) {
      year = Number.parseInt(trimmed, 10);
    }
  }
  if (
    year !== null &&
    year >= CONSTRAINTS.MIN_GRADUATION_YEAR &&
    year <= CONSTRAINTS.MAX_GRADUATION_YEAR
  ) {
    return year;
  }
  return null;
}

/**
 * Validates, cleans, and normalizes untrusted AI/extracted output into
 * a strictly constrained, typed ExtractedCareerData structure.
 * Missing, malformed, or excessive fields are safely normalized or rejected.
 */
export function validateExtractedCareerData(raw: unknown): ExtractedCareerData {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      name: null,
      currentRole: null,
      yearsOfExperience: null,
      skills: [],
      workExperience: [],
      education: [],
      projects: [],
      warnings: ['Raw extraction output was missing or not a valid object.'],
    };
  }

  const obj = raw as Record<string, unknown>;

  // 1. Candidate Name (bounded length)
  const name = sanitizeString(obj.name, CONSTRAINTS.MAX_NAME_LENGTH);

  // 2. Current Role (bounded length)
  const currentRole = sanitizeString(obj.currentRole, CONSTRAINTS.MAX_ROLE_LENGTH);

  // 3. Years of Experience (finite, bounded 0-70, strict numeric check)
  const yearsOfExperience = parseYearsOfExperience(obj.yearsOfExperience);

  // 4. Skills (bounded array size, bounded string length, deduplicated)
  const rawSkills = Array.isArray(obj.skills) ? obj.skills : [];
  const skills = Array.from(
    new Set(
      rawSkills
        .filter((s): s is string => typeof s === 'string')
        .map((s) => s.trim().slice(0, CONSTRAINTS.MAX_SKILL_LENGTH))
        .filter((s) => s.length > 0),
    ),
  ).slice(0, CONSTRAINTS.MAX_SKILLS_COUNT);

  // 5. Work Experience (bounded entries, bounded fields)
  const rawWork = Array.isArray(obj.workExperience) ? obj.workExperience : [];
  const workExperience: WorkExperienceItem[] = rawWork
    .filter(
      (w): w is Record<string, unknown> =>
        Boolean(w) && typeof w === 'object' && !Array.isArray(w),
    )
    .slice(0, CONSTRAINTS.MAX_WORK_ENTRIES)
    .map((w) => ({
      company: sanitizeString(w.company, CONSTRAINTS.MAX_COMPANY_LENGTH),
      role: sanitizeString(w.role, CONSTRAINTS.MAX_ROLE_LENGTH),
      description: sanitizeString(w.description, CONSTRAINTS.MAX_DESCRIPTION_LENGTH),
      startDate: sanitizeString(w.startDate, CONSTRAINTS.MAX_DATE_LENGTH),
      endDate: sanitizeString(w.endDate, CONSTRAINTS.MAX_DATE_LENGTH),
    }));

  // 6. Education (bounded entries, range-checked graduation years)
  const rawEdu = Array.isArray(obj.education) ? obj.education : [];
  const education: EducationItem[] = rawEdu
    .filter(
      (e): e is Record<string, unknown> =>
        Boolean(e) && typeof e === 'object' && !Array.isArray(e),
    )
    .slice(0, CONSTRAINTS.MAX_EDUCATION_ENTRIES)
    .map((e) => ({
      institution: sanitizeString(e.institution, CONSTRAINTS.MAX_COMPANY_LENGTH),
      qualification: sanitizeString(e.qualification, CONSTRAINTS.MAX_QUALIFICATION_LENGTH),
      graduationYear: parseGraduationYear(e.graduationYear),
    }));

  // 7. Projects (bounded entries, bounded fields and tech tags)
  const rawProj = Array.isArray(obj.projects) ? obj.projects : [];
  const projects: ProjectItem[] = rawProj
    .filter(
      (p): p is Record<string, unknown> =>
        Boolean(p) && typeof p === 'object' && !Array.isArray(p),
    )
    .slice(0, CONSTRAINTS.MAX_PROJECT_ENTRIES)
    .map((p) => {
      const rawTech = Array.isArray(p.technologies) ? p.technologies : [];
      const technologies = Array.from(
        new Set(
          rawTech
            .filter((t): t is string => typeof t === 'string')
            .map((t) => t.trim().slice(0, CONSTRAINTS.MAX_SKILL_LENGTH))
            .filter((t) => t.length > 0),
        ),
      ).slice(0, CONSTRAINTS.MAX_PROJECT_TECH_COUNT);

      return {
        name: sanitizeString(p.name, CONSTRAINTS.MAX_COMPANY_LENGTH),
        description: sanitizeString(p.description, CONSTRAINTS.MAX_DESCRIPTION_LENGTH),
        technologies,
      };
    });

  // 8. Warnings and extractionMethod
  const warnings: string[] = [];
  if (Array.isArray(obj.warnings)) {
    for (const w of obj.warnings) {
      if (typeof w === 'string' && w.trim()) {
        warnings.push(w.trim().slice(0, 300));
      }
    }
  }

  const extractionMethod: 'ai' | 'heuristic' | undefined =
    obj.extractionMethod === 'ai'
      ? 'ai'
      : obj.extractionMethod === 'heuristic'
        ? 'heuristic'
        : undefined;

  return {
    name,
    currentRole,
    yearsOfExperience,
    skills,
    workExperience,
    education,
    projects,
    ...(extractionMethod ? { extractionMethod } : {}),
    ...(warnings.length > 0 ? { warnings } : {}),
  };
}
