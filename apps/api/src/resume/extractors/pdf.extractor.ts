import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';
import type { TextExtractor } from './text-extractor.interface.js';
import { normalizeExtractedText } from './text-normalizer.js';

@Injectable()
export class PdfExtractor implements TextExtractor {
  private readonly logger = new Logger(PdfExtractor.name);

  supports(contentType: string, fileName?: string): boolean {
    const isPdfContentType =
      contentType.toLowerCase().trim() === 'application/pdf';
    const isPdfExtension = fileName
      ? fileName.toLowerCase().trim().endsWith('.pdf')
      : false;
    return isPdfContentType || isPdfExtension;
  }

  async extract(buffer: Buffer): Promise<string> {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('PDF file buffer is empty.');
    }

    // PDF files start with %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
    const headerPrefix = buffer.subarray(0, 1024).toString('ascii');
    if (!headerPrefix.includes('%PDF-')) {
      throw new BadRequestException(
        'Corrupted or invalid PDF: file header does not contain standard "%PDF-" signature.',
      );
    }

    let parser: PDFParse | null = null;
    try {
      parser = new PDFParse({ data: new Uint8Array(buffer) });
      const textResult = await parser.getText();
      const rawText = textResult?.text ?? '';
      return normalizeExtractedText(rawText);
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || String(err);
      const errorName = (err as Error)?.name || '';

      if (
        errorName === 'PasswordException' ||
        errorMsg.toLowerCase().includes('password') ||
        errorMsg.toLowerCase().includes('encrypted')
      ) {
        throw new BadRequestException(
          'Document is password-protected or encrypted. Please upload an unprotected PDF.',
        );
      }

      this.logger.warn(`PDF extraction failed: ${errorMsg}`);
      throw new BadRequestException(
        `Failed to parse PDF document: ${errorMsg}`,
      );
    } finally {
      if (parser) {
        await parser.destroy().catch(() => {});
      }
    }
  }
}
