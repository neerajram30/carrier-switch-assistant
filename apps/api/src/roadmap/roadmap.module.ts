import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { DynamicRoadmapGeneratorService } from './dynamic-roadmap-generator.service.js';
import { RoadmapController } from './roadmap.controller.js';
import { RoadmapService } from './roadmap.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [RoadmapController],
  providers: [RoadmapService, DynamicRoadmapGeneratorService],
  exports: [RoadmapService, DynamicRoadmapGeneratorService],
})
export class RoadmapModule {}
