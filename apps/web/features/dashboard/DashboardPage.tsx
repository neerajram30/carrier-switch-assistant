'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import {
  Chart,
  bar,
  line,
  area,
  ChartAxis,
  ChartGrid,
} from '@astryxdesign/charts';
import {
  BarChart3,
  Compass,
  Flame,
  Layers,
  Sparkles,
  TrendingUp,
  Upload,
  Zap,
} from 'lucide-react';

import { InternalPageLayout } from '@/features/navigation/InternalPageLayout';

interface UserProfile {
  currentRole: string;
  yearsOfExperience: string;
  skills: string[];
  targetRole?: string;
  summary?: string;
}

interface DashboardPageProps {
  initialProfile?: UserProfile;
}

interface StudyMilestone {
  id: string;
  week: string;
  title: string;
  description: string;
  duration: string;
  completed: boolean;
  category: string;
  dailyTasks?: Array<{
    id: string;
    dayNumber: number;
    title: string;
    isCompleted: boolean;
    duration?: string;
    completedAt?: string | null;
  }>;
}

interface ActivityResponse {
  activity: Array<{ date: string; count: number; level: number }>;
  totalActiveDays: number;
  currentStreak: number;
  longestStreak: number;
}

interface BackendMilestoneItem {
  id: string;
  weekRange: string;
  title: string;
  description: string;
  duration: string;
  isCompleted: boolean;
  category: string;
  dailyTasks?: Array<{
    id: string;
    dayNumber: number;
    dayLabel: string;
    title: string;
    learningFocus: string;
    actionItem: string;
    duration: string;
    isCompleted: boolean;
  }>;
}

const DEFAULT_PROFILE: UserProfile = {
  currentRole: 'Frontend Developer',
  yearsOfExperience: '4',
  skills: [
    'JavaScript',
    'TypeScript',
    'React',
    'Next.js',
    'Node.js',
    'Python',
    'PostgreSQL',
    'AWS',
    'Git',
    'Tailwind CSS',
  ],
  targetRole: '',
  summary: '',
};

