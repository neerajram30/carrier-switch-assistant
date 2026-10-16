import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import mammoth from 'mammoth';
import { DocxExtractor, DOCX_MIME_TYPE } from './docx.extractor.js';

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(),
  },
}));

describe('DocxExtractor', () => {
  let extractor: DocxExtractor;

  beforeEach(() => {
    vi.clearAllMocks();
    extractor = new DocxExtractor();
  });

  describe('supports', () => {
    it('returns true for DOCX mime type', () => {
      expect(extractor.supports(DOCX_MIME_TYPE)).toBe(true);
      expect(extractor.supports(DOCX_MIME_TYPE.toUpperCase())).toBe(true);
    });

    it('returns true for .docx extension in fileName', () => {
      expect(extractor.supports('application/octet-stream', 'my_resume.docx')).toBe(
        true,
      );
      expect(extractor.supports('', 'RESUME.DOCX')).toBe(true);
    });

    it('returns false for unsupported formats', () => {
      expect(extractor.supports('application/pdf', 'resume.pdf')).toBe(false);
      expect(extractor.supports('text/plain', 'notes.txt')).toBe(false);
    });
  });

  describe('extract', () => {
    it('throws BadRequestException when buffer is empty', async () => {
      await expect(extractor.extract(Buffer.alloc(0))).rejects.toThrow(
        BadRequestException,
      );
      await expect(extractor.extract(Buffer.alloc(0))).rejects.toThrow(
        'DOCX file buffer is empty.',
      );
    });

    it('throws BadRequestException when buffer does not start with standard PK archive header', async () => {
      const invalidBuffer = Buffer.from('NOT A ZIP OR DOCX ARCHIVE');
      await expect(extractor.extract(invalidBuffer)).rejects.toThrow(
        BadRequestException,
      );
      await expect(extractor.extract(invalidBuffer)).rejects.toThrow(
        /does not contain standard OpenXML PK archive signature/i,
      );
    });

    it('successfully extracts and normalizes text from a valid DOCX buffer', async () => {
      // Valid PK header (0x50, 0x4B, 0x03, 0x04)
      const validDocxBuffer = Buffer.concat([
        Buffer.from([0x50, 0x4b, 0x03, 0x04]),
        Buffer.from('docx archive content'),
      ]);

      vi.mocked(mammoth.extractRawText).mockResolvedValue({
        value: '   Full Stack Developer   \n\n\n5 years React and Node.js experience  ',
        messages: [],
      });

      const result = await extractor.extract(validDocxBuffer);

      expect(result).toBe(
        'Full Stack Developer\n\n5 years React and Node.js experience',
      );
      expect(mammoth.extractRawText).toHaveBeenCalledWith({
        buffer: validDocxBuffer,
      });
    });

    it('throws BadRequestException when mammoth extraction fails', async () => {
      const validDocxBuffer = Buffer.concat([
        Buffer.from([0x50, 0x4b, 0x03, 0x04]),
        Buffer.from('corrupted zip entries'),
      ]);

      vi.mocked(mammoth.extractRawText).mockRejectedValue(
        new Error('Could not find word/document.xml in archive'),
      );

      await expect(extractor.extract(validDocxBuffer)).rejects.toThrow(
        BadRequestException,
      );
      await expect(extractor.extract(validDocxBuffer)).rejects.toThrow(
        /Failed to parse DOCX document: Could not find word\/document\.xml/i,
      );
    });
  });
});
