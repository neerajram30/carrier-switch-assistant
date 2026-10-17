import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
export const PROCESSING_LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

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

    // 3. Idempotent return for already processed resumes
    if (resume.status === 'PROCESSED') {
      this.logger.debug(
        `Resume "${resumeId}" is already PROCESSED. Returning existing result.`,
      );
      return this.formatResponse(resume);
    }

    // 4. Handle PROCESSING state with crash / timeout recovery
    if (resume.status === 'PROCESSING') {
      const timeSinceUpdate = Date.now() - new Date(resume.updatedAt).getTime();
      if (timeSinceUpdate < PROCESSING_LOCK_TIMEOUT_MS) {
        throw new ConflictException(
          'Resume is currently being processed. Please wait for the current job to finish.',
        );
      }
      this.logger.warn(
        `Resume "${resumeId}" was left in PROCESSING for ${Math.round(timeSinceUpdate / 1000)}s (likely crashed or interrupted). Resetting lock for recovery retry.`,
      );
    }

    // 5. Concurrency lock: atomically transition state to PROCESSING
    // Allows recovery if record was stuck in PROCESSING beyond timeout
    const staleThreshold = new Date(Date.now() - PROCESSING_LOCK_TIMEOUT_MS);
    const transition = await this.prisma.resume.updateMany({
      where: {
        id: resumeId,
        userId: user.id,
        OR: [
          { status: { in: ['UPLOADED', 'FAILED'] } },
          { status: 'PROCESSING', updatedAt: { lte: staleThreshold } },
        ],
      },
      data: {
        status: 'PROCESSING',
        processingError: null,
      },
    });

    if (transition.count === 0) {
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

    // 6. Common failure boundary: wraps all processing operations
    try {
      // 6A. Download file from private object storage via abstraction
      let buffer: Buffer | null;
      try {
        buffer = await this.storage.download(resume.storageKey);
      } catch (storageErr: unknown) {
        throw new BadRequestException(
          `Failed to retrieve resume from storage: ${(storageErr as Error)?.message || 'Storage error'}`,
        );
      }

      if (!buffer || buffer.length === 0) {
        throw new NotFoundException(
          'Resume file was not found in storage or is zero bytes.',
        );
      }

      // 6B. Select appropriate text extractor
      const extractor = this.extractors.find((e) =>
        e.supports(resume.contentType, resume.originalFileName),
      );

      if (!extractor) {
        throw new BadRequestException(
          `Unsupported document format for "${resume.originalFileName}" (${resume.contentType}).`,
        );
      }

      // 6C. Perform document text extraction and quality validation
      const rawText = await extractor.extract(buffer);
      const extractedText = normalizeExtractedText(rawText);

      if (extractedText.length < MIN_EXTRACTED_TEXT_LENGTH) {
        throw new BadRequestException(
          'The uploaded document contains little or no extractable text. Scanned images and empty documents are not supported. Please upload a text-based PDF or DOCX.',
        );
      }

      // 6D. Extract structured career data via provider boundary
      let structuredData: ExtractedCareerData;
      try {
        structuredData = await this.careerDataExtractor.extract(extractedText);
      } catch (extractErr: unknown) {
        this.logger.warn(
          `Unexpected error during structured extraction: ${(extractErr as Error)?.message}. Using empty fallback.`,
        );
        structuredData = validateExtractedCareerData(null);
      }

      // 6E. Persist processing results to PostgreSQL
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
    } catch (err: unknown) {
      // Ensure we do not overwrite a successful result if processing already completed
      const latest = await this.prisma.resume
        .findUnique({ where: { id: resumeId } })
        .catch(() => null);

      if (latest?.status === 'PROCESSED') {
        this.logger.warn(
          `Resume "${resumeId}" was already marked PROCESSED; suppressing failure overwrite.`,
        );
        return this.formatResponse(latest);
      }

      // Separate internal diagnostic details from user-facing actionable error
      const { userFacingMessage, internalDiagnostic } =
        this.sanitizeErrorMessage(err);

      await this.recordFailure(resumeId, userFacingMessage, internalDiagnostic);

      if (err instanceof NotFoundException) {
        throw new NotFoundException(userFacingMessage);
      }
      throw new BadRequestException(userFacingMessage);
    }
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

  private sanitizeErrorMessage(err: unknown): {
    userFacingMessage: string;
    internalDiagnostic: string;
  } {
    const rawMessage = (err as Error)?.message || String(err);

    // 1. Scanned / Empty documents
    if (
      rawMessage.includes('little or no extractable text') ||
      rawMessage.includes('Scanned images')
    ) {
      return {
        userFacingMessage:
          'The uploaded document contains little or no extractable text. Scanned images and empty documents are not supported. Please upload a text-based PDF or DOCX.',
        internalDiagnostic: rawMessage,
      };
    }

    // 2. Unsupported format
    if (rawMessage.includes('Unsupported document format')) {
      return {
        userFacingMessage:
          'Unsupported document format. Please upload a valid PDF or DOCX file.',
        internalDiagnostic: rawMessage,
      };
    }

    // 3. PDF parsing errors
    if (
      rawMessage.toLowerCase().includes('pdf') &&
      (rawMessage.toLowerCase().includes('parse') ||
        rawMessage.toLowerCase().includes('invalid') ||
        rawMessage.toLowerCase().includes('structure') ||
        rawMessage.toLowerCase().includes('corrupted'))
    ) {
      return {
        userFacingMessage:
          "Failed to parse PDF document: We couldn't extract readable text from this file. The document may be corrupted or password-protected. Please upload another PDF or DOCX file.",
        internalDiagnostic: rawMessage,
      };
    }

    // 4. DOCX parsing errors
    if (
      rawMessage.toLowerCase().includes('docx') &&
      (rawMessage.toLowerCase().includes('parse') ||
        rawMessage.toLowerCase().includes('document part') ||
        rawMessage.toLowerCase().includes('corrupted') ||
        rawMessage.toLowerCase().includes('zip'))
    ) {
      return {
        userFacingMessage:
          "Failed to parse DOCX document: We couldn't extract readable text from this file. The document may be corrupted or password-protected. Please upload another PDF or DOCX file.",
        internalDiagnostic: rawMessage,
      };
    }

    // 5. Storage retrieval errors
    if (rawMessage.toLowerCase().includes('zero bytes')) {
      return {
        userFacingMessage:
          'Resume file was not found in storage or is zero bytes. Please re-upload your resume.',
        internalDiagnostic: rawMessage,
      };
    }

    if (
      rawMessage.toLowerCase().includes('storage') ||
      rawMessage.toLowerCase().includes('blob') ||
      rawMessage.toLowerCase().includes('not found')
    ) {
      return {
        userFacingMessage:
          "We couldn't retrieve your resume file from secure storage. Please try uploading your resume again.",
        internalDiagnostic: rawMessage,
      };
    }

    // 6. Generic safe fallback for internal/unexpected errors
    return {
      userFacingMessage:
        'An unexpected error occurred while processing your resume. Please try again or enter your details manually.',
      internalDiagnostic: rawMessage,
    };
  }

  private async recordFailure(
    resumeId: string,
    userFacingMessage: string,
    internalDiagnostic: string,
  ): Promise<void> {
    try {
      await this.prisma.resume.update({
        where: { id: resumeId },
        data: {
          status: 'FAILED',
          processingError: userFacingMessage,
        },
      });
      // Log diagnostic server-side without leaking resume contents or credentials
      this.logger.warn(
        `Resume "${resumeId}" marked as FAILED: ${internalDiagnostic}`,
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
