import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { DEFAULT_TEMPLATE_PATHS } from '../resume/extractors/deterministic-career-data.extractor.js';

export interface DailyTask {
  id: string;
  dayNumber: number;
  dayLabel: string;
  title: string;
  learningFocus: string;
  actionItem: string;
  duration: string;
  isCompleted: boolean;
  completedAt?: string | null;
}

export interface MilestoneTemplate {
  weekRange: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  dailyTasks?: DailyTask[];
}

export function generateDefaultDailyTasks(
  milestoneTitle: string,
  milestoneCategory: string,
  _weekRange: string,
): DailyTask[] {
  return [
    {
      id: 'd1',
      dayNumber: 1,
      dayLabel: 'Day 1',
      title: `${milestoneCategory} Foundations & Paradigm Review`,
      learningFocus: `Study core trade-offs, architecture specifications, and design contracts for ${milestoneTitle}.`,
      actionItem: `Author an engineering design note outlining pros/cons vs alternative patterns.`,
      duration: '2.5 hrs',
      isCompleted: false,
    },
    {
      id: 'd2',
      dayNumber: 2,
      dayLabel: 'Day 2',
      title: `High-Scale Production Patterns & Edge Cases`,
      learningFocus: `Investigate concurrency bottlenecks, failure modes, and resilient fallback mechanisms.`,
      actionItem: `Draw sequence and data-flow diagrams illustrating failure boundaries and recovery paths.`,
      duration: '2.5 hrs',
      isCompleted: false,
    },
    {
      id: 'd3',
      dayNumber: 3,
      dayLabel: 'Day 3',
      title: `Hands-on Lab: Implementation & Benchmarking`,
      learningFocus: `Examine SDKs, CLI workflows, and configuration manifests applicable to this domain.`,
      actionItem: `Write a modular, runnable code prototype with automated unit and regression tests.`,
      duration: '3.0 hrs',
      isCompleted: false,
    },
    {
      id: 'd4',
      dayNumber: 4,
      dayLabel: 'Day 4',
      title: `Security Boundaries, Observability & SLO Calibration`,
      learningFocus: `Define telemetry metrics (SLIs/SLOs), distributed tracing, and least-privilege policies.`,
      actionItem: `Instrument structured logging and verify boundary authorization against attack vectors.`,
      duration: '2.5 hrs',
      isCompleted: false,
    },
    {
      id: 'd5',
      dayNumber: 5,
      dayLabel: 'Day 5',
      title: `Sprint Synthesis & Deliverable Checkpoint`,
      learningFocus: `Review end-to-end integration, operational runbooks, and real-world deployment criteria.`,
      actionItem: `Publish reproducible artifact to your portfolio project repository for peer calibration.`,
      duration: '3.5 hrs',
      isCompleted: false,
    },
  ];
}

