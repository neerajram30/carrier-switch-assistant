import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { HealthController } from './health.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('HealthController', () => {
  let controller: HealthController;

  const mockPrismaService = {
    $queryRaw: vi.fn().mockResolvedValue([1]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('GET /health', () => {
    it('returns ok status with a timestamp', () => {
      const result = controller.getHealth();
      expect(result).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
      });
    });
  });

  describe('GET /health/db', () => {
    it('returns connected when database is reachable', async () => {
      const result = await controller.getDbHealth();
      expect(result).toEqual({
        status: 'ok',
        database: 'connected',
        timestamp: expect.any(String),
      });
    });

    it('returns disconnected when database is unreachable', async () => {
      mockPrismaService.$queryRaw.mockRejectedValueOnce(
        new Error('Connection refused'),
      );
      const result = await controller.getDbHealth();
      expect(result).toEqual({
        status: 'error',
        database: 'disconnected',
        timestamp: expect.any(String),
      });
    });
  });
});
