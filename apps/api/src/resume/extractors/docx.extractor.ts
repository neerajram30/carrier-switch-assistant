import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import mammoth from 'mammoth';
import type { TextExtractor } from './text-extractor.interface.js';
import { normalizeExtractedText } from './text-normalizer.js';

export const DOCX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

@Injectable()
export class DocxExtractor implements TextExtractor {
  private readonly logger = new Logger(DocxExtractor.name);

  supports(contentType: string, fileName?: string): boolean {
    const isDocxContentType =
      contentType.toLowerCase().trim() === DOCX_MIME_TYPE;
    const isDocxExtension = fileName
      ? fileName.toLowerCase().trim().endsWith('.docx')
      : false;
    return isDocxContentType || isDocxExtension;
  }

  async extract(buffer: Buffer): Promise<string> {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('DOCX file buffer is empty.');
    }

    // DOCX files are OpenXML ZIP archives, starting with PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
    if (
      buffer.length < 4 ||
      buffer[0] !== 0x50 ||
      buffer[1] !== 0x4b ||
      buffer[2] !== 0x03 ||
      buffer[3] !== 0x04
    ) {
      throw new BadRequestException(
        'Corrupted or invalid DOCX: file does not contain standard OpenXML PK archive signature.',
      );
    }

    try {
      const result = await mammoth.extractRawText({ buffer });
      const rawText = result?.value ?? '';
      return normalizeExtractedText(rawText);
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || String(err);
      this.logger.warn(`DOCX extraction failed: ${errorMsg}`);
      throw new BadRequestException(
        `Failed to parse DOCX document: ${errorMsg}`,
      );
    }
  }
}
