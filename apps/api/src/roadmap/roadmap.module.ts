import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RoadmapController } from './roadmap.controller.js';
import { RoadmapService } from './roadmap.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [RoadmapController],
  providers: [RoadmapService],
  exports: [RoadmapService],
})
export class RoadmapModule {}
