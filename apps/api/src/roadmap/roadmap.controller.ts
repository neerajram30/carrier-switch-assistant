import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../common/auth/auth.guard.js';
import { CurrentUser } from '../common/auth/current-user.decorator.js';
import { RoadmapService } from './roadmap.service.js';

export class SelectCareerPathDto {
  pathId: string;
  title?: string;
}

@Controller()
@UseGuards(AuthGuard)
export class RoadmapController {
  constructor(private readonly roadmapService: RoadmapService) {}

  @Get('career-paths')
  getCareerPaths(@CurrentUser('id') userId: string) {
    return this.roadmapService.getCareerPaths(userId);
  }

  @Post('career-paths/select')
  selectCareerPath(
    @CurrentUser('id') userId: string,
    @Body() dto: SelectCareerPathDto,
  ) {
    return this.roadmapService.selectCareerPath(userId, dto.pathId, dto.title);
  }

  @Get('roadmap')
  getRoadmap(@CurrentUser('id') userId: string) {
    return this.roadmapService.getRoadmap(userId);
  }

  @Patch('roadmap/milestones/:id/toggle')
  toggleMilestone(
    @CurrentUser('id') userId: string,
    @Param('id') milestoneId: string,
  ) {
    return this.roadmapService.toggleMilestone(userId, milestoneId);
  }

  @Patch('roadmap/milestones/:milestoneId/tasks/:taskId/toggle')
  toggleDailyTask(
    @CurrentUser('id') userId: string,
    @Param('milestoneId') milestoneId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.roadmapService.toggleDailyTask(userId, milestoneId, taskId);
  }

  @Get('roadmap/activity')
  getActivityLogs(
    @CurrentUser('id') userId: string,
  ) {
    return this.roadmapService.getActivityLogs(userId);
  }
}
