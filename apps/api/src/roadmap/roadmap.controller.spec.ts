import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RoadmapController, SelectCareerPathDto } from './roadmap.controller.js';
import type { RoadmapService } from './roadmap.service.js';

describe('SelectCareerPathDto Validation', () => {
  it('passes validation with valid required and optional fields', async () => {
    const dto = plainToInstance(SelectCareerPathDto, {
      pathId: 'aws-cloud-solutions-engineer',
      title: 'AWS Cloud Solutions Engineer',
      bridgeSkills: ['Terraform', 'Kubernetes'],
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toHaveLength(0);
  });

  it('passes validation when optional fields are omitted', async () => {
    const dto = plainToInstance(SelectCareerPathDto, {
      pathId: 'aws-cloud-solutions-engineer',
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toHaveLength(0);
  });

  it('fails validation when pathId is missing or empty', async () => {
    const dto = plainToInstance(SelectCareerPathDto, {
      pathId: '',
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('pathId');
  });

  it('fails validation when bridgeSkills contains non-string items', async () => {
    const dto = plainToInstance(SelectCareerPathDto, {
      pathId: 'path-1',
      bridgeSkills: [123 as unknown as string],
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('bridgeSkills');
  });
});

describe('RoadmapController', () => {
  let controller: RoadmapController;
  let mockRoadmapService: {
    getCareerPaths: ReturnType<typeof vi.fn>;
    selectCareerPath: ReturnType<typeof vi.fn>;
    getRoadmap: ReturnType<typeof vi.fn>;
    toggleMilestone: ReturnType<typeof vi.fn>;
    toggleDailyTask: ReturnType<typeof vi.fn>;
    getActivityLogs: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRoadmapService = {
      getCareerPaths: vi.fn(),
      selectCareerPath: vi.fn(),
      getRoadmap: vi.fn(),
      toggleMilestone: vi.fn(),
      toggleDailyTask: vi.fn(),
      getActivityLogs: vi.fn(),
    };

    controller = new RoadmapController(
      mockRoadmapService as unknown as RoadmapService,
    );
  });

  describe('POST /career-paths/select', () => {
    it('delegates to roadmapService.selectCareerPath with correct parameters', async () => {
      const dto: SelectCareerPathDto = {
        pathId: 'aws-solutions-architect',
        title: 'AWS Cloud Solutions Engineer',
        bridgeSkills: ['Terraform', 'Kubernetes'],
      };

      const mockResult = {
        id: 'roadmap-123',
        targetRole: 'AWS Cloud Solutions Engineer',
      };
      mockRoadmapService.selectCareerPath.mockResolvedValue(mockResult);

      const result = await controller.selectCareerPath('user-1', dto);

      expect(mockRoadmapService.selectCareerPath).toHaveBeenCalledWith(
        'user-1',
        dto.pathId,
        dto.title,
        dto.bridgeSkills,
      );
      expect(result).toEqual(mockResult);
    });
  });
});

