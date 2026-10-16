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
  warnings?: string[];
}

/**
 * Validates, cleans, and normalizes untrusted AI/extracted output into
 * a strictly typed ExtractedCareerData structure.
 * Missing or invalid fields are safely represented as null or empty arrays.
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

  // Name
  const name =
    typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim() : null;

  // Current Role
  const currentRole =
    typeof obj.currentRole === 'string' && obj.currentRole.trim()
      ? obj.currentRole.trim()
      : null;

  // Years of Experience: must be non-negative number, capped/rounded to 1 decimal place
  let yearsOfExperience: number | null = null;
  if (typeof obj.yearsOfExperience === 'number' && !Number.isNaN(obj.yearsOfExperience)) {
    if (obj.yearsOfExperience >= 0) {
      yearsOfExperience = Math.round(obj.yearsOfExperience * 10) / 10;
    }
  } else if (typeof obj.yearsOfExperience === 'string') {
    const parsed = Number.parseFloat(obj.yearsOfExperience);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      yearsOfExperience = Math.round(parsed * 10) / 10;
    }
  }

  // Skills
  const rawSkills = Array.isArray(obj.skills) ? obj.skills : [];
  const skills = Array.from(
    new Set(
      rawSkills
        .filter((s): s is string => typeof s === 'string')
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    ),
  );

  // Work Experience
  const rawWork = Array.isArray(obj.workExperience) ? obj.workExperience : [];
  const workExperience: WorkExperienceItem[] = rawWork
    .filter((w): w is Record<string, unknown> => Boolean(w) && typeof w === 'object' && !Array.isArray(w))
    .map((w) => ({
      company: typeof w.company === 'string' && w.company.trim() ? w.company.trim() : null,
      role: typeof w.role === 'string' && w.role.trim() ? w.role.trim() : null,
      description: typeof w.description === 'string' && w.description.trim() ? w.description.trim() : null,
      startDate: typeof w.startDate === 'string' && w.startDate.trim() ? w.startDate.trim() : null,
      endDate: typeof w.endDate === 'string' && w.endDate.trim() ? w.endDate.trim() : null,
    }));

  // Education
  const rawEdu = Array.isArray(obj.education) ? obj.education : [];
  const education: EducationItem[] = rawEdu
    .filter((e): e is Record<string, unknown> => Boolean(e) && typeof e === 'object' && !Array.isArray(e))
    .map((e) => {
      let graduationYear: number | null = null;
      if (typeof e.graduationYear === 'number' && !Number.isNaN(e.graduationYear)) {
        graduationYear = Math.floor(e.graduationYear);
      } else if (typeof e.graduationYear === 'string') {
        const parsedYear = Number.parseInt(e.graduationYear, 10);
        if (!Number.isNaN(parsedYear) && parsedYear >= 1900 && parsedYear <= 2100) {
          graduationYear = parsedYear;
        }
      }

      return {
        institution: typeof e.institution === 'string' && e.institution.trim() ? e.institution.trim() : null,
        qualification: typeof e.qualification === 'string' && e.qualification.trim() ? e.qualification.trim() : null,
        graduationYear,
      };
    });

  // Projects
  const rawProj = Array.isArray(obj.projects) ? obj.projects : [];
  const projects: ProjectItem[] = rawProj
    .filter((p): p is Record<string, unknown> => Boolean(p) && typeof p === 'object' && !Array.isArray(p))
    .map((p) => {
      const rawTech = Array.isArray(p.technologies) ? p.technologies : [];
      const technologies = Array.from(
        new Set(
          rawTech
            .filter((t): t is string => typeof t === 'string')
            .map((t) => t.trim())
            .filter((t) => t.length > 0),
        ),
      );

      return {
        name: typeof p.name === 'string' && p.name.trim() ? p.name.trim() : null,
        description: typeof p.description === 'string' && p.description.trim() ? p.description.trim() : null,
        technologies,
      };
    });

  // Warnings
  const warnings: string[] = [];
  if (Array.isArray(obj.warnings)) {
    for (const w of obj.warnings) {
      if (typeof w === 'string' && w.trim()) {
        warnings.push(w.trim());
      }
    }
  }

  return {
    name,
    currentRole,
    yearsOfExperience,
    skills,
    workExperience,
    education,
    projects,
    ...(warnings.length > 0 ? { warnings } : {}),
  };
}
