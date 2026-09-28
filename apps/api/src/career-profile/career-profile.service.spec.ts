import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CareerProfileService } from './career-profile.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('CareerProfileService', () => {
  let service: CareerProfileService;

  const mockPrismaService = {
    user: {
      findUnique: vi.fn(),
    },
    careerProfile: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CareerProfileService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CareerProfileService>(CareerProfileService);
  });

  describe('create', () => {
    const mockDto = {
      userId: 'user-123',
      currentRole: 'Frontend Developer',
      yearsOfExperience: 3,
      targetRole: 'Full Stack Engineer',
      summary: 'Looking to transition.',
    };

    it('successfully creates a career profile', async () => {
      // 1. ARRANGE
      const mockCreatedProfile = {
        id: 'profile-uuid-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...mockDto,
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: mockDto.userId,
        email: 'user@example.com',
      });
      mockPrismaService.careerProfile.findUnique.mockResolvedValue(null);
      mockPrismaService.careerProfile.create.mockResolvedValue(
        mockCreatedProfile,
      );

      // 2. ACT
      const result = await service.create(mockDto);

      // 3. ASSERT
      expect(result).toEqual(mockCreatedProfile);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockDto.userId },
      });
      expect(mockPrismaService.careerProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: mockDto.userId },
      });
      expect(mockPrismaService.careerProfile.create).toHaveBeenCalledWith({
        data: mockDto,
      });
    });

    it('throws NotFoundException if user does not exist', async () => {
      // 1. ARRANGE: Tell mock that user does NOT exist
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // 2. ACT & ASSERT: Expect service.create to reject with NotFoundException
      await expect(service.create(mockDto)).rejects.toThrow(NotFoundException);

      // Verify that it aborted early and never queried careerProfile or created anything
      expect(mockPrismaService.careerProfile.findUnique).not.toHaveBeenCalled();
      expect(mockPrismaService.careerProfile.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException if career profile already exists for user', async () => {
      // 1. ARRANGE: User exists, but already has an existing profile
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: mockDto.userId,
        email: 'user@example.com',
      });
      mockPrismaService.careerProfile.findUnique.mockResolvedValue({
        id: 'existing-profile-id',
        userId: mockDto.userId,
        currentRole: 'Junior Developer',
      });

      // 2. ACT & ASSERT: Expect service.create to reject with ConflictException
      await expect(service.create(mockDto)).rejects.toThrow(ConflictException);

      // Verify that it aborted and never called create()
      expect(mockPrismaService.careerProfile.create).not.toHaveBeenCalled();
    });
  });

  describe('Find by user Id', () => {
    const userId = 'USER1';
    const mockProfile = {
      id: 'profile-1',
      userId: 'USER1',
      currentRole: 'Frontend Developer',
      yearsOfExperience: 3,
      targetRole: 'Full Stack Engineer',
      user: {
        id: 'USER1',
        email: 'user@example.com',
        name: 'Test User',
      },
    };
    it('Successfully find out existing user', async () => {
      mockPrismaService.careerProfile.findUnique.mockResolvedValue(mockProfile);
      // 2. ACT
      const result = await service.findByUserId(userId);
      // 3. ASSERT
      expect(result).toEqual(mockProfile);
      expect(mockPrismaService.careerProfile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });
    });

    it('throws NotFoundException if profile is not found', async () => {
      // 1. ARRANGE
      mockPrismaService.careerProfile.findUnique.mockResolvedValue(null);

      // 2. ACT & ASSERT
      await expect(service.findByUserId(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const userId = 'user-123';
    const updateDto = {
      targetRole: 'Senior Full Stack Engineer',
      yearsOfExperience: 4,
    };

    it('successfully updates a career profile', async () => {
      const existingProfile = {
        id: 'profile-1',
        userId,
        currentRole: 'Frontend Developer',
        yearsOfExperience: 3,
        targetRole: 'Full Stack Engineer',
        summary: 'Transitioning',
        user: {
          id: userId,
          email: 'user@example.com',
          name: 'Test User',
        },
      };

      const updatedProfile = {
        ...existingProfile,
        ...updateDto,
      };

      // 1. ARRANGE
      mockPrismaService.careerProfile.findUnique.mockResolvedValue(existingProfile);
      mockPrismaService.careerProfile.update.mockResolvedValue(updatedProfile);

      // 2. ACT
      const result = await service.update(userId, updateDto);

      // 3. ASSERT
      expect(result).toEqual(updatedProfile);
      expect(mockPrismaService.careerProfile.update).toHaveBeenCalledWith({
        where: { userId },
        data: updateDto,
      });
    });

    it('throws NotFoundException if profile does not exist to update', async () => {
      // 1. ARRANGE
      mockPrismaService.careerProfile.findUnique.mockResolvedValue(null);

      // 2. ACT & ASSERT
      await expect(service.update(userId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.careerProfile.update).not.toHaveBeenCalled();
    });
  });
});
