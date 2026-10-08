import { BadRequestException } from '@nestjs/common';
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
      },
    };

    mockStorage = {
      generateUploadToken: vi.fn(),
      upload: vi.fn(),
      delete: vi.fn(),
    } as unknown as ObjectStoragePort;

    service = new ResumeService(
      mockPrisma as unknown as PrismaService,
      mockStorage,
    );
  });

  describe('createUploadIntent', () => {
    it('successfully creates an upload intent for valid PDF metadata', async () => {
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
        new RegExp(`^users/${mockUser.id}/resumes/[0-9a-f-]+/original$`),
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
      });
    });

    it('successfully creates an upload intent for valid DOCX metadata', async () => {
      // 1. ARRANGE
      mockPrisma.user.findUnique.mockResolvedValue({ id: mockUser.id });
      mockPrisma.resume.create.mockImplementation((args: any) =>
        Promise.resolve({ ...args.data }),
      );
      mockStorage.generateUploadToken.mockResolvedValue({
        clientToken: 'docx-token',
      });

      const dto = {
        fileName: 'my-resume.docx',
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileSize: 50000,
      };

      // 2. ACT
      const result = await service.createUploadIntent(mockUser, dto);

      // 3. ASSERT
      expect(result.status).toBe('UPLOADING');
      expect(result.clientToken).toBe('docx-token');
    });

    it('creates dev user if not already present in database', async () => {
      // 1. ARRANGE
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: mockUser.id });
      mockPrisma.resume.create.mockImplementation((args: any) =>
        Promise.resolve({ ...args.data }),
      );
      mockStorage.generateUploadToken.mockResolvedValue({
        clientToken: 'token',
      });

      const dto = {
        fileName: 'my-resume.docx',
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileSize: 50000,
      };

      // 2. ACT
      await service.createUploadIntent(mockUser, dto);

      // 3. ASSERT
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          id: mockUser.id,
          email: `${mockUser.id}@dev.local`,
          name: 'Current User',
        },
      });
    });

    it('rejects when fileName is missing or whitespace', async () => {
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
      const dto = {
        fileName: 'huge-resume.pdf',
        contentType: 'application/pdf',
        fileSize: 5 * 1024 * 1024 + 1, // 5 MB + 1 byte
      };

      await expect(
        service.createUploadIntent(mockUser, dto),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.resume.create).not.toHaveBeenCalled();
      expect(mockStorage.generateUploadToken).not.toHaveBeenCalled();
    });

    it('rejects when fileName has no extension', async () => {
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
      // .docx file with application/pdf header
      const mismatchedDto1 = {
        fileName: 'resume.docx',
        contentType: 'application/pdf',
        fileSize: 100000,
      };

      await expect(
        service.createUploadIntent(mockUser, mismatchedDto1),
      ).rejects.toThrow(BadRequestException);

      // .pdf file with application/vnd.openxml... header
      const mismatchedDto2 = {
        fileName: 'resume.pdf',
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileSize: 100000,
      };

      await expect(
        service.createUploadIntent(mockUser, mismatchedDto2),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
