import { beforeEach, describe, expect, it } from 'vitest';
import { DeterministicCareerDataExtractor } from './deterministic-career-data.extractor.js';

describe('DeterministicCareerDataExtractor', () => {
  let extractor: DeterministicCareerDataExtractor;

  beforeEach(() => {
    extractor = new DeterministicCareerDataExtractor();
  });

  it('handles empty or whitespace text gracefully without throwing', async () => {
    const result = await extractor.extract('   \n\n  ');

    expect(result.name).toBeNull();
    expect(result.currentRole).toBeNull();
    expect(result.yearsOfExperience).toBeNull();
    expect(result.skills).toEqual([]);
    expect(result.workExperience).toEqual([]);
    expect(result.education).toEqual([]);
    expect(result.projects).toEqual([]);
  });

  it('extracts candidate name from the top line when formatted as a name', async () => {
    const resumeText = `Jane Doe
Senior Software Engineer
5 years of professional experience
Skills: React, TypeScript, Node.js`;

    const result = await extractor.extract(resumeText);

    expect(result.name).toBe('Jane Doe');
    expect(result.currentRole).toBe('Senior Software Engineer');
    expect(result.yearsOfExperience).toBe(5);
    expect(result.skills).toContain('React');
    expect(result.skills).toContain('TypeScript');
    expect(result.skills).toContain('Node.js');
  });

  it('does not mistake headers or emails as candidate name', async () => {
    const resumeText = `RESUME - CURRICULUM VITAE
contact@example.com / 555-123-4567
Frontend Developer with 3.5 years of experience in JavaScript and CSS`;

    const result = await extractor.extract(resumeText);

    expect(result.name).toBeNull();
    expect(result.currentRole).toBe('Frontend Developer');
    expect(result.yearsOfExperience).toBe(3.5);
    expect(result.skills).toContain('JavaScript');
    expect(result.skills).toContain('CSS');
  });

  it('detects boundary-sensitive skills accurately (e.g. Next.js, Go)', async () => {
    const resumeText = `Alex Taylor
Backend Engineer with 4 years of experience.
Working with Go, Python, Docker, and PostgreSQL. Outgoing and robust team player.`;

    const result = await extractor.extract(resumeText);

    expect(result.skills).toContain('Go');
    expect(result.skills).toContain('Python');
    expect(result.skills).toContain('Docker');
    expect(result.skills).toContain('PostgreSQL');
    expect(result.skills).not.toContain('Django');
    expect(result.skills).not.toContain('Rust');
  });

  it('includes deterministic fallback warning', async () => {
    const result = await extractor.extract('Software Engineer with 2 years of experience.');

    expect(result.warnings).toBeDefined();
    expect(result.warnings?.[0]).toMatch(/deterministic heuristic fallback/i);
  });
});
