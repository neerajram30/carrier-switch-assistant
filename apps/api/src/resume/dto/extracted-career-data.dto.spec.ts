import { describe, expect, it } from 'vitest';
import {
  CONSTRAINTS,
  validateExtractedCareerData,
} from './extracted-career-data.dto.js';

describe('validateExtractedCareerData', () => {
  it('returns empty safe structure with warning when input is null, undefined, or not an object', () => {
    const resultNull = validateExtractedCareerData(null);
    expect(resultNull.name).toBeNull();
    expect(resultNull.currentRole).toBeNull();
    expect(resultNull.yearsOfExperience).toBeNull();
    expect(resultNull.skills).toEqual([]);
    expect(resultNull.workExperience).toEqual([]);
    expect(resultNull.education).toEqual([]);
    expect(resultNull.projects).toEqual([]);
    expect(resultNull.warnings).toBeDefined();

    const resultArr = validateExtractedCareerData(['not', 'an', 'object']);
    expect(resultArr.skills).toEqual([]);
  });

  it('correctly cleans and extracts valid career data', () => {
    const raw = {
      name: '  Jane Doe  ',
      currentRole: '  Lead Software Engineer ',
      yearsOfExperience: 6.45,
      skills: [' React ', 'TypeScript', 'React', '', 123, 'Node.js '],
      workExperience: [
        {
          company: ' TechCorp ',
          role: ' Staff Architect ',
          description: ' Built distributed systems ',
          startDate: ' 2022-01 ',
          endDate: ' Present ',
        },
      ],
      education: [
        {
          institution: ' MIT ',
          qualification: ' B.S. Computer Science ',
          graduationYear: 2018,
        },
      ],
      projects: [
        {
          name: ' AI Assistant ',
          description: ' Contextual assistant ',
          technologies: [' Python ', 'PyTorch', 'Python'],
        },
      ],
      extractionMethod: 'ai',
    };

    const result = validateExtractedCareerData(raw);

    expect(result.name).toBe('Jane Doe');
    expect(result.currentRole).toBe('Lead Software Engineer');
    expect(result.yearsOfExperience).toBe(6.5); // rounded to 1 decimal place
    expect(result.skills).toEqual(['React', 'TypeScript', 'Node.js']);
    expect(result.workExperience).toHaveLength(1);
    expect(result.workExperience[0]).toEqual({
      company: 'TechCorp',
      role: 'Staff Architect',
      description: 'Built distributed systems',
      startDate: '2022-01',
      endDate: 'Present',
    });
    expect(result.education).toHaveLength(1);
    expect(result.education[0]).toEqual({
      institution: 'MIT',
      qualification: 'B.S. Computer Science',
      graduationYear: 2018,
    });
    expect(result.projects).toHaveLength(1);
    expect(result.projects[0]).toEqual({
      name: 'AI Assistant',
      description: 'Contextual assistant',
      technologies: ['Python', 'PyTorch'],
    });
    expect(result.extractionMethod).toBe('ai');
  });

  it('supports missing or unknown fields without inventing data', () => {
    const sparse = {
      skills: ['Go', 'Docker'],
    };

    const result = validateExtractedCareerData(sparse);

    expect(result.name).toBeNull();
    expect(result.currentRole).toBeNull();
    expect(result.yearsOfExperience).toBeNull();
    expect(result.skills).toEqual(['Go', 'Docker']);
    expect(result.workExperience).toEqual([]);
    expect(result.education).toEqual([]);
    expect(result.projects).toEqual([]);
  });

  it('handles string years of experience and string graduation years gracefully', () => {
    const raw = {
      yearsOfExperience: '4.2',
      education: [
        {
          institution: 'Stanford',
          graduationYear: '2020',
        },
      ],
    };

    const result = validateExtractedCareerData(raw);

    expect(result.yearsOfExperience).toBe(4.2);
    expect(result.education[0].graduationYear).toBe(2020);
  });

  it('strictly rejects malformed numeric strings and out-of-range experience values', () => {
    // Malformed string with alpha prefix or suffix (previously accepted by parseFloat)
    expect(validateExtractedCareerData({ yearsOfExperience: '5abc' }).yearsOfExperience).toBeNull();
    expect(validateExtractedCareerData({ yearsOfExperience: 'abc5' }).yearsOfExperience).toBeNull();
    expect(validateExtractedCareerData({ yearsOfExperience: '10.5.2' }).yearsOfExperience).toBeNull();

    // Out-of-bounds experience (negative or > 70 years)
    expect(validateExtractedCareerData({ yearsOfExperience: -2 }).yearsOfExperience).toBeNull();
    expect(validateExtractedCareerData({ yearsOfExperience: 95 }).yearsOfExperience).toBeNull();
    expect(validateExtractedCareerData({ yearsOfExperience: '75' }).yearsOfExperience).toBeNull();

    // Valid boundary experience
    expect(validateExtractedCareerData({ yearsOfExperience: 0 }).yearsOfExperience).toBe(0);
    expect(validateExtractedCareerData({ yearsOfExperience: 70 }).yearsOfExperience).toBe(70);
  });

  it('enforces graduation year range constraints (1950 to currentYear + 10)', () => {
    // Too far in the past
    expect(validateExtractedCareerData({ education: [{ graduationYear: 1890 }] }).education[0].graduationYear).toBeNull();
    expect(validateExtractedCareerData({ education: [{ graduationYear: '1949' }] }).education[0].graduationYear).toBeNull();

    // Too far in the future
    expect(validateExtractedCareerData({ education: [{ graduationYear: 2050 }] }).education[0].graduationYear).toBeNull();

    // Valid years
    expect(validateExtractedCareerData({ education: [{ graduationYear: 1995 }] }).education[0].graduationYear).toBe(1995);
    expect(validateExtractedCareerData({ education: [{ graduationYear: '2024' }] }).education[0].graduationYear).toBe(2024);
  });

  it('bounds string lengths and limits excessive array items to prevent oversized payloads', () => {
    const overlyLongName = 'A'.repeat(200);
    const overlyLongRole = 'R'.repeat(300);
    const overlyLongDescription = 'D'.repeat(5000);

    const manySkills = Array.from({ length: 150 }, (_, i) => `Skill${i}`);
    const manyWork = Array.from({ length: 50 }, (_, i) => ({ company: `Company${i}`, role: 'Dev' }));

    const result = validateExtractedCareerData({
      name: overlyLongName,
      currentRole: overlyLongRole,
      skills: manySkills,
      workExperience: manyWork,
      projects: [{ name: 'Project 1', description: overlyLongDescription, technologies: [] }],
    });

    expect(result.name?.length).toBe(CONSTRAINTS.MAX_NAME_LENGTH);
    expect(result.currentRole?.length).toBe(CONSTRAINTS.MAX_ROLE_LENGTH);
    expect(result.skills.length).toBe(CONSTRAINTS.MAX_SKILLS_COUNT);
    expect(result.workExperience.length).toBe(CONSTRAINTS.MAX_WORK_ENTRIES);
    expect(result.projects[0].description?.length).toBe(CONSTRAINTS.MAX_DESCRIPTION_LENGTH);
  });
});
