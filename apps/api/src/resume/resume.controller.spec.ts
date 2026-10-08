import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CurrentUser } from '../common/auth/current-user.interface.js';
import type { CreateUploadIntentDto } from './dto/create-upload-intent.dto.js';
import { ResumeController } from './resume.controller.js';
import type { ResumeService } from './resume.service.js';

describe('ResumeController', () => {
  let controller: ResumeController;
  let mockResumeService: any;

  const mockUser: CurrentUser = {
    id: 'user-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockResumeService = {
      createUploadIntent: vi.fn(),
    };
    controller = new ResumeController(
      mockResumeService as unknown as ResumeService,
    );
  });

  describe('POST /api/v1/resumes/upload-intent', () => {
    it('delegates to resumeService.createUploadIntent with user and dto', async () => {
      const dto: CreateUploadIntentDto = {
        fileName: 'my-resume.pdf',
        contentType: 'application/pdf',
        fileSize: 12345,
      };

      const mockResponse = {
        resumeId: 'res-1',
        storageKey: 'users/user-123/resumes/res-1/original',
        clientToken: 'token-abc',
        status: 'UPLOADING',
      };
      mockResumeService.createUploadIntent.mockResolvedValue(mockResponse);

      const result = await controller.createUploadIntent(mockUser, dto);

      expect(mockResumeService.createUploadIntent).toHaveBeenCalledWith(
        mockUser,
        dto,
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
