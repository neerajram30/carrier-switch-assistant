import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { CurrentUser } from '../common/auth/current-user.interface.js';
import {
  OBJECT_STORAGE_PORT,
  type ObjectStoragePort,
} from '../infrastructure/storage/object-storage.port.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CAREER_DATA_EXTRACTOR,
  type CareerDataExtractor,
} from './career-data-extractor.interface.js';
import {
  type ExtractedCareerData,
  validateExtractedCareerData,
} from './dto/extracted-career-data.dto.js';
import type { ResumeProcessResponseDto } from './dto/resume-process-response.dto.js';
import { DocxExtractor } from './extractors/docx.extractor.js';
import { PdfExtractor } from './extractors/pdf.extractor.js';
import type { TextExtractor } from './extractors/text-extractor.interface.js';
import { normalizeExtractedText } from './extractors/text-normalizer.js';

export const MIN_EXTRACTED_TEXT_LENGTH = 50;

@Injectable()
export class ResumeProcessingService {
  private readonly logger = new Logger(ResumeProcessingService.name);
  private readonly extractors: TextExtractor[];

  constructor(
    private readonly prisma: PrismaService,
    @Inject(OBJECT_STORAGE_PORT)
    private readonly storage: ObjectStoragePort,
    @Inject(CAREER_DATA_EXTRACTOR)
    private readonly careerDataExtractor: CareerDataExtractor,
    private readonly pdfExtractor: PdfExtractor,
    private readonly docxExtractor: DocxExtractor,
  ) {
    this.extractors = [this.pdfExtractor, this.docxExtractor];
  }

  async processResume(
    user: CurrentUser,
    resumeId: string,
  ): Promise<ResumeProcessResponseDto> {
    const startTime = Date.now();

    // 1. Verify existence and ownership
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      throw new NotFoundException(`Resume with ID "${resumeId}" not found`);
    }

