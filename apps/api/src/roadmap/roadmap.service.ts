import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  DailyTaskTemplate,
  DynamicCareerPath,
  DynamicRoadmapGeneratorService,
} from './dynamic-roadmap-generator.service.js';

export interface DailyTask extends DailyTaskTemplate {}

export interface RoadmapSummaryItem {
  id: string;
  targetRole: string;
  progressPercent: number;
  estimatedMonths: number;
  totalMilestones: number;
  completedMilestones: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface HydratedRoadmapResponse {
  id: string;
  careerProfileId: string;
  targetRole: string;
  estimatedMonths: number;
  progressPercent: number;
  milestones: any[];
  roadmaps: RoadmapSummaryItem[];
  totalActive: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class RoadmapService {
  private readonly logger = new Logger(RoadmapService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dynamicRoadmapGenerator: DynamicRoadmapGeneratorService,
  ) {}

  /**
   * Retrieves dynamic tailored career paths for the user.
   * If not yet calibrated in CareerProfile, triggers on-demand AI generation from user profile.
   * Never returns hardcoded dummy paths.
   */
  async getCareerPaths(userId: string): Promise<DynamicCareerPath[]> {
    const profile = await this.prisma.careerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(
        'Career profile not found. Please upload or review your resume to initialize your profile.',
      );
    }

    if (
      profile.suggestedPaths &&
      Array.isArray(profile.suggestedPaths) &&
      profile.suggestedPaths.length > 0
    ) {
      return profile.suggestedPaths as unknown as DynamicCareerPath[];
    }

    this.logger.log(
      `Calibrating dynamic career paths on-demand for user "${userId}" (${profile.currentRole})...`,
    );

    // Call dynamic LLM generator with candidate's verified baseline
    const generatedPaths =
      await this.dynamicRoadmapGenerator.generateCareerPathsForProfile({
        currentRole: profile.currentRole,
        yearsOfExperience: Number(profile.yearsOfExperience),
        currentSkills: profile.skills,
        summary: profile.summary,
      });

    // Persist dynamic paths to CareerProfile for fast subsequent queries
    await this.prisma.careerProfile.update({
      where: { id: profile.id },
      data: { suggestedPaths: generatedPaths as any },
    });

    return generatedPaths;
  }

  /**
   * Selects or activates a career path.
   * Supports MULTIPLE active roadmaps simultaneously without resetting existing progress.
   * Generates a tailored dynamic 5-sprint curriculum via Gemini if new.
   */
  async selectCareerPath(
    userId: string,
    pathId: string,
    title?: string,
    bridgeSkills?: string[],
  ): Promise<HydratedRoadmapResponse> {
    let profile = await this.prisma.careerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(
        'Career profile not found. Please complete profile onboarding before selecting a roadmap.',
      );
    }

    // Determine target title from title param or suggestedPaths lookup
    let targetTitle = title?.trim();
    let detectedBridgeSkills: string[] = bridgeSkills || [];

    if (!targetTitle || detectedBridgeSkills.length === 0) {
      const paths = (profile.suggestedPaths as any[]) || [];
      const match = paths.find(
        (p: any) =>
          p.id === pathId ||
          p.title?.toLowerCase() === targetTitle?.toLowerCase(),
      );
      if (match) {
        if (!targetTitle) targetTitle = match.title;
        if (
          detectedBridgeSkills.length === 0 &&
          Array.isArray(match.bridgeSkills)
        ) {
          detectedBridgeSkills = match.bridgeSkills;
        }
      }
    }
    const finalTargetTitle = targetTitle || pathId.replace(/-/g, ' ');

    // Update CareerProfile active targetRole pointer
    await this.prisma.careerProfile.update({
      where: { id: profile.id },
      data: { targetRole: finalTargetTitle },
    });

    // Check if user ALREADY has a roadmap for this role (Multi-Roadmap Concurrency)
    const existingRoadmap = await this.prisma.roadmap.findFirst({
      where: {
        careerProfileId: profile.id,
        targetRole: { equals: finalTargetTitle, mode: 'insensitive' },
      },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (existingRoadmap) {
      this.logger.log(
        `User "${userId}" switched to existing active roadmap "${finalTargetTitle}" (${existingRoadmap.progressPercent}% complete).`,
      );

      const allRoadmaps = await this.prisma.roadmap.findMany({
        where: { careerProfileId: profile.id },
        orderBy: { createdAt: 'desc' },
        include: { milestones: { orderBy: { order: 'asc' } } },
      });

      return {
        ...existingRoadmap,
        milestones: (existingRoadmap.milestones || []).map((m: any) =>
          this.hydrateMilestone(m),
        ),
        roadmaps: allRoadmaps.map((r: any) => this.summarizeRoadmap(r)),
        totalActive: allRoadmaps.length,
      };
    }

    // Generate tailored dynamic curriculum via Gemini API (No hardcoded fallback!)
    const milestoneTemplates =
      await this.dynamicRoadmapGenerator.generateRoadmapForRole({
        currentRole: profile.currentRole,
        yearsOfExperience: Number(profile.yearsOfExperience),
        currentSkills: profile.skills,
        targetRole: finalTargetTitle,
        bridgeSkills: detectedBridgeSkills,
        summary: profile.summary,
      });

    // Create fresh Roadmap record and seed dynamic milestones in PostgreSQL
    const roadmap = await this.prisma.roadmap.create({
      data: {
        careerProfileId: profile.id,
        targetRole: finalTargetTitle,
        estimatedMonths: 6,
        progressPercent: 0,
        milestones: {
          create: milestoneTemplates.map((m, index) => ({
            weekRange: m.weekRange,
            title: m.title,
            description: JSON.stringify({
              summary: m.description,
              dailyTasks: m.dailyTasks,
            }),
            category: m.category,
            duration: m.duration,
            isCompleted: false,
            order: index + 1,
          })),
        },
      },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
        },
      },
    });

    this.logger.log(
      `User "${userId}" generated new dynamic roadmap "${finalTargetTitle}" with ${roadmap?.milestones?.length || 0} milestones.`,
    );

    const allRoadmaps = await this.prisma.roadmap.findMany({
      where: { careerProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
      include: { milestones: { orderBy: { order: 'asc' } } },
    });

    return {
      ...roadmap,
      milestones: (roadmap.milestones || []).map((m: any) =>
        this.hydrateMilestone(m),
      ),
      roadmaps: allRoadmaps.map((r: any) => this.summarizeRoadmap(r)),
      totalActive: allRoadmaps.length,
    };
  }

  /**
   * Retrieves active roadmap and all user roadmaps.
   * If roadmapId is specified, focuses that specific roadmap.
   */
  async getRoadmap(userId: string, roadmapId?: string): Promise<HydratedRoadmapResponse | null> {
    const profile = await this.prisma.careerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return null;
    }

    const allRoadmaps = await this.prisma.roadmap.findMany({
      where: { careerProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (allRoadmaps.length === 0) {
      return null;
    }

    let activeRoadmap = roadmapId
      ? allRoadmaps.find((r: any) => r.id === roadmapId)
      : null;

    if (!activeRoadmap && profile.targetRole) {
      activeRoadmap = allRoadmaps.find(
        (r: any) =>
          r.targetRole.toLowerCase() === profile.targetRole?.toLowerCase(),
      );
    }

    if (!activeRoadmap) {
      activeRoadmap = allRoadmaps[0];
    }

    const mappedMilestones = (activeRoadmap.milestones || []).map((m: any) =>
      this.hydrateMilestone(m),
    );

    return {
      ...activeRoadmap,
      milestones: mappedMilestones,
      roadmaps: allRoadmaps.map((r: any) => this.summarizeRoadmap(r)),
      totalActive: allRoadmaps.length,
    };
  }

  /**
   * Hydrates a database milestone by parsing its daily tasks JSON.
   */
  private hydrateMilestone(m: any) {
    let summary = m.description;
    let dailyTasks: DailyTask[] = [];

    try {
      const parsed = JSON.parse(m.description);
      if (parsed && Array.isArray(parsed.dailyTasks)) {
        summary = parsed.summary || m.description;
        dailyTasks = parsed.dailyTasks;
      }
    } catch {
      // Plain text description without micro-tasks
    }

    return {
      ...m,
      description: summary,
      dailyTasks,
    };
  }

  private summarizeRoadmap(r: any): RoadmapSummaryItem {
    const milestones = r.milestones || [];
    const completedMilestones = milestones.filter(
      (m: any) => m.isCompleted,
    ).length;
    return {
      id: r.id,
      targetRole: r.targetRole,
      progressPercent: r.progressPercent,
      estimatedMonths: r.estimatedMonths,
      totalMilestones: milestones.length,
      completedMilestones,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  /**
   * Toggles milestone completion and synchronizes all its daily tasks.
   */
  async toggleMilestone(userId: string, milestoneId: string) {
    const milestone = await this.prisma.roadmapMilestone.findUnique({
      where: { id: milestoneId },
      include: {
        roadmap: {
          include: {
            careerProfile: true,
          },
        },
      },
    });

    if (!milestone) {
      throw new NotFoundException(`Milestone "${milestoneId}" not found`);
    }

    if (milestone.roadmap.careerProfile.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this milestone',
      );
    }

    const nextCompleted = !milestone.isCompleted;

    const hydrated = this.hydrateMilestone(milestone);
    const updatedDailyTasks = hydrated.dailyTasks.map((t: DailyTask) => ({
      ...t,
      isCompleted: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : null,
    }));

    const updated = await this.prisma.roadmapMilestone.update({
      where: { id: milestoneId },
      data: {
        isCompleted: nextCompleted,
        completedAt: nextCompleted ? new Date() : null,
        description: JSON.stringify({
          summary: hydrated.description,
          dailyTasks: updatedDailyTasks,
        }),
      },
    });

    // Recalculate roadmap progress percentage based on all daily tasks
    const allMilestones = await this.prisma.roadmapMilestone.findMany({
      where: { roadmapId: milestone.roadmapId },
    });

    let totalTasks = 0;
    let completedTasks = 0;

    for (const m of allMilestones) {
      if (m.id === milestoneId) {
        totalTasks += updatedDailyTasks.length;
        completedTasks += updatedDailyTasks.filter(
          (t: DailyTask) => t.isCompleted,
        ).length;
        continue;
      }
      const h = this.hydrateMilestone(m);
      totalTasks += h.dailyTasks.length;
      completedTasks += h.dailyTasks.filter(
        (t: DailyTask) => t.isCompleted,
      ).length;
    }

    const progressPercent =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    await this.prisma.roadmap.update({
      where: { id: milestone.roadmapId },
      data: { progressPercent },
    });

    return {
      milestone: {
        ...updated,
        description: hydrated.description,
        dailyTasks: updatedDailyTasks,
      },
      progressPercent,
      completedCount: completedTasks,
      totalCount: totalTasks,
    };
  }

  /**
   * Toggles an individual daily micro-task within a sprint milestone.
   */
  async toggleDailyTask(userId: string, milestoneId: string, taskId: string) {
    const milestone = await this.prisma.roadmapMilestone.findUnique({
      where: { id: milestoneId },
      include: {
        roadmap: {
          include: {
            careerProfile: true,
          },
        },
      },
    });

    if (!milestone) {
      throw new NotFoundException(`Milestone "${milestoneId}" not found`);
    }

    if (milestone.roadmap.careerProfile.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this milestone task',
      );
    }

    const hydrated = this.hydrateMilestone(milestone);
    const updatedDailyTasks = hydrated.dailyTasks.map((t: DailyTask) => {
      if (t.id === taskId) {
        const nextState = !t.isCompleted;
        return {
          ...t,
          isCompleted: nextState,
          completedAt: nextState ? new Date().toISOString() : null,
        };
      }
      return t;
    });

    const allDailyDone =
      updatedDailyTasks.length > 0 &&
      updatedDailyTasks.every((t: DailyTask) => t.isCompleted);

    const updated = await this.prisma.roadmapMilestone.update({
      where: { id: milestoneId },
      data: {
        isCompleted: allDailyDone,
        completedAt: allDailyDone ? new Date() : null,
        description: JSON.stringify({
          summary: hydrated.description,
          dailyTasks: updatedDailyTasks,
        }),
      },
    });

    // Recalculate roadmap progress
    const allMilestones = await this.prisma.roadmapMilestone.findMany({
      where: { roadmapId: milestone.roadmapId },
    });

    let totalTasks = 0;
    let completedTasks = 0;

    for (const m of allMilestones) {
      if (m.id === milestoneId) {
        totalTasks += updatedDailyTasks.length;
        completedTasks += updatedDailyTasks.filter(
          (t: DailyTask) => t.isCompleted,
        ).length;
        continue;
      }
      const h = this.hydrateMilestone(m);
      totalTasks += h.dailyTasks.length;
      completedTasks += h.dailyTasks.filter(
        (t: DailyTask) => t.isCompleted,
      ).length;
    }

    const progressPercent =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    await this.prisma.roadmap.update({
      where: { id: milestone.roadmapId },
      data: { progressPercent },
    });

    return {
      milestone: {
        ...updated,
        description: hydrated.description,
        dailyTasks: updatedDailyTasks,
      },
      progressPercent,
      completedCount: completedTasks,
      totalCount: totalTasks,
    };
  }

  /**
   * Aggregates activity logs across all active roadmaps for consistency heatmap and streak calculations.
   */
  async getActivityLogs(userId: string, days = 84) {
    const profile = await this.prisma.careerProfile.findUnique({
      where: { userId },
    });
    if (!profile)
      return {
        activity: [],
        totalActiveDays: 0,
        currentStreak: 0,
        longestStreak: 0,
      };

    const roadmaps = await this.prisma.roadmap.findMany({
      where: { careerProfileId: profile.id },
      include: {
        milestones: { orderBy: { order: 'asc' } },
      },
    });

    if (roadmaps.length === 0)
      return {
        activity: [],
        totalActiveDays: 0,
        currentStreak: 0,
        longestStreak: 0,
      };

    const dateCountMap = new Map<string, number>();

    for (const roadmap of roadmaps) {
      for (const m of roadmap.milestones || []) {
        const h = this.hydrateMilestone(m);
        for (const t of h.dailyTasks) {
          if (t.isCompleted && t.completedAt) {
            const dateStr = t.completedAt.split('T')[0];
            dateCountMap.set(dateStr, (dateCountMap.get(dateStr) || 0) + 1);
          }
        }
        if (m.isCompleted && m.completedAt) {
          const mDate = new Date(m.completedAt).toISOString().split('T')[0];
          if (!dateCountMap.has(mDate)) {
            dateCountMap.set(mDate, 1);
          }
        }
      }
    }

    const now = new Date();
    const activity: Array<{ date: string; count: number; level: number }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const count = dateCountMap.get(iso) || 0;
      const level =
        count === 0 ? 0 : count <= 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4;
      activity.push({ date: iso, count, level });
    }

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = activity.length - 1; i >= 0; i--) {
      if (activity[i].count > 0) {
        currentStreak++;
      } else {
        if (i === activity.length - 1) continue;
        break;
      }
    }

    for (const day of activity) {
      if (day.count > 0) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    const totalActiveDays = Array.from(dateCountMap.values()).filter(
      (cnt) => cnt > 0,
    ).length;

    return {
      activity,
      totalActiveDays,
      currentStreak,
      longestStreak,
    };
  }
}