export function DashboardPage({ initialProfile }: DashboardPageProps) {
  const [profile, setProfile] = useState<UserProfile>(() => {
    if (initialProfile) return initialProfile;
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('csa_career_profile');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.currentRole) {
            return {
              ...DEFAULT_PROFILE,
              currentRole: parsed.currentRole,
              yearsOfExperience: parsed.yearsOfExperience || DEFAULT_PROFILE.yearsOfExperience,
              skills: Array.isArray(parsed.skills) && parsed.skills.length > 0 ? (parsed.skills as string[]) : DEFAULT_PROFILE.skills,
              targetRole: parsed.targetRole || DEFAULT_PROFILE.targetRole,
              summary: parsed.summary || DEFAULT_PROFILE.summary,
            };
          }
        }
      } catch {
        // Fallback to default
      }
    }
    return DEFAULT_PROFILE;
  });

  const [milestones, setMilestones] = useState<StudyMilestone[]>([]);
  const [activityData, setActivityData] = useState<ActivityResponse | null>(null);

  // Load dynamically from backend roadmap or fallback to session storage
  useEffect(() => {
    async function fetchRoadmapAndActivity() {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      try {
        const [roadmapRes, activityRes] = await Promise.all([
          fetch(`${apiUrl}/api/v1/roadmap`, {
            headers: { 'x-user-id': '00000000-0000-0000-0000-000000000001' },
          }),
          fetch(`${apiUrl}/api/v1/roadmap/activity`, {
            headers: { 'x-user-id': '00000000-0000-0000-0000-000000000001' },
          }),
        ]);

        if (roadmapRes.ok) {
          const data = await roadmapRes.json();
          if (data && data.milestones) {
            setMilestones(
              data.milestones.map((m: BackendMilestoneItem) => {
                let dailyTasks = m.dailyTasks;
                if (!dailyTasks && typeof m.description === 'string') {
                  try {
                    const parsed = JSON.parse(m.description);
                    if (Array.isArray(parsed.dailyTasks)) {
                      dailyTasks = parsed.dailyTasks;
                    }
                  } catch {
                    // plain text
                  }
                }
                return {
                  id: m.id,
                  week: m.weekRange,
                  title: m.title,
                  description: m.description,
                  duration: m.duration,
                  completed: m.isCompleted,
                  category: m.category,
                  dailyTasks: dailyTasks || [],
                };
              }),
            );
            if (data.targetRole) {
              setProfile((prev) => ({ ...prev, targetRole: data.targetRole }));
            }
          }
        }

        if (activityRes.ok) {
          const act = await activityRes.json();
          setActivityData(act);
        }
      } catch {
        // Fallback to storage
      }
    }

    void fetchRoadmapAndActivity();
  }, []);

  const hasSelectedPath = Boolean(profile.targetRole && profile.targetRole.trim().length > 0);
  const targetRole = profile.targetRole;
  const skills = profile.skills.length > 0 ? profile.skills : ['TypeScript', 'React', 'Node.js'];

  const completedCount = milestones.filter((m) => m.completed).length;
  const progressPercent = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  // Derive weekly task completion data for Astryx bar chart
  const weeklyVelocityData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // If activityData is present, use last 7 days from API
    if (activityData && activityData.activity.length >= 7) {
      const recent7 = activityData.activity.slice(-7);
      return recent7.map((item) => {
        const dayDate = new Date(item.date);
        const dayIdx = (dayDate.getDay() + 6) % 7; // Monday = 0
        return {
          day: days[dayIdx] || 'Day',
          tasks: item.count,
        };
      });
    }

    // Count real completed daily tasks across milestones
    let totalDone = 0;
    milestones.forEach((m) => {
      if (m.dailyTasks) {
        totalDone += m.dailyTasks.filter((t) => t.isCompleted).length;
      } else if (m.completed) {
        totalDone += 5;
      }
    });

    const weights = [0.2, 0.25, 0.15, 0.25, 0.15, 0, 0];
    return days.map((day, idx) => ({
      day,
      tasks: totalDone > 0 ? Math.max(0, Math.round(totalDone * weights[idx])) : idx < 3 ? idx + 1 : 0,
    }));
  }, [milestones, activityData]);

  // Derive sprint stage trajectory for Astryx line/area chart
  const sprintTrajectoryData = useMemo(() => {
    if (milestones.length === 0) {
      return [
        { sprint: 'Sprint 1', readiness: 15 },
        { sprint: 'Sprint 2', readiness: 35 },
        { sprint: 'Sprint 3', readiness: 55 },
        { sprint: 'Sprint 4', readiness: 78 },
        { sprint: 'Sprint 5', readiness: 100 },
      ];
    }
    let cumulative = 0;
    const step = 100 / milestones.length;
    return milestones.map((m, idx) => {
      if (m.completed) cumulative += step;
      return {
        sprint: `S${idx + 1}`,
        readiness: Math.min(100, Math.round(cumulative)),
      };
    });
  }, [milestones]);

  // Total study hours
  const totalEstimatedHours = useMemo(() => {
    return milestones.reduce((acc, m) => {
      const match = m.duration?.match(/\d+/);
      return acc + (match ? parseInt(match[0], 10) : 15);
    }, 0);
  }, [milestones]);

  const completedEstimatedHours = useMemo(() => {
    return milestones
      .filter((m) => m.completed)
      .reduce((acc, m) => {
        const match = m.duration?.match(/\d+/);
        return acc + (match ? parseInt(match[0], 10) : 15);
      }, 0);
  }, [milestones]);

  // 12-week heatmap data (84 days)
  const heatmapDays = useMemo(() => {
    if (activityData && activityData.activity.length > 0) {
      return activityData.activity;
    }
    // Generate synthetic 84 days with baseline progression for aesthetic presentation
    const days: Array<{ date: string; count: number; level: number }> = [];
    const now = new Date();
    for (let i = 83; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      // Random deterministic density matching completed milestones
      const activeSeed = (i * 17) % 7;
      const count = activeSeed > 4 ? activeSeed - 3 : 0;
      const level = count === 0 ? 0 : count <= 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4;
      days.push({ date: iso, count, level });
    }
    return days;
  }, [activityData]);

  // Group 84 days into 12 columns of 7 rows (weeks)
  const heatmapWeeks = useMemo(() => {
    const weeks: Array<Array<{ date: string; count: number; level: number }>> = [];
    for (let i = 0; i < heatmapDays.length; i += 7) {
      weeks.push(heatmapDays.slice(i, i + 7));
    }
    return weeks;
  }, [heatmapDays]);

  // Radial gauge geometry calculation (circumference: 2 * PI * 34 ≈ 213.6)
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Heatmap block color resolver based on level (0-4)
  const getCellColor = (level: number) => {
    switch (level) {
      case 1:
        return 'rgba(152, 164, 247, 0.35)'; // Light periwinkle
      case 2:
        return 'rgba(91, 99, 211, 0.65)';  // Iris Blue
      case 3:
        return '#7C87F7';                   // Bright Periwinkle
      case 4:
        return '#86EFAC';                   // Mint success
      default:
        return 'var(--color-void-black, #0f101a)';
    }
  };

  return (
    <InternalPageLayout
      badge="Dashboard"
      title="Roadmap study progress"
      current="dashboard"
      maxWidth='100%'
    >
      {/* Wireframe Hero Card: Minimal Profile Baseline */}
      <Card
        variant="default"
        elevation="low"
        style={{
          background: 'var(--color-carbon-surface, #151621)',
          border: '1px solid var(--color-gunmetal, #1f2433)',
          boxShadow: 'var(--shadow-subtle, rgba(255, 255, 255, 0.25) 0px 1px 3px 0px inset)',
          padding: '24px 28px',
        }}
      >
        <HStack justify="between" align="center" wrap="wrap" gap={4}>
          <VStack gap={2} style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-periwinkle-glow, #98a4f7)',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                ROADMAP STUDY PROGRESS // BASELINE LOCKED
              </span>
              <span style={{ color: 'var(--color-muted-steel, #646e87)' }}>•</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <StatusDot variant="success" label="Active" />
                <span style={{ fontSize: '0.75rem', color: '#86EFAC', fontWeight: 500 }}>
                  Baseline Ready
                </span>
              </div>
            </div>

            <Heading level={1} weight="bold">
              Transition Trajectory &amp; Study Dashboard
            </Heading>

            {/* Origin -> Destination Horizon Pills */}
            <HStack gap={3} align="center" wrap="wrap" style={{ marginTop: 4 }}>
              <div
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: 'var(--color-void-black, #0f101a)',
                  border: '1px solid var(--color-gunmetal, #1f2433)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <Text
                    type="supporting"
                    color="secondary"
                    style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}
                  >
                    Current Origin Baseline
                  </Text>
                  <Link href="/onboarding" style={{ textDecoration: 'none' }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        color: 'var(--color-periwinkle-glow, #98a4f7)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        cursor: 'pointer',
                      }}
                    >
                      <Upload size={10} />
                      Re-upload
                    </span>
                  </Link>
                </div>
                <Text type="body" weight="semibold">
                  {profile.currentRole} ({profile.yearsOfExperience} yrs)
                </Text>
              </div>

              <span
                style={{
                  color: 'var(--color-periwinkle-glow, #98a4f7)',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                }}
              >
                ──▶
              </span>

              <div
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: hasSelectedPath
                    ? 'rgba(91, 99, 211, 0.15)'
                    : 'rgba(255, 255, 255, 0.04)',
                  border: hasSelectedPath
                    ? '1px solid rgba(91, 99, 211, 0.35)'
                    : '1px dashed var(--color-gunmetal, #1f2433)',
                }}
              >
                <Text
                  type="supporting"
                  style={{
                    fontSize: '0.7rem',
                    color: hasSelectedPath ? 'var(--color-frost, #c9d3ee)' : 'var(--color-muted-steel, #646e87)',
                    textTransform: 'uppercase',
                  }}
                >
                  Target Horizon
                </Text>
                <Text
                  type="body"
                  weight="semibold"
                  style={{
                    color: hasSelectedPath ? 'var(--color-pure-white, #ffffff)' : 'var(--color-frost, #c9d3ee)',
                  }}
                >
                  {hasSelectedPath ? targetRole : 'No Path Selected Yet (Pick in Explore Paths)'}
                </Text>
              </div>
            </HStack>
          </VStack>

          {/* Graphical Radial Progress Arc Gauge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '16px 22px',
              borderRadius: 14,
              background: 'var(--color-void-black, #0f101a)',
              border: '1px solid var(--color-gunmetal, #1f2433)',
            }}
          >
            <div style={{ position: 'relative', width: 80, height: 80 }}>
              <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Track */}
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  fill="transparent"
                  stroke="#1f2433"
                  strokeWidth="7"
                />
                {/* Active Progress Arc */}
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  fill="transparent"
                  stroke={hasSelectedPath ? (progressPercent > 70 ? '#86EFAC' : '#98a4f7') : '#646e87'}
                  strokeWidth="7"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                }}
              >
                <span
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    lineHeight: 1,
                    color: hasSelectedPath ? '#ffffff' : 'var(--color-muted-steel, #646e87)',
                  }}
                >
                  {progressPercent}%
                </span>
              </div>
            </div>

            <VStack gap={0} align="start">
              <Text type="body" weight="semibold">
                {hasSelectedPath ? 'Roadmap Completed' : 'Study Progress'}
              </Text>
              <Text type="supporting" color="secondary" style={{ fontSize: '0.75rem' }}>
                {hasSelectedPath
                  ? `${completedCount} of ${milestones.length} milestones finished`
                  : 'Awaiting path selection'}
              </Text>
              {hasSelectedPath && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    marginTop: 4,
                    fontSize: '0.72rem',
                    color: '#86EFAC',
                  }}
                >
                  <Flame size={12} />
                  <span>{completedEstimatedHours} / {totalEstimatedHours} hrs logged</span>
                </div>
              )}
            </VStack>
          </div>
        </HStack>
      </Card>

      {/* MINIMAL DETAILS STATE: When user hasn't selected a path yet */}
      {!hasSelectedPath ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr',
            gap: 20,
            width: '100%',
          }}
        >
          {/* Primary Action Hero Callout: Choose Your Target Career Path */}
          <div
            style={{
              background: 'var(--color-carbon-surface, #151621)',
              border: '1px solid var(--color-periwinkle-glow, #98a4f7)',
              boxShadow:
                '0 0 25px rgba(152, 164, 247, 0.12), var(--shadow-subtle, rgba(255, 255, 255, 0.25) 0px 1px 3px 0px inset)',
              borderRadius: 16,
              padding: '32px 28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 20,
            }}
          >
            <VStack gap={3}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 9999,
                  background: 'rgba(91, 99, 211, 0.18)',
                  color: 'var(--color-periwinkle-glow, #98a4f7)',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  width: 'fit-content',
                }}
              >
                <Sparkles size={14} />
                <span>STEP 2: CHOOSE YOUR CAREER PATH</span>
              </div>

              <Heading level={2} weight="semibold" style={{ fontSize: '1.45rem', margin: 0 }}>
                Ready to select your target transition horizon
              </Heading>

              <Text type="supporting" color="secondary" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                Your baseline profile is confirmed with <strong style={{ color: '#ffffff' }}>{skills.length} verified skills</strong> and <strong style={{ color: '#ffffff' }}>{profile.yearsOfExperience} years of experience</strong> as a {profile.currentRole}.
                <br />
                To unlock your personalized study roadmap, weekly completion analytics, and graphical flight deck metrics, explore our interactive constellation of 8+ engineering career options.
              </Text>
            </VStack>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link href="/dashboard/explore" style={{ textDecoration: 'none' }}>
                <button
                  type="button"
                  style={{
                    background: 'linear-gradient(353deg, rgb(91, 99, 211) 17.51%, rgb(124, 135, 247) 183.08%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 9999,
                    padding: '12px 26px',
                    fontSize: '0.94rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: 'var(--shadow-subtle, rgba(255, 255, 255, 0.25) 0px 1px 3px 0px inset)',
                  }}
                >
                  <Compass size={16} />
                  <span>Explore Career Paths Constellation →</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Right Column: Verified Baseline Skills */}
          <div
            style={{
              background: 'var(--color-carbon-surface, #151621)',
              border: '1px solid var(--color-gunmetal, #1f2433)',
              boxShadow: 'var(--shadow-subtle, rgba(255, 255, 255, 0.25) 0px 1px 3px 0px inset)',
              borderRadius: 14,
              padding: 22,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={16} style={{ color: 'var(--color-periwinkle-glow, #98a4f7)' }} />
                <Heading level={3} weight="medium" style={{ fontSize: '0.98rem', margin: 0 }}>
                  Verified Baseline Skills ({skills.length})
                </Heading>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#86EFAC' }}>Verified</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {skills.map((skill) => (
                <Token key={skill} label={skill} size="sm" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* GRAPHICAL DASHBOARD: Graphical completion visualizations */
        <VStack gap={5} width="100%">
          {/* SECTION 2: Graphical Analytics Grid Powered by @astryxdesign/charts */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(380px, 1.2fr) minmax(340px, 1fr)',
              gap: 20,
              width: '100%',
            }}
          >
            {/* Chart A: Weekly Completion Velocity Bar Chart */}
            <Card
              variant="default"
              elevation="low"
              style={{
                background: 'var(--color-carbon-surface, #151621)',
                border: '1px solid var(--color-gunmetal, #1f2433)',
                padding: '22px 24px',
              }}
            >
              <VStack gap={3}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BarChart3 size={18} style={{ color: 'var(--color-periwinkle-glow, #98a4f7)' }} />
                    <Heading level={3} weight="medium">
                      Weekly Learning Velocity
                    </Heading>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#86EFAC', fontWeight: 600 }}>
                    Active Cadence
                  </span>
                </div>
                <Text type="supporting" color="secondary" style={{ fontSize: '0.8rem' }}>
                  Daily study task completions across the current weekly sprint cycle.
                </Text>

                {/* Astryx Bar Chart */}
                <div style={{ width: '100%', marginTop: 8 }}>
                  <Chart
                    data={weeklyVelocityData}
                    xKey="day"
                    series={[
                      bar('tasks', {
                        label: 'Tasks Completed',
                        color: 'var(--color-periwinkle-glow, #98a4f7)',
                        radius: 4,
                      }),
                    ]}
                    height={210}
                    grid={<ChartGrid horizontal />}
                    axes={
                      <>
                        <ChartAxis position="bottom" />
                        <ChartAxis position="left" />
                      </>
                    }
                    tooltip
                  />
                </div>
              </VStack>
            </Card>

            {/* Chart B: Target Readiness Cumulative Trajectory Curve */}
            <Card
              variant="default"
              elevation="low"
              style={{
                background: 'var(--color-carbon-surface, #151621)',
                border: '1px solid var(--color-gunmetal, #1f2433)',
                padding: '22px 24px',
              }}
            >
              <VStack gap={3}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={18} style={{ color: '#86EFAC' }} />
                    <Heading level={3} weight="medium">
                      Role Transition Trajectory
                    </Heading>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-periwinkle-glow, #98a4f7)', fontWeight: 600 }}>
                    {targetRole}
                  </span>
                </div>
                <Text type="supporting" color="secondary" style={{ fontSize: '0.8rem' }}>
                  Estimated cumulative transition competency across progressive sprint milestones.
                </Text>

                {/* Astryx Area & Line Chart */}
                <div style={{ width: '100%', marginTop: 8 }}>
                  <Chart
                    data={sprintTrajectoryData}
                    xKey="sprint"
                    series={[
                      area('readiness', {
                        color: 'var(--color-iris-blue, #5b63d3)',
                        opacity: 0.2,
                      }),
                      line('readiness', {
                        color: '#86EFAC',
                        label: 'Readiness %',
                      }),
                    ]}
                    height={210}
                    yDomain={[0, 100]}
                    grid={<ChartGrid horizontal />}
                    axes={
                      <>
                        <ChartAxis position="bottom" />
                        <ChartAxis position="left" />
                      </>
                    }
                    tooltip
                  />
                </div>
              </VStack>
            </Card>
          </div>

          {/* SECTION 3: 12-Week Study Streak Activity Matrix (Heatmap) */}
          <Card
            variant="default"
            elevation="low"
            style={{
              background: 'var(--color-carbon-surface, #151621)',
              border: '1px solid var(--color-gunmetal, #1f2433)',
              padding: '22px 24px',
            }}
          >
            <VStack gap={3}>
              <HStack justify="between" align="center" wrap="wrap">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Zap size={18} style={{ color: '#FBBF24' }} />
                  <Heading level={3} weight="medium">
                    12-Week Study Streak &amp; Habit Matrix
                  </Heading>
                </div>
                <HStack gap={4} align="center">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
                    <span style={{ color: 'var(--color-muted-steel, #646e87)' }}>Current Streak:</span>
                    <span style={{ color: '#FBBF24', fontWeight: 700 }}>
                      🔥 {activityData?.currentStreak || 3} days
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
                    <span style={{ color: 'var(--color-muted-steel, #646e87)' }}>Total Active:</span>
                    <span style={{ color: '#86EFAC', fontWeight: 700 }}>
                      {activityData?.totalActiveDays || 14} days
                    </span>
                  </div>
                </HStack>
              </HStack>

              <Text type="supporting" color="secondary" style={{ fontSize: '0.8rem' }}>
                Consistency heatmap displaying daily task completions across the last 84 days.
              </Text>

              {/* Heatmap Grid Matrix */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '16px 18px',
                  borderRadius: 12,
                  background: 'var(--color-void-black, #0f101a)',
                  border: '1px solid var(--color-gunmetal, #1f2433)',
                  overflowX: 'auto',
                }}
              >
                {/* 12 Columns (Weeks) */}
                {heatmapWeeks.map((week, wIdx) => (
                  <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {week.map((day, dIdx) => (
                      <div
                        key={dIdx}
                        title={`${day.date}: ${day.count} tasks completed`}
                        style={{
                          width: 15,
                          height: 15,
                          borderRadius: 3,
                          background: getCellColor(day.level),
                          border: day.level === 0 ? '1px solid #1f2433' : '1px solid transparent',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease',
                        }}
                      />
                    ))}
                  </div>
                ))}

                {/* Heatmap Legend */}
                <div
                  style={{
                    marginLeft: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.7rem',
                    color: 'var(--color-muted-steel, #646e87)',
                  }}
                >
                  <span>Less</span>
                  <div style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--color-void-black, #0f101a)', border: '1px solid #1f2433' }} />
                  <div style={{ width: 12, height: 12, borderRadius: 2, background: 'rgba(152, 164, 247, 0.35)' }} />
                  <div style={{ width: 12, height: 12, borderRadius: 2, background: 'rgba(91, 99, 211, 0.65)' }} />
                  <div style={{ width: 12, height: 12, borderRadius: 2, background: '#7C87F7' }} />
                  <div style={{ width: 12, height: 12, borderRadius: 2, background: '#86EFAC' }} />
                  <span>More</span>
                </div>
              </div>
            </VStack>
          </Card>

          {/* SECTION 4: Calibrated Horizon Competency Badges */}
          <Card
            variant="default"
            elevation="low"
            style={{
              background: 'var(--color-carbon-surface, #151621)',
              border: '1px solid var(--color-gunmetal, #1f2433)',
              padding: '20px 24px',
            }}
          >
            <VStack gap={3}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Heading level={3} weight="medium">
                  Calibrated Target Competencies ({targetRole})
                </Heading>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-muted-steel, #646e87)' }}>
                  Total {skills.length} core requirements
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {skills.map((s) => (
                  <Token key={s} label={s} size="sm" />
                ))}
              </div>
            </VStack>
          </Card>
        </VStack>
      )}
    </InternalPageLayout>
  );
}

export default DashboardPage;
