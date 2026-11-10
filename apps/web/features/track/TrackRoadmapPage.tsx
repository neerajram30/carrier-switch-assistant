'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { VStack } from '@astryxdesign/core/Stack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  ListTodo,
  Sparkles,
  Target,
  Terminal,
} from 'lucide-react';

import { InternalPageLayout } from '@/features/navigation/InternalPageLayout';

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

export interface TrackMilestone {
  id: string;
  week: string;
  title: string;
  description: string;
  duration: string;
  completed: boolean;
  category: string;
  dailyTasks: DailyTask[];
}

export interface ActiveRoadmapSummary {
  id: string;
  targetRole: string;
  progressPercent: number;
  milestonesCount?: number;
}

interface ApiMilestone {
  id: string;
  weekRange?: string;
  week?: string;
  title: string;
  description: string;
  duration: string;
  isCompleted?: boolean;
  completed?: boolean;
  category?: string;
  dailyTasks?: DailyTask[];
}

export function TrackRoadmapPage() {
  const searchParams = useSearchParams();
  const paramRoadmapId = searchParams?.get('roadmapId') || null;

  const [activeRoadmapId, setActiveRoadmapId] = useState<string | null>(paramRoadmapId);
  const [roadmaps, setRoadmaps] = useState<ActiveRoadmapSummary[]>([]);
  const [targetRole, setTargetRole] = useState<string>('');
  const [currentRole] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('csa_career_profile');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed.currentRole === 'string') {
            return parsed.currentRole;
          }
        }
      } catch {
        // Ignore fallback
      }
    }
    return 'Software Engineer';
  });
  const [milestones, setMilestones] = useState<TrackMilestone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({});
  const [syncTrigger, setSyncTrigger] = useState<number>(0);

  useEffect(() => {
    async function loadTrackData() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const query = activeRoadmapId ? `?roadmapId=${encodeURIComponent(activeRoadmapId)}` : '';
        const res = await fetch(`${apiUrl}/api/v1/roadmap${query}`, {
          headers: {
            'x-user-id': '00000000-0000-0000-0000-000000000001',
          },
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          const msg =
            errJson.message ||
            `Failed to load roadmap execution telemetry (${res.status} ${res.statusText})`;
          throw new Error(msg);
        }

        const data = await res.json();
        if (data) {
          if (Array.isArray(data.roadmaps)) {
            setRoadmaps(data.roadmaps);
          }
          if (data.id) {
            setActiveRoadmapId(data.id);
          }
          if (data.targetRole) {
            setTargetRole(data.targetRole);
          }
          if (Array.isArray(data.milestones)) {
            const mapped: TrackMilestone[] = data.milestones.map((m: ApiMilestone) => ({
              id: m.id,
              week: m.weekRange || m.week || 'Sprint',
              title: m.title,
              description: m.description,
              duration: m.duration,
              completed: Boolean(m.isCompleted ?? m.completed),
              category: m.category || 'Architecture',
              dailyTasks: Array.isArray(m.dailyTasks) ? m.dailyTasks : [],
            }));

            setMilestones(mapped);

            // Default expand first active milestone or first milestone
            const initialExpanded: Record<string, boolean> = {};
            const firstActive = mapped.find((m) => !m.completed);
            if (firstActive) {
              initialExpanded[firstActive.id] = true;
            } else if (mapped.length > 0) {
              initialExpanded[mapped[0].id] = true;
            }
            setExpandedMilestones(initialExpanded);
          } else {
            setMilestones([]);
          }
        }
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : 'Failed to synchronize roadmap execution plan with server.';
        setFetchError(errorMsg);
        setMilestones([]);
      } finally {
        setLoading(false);
      }
    }

    void loadTrackData();
  }, [activeRoadmapId, syncTrigger]);

  const handleSwitchRoadmap = (newRoadmapId: string) => {
    if (newRoadmapId === activeRoadmapId) return;
    setLoading(true);
    setFetchError(null);
    setActiveRoadmapId(newRoadmapId);
    if (typeof window !== 'undefined') {
      window.history.pushState(
        null,
        '',
        `/dashboard/track?roadmapId=${encodeURIComponent(newRoadmapId)}`,
      );
    }
  };

  const handleRetrySync = () => {
    setLoading(true);
    setFetchError(null);
    setSyncTrigger((prev) => prev + 1);
  };

  const toggleExpand = (id: string) => {
    setExpandedMilestones((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const allExp: Record<string, boolean> = {};
    milestones.forEach((m) => {
      allExp[m.id] = true;
    });
    setExpandedMilestones(allExp);
  };

  const collapseAll = () => {
    setExpandedMilestones({});
  };

  // Toggle whole milestone
  const handleToggleMilestone = async (milestoneId: string) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id === milestoneId) {
          const nextState = !m.completed;
          return {
            ...m,
            completed: nextState,
            dailyTasks: m.dailyTasks.map((t) => ({
              ...t,
              isCompleted: nextState,
            })),
          };
        }
        return m;
      }),
    );

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/v1/roadmap/milestones/${milestoneId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '00000000-0000-0000-0000-000000000001',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (typeof data.progressPercent === 'number' && activeRoadmapId) {
          setRoadmaps((prev) =>
            prev.map((r) =>
              r.id === activeRoadmapId
                ? { ...r, progressPercent: data.progressPercent }
                : r,
            ),
          );
        }
      }
    } catch {
      // Graceful degradation
    }
  };

  // Toggle individual daily task
  const handleToggleDailyTask = async (milestoneId: string, taskId: string) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id === milestoneId) {
          const updatedTasks = m.dailyTasks.map((t) =>
            t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t,
          );
          const allCompleted =
            updatedTasks.length > 0 && updatedTasks.every((t) => t.isCompleted);
          return {
            ...m,
            completed: allCompleted,
            dailyTasks: updatedTasks,
          };
        }
        return m;
      }),
    );

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(
        `${apiUrl}/api/v1/roadmap/milestones/${milestoneId}/tasks/${taskId}/toggle`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': '00000000-0000-0000-0000-000000000001',
          },
        },
      );

      if (res.ok) {
        const data = await res.json();
        if (typeof data.progressPercent === 'number' && activeRoadmapId) {
          setRoadmaps((prev) =>
            prev.map((r) =>
              r.id === activeRoadmapId
                ? { ...r, progressPercent: data.progressPercent }
                : r,
            ),
          );
        }
      }
    } catch {
      // Graceful degradation
    }
  };

  // Metrics calculation
  let totalDailyTasks = 0;
  let completedDailyTasks = 0;

  milestones.forEach((m) => {
    totalDailyTasks += m.dailyTasks.length;
    completedDailyTasks += m.dailyTasks.filter((t) => t.isCompleted).length;
  });

  const progressPercent =
    totalDailyTasks > 0
      ? Math.round((completedDailyTasks / totalDailyTasks) * 100)
      : milestones.length > 0
        ? Math.round(
            (milestones.filter((m) => m.completed).length / milestones.length) * 100,
          )
        : 0;

  const completedMilestonesCount = milestones.filter((m) => m.completed).length;

  const filteredMilestones = milestones.filter((m) => {
    if (filter === 'active') return !m.completed;
    if (filter === 'completed') return m.completed;
    return true;
  });

  const hasSelectedPath = Boolean(targetRole && targetRole.trim().length > 0);

  return (
    <InternalPageLayout
      maxWidth="100%"
      badge="ROADMAP EXECUTION TRACKER // DAILY SPRINT LOG"
      badgeIcon={<Target size={12} />}
      badgeSecondaryText="Daily Learning & Micro-Task Engine"
      title="Track Roadmap Progress"
      description={`Systematic daily execution plan calibrated from your ${currentRole} baseline toward ${
        hasSelectedPath ? targetRole : 'your chosen target role'
      }.`}
      current="track"
    >
      {/* ERROR STATE: Transparent error card with real message (NO fallback!) */}
      {fetchError && !loading && (
        <Card
          variant="default"
          elevation="low"
          style={{
            background: 'rgba(21, 22, 33, 0.95)',
            border: '1.5px solid rgba(239, 68, 68, 0.45)',
            padding: '36px 32px',
            textAlign: 'center',
            borderRadius: 16,
            boxShadow:
              '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 20px rgba(239, 68, 68, 0.2)',
          }}
        >
          <VStack gap={4} align="center">
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F87171',
              }}
            >
              <AlertTriangle size={26} />
            </div>
            <VStack gap={2} align="center">
              <Heading level={2} weight="semibold" style={{ color: '#ffffff' }}>
                Roadmap Synchronization Error
              </Heading>
              <Text
                type="supporting"
                color="secondary"
                style={{
                  maxWidth: 540,
                  lineHeight: 1.6,
                  color: '#FCA5A5',
                  wordBreak: 'break-word',
                }}
              >
                {fetchError}
              </Text>
            </VStack>
            <button
              type="button"
              onClick={handleRetrySync}
              style={{
                background:
                  'linear-gradient(353deg, rgb(91, 99, 211) 17.51%, rgb(124, 135, 247) 183.08%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 9999,
                padding: '10px 26px',
                fontSize: '0.88rem',
                fontWeight: 500,
                cursor: 'pointer',
                boxShadow: '0 0 16px rgba(91, 99, 211, 0.35)',
              }}
            >
              Retry Synchronization
            </button>
          </VStack>
        </Card>
      )}

      {/* EMPTY STATE */}
      {!loading && !fetchError && !hasSelectedPath && milestones.length === 0 && (
        <Card
          variant="default"
          elevation="low"
          style={{
            background: 'var(--color-carbon-surface, #151621)',
            border: '1px solid var(--color-gunmetal, #1f2433)',
            padding: '48px 32px',
            textAlign: 'center',
            borderRadius: 16,
          }}
        >
          <VStack gap={4} align="center">
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(91, 99, 211, 0.12)',
                border: '1px solid rgba(152, 164, 247, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-periwinkle-glow, #98a4f7)',
              }}
            >
              <Compass size={32} />
            </div>
            <VStack gap={2} align="center">
              <Heading level={2} weight="semibold">
                No Target Career Path Selected Yet
              </Heading>
              <Text
                type="supporting"
                color="secondary"
                style={{ maxWidth: 520, lineHeight: 1.6 }}
              >
                To generate your daily tasks, learning objectives, and weekly
                milestone sprints, explore our interactive trajectory constellation
                and lock in your target destination.
              </Text>
            </VStack>
            <Link href="/dashboard/explore" style={{ textDecoration: 'none' }}>
              <button
                type="button"
                id="explore-paths-cta"
                style={{
                  background:
                    'linear-gradient(353deg, rgb(91, 99, 211) 17.51%, rgb(124, 135, 247) 183.08%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 9999,
                  padding: '12px 28px',
                  fontSize: '0.96rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow:
                    '0 0 20px rgba(91, 99, 211, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.25)',
                }}
              >
                <span>Explore &amp; Select Career Path</span>
                <ArrowRight size={16} />
              </button>
            </Link>
          </VStack>
        </Card>
      )}

      {/* MAIN ROADMAP TRACK CONTENT */}
      {!loading && !fetchError && (hasSelectedPath || milestones.length > 0) && (
        <VStack gap={6} width="100%">
          {/* Executive Overview & Macro Progress Deck */}
          <div
            style={{
              background: 'var(--color-carbon-surface, #151621)',
              border: '1px solid var(--color-gunmetal, #1f2433)',
              borderRadius: 16,
              padding: '24px 28px',
              boxShadow:
                'var(--shadow-subtle, rgba(255, 255, 255, 0.25) 0px 1px 3px 0px inset)',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            {/* MULTI-ROADMAP SWITCHER BAR */}
            {roadmaps.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                  paddingBottom: 16,
                  borderBottom: '1px solid var(--color-gunmetal, #1f2433)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--color-muted-steel, #646e87)',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Active Roadmaps ({roadmaps.length}):
                  </span>

                  {roadmaps.map((rm) => {
                    const isCurrent =
                      rm.id === activeRoadmapId ||
                      rm.targetRole.toLowerCase() === targetRole.toLowerCase();

                    return (
                      <button
                        key={rm.id}
                        type="button"
                        onClick={() => handleSwitchRoadmap(rm.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 14px',
                          borderRadius: 9999,
                          background: isCurrent
                            ? 'linear-gradient(135deg, rgba(91, 99, 211, 0.4) 0%, rgba(21, 22, 33, 0.95) 100%)'
                            : 'rgba(21, 22, 33, 0.7)',
                          border: isCurrent
                            ? '1.5px solid var(--color-periwinkle-glow, #98a4f7)'
                            : '1px solid var(--color-gunmetal, #1f2433)',
                          boxShadow: isCurrent
                            ? '0 0 14px rgba(152, 164, 247, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.2)'
                            : 'none',
                          color: isCurrent
                            ? '#ffffff'
                            : 'var(--color-frost, #c9d3ee)',
                          fontSize: '0.78rem',
                          fontWeight: isCurrent ? 600 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                        }}
                      >
                        <span
                          style={{
                            color: isCurrent ? '#98a4f7' : '#646e87',
                          }}
                        >
                          🎯
                        </span>
                        <span>{rm.targetRole}</span>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 9999,
                            background: isCurrent
                              ? 'rgba(134, 239, 172, 0.22)'
                              : 'rgba(255, 255, 255, 0.06)',
                            color: isCurrent
                              ? '#86EFAC'
                              : 'var(--color-muted-steel, #646e87)',
                          }}
                        >
                          {rm.progressPercent}%
                        </span>
                      </button>
                    );
                  })}
                </div>

                <Link href="/dashboard/explore" style={{ textDecoration: 'none' }}>
                  <button
                    type="button"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 14px',
                      borderRadius: 9999,
                      background: 'rgba(91, 99, 211, 0.12)',
                      border: '1px dashed rgba(152, 164, 247, 0.35)',
                      color: 'var(--color-periwinkle-glow, #98a4f7)',
                      fontSize: '0.76rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>+ Explore Arena / Add Path</span>
                  </button>
                </Link>
              </div>
            )}

            {/* Trajectory Header & Action Buttons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'rgba(91, 99, 211, 0.15)',
                    border: '1px solid rgba(152, 164, 247, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-periwinkle-glow, #98a4f7)',
                  }}
                >
                  <ListTodo size={22} />
                </div>
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: 'var(--color-periwinkle-glow, #98a4f7)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Target Trajectory
                    </span>
                    <StatusDot variant="success" label="Active" />
                  </div>
                  <Heading
                    level={2}
                    weight="semibold"
                    style={{ fontSize: '1.4rem', margin: 0 }}
                  >
                    {targetRole || 'Software Engineer Trajectory'}
                  </Heading>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Button
                  label="Expand All"
                  variant="ghost"
                  size="sm"
                  onClick={expandAll}
                />
                <Button
                  label="Collapse All"
                  variant="ghost"
                  size="sm"
                  onClick={collapseAll}
                />
              </div>
            </div>

            {/* Macro Progress Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles
                    size={14}
                    style={{ color: 'var(--color-periwinkle-glow, #98a4f7)' }}
                  />
                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#ffffff',
                    }}
                  >
                    Roadmap Execution Progress
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color:
                      progressPercent === 100
                        ? '#86EFAC'
                        : 'var(--color-periwinkle-glow, #98a4f7)',
                  }}
                >
                  {progressPercent}% Complete
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: 10,
                  borderRadius: 9999,
                  background: 'var(--color-void-black, #0f101a)',
                  border: '1px solid var(--color-gunmetal, #1f2433)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progressPercent}%`,
                    background:
                      progressPercent === 100
                        ? '#10b981'
                        : 'linear-gradient(90deg, #5b63d3, #7c87f7, #38bdf8)',
                    borderRadius: 9999,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            {/* Summary Stat Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
                paddingTop: 12,
                borderTop: '1px solid var(--color-gunmetal, #1f2433)',
              }}
            >
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'var(--color-void-black, #0f101a)',
                  border: '1px solid var(--color-gunmetal, #1f2433)',
                }}
              >
                <span
                  style={{
                    fontSize: '0.74rem',
                    color: 'var(--color-muted-steel, #646e87)',
                  }}
                >
                  Daily Tasks Finished
                </span>
                <div
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    marginTop: 2,
                  }}
                >
                  {completedDailyTasks}{' '}
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 400,
                      color: 'var(--color-frost, #c9d3ee)',
                    }}
                  >
                    / {totalDailyTasks} Days
                  </span>
                </div>
              </div>

              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'var(--color-void-black, #0f101a)',
                  border: '1px solid var(--color-gunmetal, #1f2433)',
                }}
              >
                <span
                  style={{
                    fontSize: '0.74rem',
                    color: 'var(--color-muted-steel, #646e87)',
                  }}
                >
                  Sprints Completed
                </span>
                <div
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    marginTop: 2,
                  }}
                >
                  {completedMilestonesCount}{' '}
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 400,
                      color: 'var(--color-frost, #c9d3ee)',
                    }}
                  >
                    / {milestones.length} Sprints
                  </span>
                </div>
              </div>

              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'var(--color-void-black, #0f101a)',
                  border: '1px solid var(--color-gunmetal, #1f2433)',
                }}
              >
                <span
                  style={{
                    fontSize: '0.74rem',
                    color: 'var(--color-muted-steel, #646e87)',
                  }}
                >
                  Estimated Timeline
                </span>
                <div
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: 'var(--color-periwinkle-glow, #98a4f7)',
                    marginTop: 2,
                  }}
                >
                  4 - 6 Months
                </div>
              </div>

              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'var(--color-void-black, #0f101a)',
                  border: '1px solid var(--color-gunmetal, #1f2433)',
                }}
              >
                <span
                  style={{
                    fontSize: '0.74rem',
                    color: 'var(--color-muted-steel, #646e87)',
                  }}
                >
                  Study Pace
                </span>
                <div
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: '#86EFAC',
                    marginTop: 2,
                  }}
                >
                  ~8 hrs / week
                </div>
              </div>
            </div>
          </div>

          {/* Sprints Filter & Navigation Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setFilter('all')}
                style={{
                  background:
                    filter === 'all'
                      ? 'rgba(91, 99, 211, 0.2)'
                      : 'var(--color-void-black, #0f101a)',
                  color:
                    filter === 'all'
                      ? 'var(--color-periwinkle-glow, #98a4f7)'
                      : 'var(--color-muted-steel, #646e87)',
                  border:
                    filter === 'all'
                      ? '1px solid var(--color-periwinkle-glow, #98a4f7)'
                      : '1px solid var(--color-gunmetal, #1f2433)',
                  borderRadius: 9999,
                  padding: '6px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                All Sprints ({milestones.length})
              </button>

              <button
                type="button"
                onClick={() => setFilter('active')}
                style={{
                  background:
                    filter === 'active'
                      ? 'rgba(91, 99, 211, 0.2)'
                      : 'var(--color-void-black, #0f101a)',
                  color:
                    filter === 'active'
                      ? 'var(--color-periwinkle-glow, #98a4f7)'
                      : 'var(--color-muted-steel, #646e87)',
                  border:
                    filter === 'active'
                      ? '1px solid var(--color-periwinkle-glow, #98a4f7)'
                      : '1px solid var(--color-gunmetal, #1f2433)',
                  borderRadius: 9999,
                  padding: '6px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                In Progress ({milestones.length - completedMilestonesCount})
              </button>

              <button
                type="button"
                onClick={() => setFilter('completed')}
                style={{
                  background:
                    filter === 'completed'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'var(--color-void-black, #0f101a)',
                  color:
                    filter === 'completed'
                      ? '#86EFAC'
                      : 'var(--color-muted-steel, #646e87)',
                  border:
                    filter === 'completed'
                      ? '1px solid #10b981'
                      : '1px solid var(--color-gunmetal, #1f2433)',
                  borderRadius: 9999,
                  padding: '6px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Completed ({completedMilestonesCount})
              </button>
            </div>

            <span
              style={{
                fontSize: '0.78rem',
                color: 'var(--color-muted-steel, #646e87)',
              }}
            >
              Click individual daily checkboxes to log micro-task completions.
            </span>
          </div>

          {/* SPRINT ACCORDION LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {filteredMilestones.map((milestone) => {
              const isExpanded = Boolean(expandedMilestones[milestone.id]);
              const mTasks = milestone.dailyTasks || [];
              const mCompletedTasks = mTasks.filter((t) => t.isCompleted).length;
              const mProgress =
                mTasks.length > 0
                  ? Math.round((mCompletedTasks / mTasks.length) * 100)
                  : milestone.completed
                    ? 100
                    : 0;

              return (
                <div
                  key={milestone.id}
                  style={{
                    background: 'var(--color-carbon-surface, #151621)',
                    border: milestone.completed
                      ? '1px solid rgba(16, 185, 129, 0.35)'
                      : isExpanded
                        ? '1px solid rgba(152, 164, 247, 0.4)'
                        : '1px solid var(--color-gunmetal, #1f2433)',
                    borderRadius: 14,
                    overflow: 'hidden',
                    boxShadow: isExpanded
                      ? '0 8px 24px rgba(0, 0, 0, 0.45)'
                      : 'none',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  }}
                >
                  {/* Sprint Card Header */}
                  <div
                    style={{
                      padding: '18px 22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 14,
                      background: milestone.completed
                        ? 'rgba(16, 185, 129, 0.04)'
                        : isExpanded
                          ? 'rgba(91, 99, 211, 0.05)'
                          : 'transparent',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        flex: 1,
                        minWidth: 280,
                      }}
                    >
                      {/* Checkbox for entire sprint */}
                      <input
                        type="checkbox"
                        checked={milestone.completed}
                        onChange={() => handleToggleMilestone(milestone.id)}
                        aria-label={`Mark sprint ${milestone.title} as completed`}
                        style={{
                          width: 20,
                          height: 20,
                          accentColor: '#10b981',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      />

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: milestone.completed
                                ? '#86EFAC'
                                : 'var(--color-periwinkle-glow, #98a4f7)',
                              background: milestone.completed
                                ? 'rgba(16, 185, 129, 0.12)'
                                : 'rgba(91, 99, 211, 0.15)',
                              padding: '2px 8px',
                              borderRadius: 4,
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase',
                            }}
                          >
                            {`${milestone.week} // ${milestone.category}`}
                          </span>

                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: '0.74rem',
                              color: 'var(--color-muted-steel, #646e87)',
                            }}
                          >
                            <Clock size={12} />
                            {milestone.duration}
                          </span>
                        </div>

                        <Heading
                          level={3}
                          weight="medium"
                          style={{
                            fontSize: '1.08rem',
                            margin: 0,
                            color: milestone.completed
                              ? 'var(--color-frost, #c9d3ee)'
                              : '#ffffff',
                            textDecoration: milestone.completed
                              ? 'line-through'
                              : 'none',
                          }}
                        >
                          {milestone.title}
                        </Heading>
                      </div>
                    </div>

                    {/* Progress pill & Expand Button */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 100,
                            height: 6,
                            borderRadius: 9999,
                            background: 'var(--color-void-black, #0f101a)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${mProgress}%`,
                              height: '100%',
                              background:
                                mProgress === 100 ? '#10b981' : '#7c87f7',
                              borderRadius: 9999,
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color:
                              mProgress === 100
                                ? '#86EFAC'
                                : 'var(--color-frost, #c9d3ee)',
                          }}
                        >
                          {mCompletedTasks} / {mTasks.length} Days ({mProgress}%)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleExpand(milestone.id)}
                        aria-label={
                          isExpanded
                            ? 'Collapse daily tasks'
                            : 'Expand daily tasks'
                        }
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--color-gunmetal, #1f2433)',
                          borderRadius: 8,
                          padding: '6px 12px',
                          color: 'var(--color-frost, #c9d3ee)',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span>{isExpanded ? 'Hide Days' : 'View Days'}</span>
                        {isExpanded ? (
                          <ChevronUp size={15} />
                        ) : (
                          <ChevronDown size={15} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Daily Tasks & Learning Section */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: '16px 22px 24px',
                        borderTop: '1px solid var(--color-gunmetal, #1f2433)',
                        background: 'var(--color-void-black, #0f101a)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                      }}
                    >
                      {/* Sprint Overview */}
                      <Text
                        type="supporting"
                        color="secondary"
                        style={{
                          fontSize: '0.88rem',
                          lineHeight: 1.5,
                          maxWidth: 820,
                        }}
                      >
                        {milestone.description}
                      </Text>

                      {/* Daily Task List Header */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          paddingBottom: 4,
                          borderBottom:
                            '1px solid rgba(255, 255, 255, 0.06)',
                        }}
                      >
                        <Calendar
                          size={14}
                          style={{
                            color: 'var(--color-periwinkle-glow, #98a4f7)',
                          }}
                        />
                        <span
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: 'var(--color-frost, #c9d3ee)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          Daily Micro-Tasks &amp; Action Plan
                        </span>
                      </div>

                      {/* Daily Task Items */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12,
                        }}
                      >
                        {mTasks.map((task) => (
                          <div
                            key={task.id}
                            style={{
                              padding: '14px 16px',
                              borderRadius: 10,
                              background: task.isCompleted
                                ? 'rgba(16, 185, 129, 0.05)'
                                : 'var(--color-carbon-surface, #151621)',
                              border: task.isCompleted
                                ? '1px solid rgba(16, 185, 129, 0.3)'
                                : '1px solid var(--color-gunmetal, #1f2433)',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 14,
                              transition:
                                'background 0.15s ease, border-color 0.15s ease',
                            }}
                          >
                            {/* Checkbox for the day */}
                            <input
                              type="checkbox"
                              checked={task.isCompleted}
                              onChange={() =>
                                handleToggleDailyTask(milestone.id, task.id)
                              }
                              aria-label={`Toggle ${task.dayLabel}: ${task.title}`}
                              style={{
                                marginTop: 3,
                                width: 18,
                                height: 18,
                                accentColor: '#10b981',
                                cursor: 'pointer',
                                flexShrink: 0,
                              }}
                            />

                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                                flex: 1,
                              }}
                            >
                              {/* Day Header row */}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  flexWrap: 'wrap',
                                  gap: 8,
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: '0.74rem',
                                      fontWeight: 700,
                                      padding: '2px 8px',
                                      borderRadius: 4,
                                      background: task.isCompleted
                                        ? 'rgba(16, 185, 129, 0.15)'
                                        : 'rgba(91, 99, 211, 0.18)',
                                      color: task.isCompleted
                                        ? '#86EFAC'
                                        : 'var(--color-periwinkle-glow, #98a4f7)',
                                    }}
                                  >
                                    {task.dayLabel}
                                  </span>

                                  <span
                                    style={{
                                      fontSize: '0.94rem',
                                      fontWeight: 600,
                                      color: task.isCompleted
                                        ? 'var(--color-muted-steel, #646e87)'
                                        : '#ffffff',
                                      textDecoration: task.isCompleted
                                        ? 'line-through'
                                        : 'none',
                                    }}
                                  >
                                    {task.title}
                                  </span>
                                </div>

                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: '0.72rem',
                                      color:
                                        'var(--color-muted-steel, #646e87)',
                                    }}
                                  >
                                    Est. {task.duration || '2.5 hrs'}
                                  </span>

                                  {task.isCompleted && (
                                    <span
                                      style={{
                                        fontSize: '0.72rem',
                                        fontWeight: 600,
                                        color: '#86EFAC',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 3,
                                      }}
                                    >
                                      <CheckCircle2 size={12} />
                                      Done
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Structured Learning & Action Grid */}
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns:
                                    'repeat(auto-fit, minmax(280px, 1fr))',
                                  gap: 10,
                                  marginTop: 2,
                                }}
                              >
                                {/* Learning Objective */}
                                <div
                                  style={{
                                    padding: '8px 12px',
                                    borderRadius: 6,
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    border:
                                      '1px solid rgba(255, 255, 255, 0.05)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 3,
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 5,
                                    }}
                                  >
                                    <BookOpen
                                      size={13}
                                      style={{
                                        color:
                                          'var(--color-periwinkle-glow, #98a4f7)',
                                      }}
                                    />
                                    <span
                                      style={{
                                        fontSize: '0.72rem',
                                        fontWeight: 600,
                                        color:
                                          'var(--color-periwinkle-glow, #98a4f7)',
                                      }}
                                    >
                                      Concepts &amp; Theory
                                    </span>
                                  </div>
                                  <span
                                    style={{
                                      fontSize: '0.8rem',
                                      color:
                                        'var(--color-frost, #c9d3ee)',
                                      lineHeight: 1.4,
                                    }}
                                  >
                                    {task.learningFocus}
                                  </span>
                                </div>

                                {/* Hands-on Lab Action */}
                                <div
                                  style={{
                                    padding: '8px 12px',
                                    borderRadius: 6,
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    border:
                                      '1px solid rgba(255, 255, 255, 0.05)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 3,
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 5,
                                    }}
                                  >
                                    <Terminal
                                      size={13}
                                      style={{ color: '#38bdf8' }}
                                    />
                                    <span
                                      style={{
                                        fontSize: '0.72rem',
                                        fontWeight: 600,
                                        color: '#38bdf8',
                                      }}
                                    >
                                      Hands-on Lab Exercise
                                    </span>
                                  </div>
                                  <span
                                    style={{
                                      fontSize: '0.8rem',
                                      color:
                                        'var(--color-frost, #c9d3ee)',
                                      lineHeight: 1.4,
                                    }}
                                  >
                                    {task.actionItem}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </VStack>
      )}
    </InternalPageLayout>
  );
}

export default TrackRoadmapPage;