    if (resume.userId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to access this resume',
      );
    }

    // 2. Verify upload completion
    if (resume.status === 'UPLOADING') {
      throw new BadRequestException(
        'Cannot process resume: file upload has not completed yet.',
      );
    }

    if (resume.status === 'PROCESSING') {
      throw new ConflictException(
        'Resume is currently being processed. Please wait for the current job to finish.',
      );
    }

    // 3. Idempotent return for already processed resumes
    if (resume.status === 'PROCESSED') {
      this.logger.debug(
        `Resume "${resumeId}" is already PROCESSED. Returning existing result.`,
      );
      return this.formatResponse(resume);
    }

    // 4. Concurrency lock: atomically transition state from UPLOADED or FAILED to PROCESSING
    const transition = await this.prisma.resume.updateMany({
      where: {
        id: resumeId,
        userId: user.id,
        status: { in: ['UPLOADED', 'FAILED'] },
      },
      data: {
        status: 'PROCESSING',
        processingError: null,
      },
    });

    if (transition.count === 0) {
      // Re-fetch current record to provide accurate error response
      const current = await this.prisma.resume.findUnique({
        where: { id: resumeId },
      });
      if (current?.status === 'PROCESSING') {
        throw new ConflictException(
          'Resume is currently being processed. Please wait for the current job to finish.',
        );
      }
      if (current?.status === 'PROCESSED') {
        return this.formatResponse(current);
      }
      throw new BadRequestException(
        `Cannot process resume in status "${current?.status}".`,
      );
    }

    this.logger.debug(
      `Starting processing pipeline for resume "${resumeId}" (user: "${user.id}")`,
    );

    // 5. Download file from private object storage via ObjectStoragePort abstraction
    let buffer: Buffer | null;
    try {
      buffer = await this.storage.download(resume.storageKey);
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Storage error';
      await this.recordFailure(resumeId, `Failed to retrieve resume from storage: ${msg}`);
      throw new BadRequestException(
        `Could not retrieve resume from storage: ${msg}`,
      );
    }

    if (!buffer || buffer.length === 0) {
      await this.recordFailure(
        resumeId,
        'Resume file was not found in storage or is zero bytes.',
      );
      throw new NotFoundException(
        'Resume file was not found in storage or is empty.',
      );
    }

    // 6. Select appropriate extractor
    const extractor = this.extractors.find((e) =>
      e.supports(resume.contentType, resume.originalFileName),
    );

    if (!extractor) {
      const err = `Unsupported document format for "${resume.originalFileName}" (${resume.contentType}).`;
      await this.recordFailure(resumeId, err);
      throw new BadRequestException(err);
    }

    // 7. Perform extraction and quality validation
    let extractedText: string;
    try {
      const rawText = await extractor.extract(buffer);
      extractedText = normalizeExtractedText(rawText);

      if (extractedText.length < MIN_EXTRACTED_TEXT_LENGTH) {
        throw new BadRequestException(
          'The uploaded document contains little or no extractable text. Scanned images and empty documents are not supported. Please upload a text-based PDF or DOCX.',
        );
      }
    } catch (err: unknown) {
      const errorMessage =
        (err as Error)?.message || 'Text extraction failed unexpectedly.';
      await this.recordFailure(resumeId, errorMessage);

      if (err instanceof HttpException) {
        throw err;
      }
      throw new BadRequestException(errorMessage);
    }

    // 8. Extract structured career data via provider boundary
    let structuredData: ExtractedCareerData;
    try {
      structuredData = await this.careerDataExtractor.extract(extractedText);
    } catch (extractErr: unknown) {
      this.logger.warn(
        `Unexpected error during structured extraction: ${(extractErr as Error)?.message}. Using empty fallback.`,
      );
      structuredData = validateExtractedCareerData(null);
    }

    // 9. Persist processing results
    // ARCHITECTURAL GUARANTEE (Task 2.3):
    // Resume processing only updates the Resume record (unconfirmed suggestions).
    // It NEVER creates, mutates, or silently overwrites the user's confirmed CareerProfile!
    const processedAt = new Date();
    const updated = await this.prisma.resume.update({
      where: { id: resumeId },
      data: {
        status: 'PROCESSED',
        extractedText,
        structuredData: structuredData as any,
        processingError: null,
        processedAt,
      },
    });

    const durationMs = Date.now() - startTime;
    // Privacy guard: Log safe metrics only (no resume text, no PII)
    this.logger.log(
      `Successfully processed resume "${resumeId}": ${extractedText.length} characters extracted, ${structuredData.skills.length} skills identified in ${durationMs}ms`,
    );

    return this.formatResponse(updated);
  }

  async getResume(
    user: CurrentUser,
    resumeId: string,
  ): Promise<ResumeProcessResponseDto> {
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      throw new NotFoundException(`Resume with ID "${resumeId}" not found`);
    }

    if (resume.userId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to access this resume',
      );
    }

    return this.formatResponse(resume);
  }

  private async recordFailure(
    resumeId: string,
    errorMessage: string,
  ): Promise<void> {
    try {
      await this.prisma.resume.update({
        where: { id: resumeId },
        data: {
          status: 'FAILED',
          processingError: errorMessage,
        },
      });
      this.logger.warn(
        `Resume "${resumeId}" marked as FAILED: ${errorMessage}`,
      );
    } catch (dbErr: unknown) {
      this.logger.error(
        `Failed to record failure state for resume "${resumeId}": ${(dbErr as Error)?.message}`,
      );
    }
  }

  private formatResponse(resume: {
    id: string;
    userId: string;
    originalFileName: string;
    status: string;
    extractedText: string | null;
    structuredData?: unknown;
    processedAt: Date | null;
    processingError?: string | null;
  }): ResumeProcessResponseDto {
    let validatedStructured: ExtractedCareerData | null = null;
    if (resume.structuredData) {
      validatedStructured = validateExtractedCareerData(resume.structuredData);
    }

    return {
      id: resume.id,
      userId: resume.userId,
      originalFileName: resume.originalFileName,
      status: resume.status,
      extractedText: resume.extractedText,
      characterCount: resume.extractedText ? resume.extractedText.length : 0,
      structuredData: validatedStructured,
      processedAt: resume.processedAt,
      processingError: resume.processingError ?? null,
    };
  }
}