const ROLE_MILESTONE_MAP: Record<string, MilestoneTemplate[]> = {
  'cloud-architect': [
    {
      weekRange: 'Week 1 - 2',
      title: 'Distributed Systems & Consensus Fundamentals',
      description:
        'Master CAP theorem trade-offs, Paxos/Raft consensus algorithms, and fault tolerance paradigms in large-scale multi-region setups.',
      category: 'Architecture',
      duration: '15 hrs',
    },
    {
      weekRange: 'Week 3 - 4',
      title: 'AWS Well-Architected Framework & VPC Networking',
      description:
        'Architect multi-AZ networks with Transit Gateways, Direct Connect redundancy, and cost-effective disaster recovery topologies.',
      category: 'Cloud',
      duration: '18 hrs',
    },
    {
      weekRange: 'Week 5 - 6',
      title: 'Infrastructure as Code (IaC) with Terraform & Terragrunt',
      description:
        'Write modular, reusable infrastructure manifests with automated drift detection, state locking in DynamoDB, and policy-as-code.',
      category: 'DevOps',
      duration: '14 hrs',
    },
    {
      weekRange: 'Week 7 - 8',
      title: 'Enterprise Security, Zero-Trust Posture & IAM Boundary Governance',
      description:
        'Implement least-privilege IAM service control policies, KMS key rotations, and mTLS communication across microservices.',
      category: 'Security',
      duration: '12 hrs',
    },
    {
      weekRange: 'Week 9 - 10',
      title: 'Capstone: Multi-Tenant Enterprise Cloud Architecture Blueprint',
      description:
        'Design a comprehensive end-to-end architecture RFC with automated deployment pipelines and operational runbooks.',
      category: 'Capstone',
      duration: '20 hrs',
    },
  ],
  'ai-ml-engineer': [
    {
      weekRange: 'Week 1 - 2',
      title: 'LLM Foundations, Attention Mechanisms & PyTorch Fine-Tuning',
      description:
        'Understand transformer internals, LoRA/QLoRA parameter-efficient fine-tuning, and gradient accumulation strategies.',
      category: 'AI Systems',
      duration: '16 hrs',
    },
    {
      weekRange: 'Week 3 - 4',
      title: 'High-Performance Vector Databases & Hybrid Retrieval Telemetry',
      description:
        'Benchmark vector indexing algorithms (HNSW, IVFFlat), implement hybrid BM25 + dense embedding retrieval, and optimize latency.',
      category: 'Data & Search',
      duration: '14 hrs',
    },
    {
      weekRange: 'Week 5 - 6',
      title: 'Scalable Model Serving with vLLM, Triton & GPU Orchestration',
      description:
        'Deploy low-latency inference servers with PagedAttention, continuous batching, and Kubernetes GPU operator scheduling.',
      category: 'Platform',
      duration: '18 hrs',
    },
    {
      weekRange: 'Week 7 - 8',
      title: 'Agentic Workflows, Tool Use & LLM Evaluation Frameworks',
      description:
        'Build robust autonomous agents with LangGraph, implement structured tool calling, and track evaluation metrics with Ragas.',
      category: 'Agents & Eval',
      duration: '15 hrs',
    },
    {
      weekRange: 'Week 9 - 10',
      title: 'Capstone: Enterprise AI Copilot Engine with Guardrails & Observability',
      description:
        'Deploy a full-stack generative AI assistant with OpenTelemetry tracing, toxicity guardrails, and automated regression testing.',
      category: 'Capstone',
      duration: '20 hrs',
    },
  ],
  'staff-engineer': [
    {
      weekRange: 'Week 1 - 2',
      title: 'Cross-Organization Architectural Governance & RFC Frameworks',
      description:
        'Establish technical decision-making processes, write structured RFCs for critical initiatives, and drive consensus across squads.',
      category: 'Leadership',
      duration: '12 hrs',
    },
    {
      weekRange: 'Week 3 - 4',
      title: 'High-Scale Distributed Storage & Real-Time Event Streaming',
      description:
        'Architect event-driven platforms with Apache Kafka, outbox patterns, schema registries, and idempotent consumer workers.',
      category: 'Architecture',
      duration: '18 hrs',
    },
    {
      weekRange: 'Week 5 - 6',
      title: 'Organizational Engineering Velocity, Observability & SLO Management',
      description:
        'Define meaningful SLIs/SLOs, conduct blameless postmortems, and eliminate systemic engineering friction.',
      category: 'Strategy',
      duration: '14 hrs',
    },
    {
      weekRange: 'Week 7 - 8',
      title: 'Tech Debt Prioritization & Executive Alignment',
      description:
        'Quantify business risk of technical debt, negotiate engineering investments with executive leadership, and mentor senior talent.',
      category: 'Delivery',
      duration: '12 hrs',
    },
    {
      weekRange: 'Week 9 - 10',
      title: 'Technical Vision & Multi-Year Platform Evolution Strategy',
      description:
        'Author a multi-year technical roadmap balancing immediate customer delivery with strategic architectural scalability.',
      category: 'Capstone',
      duration: '16 hrs',
    },
  ],
};

const DEFAULT_GENERIC_MILESTONES: MilestoneTemplate[] = [
  {
    weekRange: 'Week 1 - 2',
    title: 'Core Architecture & System Decomposition',
    description:
      'Analyze architectural patterns, decompose monolithic domains into clean boundaries, and solidify API contracts.',
    category: 'Foundations',
    duration: '14 hrs',
  },
  {
    weekRange: 'Week 3 - 4',
    title: 'Advanced Domain Modeling & High-Scale Design',
    description:
      'Implement domain-driven design, transactional integrity, caching strategies with Redis, and database query optimization.',
    category: 'Engineering',
    duration: '16 hrs',
  },
  {
    weekRange: 'Week 5 - 6',
    title: 'Production Infrastructure, Observability & CI/CD Hardening',
    description:
      'Build automated testing matrices, containerized deployments, zero-downtime release pipelines, and monitoring dashboards.',
    category: 'Platform',
    duration: '15 hrs',
  },
  {
    weekRange: 'Week 7 - 8',
    title: 'Security, Performance Optimization & Reliability Engineering',
    description:
      'Audit OWASP vulnerabilities, optimize runtime CPU/memory profiles, and run automated resilience and chaos experiments.',
    category: 'Reliability',
    duration: '14 hrs',
  },
  {
    weekRange: 'Week 9 - 10',
    title: 'Capstone: Production Transition Project & Architecture Portfolio',
    description:
      'Assemble a production-ready reference application showcasing your mastery of target role competencies.',
    category: 'Capstone',
    duration: '18 hrs',
  },
];

