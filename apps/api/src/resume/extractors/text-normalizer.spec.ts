import { describe, expect, it } from 'vitest';
import { normalizeExtractedText } from './text-normalizer.js';

describe('normalizeExtractedText', () => {
  it('handles empty or blank input', () => {
    expect(normalizeExtractedText('')).toBe('');
    expect(normalizeExtractedText('   \n\t  ')).toBe('');
  });

  it('normalizes windows CRLF line breaks to standard newlines', () => {
    const input = 'Line 1\r\nLine 2\rLine 3';
    expect(normalizeExtractedText(input)).toBe('Line 1\nLine 2\nLine 3');
  });

  it('collapses multiple horizontal spaces and tabs into a single space', () => {
    const input = 'Senior    Software   \t\t Engineer';
    expect(normalizeExtractedText(input)).toBe('Senior Software Engineer');
  });

  it('trims leading and trailing whitespace from each line', () => {
    const input = '  Skill 1  \n   Skill 2 \n  Skill 3   ';
    expect(normalizeExtractedText(input)).toBe('Skill 1\nSkill 2\nSkill 3');
  });

  it('collapses 3 or more consecutive newlines into 2 to preserve clean paragraphs', () => {
    const input = 'Paragraph 1\n\n\n\n\nParagraph 2\n\n\nParagraph 3';
    expect(normalizeExtractedText(input)).toBe(
      'Paragraph 1\n\nParagraph 2\n\nParagraph 3',
    );
  });

  it('strips null bytes and non-printable control characters that would corrupt database text fields', () => {
    const input = 'Clean\u0000Text\u0007With\u001FControls';
    expect(normalizeExtractedText(input)).toBe('CleanTextWithControls');
  });
});
