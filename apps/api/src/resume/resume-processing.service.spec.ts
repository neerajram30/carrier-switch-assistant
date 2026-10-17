import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CurrentUser } from '../common/auth/current-user.interface.js';
import { OBJECT_STORAGE_PORT } from '../infrastructure/storage/object-storage.port.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CAREER_DATA_EXTRACTOR } from './career-data-extractor.interface.js';
import type { ExtractedCareerData } from './dto/extracted-career-data.dto.js';
import { DocxExtractor } from './extractors/docx.extractor.js';
import { PdfExtractor } from './extractors/pdf.extractor.js';
import { ResumeProcessingService } from './resume-processing.service.js';

describe('ResumeProcessingService', () => {
  let service: ResumeProcessingService;

  const mockUser: CurrentUser = {
    id: 'user-uuid-123',
  };

  const otherUser: CurrentUser = {
    id: 'user-uuid-999',
  };

  const mockResume = {
    id: 'resume-uuid-1',
    userId: mockUser.id,
    originalFileName: 'resume.pdf',
    contentType: 'application/pdf',
    fileSize: 1024,
    storageKey: `users/${mockUser.id}/resumes/resume-uuid-1/original.pdf`,
    status: 'UPLOADED',
    extractedText: null,
    processingError: null,
    processedAt: null,
    createdAt: new Date('2026-10-10T00:00:00Z'),
    updatedAt: new Date(),
  };

  const sampleExtractedText =
    'Senior Frontend Engineer with 8 years of experience building web applications in React, TypeScript, and Next.js. Led teams of 6 developers.';

  const mockPrismaService = {
    resume: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    careerProfile: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  const mockStorage = {
    download: vi.fn(),
    head: vi.fn(),
    exists: vi.fn(),
    upload: vi.fn(),
    delete: vi.fn(),
    generateUploadToken: vi.fn(),
  };

  const mockPdfExtractor = {
    supports: vi.fn(),
    extract: vi.fn(),
  };

  const mockDocxExtractor = {
    supports: vi.fn(),
    extract: vi.fn(),
  };

  const sampleStructuredData: ExtractedCareerData = {
    name: 'Jane Doe',
    currentRole: 'Senior Frontend Engineer',
    yearsOfExperience: 8,
    skills: ['React', 'TypeScript', 'Next.js'],
    workExperience: [
      {
        company: 'TechCorp',
        role: 'Senior Frontend Engineer',
        description: 'Led frontend team',
        startDate: '2020-01',
        endDate: 'Present',
      },
    ],
    education: [
      {
        institution: 'University of Science',
        qualification: 'B.S. in Computer Science',
        graduationYear: 2016,
      },
    ],
    projects: [
      {
        name: 'OpenSource App',
        description: 'A Next.js dashboard',
        technologies: ['React', 'Next.js'],
      },
    ],
  };

  const mockCareerDataExtractor = {
    extract: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockCareerDataExtractor.extract.mockResolvedValue(sampleStructuredData);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResumeProcessingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: OBJECT_STORAGE_PORT,
          useValue: mockStorage,
        },
        {
          provide: CAREER_DATA_EXTRACTOR,
          useValue: mockCareerDataExtractor,
        },
        {
          provide: PdfExtractor,
          useValue: mockPdfExtractor,
        },
        {
          provide: DocxExtractor,
          useValue: mockDocxExtractor,
        },
      ],
    }).compile();

    service = module.get<ResumeProcessingService>(ResumeProcessingService);
  });

  describe('processResume', () => {
    it('throws NotFoundException when resume record does not exist', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(null);

      await expect(
        service.processResume(mockUser, 'missing-id'),
      ).rejects.toThrow(NotFoundException);
      expect(mockStorage.download).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when resume belongs to another user', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(mockResume);

      await expect(
        service.processResume(otherUser, mockResume.id),
      ).rejects.toThrow(ForbiddenException);
      expect(mockStorage.download).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when resume is still in UPLOADING state', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue({
        ...mockResume,
        status: 'UPLOADING',
      });

      await expect(
        service.processResume(mockUser, mockResume.id),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.processResume(mockUser, mockResume.id),
      ).rejects.toThrow(/file upload has not completed yet/i);
    });

    it('returns existing result idempotently when resume is already PROCESSED', async () => {
      const alreadyProcessed = {
        ...mockResume,
        status: 'PROCESSED',
        extractedText: sampleExtractedText,
        processedAt: new Date('2026-10-10T01:00:00Z'),
      };
      mockPrismaService.resume.findUnique.mockResolvedValue(alreadyProcessed);

      const result = await service.processResume(mockUser, mockResume.id);

      expect(result.status).toBe('PROCESSED');
      expect(result.extractedText).toBe(sampleExtractedText);
      expect(result.characterCount).toBe(sampleExtractedText.length);
      expect(mockStorage.download).not.toHaveBeenCalled();
    });

    it('throws ConflictException when resume is currently in PROCESSING state', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue({
        ...mockResume,
        status: 'PROCESSING',
      });

      await expect(
        service.processResume(mockUser, mockResume.id),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.processResume(mockUser, mockResume.id),
      ).rejects.toThrow(/currently being processed/i);
    });

    it('throws ConflictException when concurrent update changes status to PROCESSING', async () => {
      mockPrismaService.resume.findUnique
        .mockResolvedValueOnce(mockResume)
        .mockResolvedValueOnce({
          ...mockResume,
          status: 'PROCESSING',
        });
      mockPrismaService.resume.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.processResume(mockUser, mockResume.id),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.processResume(mockUser, mockResume.id),
      ).rejects.toThrow(/currently being processed/i);
    });

    it('marks resume as FAILED and throws NotFoundException when storage returns null', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(mockResume);
      mockPrismaService.resume.updateMany.mockResolvedValue({ count: 1 });
      mockStorage.download.mockResolvedValue(null);

      await expect(
        service.processResume(mockUser, mockResume.id),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.resume.update).toHaveBeenCalledWith({
        where: { id: mockResume.id },
        data: {
          status: 'FAILED',
          processingError: expect.stringContaining(
            'not found in storage or is zero bytes',
          ),
        },
      });
    });

    it('marks resume as FAILED and throws BadRequestException when no extractor supports the format', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(mockResume);
      mockPrismaService.resume.updateMany.mockResolvedValue({ count: 1 });
      mockStorage.download.mockResolvedValue(Buffer.from('binary-content'));
      mockPdfExtractor.supports.mockReturnValue(false);
      mockDocxExtractor.supports.mockReturnValue(false);

      await expect(
        service.processResume(mockUser, mockResume.id),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.processResume(mockUser, mockResume.id),
      ).rejects.toThrow(/Unsupported document format/i);

      expect(mockPrismaService.resume.update).toHaveBeenCalledWith({
        where: { id: mockResume.id },
        data: {
          status: 'FAILED',
          processingError: expect.stringContaining('Unsupported document format'),
        },
      });
    });

    it('marks resume as FAILED and throws BadRequestException when extracted text is less than 50 characters (scanned image)', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(mockResume);
      mockPrismaService.resume.updateMany.mockResolvedValue({ count: 1 });
      mockStorage.download.mockResolvedValue(Buffer.from('binary-content'));
      mockPdfExtractor.supports.mockReturnValue(true);
      mockPdfExtractor.extract.mockResolvedValue('Only a few words');

      await expect(
        service.processResume(mockUser, mockResume.id),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.processResume(mockUser, mockResume.id),
      ).rejects.toThrow(/little or no extractable text/i);

      expect(mockPrismaService.resume.update).toHaveBeenCalledWith({
        where: { id: mockResume.id },
        data: {
          status: 'FAILED',
          processingError: expect.stringContaining(
            'little or no extractable text',
          ),
        },
      });
    });

    it('successfully extracts text and structured career data from PDF and updates status to PROCESSED', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(mockResume);
      mockPrismaService.resume.updateMany.mockResolvedValue({ count: 1 });
      const fakeBuffer = Buffer.from('fake-pdf-data');
      mockStorage.download.mockResolvedValue(fakeBuffer);
      mockPdfExtractor.supports.mockReturnValue(true);
      mockPdfExtractor.extract.mockResolvedValue(sampleExtractedText);

      const processedResume = {
        ...mockResume,
        status: 'PROCESSED',
        extractedText: sampleExtractedText,
        structuredData: sampleStructuredData,
        processedAt: new Date('2026-10-15T00:00:00Z'),
      };
      mockPrismaService.resume.update.mockResolvedValue(processedResume);

      const result = await service.processResume(mockUser, mockResume.id);

      expect(result.status).toBe('PROCESSED');
      expect(result.extractedText).toBe(sampleExtractedText);
      expect(result.characterCount).toBe(sampleExtractedText.length);
      expect(result.structuredData).toEqual(sampleStructuredData);
      expect(mockStorage.download).toHaveBeenCalledWith(mockResume.storageKey);
      expect(mockPdfExtractor.extract).toHaveBeenCalledWith(fakeBuffer);
      expect(mockCareerDataExtractor.extract).toHaveBeenCalledWith(sampleExtractedText);
      expect(mockPrismaService.resume.update).toHaveBeenCalledWith({
        where: { id: mockResume.id },
        data: {
          status: 'PROCESSED',
          extractedText: sampleExtractedText,
          structuredData: sampleStructuredData,
          processingError: null,
          processedAt: expect.any(Date),
        },
      });

      // Strict architectural guarantee: career profiles must NOT be touched during resume processing
      expect(mockPrismaService.careerProfile.create).not.toHaveBeenCalled();
      expect(mockPrismaService.careerProfile.update).not.toHaveBeenCalled();
    });

    it('successfully extracts text from DOCX resume', async () => {
      const docxResume = {
        ...mockResume,
        originalFileName: 'resume.docx',
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        storageKey: `users/${mockUser.id}/resumes/resume-uuid-1/original.docx`,
      };

      mockPrismaService.resume.findUnique.mockResolvedValue(docxResume);
      mockPrismaService.resume.updateMany.mockResolvedValue({ count: 1 });
      const fakeBuffer = Buffer.from('fake-docx-data');
      mockStorage.download.mockResolvedValue(fakeBuffer);
      mockPdfExtractor.supports.mockReturnValue(false);
      mockDocxExtractor.supports.mockReturnValue(true);
      mockDocxExtractor.extract.mockResolvedValue(sampleExtractedText);

      const processedResume = {
        ...docxResume,
        status: 'PROCESSED',
        extractedText: sampleExtractedText,
        processedAt: new Date('2026-10-15T00:00:00Z'),
      };
      mockPrismaService.resume.update.mockResolvedValue(processedResume);

      const result = await service.processResume(mockUser, docxResume.id);

      expect(result.status).toBe('PROCESSED');
      expect(mockDocxExtractor.extract).toHaveBeenCalledWith(fakeBuffer);
    });

    it('allows retry when resume previous status was FAILED', async () => {
      const failedResume = {
        ...mockResume,
        status: 'FAILED',
        processingError: 'Storage connection timeout',
      };

      mockPrismaService.resume.findUnique.mockResolvedValue(failedResume);
      mockPrismaService.resume.updateMany.mockResolvedValue({ count: 1 });
      const fakeBuffer = Buffer.from('fake-pdf-data');
      mockStorage.download.mockResolvedValue(fakeBuffer);
      mockPdfExtractor.supports.mockReturnValue(true);
      mockPdfExtractor.extract.mockResolvedValue(sampleExtractedText);

      const retryProcessed = {
        ...failedResume,
        status: 'PROCESSED',
        extractedText: sampleExtractedText,
        processingError: null,
        processedAt: new Date('2026-10-15T00:00:00Z'),
      };
      mockPrismaService.resume.update.mockResolvedValue(retryProcessed);

      const result = await service.processResume(mockUser, failedResume.id);

      expect(result.status).toBe('PROCESSED');
      expect(mockPrismaService.resume.updateMany).toHaveBeenCalledWith({
        where: {
          id: failedResume.id,
          userId: mockUser.id,
          OR: [
            { status: { in: ['UPLOADED', 'FAILED'] } },
            { status: 'PROCESSING', updatedAt: expect.any(Object) },
          ],
        },
        data: {
          status: 'PROCESSING',
          processingError: null,
        },
      });
    });

    it('recovers and allows processing when resume is stuck in PROCESSING beyond the lock timeout', async () => {
      const stuckResume = {
        ...mockResume,
        status: 'PROCESSING',
        updatedAt: new Date(Date.now() - 6 * 60 * 1000), // 6 minutes ago
      };
      mockPrismaService.resume.findUnique.mockResolvedValue(stuckResume);
      mockPrismaService.resume.updateMany.mockResolvedValue({ count: 1 });
      const fakeBuffer = Buffer.from('fake-pdf-data');
      mockStorage.download.mockResolvedValue(fakeBuffer);
      mockPdfExtractor.supports.mockReturnValue(true);
      mockPdfExtractor.extract.mockResolvedValue(sampleExtractedText);

      mockPrismaService.resume.update.mockResolvedValue({
        ...stuckResume,
        status: 'PROCESSED',
        extractedText: sampleExtractedText,
        structuredData: sampleStructuredData,
        processedAt: new Date(),
      });

      const result = await service.processResume(mockUser, stuckResume.id);
      expect(result.status).toBe('PROCESSED');
    });
  });

  describe('getResume', () => {
    it('returns resume details for authenticated owner', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(mockResume);

      const result = await service.getResume(mockUser, mockResume.id);

      expect(result.id).toBe(mockResume.id);
      expect(result.userId).toBe(mockResume.userId);
      expect(result.status).toBe(mockResume.status);
    });

    it('throws NotFoundException if resume does not exist', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(null);

      await expect(service.getResume(mockUser, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException if user is not the owner', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(mockResume);

      await expect(service.getResume(otherUser, mockResume.id)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