@Injectable()
export class RoadmapService {
  private readonly logger = new Logger(RoadmapService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCareerPaths(userId: string) {
    const profile = await this.prisma.careerProfile.findUnique({
      where: { userId },
    });

    if (profile?.suggestedPaths && Array.isArray(profile.suggestedPaths)) {
      return profile.suggestedPaths;
    }

    return DEFAULT_TEMPLATE_PATHS;
  }

  async selectCareerPath(userId: string, pathId: string, title?: string) {
    let profile = await this.prisma.careerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      // Auto-create basic profile if user jumps straight into paths
      profile = await this.prisma.careerProfile.create({
        data: {
          userId,
          currentRole: 'Software Engineer',
          yearsOfExperience: 3,
          skills: ['TypeScript', 'React', 'Node.js'],
        },
      });
    }

    // Determine target title from suggestedPaths or fallback
    let targetTitle = title?.trim();
    if (!targetTitle) {
      const paths = (profile.suggestedPaths as any[]) || DEFAULT_TEMPLATE_PATHS;
      const match = paths.find((p) => p.id === pathId);
      targetTitle = match?.title || pathId.replace(/-/g, ' ');
    }
    const finalTargetTitle = targetTitle || 'Software Engineer';

    // 1. Update CareerProfile with chosen targetRole
    await this.prisma.careerProfile.update({
      where: { id: profile.id },
      data: { targetRole: finalTargetTitle },
    });

    // 2. Select matching milestones template
    const milestoneTemplates =
      ROLE_MILESTONE_MAP[pathId] || DEFAULT_GENERIC_MILESTONES;

    // 3. Create fresh Roadmap record and seed milestones
    const roadmap: any = await this.prisma.roadmap.create({
      data: {
        careerProfileId: profile.id,
        targetRole: finalTargetTitle,
        estimatedMonths: 6,
        progressPercent: 0,
        milestones: {
          create: milestoneTemplates.map((m, index) => {
            const daily =
              m.dailyTasks && m.dailyTasks.length > 0
                ? m.dailyTasks
                : generateDefaultDailyTasks(m.title, m.category, m.weekRange);
            return {
              weekRange: m.weekRange,
              title: m.title,
              description: JSON.stringify({
                summary: m.description,
                dailyTasks: daily,
              }),
              category: m.category,
              duration: m.duration,
              isCompleted: false,
              order: index + 1,
            };
          }),
        },
      },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
        },
      },
    });

    this.logger.log(
      `User "${userId}" locked target role "${finalTargetTitle}" with ${roadmap?.milestones?.length || 0} milestones.`,
    );

    return {
      ...roadmap,
      milestones: (roadmap.milestones || []).map((m: any) =>
        this.hydrateMilestone(m),
      ),
    };
  }

  private hydrateMilestone(m: any) {
    let summary = m.description;
    let dailyTasks: DailyTask[] = [];

    try {
      const parsed = JSON.parse(m.description);
      if (parsed && Array.isArray(parsed.dailyTasks)) {
        summary = parsed.summary || m.description;
        dailyTasks = parsed.dailyTasks;
      } else {
        dailyTasks = generateDefaultDailyTasks(
          m.title,
          m.category,
          m.weekRange,
        );
      }
    } catch {
      dailyTasks = generateDefaultDailyTasks(
        m.title,
        m.category,
        m.weekRange,
      );
    }

    return {
      ...m,
      description: summary,
      dailyTasks,
    };
  }

  async getRoadmap(userId: string) {
    const profile = await this.prisma.careerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return null;
    }

    let roadmap: any = await this.prisma.roadmap.findFirst({
      where: { careerProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // If targetRole is set but no roadmap records exist, automatically generate one!
    if (!roadmap && profile.targetRole) {
      const pathKey = profile.targetRole
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
      roadmap = await this.selectCareerPath(
        userId,
        pathKey,
        profile.targetRole,
      );
    }

    if (!roadmap) {
      return null;
    }

    const mappedMilestones = (roadmap.milestones || []).map((m: any) =>
      this.hydrateMilestone(m),
    );

    return {
      ...roadmap,
      milestones: mappedMilestones,
    };
  }

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

    // Hydrate current daily tasks and sync their state with milestone
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
        completedTasks += updatedDailyTasks.filter((t: DailyTask) => t.isCompleted).length;
        continue;
      }
      const h = this.hydrateMilestone(m);
      totalTasks += h.dailyTasks.length;
      completedTasks += h.dailyTasks.filter((t: DailyTask) => t.isCompleted).length;
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
        completedTasks += updatedDailyTasks.filter((t: DailyTask) => t.isCompleted).length;
        continue;
      }
      const h = this.hydrateMilestone(m);
      totalTasks += h.dailyTasks.length;
      completedTasks += h.dailyTasks.filter((t: DailyTask) => t.isCompleted).length;
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

  async getActivityLogs(userId: string, days = 84) {
    const profile = await this.prisma.careerProfile.findUnique({
      where: { userId },
    });
    if (!profile) return { activity: [], totalActiveDays: 0, currentStreak: 0, longestStreak: 0 };

    const roadmap: any = await this.prisma.roadmap.findFirst({
      where: { careerProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        milestones: { orderBy: { order: 'asc' } },
      },
    });

    if (!roadmap) return { activity: [], totalActiveDays: 0, currentStreak: 0, longestStreak: 0 };

    const dateCountMap = new Map<string, number>();

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

    const now = new Date();
    const activity: Array<{ date: string; count: number; level: number }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const count = dateCountMap.get(iso) || 0;
      const level = count === 0 ? 0 : count <= 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4;
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

    const totalActiveDays = Array.from(dateCountMap.values()).filter((cnt) => cnt > 0).length;

    return {
      activity,
      totalActiveDays,
      currentStreak,
      longestStreak,
    };
  }
}
