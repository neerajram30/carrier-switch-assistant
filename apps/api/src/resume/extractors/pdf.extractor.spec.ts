import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PDFParse } from 'pdf-parse';
import { PdfExtractor } from './pdf.extractor.js';

vi.mock('pdf-parse', () => {
  return {
    PDFParse: vi.fn(),
  };
});

describe('PdfExtractor', () => {
  let extractor: PdfExtractor;

  beforeEach(() => {
    vi.clearAllMocks();
    extractor = new PdfExtractor();
  });

  describe('supports', () => {
    it('returns true for application/pdf content type', () => {
      expect(extractor.supports('application/pdf')).toBe(true);
      expect(extractor.supports('APPLICATION/PDF')).toBe(true);
    });

    it('returns true for .pdf extension in fileName', () => {
      expect(extractor.supports('application/octet-stream', 'resume.pdf')).toBe(
        true,
      );
      expect(extractor.supports('', 'MY-RESUME.PDF')).toBe(true);
    });

    it('returns false for unsupported formats', () => {
      expect(
        extractor.supports(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'resume.docx',
        ),
      ).toBe(false);
      expect(extractor.supports('text/plain', 'notes.txt')).toBe(false);
    });
  });

  describe('extract', () => {
    it('throws BadRequestException when buffer is empty', async () => {
      await expect(extractor.extract(Buffer.alloc(0))).rejects.toThrow(
        BadRequestException,
      );
      await expect(extractor.extract(Buffer.alloc(0))).rejects.toThrow(
        'PDF file buffer is empty.',
      );
    });

    it('throws BadRequestException when buffer does not start with %PDF- header', async () => {
      const invalidBuffer = Buffer.from('NOT A PDF FILE');
      await expect(extractor.extract(invalidBuffer)).rejects.toThrow(
        BadRequestException,
      );
      await expect(extractor.extract(invalidBuffer)).rejects.toThrow(
        /does not contain standard "%PDF-" signature/i,
      );
    });

    it('successfully extracts and normalizes text from a valid PDF buffer', async () => {
      const validPdfBuffer = Buffer.from(
        '%PDF-1.4\n1 0 obj\n<<\n>>\nstream\nSenior Software Engineer\nendstream',
      );

      const mockGetText = vi.fn().mockResolvedValue({
        text: '   Senior   Software   Engineer   \n\n\n10+ years experience  ',
      });
      const mockDestroy = vi.fn().mockResolvedValue(undefined);

      vi.mocked(PDFParse).mockImplementation(function (this: any) {
        this.getText = mockGetText;
        this.destroy = mockDestroy;
      } as any);

      const result = await extractor.extract(validPdfBuffer);

      expect(result).toBe('Senior Software Engineer\n\n10+ years experience');
      expect(PDFParse).toHaveBeenCalledWith({
        data: new Uint8Array(validPdfBuffer),
      });
      expect(mockDestroy).toHaveBeenCalled();
    });

    it('throws friendly BadRequestException when PDF is password protected', async () => {
      const validPdfBuffer = Buffer.from('%PDF-1.5 encrypted content');

      const passwordErr = new Error('Password required to open this document');
      passwordErr.name = 'PasswordException';

      vi.mocked(PDFParse).mockImplementation(function (this: any) {
        this.getText = vi.fn().mockRejectedValue(passwordErr);
        this.destroy = vi.fn().mockResolvedValue(undefined);
      } as any);

      await expect(extractor.extract(validPdfBuffer)).rejects.toThrow(
        BadRequestException,
      );
      await expect(extractor.extract(validPdfBuffer)).rejects.toThrow(
        'Document is password-protected or encrypted. Please upload an unprotected PDF.',
      );
    });

    it('throws BadRequestException when PDF parsing fails with corrupted document', async () => {
      const validPdfBuffer = Buffer.from('%PDF-1.4 corrupted xref table');

      vi.mocked(PDFParse).mockImplementation(function (this: any) {
        this.getText = vi
          .fn()
          .mockRejectedValue(new Error('Invalid XRef stream'));
        this.destroy = vi.fn().mockResolvedValue(undefined);
      } as any);

      await expect(extractor.extract(validPdfBuffer)).rejects.toThrow(
        BadRequestException,
      );
      await expect(extractor.extract(validPdfBuffer)).rejects.toThrow(
        /Failed to parse PDF document: Invalid XRef stream/i,
      );
    });
  });
});
