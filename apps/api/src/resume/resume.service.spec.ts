import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CurrentUser } from '../common/auth/current-user.interface.js';
import type { ObjectStoragePort } from '../infrastructure/storage/object-storage.port.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ResumeService } from './resume.service.js';

describe('ResumeService', () => {
  let service: ResumeService;
  let mockPrisma: any;
  let mockStorage: any;

  const mockUser: CurrentUser = {
    id: 'user-uuid-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      resume: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };

    mockStorage = {
      generateUploadToken: vi.fn(),
      upload: vi.fn(),
      delete: vi.fn(),
      head: vi.fn(),
      exists: vi.fn(),
    } as unknown as ObjectStoragePort;

    service = new ResumeService(
      mockPrisma as unknown as PrismaService,
      mockStorage,
    );
  });

  describe('createUploadIntent', () => {
    it('successfully creates an upload intent with private access for valid PDF metadata', async () => {
      // 1. ARRANGE
      mockPrisma.user.findUnique.mockResolvedValue({ id: mockUser.id });
      mockPrisma.resume.create.mockImplementation((args: any) =>
        Promise.resolve({
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );
      mockStorage.generateUploadToken.mockResolvedValue({
        clientToken: 'mock-client-token-xyz',
      });

      const dto = {
        fileName: 'neeraj-resume.pdf',
        contentType: 'application/pdf',
        fileSize: 183421,
      };

      // 2. ACT
      const result = await service.createUploadIntent(mockUser, dto);

      // 3. ASSERT
      expect(result.status).toBe('UPLOADING');
      expect(result.clientToken).toBe('mock-client-token-xyz');
      expect(result.storageKey).toMatch(
        new RegExp(`^users/${mockUser.id}/resumes/[0-9a-f-]+/original\\.pdf$`),
      );
      expect(mockPrisma.resume.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUser.id,
            originalFileName: 'neeraj-resume.pdf',
            contentType: 'application/pdf',
            fileSize: 183421,
            status: 'UPLOADING',
          }),
        }),
      );
      expect(mockStorage.generateUploadToken).toHaveBeenCalledWith({
        pathname: result.storageKey,
        contentType: 'application/pdf',
        maximumSizeInBytes: 5 * 1024 * 1024,
        access: 'private',
      });
    });

    it('successfully creates an upload intent for valid DOCX metadata', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: mockUser.id });
      mockPrisma.resume.create.mockImplementation((args: any) =>
        Promise.resolve({ ...args.data }),
      );
      mockStorage.generateUploadToken.mockResolvedValue({
        clientToken: 'docx-token',
      });

      const dto = {
        fileName: 'resume.docx',
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileSize: 200000,
      };

      const result = await service.createUploadIntent(mockUser, dto);

      expect(result.status).toBe('UPLOADING');
      expect(result.clientToken).toBe('docx-token');
      expect(result.storageKey).toMatch(
        new RegExp(`^users/${mockUser.id}/resumes/[0-9a-f-]+/original\\.docx$`),
      );
    });

    it('throws UnauthorizedException when user does not exist in database (no auto-provisioning)', async () => {
      // 1. ARRANGE
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const dto = {
        fileName: 'my-resume.pdf',
        contentType: 'application/pdf',
        fileSize: 50000,
      };

      // 2. ACT & ASSERT
      await expect(service.createUploadIntent(mockUser, dto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      expect(mockPrisma.resume.create).not.toHaveBeenCalled();
    });

    it('rejects when fileName is missing or whitespace', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: mockUser.id });
      const dto = {
        fileName: '   ',
        contentType: 'application/pdf',
        fileSize: 100000,
      };

      await expect(
        service.createUploadIntent(mockUser, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when contentType is missing or whitespace', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: mockUser.id });
      const dto = {
        fileName: 'resume.pdf',
        contentType: '   ',
        fileSize: 100000,
      };

      await expect(
        service.createUploadIntent(mockUser, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when fileSize is 0 or negative', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: mockUser.id });
      const zeroSizeDto = {
        fileName: 'resume.pdf',
        contentType: 'application/pdf',
        fileSize: 0,
      };

      await expect(
        service.createUploadIntent(mockUser, zeroSizeDto),
      ).rejects.toThrow(BadRequestException);

      const negativeSizeDto = {
        fileName: 'resume.pdf',
        contentType: 'application/pdf',
        fileSize: -500,
      };

      await expect(
        service.createUploadIntent(mockUser, negativeSizeDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when fileSize exceeds 5 MB', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: mockUser.id });
      const dto = {
        fileName: 'huge-resume.pdf',
        contentType: 'application/pdf',
        fileSize: 5 * 1024 * 1024 + 1,
      };

      await expect(
        service.createUploadIntent(mockUser, dto),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.resume.create).not.toHaveBeenCalled();
      expect(mockStorage.generateUploadToken).not.toHaveBeenCalled();
    });

    it('cleans up newly created database record when token generation fails', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: mockUser.id });
      mockPrisma.resume.create.mockImplementation((args: any) =>
        Promise.resolve({ ...args.data }),
      );
      mockStorage.generateUploadToken.mockRejectedValue(
        new Error('Vercel Blob token service unreachable'),
      );
      mockPrisma.resume.delete.mockResolvedValue({} as any);

      const dto = {
        fileName: 'my-resume.pdf',
        contentType: 'application/pdf',
        fileSize: 100000,
      };

      await expect(service.createUploadIntent(mockUser, dto)).rejects.toThrow(
        'Vercel Blob token service unreachable',
      );

      expect(mockPrisma.resume.create).toHaveBeenCalled();
      expect(mockPrisma.resume.delete).toHaveBeenCalledWith({
        where: { id: expect.any(String) },
      });
    });

    it('rejects when fileName has no extension', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: mockUser.id });
      const dto = {
        fileName: 'my-resume',
        contentType: 'application/pdf',
        fileSize: 100000,
      };

      await expect(
        service.createUploadIntent(mockUser, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects unsupported file formats (.png, .exe, .doc)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: mockUser.id });
      const pngDto = {
        fileName: 'image.png',
        contentType: 'image/png',
        fileSize: 100000,
      };

      await expect(
        service.createUploadIntent(mockUser, pngDto),
      ).rejects.toThrow(BadRequestException);

      const oldDocDto = {
        fileName: 'resume.doc',
        contentType: 'application/msword',
        fileSize: 100000,
      };

      await expect(
        service.createUploadIntent(mockUser, oldDocDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when extension does not match MIME content type', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: mockUser.id });
      const mismatchedDto = {
        fileName: 'resume.docx',
        contentType: 'application/pdf',
        fileSize: 100000,
      };

      await expect(
        service.createUploadIntent(mockUser, mismatchedDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeUpload', () => {
    const resumeId = 'resume-uuid-1';
    const canonicalStorageKey = `users/${mockUser.id}/resumes/${resumeId}/original.pdf`;

    it('successfully verifies canonical storage object and updates status to UPLOADED', async () => {
      // 1. ARRANGE
      mockPrisma.resume.findUnique.mockResolvedValue({
        id: resumeId,
        userId: mockUser.id,
        originalFileName: 'resume.pdf',
        contentType: 'application/pdf',
        fileSize: 183421,
        storageKey: canonicalStorageKey,
        status: 'UPLOADING',
      });

      mockStorage.head.mockResolvedValue({
        pathname: canonicalStorageKey,
        size: 183421,
        contentType: 'application/pdf',
        uploadedAt: new Date(),
        url: 'https://store.blob.vercel-storage.com/private',
      });

      mockPrisma.resume.update.mockResolvedValue({
        id: resumeId,
        userId: mockUser.id,
        originalFileName: 'resume.pdf',
        contentType: 'application/pdf',
        fileSize: 183421,
        storageKey: canonicalStorageKey,
        status: 'UPLOADED',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 2. ACT: Client provides empty body or arbitrary URL; server uses canonical key
      const result = await service.completeUpload(mockUser, resumeId, {
        blobUrl: 'https://attacker.com/unrelated.pdf',
      });

      // 3. ASSERT: Queried using canonical storageKey, never trusted client URL
      expect(mockStorage.head).toHaveBeenCalledWith(canonicalStorageKey);
      expect(mockPrisma.resume.update).toHaveBeenCalledWith({
        where: { id: resumeId },
        data: {
          status: 'UPLOADED',
        },
      });
      expect(result.status).toBe('UPLOADED');
      expect(result.storageKey).toBe(canonicalStorageKey);
    });

    it('is idempotent: returns existing record when resume is already UPLOADED', async () => {
      // 1. ARRANGE
      const alreadyUploaded = {
        id: resumeId,
        userId: mockUser.id,
        originalFileName: 'resume.pdf',
        contentType: 'application/pdf',
        fileSize: 183421,
        storageKey: canonicalStorageKey,
        status: 'UPLOADED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.resume.findUnique.mockResolvedValue(alreadyUploaded);

      // 2. ACT
      const result = await service.completeUpload(mockUser, resumeId);

      // 3. ASSERT: No storage check or database mutation needed
      expect(mockStorage.head).not.toHaveBeenCalled();
      expect(mockPrisma.resume.update).not.toHaveBeenCalled();
      expect(result.status).toBe('UPLOADED');
    });

    it('throws NotFoundException if resume does not exist', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(null);

      await expect(
        service.completeUpload(mockUser, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);

      expect(mockStorage.head).not.toHaveBeenCalled();
      expect(mockPrisma.resume.update).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException if resume belongs to a different user', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue({
        id: resumeId,
        userId: 'different-user-id',
        status: 'UPLOADING',
      });

      await expect(
        service.completeUpload(mockUser, resumeId),
      ).rejects.toThrow(ForbiddenException);

      expect(mockStorage.head).not.toHaveBeenCalled();
      expect(mockPrisma.resume.update).not.toHaveBeenCalled();
    });

    it('throws BadRequestException if the canonical object does not exist in storage', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue({
        id: resumeId,
        userId: mockUser.id,
        fileSize: 1000,
        contentType: 'application/pdf',
        storageKey: canonicalStorageKey,
        status: 'UPLOADING',
      });
      mockStorage.head.mockResolvedValue(null);

      await expect(
        service.completeUpload(mockUser, resumeId),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.resume.update).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when stored file size does not match record metadata', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue({
        id: resumeId,
        userId: mockUser.id,
        fileSize: 100000,
        contentType: 'application/pdf',
        storageKey: canonicalStorageKey,
        status: 'UPLOADING',
      });

      mockStorage.head.mockResolvedValue({
        pathname: canonicalStorageKey,
        size: 50, // Mismatched size!
        contentType: 'application/pdf',
        uploadedAt: new Date(),
        url: 'https://store.blob.vercel-storage.com/private',
      });

      await expect(
        service.completeUpload(mockUser, resumeId),
      ).rejects.toThrow(/does not match expected file size/i);

      expect(mockPrisma.resume.update).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when stored content type does not match record metadata', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue({
        id: resumeId,
        userId: mockUser.id,
        fileSize: 100000,
        contentType: 'application/pdf',
        storageKey: canonicalStorageKey,
        status: 'UPLOADING',
      });

      mockStorage.head.mockResolvedValue({
        pathname: canonicalStorageKey,
        size: 100000,
        contentType: 'image/png', // Mismatched MIME type!
        uploadedAt: new Date(),
        url: 'https://store.blob.vercel-storage.com/private',
      });

      await expect(
        service.completeUpload(mockUser, resumeId),
      ).rejects.toThrow(/does not match expected content type/i);

      expect(mockPrisma.resume.update).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when stored pathname does not match expected canonical storageKey', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue({
        id: resumeId,
        userId: mockUser.id,
        fileSize: 100000,
        contentType: 'application/pdf',
        storageKey: canonicalStorageKey,
        status: 'UPLOADING',
      });

      mockStorage.head.mockResolvedValue({
        pathname: 'users/attacker/resumes/other/original.pdf', // Mismatched pathname!
        size: 100000,
        contentType: 'application/pdf',
        uploadedAt: new Date(),
        url: 'https://store.blob.vercel-storage.com/private',
      });

      await expect(
        service.completeUpload(mockUser, resumeId),
      ).rejects.toThrow(/does not match expected storage key/i);

      expect(mockPrisma.resume.update).not.toHaveBeenCalled();
    });
  });
});
