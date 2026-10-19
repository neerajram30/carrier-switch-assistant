/**
 * Normalizes extracted document text:
 * - Strips null bytes (\u0000) and control characters that corrupt PostgreSQL text storage
 * - Unifies line endings (\r\n -> \n)
 * - Collapses consecutive spaces/tabs on each line
 * - Trims each line
 * - Collapses 3+ newlines into 2 to preserve clean paragraph spacing
 * - Trims document start and end
 */
export function normalizeExtractedText(text: string): string {
  if (!text) return '';

  return text
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\r\n|\r/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
