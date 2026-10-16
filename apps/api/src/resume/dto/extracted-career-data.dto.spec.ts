import { describe, expect, it } from 'vitest';
import { validateExtractedCareerData } from './extracted-career-data.dto.js';

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
});
