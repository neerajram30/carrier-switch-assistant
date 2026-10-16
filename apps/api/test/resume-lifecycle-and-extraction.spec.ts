import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CurrentUser } from '../src/common/auth/current-user.interface.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { validateExtractedCareerData } from '../src/resume/dto/extracted-career-data.dto.js';
import { DeterministicCareerDataExtractor } from '../src/resume/extractors/deterministic-career-data.extractor.js';
import { DocxExtractor } from '../src/resume/extractors/docx.extractor.js';
import { PdfExtractor } from '../src/resume/extractors/pdf.extractor.js';
import { ResumeProcessingService } from '../src/resume/resume-processing.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.resolve(__dirname, 'fixtures/resumes');

describe('Resume Document Extraction & Processing Lifecycle (Backend)', () => {
  let realPdfExtractor: PdfExtractor;
  let realDocxExtractor: DocxExtractor;
  let realDeterministicExtractor: DeterministicCareerDataExtractor;
  let service: ResumeProcessingService;

  const validPdfBuffer = fs.readFileSync(path.join(fixturesDir, 'valid-resume.pdf'));
  const validDocxBuffer = fs.readFileSync(path.join(fixturesDir, 'valid-resume.docx'));
  const emptyPdfBuffer = fs.readFileSync(path.join(fixturesDir, 'empty-scanned.pdf'));
  const corruptPdfBuffer = fs.readFileSync(path.join(fixturesDir, 'corrupted.pdf'));
  const corruptDocxBuffer = fs.readFileSync(path.join(fixturesDir, 'corrupted.docx'));
  const unsupportedPngBuffer = fs.readFileSync(path.join(fixturesDir, 'unsupported.png'));

  const userA: CurrentUser = { id: 'user-aaa-111' };
  const userB: CurrentUser = { id: 'user-bbb-222' };

  let mockResumeDb: Map<string, any>;
  let mockStorageDb: Map<string, Buffer>;

  beforeEach(() => {
    vi.clearAllMocks();

    realPdfExtractor = new PdfExtractor();
    realDocxExtractor = new DocxExtractor();
    realDeterministicExtractor = new DeterministicCareerDataExtractor();

    mockResumeDb = new Map();
    mockStorageDb = new Map();

    const mockPrisma = {
      resume: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          return mockResumeDb.get(where.id) || null;
        }),
        update: vi.fn(
          async ({
            where,
            data,
          }: {
            where: { id: string };
            data: Record<string, any>;
          }) => {
            const existing = mockResumeDb.get(where.id);
            if (!existing) throw new Error('Record not found');
            const updated = { ...existing, ...data };
            mockResumeDb.set(where.id, updated);
            return updated;
          },
        ),
        updateMany: vi.fn(
          async ({
            where,
            data,
          }: {
            where: { id: string; userId: string; status: { in: string[] } };
            data: Record<string, any>;
          }) => {
            const existing = mockResumeDb.get(where.id);
            if (
              existing &&
              existing.userId === where.userId &&
              where.status.in.includes(existing.status)
            ) {
              const updated = { ...existing, ...data };
              mockResumeDb.set(where.id, updated);
              return { count: 1 };
            }
            return { count: 0 };
          },
        ),
      },
      careerProfile: {
        create: vi.fn(),
        update: vi.fn(),
      },
    };

    const mockStorage = {
      download: vi.fn(async (key: string) => mockStorageDb.get(key) || null),
      head: vi.fn(),
      exists: vi.fn(),
      upload: vi.fn(),
      delete: vi.fn(),
      generateUploadToken: vi.fn(),
    };

    service = new ResumeProcessingService(
      mockPrisma as unknown as PrismaService,
      mockStorage as any,
      realDeterministicExtractor,
      realPdfExtractor,
      realDocxExtractor,
    );
  });

  describe('1. Valid Document Parsing (Unmocked Parsers)', () => {
    it('extracts readable text and career data from valid PDF fixture', async () => {
      // 1. Direct extractor check with real pdf-parse library
      const rawText = await realPdfExtractor.extract(validPdfBuffer);
      expect(rawText).toContain('Jane Doe');
      expect(rawText).toContain('Senior Full Stack Engineer');
      expect(rawText).toContain('React');
      expect(rawText).toContain('TypeScript');

      // 2. Structured extraction from extracted text
      const structured = await realDeterministicExtractor.extract(rawText);
      expect(structured.name).toBe('Jane Doe');
      expect(structured.currentRole).toBe('Full Stack Engineer');
      expect(structured.yearsOfExperience).toBe(7);
      expect(structured.skills).toContain('React');
      expect(structured.skills).toContain('TypeScript');
      expect(structured.skills).toContain('PostgreSQL');
    });

    it('extracts readable text and career data from valid DOCX fixture', async () => {
      // 1. Direct extractor check with real mammoth library
      const rawText = await realDocxExtractor.extract(validDocxBuffer);
      expect(rawText).toContain('Alex Morgan');
      expect(rawText).toContain('Senior Backend Engineer');
      expect(rawText).toContain('Go');
      expect(rawText).toContain('Docker');

      // 2. Structured extraction from extracted text
      const structured = await realDeterministicExtractor.extract(rawText);
      expect(structured.name).toBe('Alex Morgan');
      expect(structured.currentRole).toBe('Backend Engineer');
      expect(structured.yearsOfExperience).toBe(5);
      expect(structured.skills).toContain('Go');
      expect(structured.skills).toContain('Python');
      expect(structured.skills).toContain('Docker');
    });
  });

  describe('2. Corrupted and Unsupported Documents', () => {
    it('handles corrupted PDF by throwing BadRequestException and recording FAILED', async () => {
      const resumeId = 'res-corrupt-pdf';
      const storageKey = `users/${userA.id}/resumes/${resumeId}/corrupt.pdf`;

      mockResumeDb.set(resumeId, {
        id: resumeId,
        userId: userA.id,
        originalFileName: 'corrupted.pdf',
        contentType: 'application/pdf',
        status: 'UPLOADED',
        storageKey,
      });
      mockStorageDb.set(storageKey, corruptPdfBuffer);

      await expect(service.processResume(userA, resumeId)).rejects.toThrow(
        BadRequestException,
      );

      const saved = mockResumeDb.get(resumeId);
      expect(saved.status).toBe('FAILED');
      expect(saved.processingError).toMatch(/Failed to parse PDF document/i);
    });

    it('handles corrupted DOCX by throwing BadRequestException and recording FAILED', async () => {
      const resumeId = 'res-corrupt-docx';
      const storageKey = `users/${userA.id}/resumes/${resumeId}/corrupt.docx`;

      mockResumeDb.set(resumeId, {
        id: resumeId,
        userId: userA.id,
        originalFileName: 'corrupted.docx',
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        status: 'UPLOADED',
        storageKey,
      });
      mockStorageDb.set(storageKey, corruptDocxBuffer);

      await expect(service.processResume(userA, resumeId)).rejects.toThrow(
        BadRequestException,
      );

      const saved = mockResumeDb.get(resumeId);
      expect(saved.status).toBe('FAILED');
      expect(saved.processingError).toMatch(/Failed to parse DOCX document/i);
    });

    it('rejects unsupported files with clear error and records FAILED', async () => {
      const resumeId = 'res-unsupported';
      const storageKey = `users/${userA.id}/resumes/${resumeId}/photo.png`;

      mockResumeDb.set(resumeId, {
        id: resumeId,
        userId: userA.id,
        originalFileName: 'photo.png',
        contentType: 'image/png',
        status: 'UPLOADED',
        storageKey,
      });
      mockStorageDb.set(storageKey, unsupportedPngBuffer);

      await expect(service.processResume(userA, resumeId)).rejects.toThrow(
        /Unsupported document format/i,
      );

      const saved = mockResumeDb.get(resumeId);
      expect(saved.status).toBe('FAILED');
      expect(saved.processingError).toContain('Unsupported document format');
    });
  });

  describe('3. Empty and Scanned Documents', () => {
    it('detects documents with little/no text and throws BadRequestException (< 50 chars)', async () => {
      const resumeId = 'res-empty-pdf';
      const storageKey = `users/${userA.id}/resumes/${resumeId}/empty.pdf`;

      mockResumeDb.set(resumeId, {
        id: resumeId,
        userId: userA.id,
        originalFileName: 'empty-scanned.pdf',
        contentType: 'application/pdf',
        status: 'UPLOADED',
        storageKey,
      });
      mockStorageDb.set(storageKey, emptyPdfBuffer);

      await expect(service.processResume(userA, resumeId)).rejects.toThrow(
        /contains little or no extractable text/i,
      );

      const saved = mockResumeDb.get(resumeId);
      expect(saved.status).toBe('FAILED');
      expect(saved.processingError).toContain('little or no extractable text');
    });
  });

  describe('4. Authorization & Security Boundaries', () => {
    it('prevents user B from processing user A resume with ForbiddenException', async () => {
      const resumeId = 'res-auth-test';
      mockResumeDb.set(resumeId, {
        id: resumeId,
        userId: userA.id,
        originalFileName: 'resume.pdf',
        contentType: 'application/pdf',
        status: 'UPLOADED',
        storageKey: 'key',
      });

      await expect(service.processResume(userB, resumeId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('prevents user B from retrieving user A resume with ForbiddenException', async () => {
      const resumeId = 'res-auth-test';
      mockResumeDb.set(resumeId, {
        id: resumeId,
        userId: userA.id,
        originalFileName: 'resume.pdf',
        status: 'PROCESSED',
        storageKey: 'key',
      });

      await expect(service.getResume(userB, resumeId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('5. Upload Lifecycle Guard & Concurrency', () => {
    it('blocks processing when resume is still in UPLOADING status', async () => {
      const resumeId = 'res-still-uploading';
      mockResumeDb.set(resumeId, {
        id: resumeId,
        userId: userA.id,
        originalFileName: 'resume.pdf',
        contentType: 'application/pdf',
        status: 'UPLOADING',
        storageKey: 'key',
      });

      await expect(service.processResume(userA, resumeId)).rejects.toThrow(
        /file upload has not completed yet/i,
      );
    });

    it('prevents duplicate processing on already PROCESSING resumes with ConflictException', async () => {
      const resumeId = 'res-concurrency';
      mockResumeDb.set(resumeId, {
        id: resumeId,
        userId: userA.id,
        originalFileName: 'resume.pdf',
        contentType: 'application/pdf',
        status: 'PROCESSING',
        storageKey: 'key',
      });

      await expect(service.processResume(userA, resumeId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('returns existing result idempotently when resume is already PROCESSED', async () => {
      const resumeId = 'res-already-done';
      const existingData = {
        name: 'Jane Doe',
        currentRole: 'Senior Engineer',
        yearsOfExperience: 5,
        skills: ['TypeScript'],
        workExperience: [],
        education: [],
        projects: [],
      };

      mockResumeDb.set(resumeId, {
        id: resumeId,
        userId: userA.id,
        originalFileName: 'resume.pdf',
        contentType: 'application/pdf',
        status: 'PROCESSED',
        extractedText: 'Pre-existing extracted text content here',
        structuredData: existingData,
        processedAt: new Date('2026-10-10'),
      });

      const result = await service.processResume(userA, resumeId);

      expect(result.status).toBe('PROCESSED');
      expect(result.structuredData).toEqual(existingData);
      expect(result.extractedText).toBe('Pre-existing extracted text content here');
    });
  });

  describe('6. Database Persistence & Retry Behavior', () => {
    it('persists structuredData and allows retry from FAILED status', async () => {
      const resumeId = 'res-retry-test';
      const storageKey = `users/${userA.id}/resumes/${resumeId}/resume.pdf`;

      // Set initial failed state
      mockResumeDb.set(resumeId, {
        id: resumeId,
        userId: userA.id,
        originalFileName: 'valid-resume.pdf',
        contentType: 'application/pdf',
        status: 'FAILED',
        processingError: 'Network glitch on previous attempt',
        storageKey,
      });
      mockStorageDb.set(storageKey, validPdfBuffer);

      // Retry processing
      const result = await service.processResume(userA, resumeId);

      expect(result.status).toBe('PROCESSED');
      expect(result.processingError).toBeNull();
      expect(result.structuredData?.name).toBe('Jane Doe');
      expect(result.structuredData?.skills).toContain('React');
      expect(result.structuredData?.skills).toContain('TypeScript');

      // Verify PostgreSQL state
      const dbRecord = mockResumeDb.get(resumeId);
      expect(dbRecord.status).toBe('PROCESSED');
      expect(dbRecord.processingError).toBeNull();
      expect(dbRecord.structuredData).toBeDefined();
      expect(dbRecord.structuredData.currentRole).toBe('Full Stack Engineer');
    });
  });

  describe('7. Structured Schema Robustness (Malformed & Incomplete Inputs)', () => {
    it('gracefully handles missing, corrupted, or non-object payloads', () => {
      const emptyRaw = validateExtractedCareerData(null);
      expect(emptyRaw.name).toBeNull();
      expect(emptyRaw.currentRole).toBeNull();
      expect(emptyRaw.yearsOfExperience).toBeNull();
      expect(emptyRaw.skills).toEqual([]);
      expect(emptyRaw.warnings).toBeDefined();

      const malformedJson = validateExtractedCareerData({
        name: 12345, // invalid type
        currentRole: '',
        yearsOfExperience: 'not-a-number',
        skills: ['React', 42, null, 'React'], // duplicates and non-strings
        education: [{ graduationYear: 'nineteen ninety' }],
      });

      expect(malformedJson.name).toBeNull();
      expect(malformedJson.currentRole).toBeNull();
      expect(malformedJson.yearsOfExperience).toBeNull();
      expect(malformedJson.skills).toEqual(['React']); // cleaned & deduplicated
      expect(malformedJson.education[0].graduationYear).toBeNull();
    });
  });
});
