'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Cloud,
  Compass,
  Cpu,
  Database,
  GitBranch,
  Network,
  Rocket,
  Shield,
  X,
  Zap,
} from 'lucide-react';

import { InternalPageLayout } from '@/features/navigation/InternalPageLayout';

export interface CareerPathOption {
  id: string;
  title: string;
  matchScore: number;
  category: string;
  icon: React.ReactNode;
  timeline: string;
  marketDemand: 'Very High' | 'High' | 'Explosive' | string;
  salaryRange: string;
  description: string;
  bridgeSkills: string[];
  x: number;
  y: number;
}

export interface ActiveRoadmapSummary {
  id: string;
  targetRole: string;
  progressPercent: number;
}

function getPathIcon(category?: string, title?: string) {
  const text = `${category || ''} ${title || ''}`.toLowerCase();
  if (text.includes('cloud') || text.includes('aws') || text.includes('gcp') || text.includes('azure')) {
    return <Cloud size={16} />;
  }
  if (text.includes('ai') || text.includes('ml') || text.includes('agent') || text.includes('learning')) {
    return <BrainCircuit size={16} />;
  }
  if (text.includes('staff') || text.includes('principal') || text.includes('lead') || text.includes('leader')) {
    return <Rocket size={16} />;
  }
  if (text.includes('sre') || text.includes('reliability') || text.includes('performance')) {
    return <Cpu size={16} />;
  }
  if (text.includes('devops') || text.includes('platform') || text.includes('infra') || text.includes('gitops')) {
    return <GitBranch size={16} />;
  }
  if (text.includes('data') || text.includes('database') || text.includes('streaming') || text.includes('analytics')) {
    return <Database size={16} />;
  }
  if (text.includes('security') || text.includes('devsecops') || text.includes('cyber')) {
    return <Shield size={16} />;
  }
  if (text.includes('manager') || text.includes('engineering manager') || text.includes('network')) {
    return <Network size={16} />;
  }
  return <Compass size={16} />;
}

export function ExplorePathsPage() {
  const router = useRouter();

  const [careerPaths, setCareerPaths] = useState<CareerPathOption[]>([]);
  const [activeRoadmaps, setActiveRoadmaps] = useState<ActiveRoadmapSummary[]>([]);
  const [loadingPaths, setLoadingPaths] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [activePodId, setActivePodId] = useState<string | null>(null);
  const [hoveredBubbleId, setHoveredBubbleId] = useState<string | null>(null);

  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    async function loadPaths() {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      try {
        const [pathsRes, roadmapRes] = await Promise.all([
          fetch(`${apiUrl}/api/v1/career-paths`, {
            headers: {
              'x-user-id': '00000000-0000-0000-0000-000000000001',
            },
          }),
          fetch(`${apiUrl}/api/v1/roadmap`, {
            headers: {
              'x-user-id': '00000000-0000-0000-0000-000000000001',
            },
          }),
        ]);

        if (!pathsRes.ok) {
          const errJson = await pathsRes.json().catch(() => ({}));
          const msg =
            errJson.message ||
            `Failed to fetch career paths (${pathsRes.status} ${pathsRes.statusText})`;
          throw new Error(msg);
        }

        const rawPaths = await pathsRes.json();
        if (!Array.isArray(rawPaths) || rawPaths.length === 0) {
          throw new Error(
            'No career paths generated yet. Please upload your resume or calibrate your technical baseline.',
          );
        }

        let activeList: ActiveRoadmapSummary[] = [];
        if (roadmapRes.ok) {
          const roadmapData = await roadmapRes.json();
          if (roadmapData) {
            if (Array.isArray(roadmapData.roadmaps)) {
              activeList = roadmapData.roadmaps.map((r: { id: string; targetRole: string; progressPercent: number }) => ({
                id: r.id,
                targetRole: r.targetRole,
                progressPercent: r.progressPercent ?? 0,
              }));
            } else if (roadmapData.targetRole) {
              activeList = [
                {
                  id: roadmapData.id || '',
                  targetRole: roadmapData.targetRole,
                  progressPercent: roadmapData.progressPercent ?? 0,
                },
              ];
            }
          }
        }
        setActiveRoadmaps(activeList);

        const total = rawPaths.length;
        const computedPaths: CareerPathOption[] = rawPaths.map((item, index) => {
          const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
          const x = Math.round(250 * Math.cos(angle));
          const y = Math.round(145 * Math.sin(angle));
          return {
            id: item.id || `path-${index}`,
            title: item.title,
            category: item.category || 'Engineering',
            matchScore: typeof item.matchScore === 'number' ? item.matchScore : 75,
            timeline: item.timeline || '4 - 6 Months',
            marketDemand: item.marketDemand || 'High',
            salaryRange: item.salaryRange || '$160k - $220k',
            description: item.description || '',
            bridgeSkills: Array.isArray(item.bridgeSkills) ? item.bridgeSkills : [],
            icon: getPathIcon(item.category, item.title),
            x,
            y,
          };
        });

        setCareerPaths(computedPaths);
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : 'Failed to connect to Career Switch Assistant API.';
        setLoadError(errorMsg);
      } finally {
        setLoadingPaths(false);
      }
    }

    void loadPaths();
  }, [reloadTrigger]);

  const handleRetryPaths = () => {
    setLoadingPaths(true);
    setLoadError(null);
    setReloadTrigger((prev) => prev + 1);
  };

  // Close pod on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePodId(null);
        setHoveredBubbleId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activePath = activePodId
    ? careerPaths.find((p) => p.id === activePodId) || null
    : null;

  const matchingActiveRoadmap = activePath
    ? activeRoadmaps.find(
        (r) => r.targetRole.toLowerCase() === activePath.title.toLowerCase(),
      )
    : null;

  const handleBubbleMouseEnter = (pathId: string) => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setHoveredBubbleId(pathId);
    setActivePodId(pathId);
    setSubmitError(null);
  };

  const handleBubbleMouseLeave = () => {
    setHoveredBubbleId(null);
    leaveTimerRef.current = setTimeout(() => {
      setActivePodId(null);
    }, 160);
  };

  const handlePodMouseEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  };

  const handlePodMouseLeave = () => {
    setActivePodId(null);
    setHoveredBubbleId(null);
  };

  const handleCanvasMouseLeave = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setActivePodId(null);
    setHoveredBubbleId(null);
  };

  const handleSelectAsTarget = async (path: CareerPathOption) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSelectedPathId(path.id);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/v1/career-paths/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '00000000-0000-0000-0000-000000000001',
        },
        body: JSON.stringify({
          pathId: path.id,
          title: path.title,
          bridgeSkills: path.bridgeSkills,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson.message || `Roadmap generation failed (${res.status})`;
        throw new Error(msg);
      }

      const createdData = await res.json();

      if (typeof window !== 'undefined') {
        try {
          const stored = sessionStorage.getItem('csa_career_profile');
          const profile = stored ? JSON.parse(stored) : {};
          profile.targetRole = path.title;
          sessionStorage.setItem('csa_career_profile', JSON.stringify(profile));
        } catch {
          // Ignore fallback
        }
      }

      router.push(
        createdData?.id
          ? `/dashboard/track?roadmapId=${createdData.id}`
          : '/dashboard/track',
      );
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Failed to generate dynamic roadmap.';
      setSubmitError(errorMsg);
      setIsSubmitting(false);
    }
  };

  // Calculate pod floating coordinates strictly clamped inside the bubble canvas viewport
  const getPodPosition = (path: CareerPathOption) => {
    const leftOffset = path.x >= 0 ? path.x - 355 : path.x + 25;
    const topOffset = path.y - 120;

    return {
      left: `clamp(16px, calc(50% + ${leftOffset}px), calc(100% - 350px))`,
      top: `clamp(16px, calc(50% + ${topOffset}px), calc(100% - 390px))`,
    };
  };

  return (
    <InternalPageLayout
      fullHeight
      badge="INTERACTIVE CAREER CONSTELLATION"
      badgeIcon={<Compass size={12} />}
      badgeSecondaryText={
        careerPaths.length > 0
          ? `${careerPaths.length} Trajectories Mapped to Your Baseline`
          : 'Calibrating Trajectories'
      }
      title="Explore Career Paths"
      description="Hover on any career bubble radiating around your baseline to inspect skill compatibility, bridge milestones, and market trajectory."
      current="explore"
    >
      {/* Keyframe animations for micro-movements */}
      <style>{`
        @keyframes bubbleDrift1 {
          0%, 100% {
            transform: translate(var(--bx), var(--by)) translate(-50%, -50%) translateY(0px) translateX(0px);
          }
          50% {
            transform: translate(var(--bx), var(--by)) translate(-50%, -50%) translateY(-5px) translateX(3px);
          }
        }
        @keyframes bubbleDrift2 {
          0%, 100% {
            transform: translate(var(--bx), var(--by)) translate(-50%, -50%) translateY(0px) translateX(0px);
          }
          50% {
            transform: translate(var(--bx), var(--by)) translate(-50%, -50%) translateY(4px) translateX(-3px);
          }
        }
        @keyframes bubbleDrift3 {
          0%, 100% {
            transform: translate(var(--bx), var(--by)) translate(-50%, -50%) translateY(0px) translateX(0px);
          }
          50% {
            transform: translate(var(--bx), var(--by)) translate(-50%, -50%) translateY(-4px) translateX(-3px);
          }
        }
        @keyframes bubbleDrift4 {
          0%, 100% {
            transform: translate(var(--bx), var(--by)) translate(-50%, -50%) translateY(0px) translateX(0px);
          }
          50% {
            transform: translate(var(--bx), var(--by)) translate(-50%, -50%) translateY(4px) translateX(3px);
          }
        }
        @keyframes hubPulseGlow {
          0%, 100% {
            box-shadow: 0 0 25px rgba(152, 164, 247, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.25);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 40px rgba(152, 164, 247, 0.5), 0 0 18px rgba(91, 99, 211, 0.35), inset 0 1px 3px rgba(255, 255, 255, 0.35);
            transform: scale(1.02);
          }
        }
        @keyframes podFadeIn {
          from {
            opacity: 0;
            transform: scale(0.97) translateY(4px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes radarSpin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>

      {/* FULL-SCREEN BUBBLE CONSTELLATION CANVAS (Zero Scroll, Strict Viewport Fit) */}
      <div
        ref={canvasRef}
        onMouseLeave={handleCanvasMouseLeave}
        style={{
          flex: 1,
          width: '100%',
          minHeight: 0,
          height: '100%',
          background: 'var(--color-carbon-surface, #151621)',
          border: '1px solid var(--color-gunmetal, #1f2433)',
          boxShadow:
            'var(--shadow-subtle, rgba(255, 255, 255, 0.25) 0px 1px 3px 0px inset)',
          borderRadius: 16,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
        }}
      >
        {/* Starry Ambient Background & Concentric Orbit Guides */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <defs>
            <pattern
              id="celestialDots"
              width="36"
              height="36"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="18" cy="18" r="1.1" fill="rgba(152, 164, 247, 0.1)" />
            </pattern>

            <radialGradient id="hubCosmicGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(152, 164, 247, 0.25)" />
              <stop offset="50%" stopColor="rgba(91, 99, 211, 0.12)" />
              <stop offset="100%" stopColor="rgba(21, 22, 33, 0)" />
            </radialGradient>

            <linearGradient id="activeLineBeam" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#98a4f7" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#5b63d3" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Dot Matrix Background */}
          <rect width="100%" height="100%" fill="url(#celestialDots)" />

          {/* Elliptical Cosmic Orbit Rings (Tailored to Landscape Viewports) */}
          <ellipse
            cx="50%"
            cy="50%"
            rx="150"
            ry="95"
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeDasharray="4 6"
          />
          <ellipse
            cx="50%"
            cy="50%"
            rx="230"
            ry="145"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="5 7"
          />
          <ellipse
            cx="50%"
            cy="50%"
            rx="300"
            ry="185"
            fill="none"
            stroke="rgba(255,255,255,0.03)"
            strokeDasharray="4 8"
          />

          {/* Central Halo Glow */}
          <circle cx="50%" cy="50%" r="180" fill="url(#hubCosmicGlow)" />

          {/* Connecting Beams to Bubbles */}
          {careerPaths.map((path) => {
            const isActive = activePodId === path.id || hoveredBubbleId === path.id;

            return (
              <line
                key={path.id}
                x1="50%"
                y1="50%"
                x2={`calc(50% + ${path.x}px)`}
                y2={`calc(50% + ${path.y}px)`}
                stroke={isActive ? 'url(#activeLineBeam)' : 'rgba(147, 157, 184, 0.15)'}
                strokeWidth={isActive ? 2 : 1}
                strokeDasharray={isActive ? 'none' : '3 4'}
                style={{
                  transition: 'stroke 0.22s ease, stroke-width 0.22s ease',
                }}
              />
            );
          })}
        </svg>

        {/* LOADING STATE: Cosmic Telemetry Radar Scanner */}
        {loadingPaths && (
          <div
            style={{
              position: 'relative',
              zIndex: 30,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              textAlign: 'center',
              padding: 24,
            }}
          >
            <div
              style={{
                position: 'relative',
                width: 86,
                height: 86,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '2px solid rgba(152, 164, 247, 0.25)',
                  borderTopColor: '#98a4f7',
                  animation: 'radarSpin 1.4s cubic-bezier(0.5, 0, 0.5, 1) infinite',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 12,
                  borderRadius: '50%',
                  border: '1.5px dashed rgba(91, 99, 211, 0.45)',
                  animation: 'radarSpin 3s linear infinite reverse',
                }}
              />
              <Compass
                size={30}
                style={{
                  color: '#98a4f7',
                  animation: 'hubPulseGlow 2.5s ease-in-out infinite',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '0.98rem', fontWeight: 600, color: '#ffffff' }}>
                Analyzing verified baseline &amp; calibrating transition vectors...
              </span>
              <span
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--color-muted-steel, #646e87)',
                }}
              >
                Synthesizing real-time market demand and role competency gaps
              </span>
            </div>
          </div>
        )}

        {/* ERROR STATE: Transparent error card with real message (NO fallback!) */}
        {loadError && !loadingPaths && (
          <div
            style={{
              position: 'relative',
              zIndex: 30,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              textAlign: 'center',
              maxWidth: 480,
              padding: '28px 32px',
              background: 'rgba(21, 22, 33, 0.95)',
              border: '1.5px solid rgba(239, 68, 68, 0.45)',
              borderRadius: 16,
              boxShadow:
                '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 20px rgba(239, 68, 68, 0.2)',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F87171',
              }}
            >
              <AlertTriangle size={24} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff' }}>
                Trajectory Calibration Unavailable
              </span>
              <span
                style={{
                  fontSize: '0.8rem',
                  color: '#FCA5A5',
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                }}
              >
                {loadError}
              </span>
            </div>
            <button
              type="button"
              onClick={handleRetryPaths}
              style={{
                background:
                  'linear-gradient(353deg, rgb(91, 99, 211) 17.51%, rgb(124, 135, 247) 183.08%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 9999,
                padding: '9px 24px',
                fontSize: '0.84rem',
                fontWeight: 500,
                cursor: 'pointer',
                boxShadow: '0 0 14px rgba(91, 99, 211, 0.35)',
              }}
            >
              Retry Calibration
            </button>
          </div>
        )}

        {/* Central Baseline Hub (Rendered when paths are loaded) */}
        {!loadingPaths && !loadError && (
          <div
            style={{
              position: 'relative',
              zIndex: 10,
              width: 126,
              height: 126,
              borderRadius: '50%',
              background:
                'radial-gradient(circle at 35% 35%, #1f2433 0%, #0f101a 100%)',
              border: '2px solid var(--color-periwinkle-glow, #98a4f7)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: 10,
              boxSizing: 'border-box',
              cursor: 'default',
              animation: 'hubPulseGlow 4.5s ease-in-out infinite',
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#86EFAC',
                boxShadow: '0 0 8px #86EFAC',
                marginBottom: 3,
              }}
            />
            <span
              style={{
                fontSize: '0.64rem',
                fontWeight: 600,
                color: 'var(--color-periwinkle-glow, #98a4f7)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Explore Paths
            </span>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#ffffff',
                lineHeight: 1.2,
                marginTop: 2,
              }}
            >
              Technical Baseline
            </span>
            <span
              style={{
                fontSize: '0.64rem',
                color: 'var(--color-muted-steel, #646e87)',
                marginTop: 2,
              }}
            >
              {careerPaths.length} Paths Calibrated
            </span>
          </div>
        )}

        {/* Radiating Interactive Career Bubbles */}
        {!loadingPaths &&
          !loadError &&
          careerPaths.map((path, index) => {
            const isPodActive = activePodId === path.id;
            const isBubbleHovered = hoveredBubbleId === path.id;
            const isSelected = selectedPathId === path.id;

            const matching = activeRoadmaps.find(
              (r) => r.targetRole.toLowerCase() === path.title.toLowerCase(),
            );
            const isActiveTrajectory = Boolean(matching);

            const animationName = `bubbleDrift${(index % 4) + 1}`;
            const animationDuration = `${5.2 + (index % 4) * 0.5}s`;
            const animationDelay = `${(index * 0.35).toFixed(1)}s`;

            return (
              <button
                key={path.id}
                type="button"
                onMouseEnter={() => handleBubbleMouseEnter(path.id)}
                onMouseLeave={handleBubbleMouseLeave}
                onClick={() => handleBubbleMouseEnter(path.id)}
                style={
                  {
                    '--bx': `${path.x}px`,
                    '--by': `${path.y}px`,
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    zIndex: isPodActive ? 30 : isBubbleHovered ? 25 : 15,
                    padding: '7px 14px',
                    borderRadius: 9999,
                    background:
                      isPodActive || isSelected
                        ? 'linear-gradient(135deg, rgba(91, 99, 211, 0.45) 0%, rgba(21, 22, 33, 0.95) 100%)'
                        : isBubbleHovered
                          ? 'rgba(31, 36, 51, 0.95)'
                          : 'rgba(21, 22, 33, 0.88)',
                    border:
                      isPodActive || isSelected
                        ? '2px solid var(--color-periwinkle-glow, #98a4f7)'
                        : isActiveTrajectory
                          ? '1.5px solid rgba(74, 222, 128, 0.5)'
                          : isBubbleHovered
                            ? '1.5px solid var(--color-frost, #c9d3ee)'
                            : '1px solid var(--color-gunmetal, #1f2433)',
                    boxShadow:
                      isPodActive || isSelected
                        ? '0 0 20px rgba(152, 164, 247, 0.45), inset 0 1px 3px rgba(255, 255, 255, 0.25)'
                        : isActiveTrajectory
                          ? '0 0 14px rgba(74, 222, 128, 0.25)'
                          : isBubbleHovered
                            ? '0 0 12px rgba(152, 164, 247, 0.25)'
                            : 'none',
                    color:
                      isPodActive || isSelected
                        ? '#ffffff'
                        : 'var(--color-frost, #c9d3ee)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    animation: `${animationName} ${animationDuration} ease-in-out infinite alternate`,
                    animationDelay,
                    animationPlayState:
                      isBubbleHovered || isPodActive ? 'paused' : 'running',
                    transform:
                      isBubbleHovered || isPodActive
                        ? `translate(${path.x}px, ${path.y}px) translate(-50%, -50%) scale(1.06)`
                        : undefined,
                    transition:
                      'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
                  } as React.CSSProperties
                }
              >
                <span
                  style={{
                    color:
                      isPodActive || isSelected
                        ? 'var(--color-periwinkle-glow, #98a4f7)'
                        : isActiveTrajectory
                          ? '#4ADE80'
                          : 'var(--color-muted-steel, #646e87)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {path.icon}
                </span>

                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                  {path.title}
                </span>

                <span
                  style={{
                    fontSize: '0.67rem',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: 9999,
                    background: isActiveTrajectory
                      ? 'rgba(34, 197, 94, 0.25)'
                      : isPodActive || isSelected
                        ? 'rgba(134, 239, 172, 0.22)'
                        : 'rgba(255, 255, 255, 0.06)',
                    color: isActiveTrajectory
                      ? '#4ADE80'
                      : isPodActive || isSelected
                        ? '#86EFAC'
                        : 'var(--color-muted-steel, #646e87)',
                    border: isActiveTrajectory
                      ? '1px solid rgba(74, 222, 128, 0.4)'
                      : 'none',
                  }}
                >
                  {isActiveTrajectory
                    ? `Active • ${matching?.progressPercent}%`
                    : `${path.matchScore}%`}
                </span>
              </button>
            );
          })}

        {/* FLOATING INSPECTOR POD */}
        {activePodId && activePath && (
          <div
            onMouseEnter={handlePodMouseEnter}
            onMouseLeave={handlePodMouseLeave}
            style={{
              position: 'absolute',
              ...getPodPosition(activePath),
              width: 330,
              maxWidth: 'calc(100% - 32px)',
              maxHeight: 'calc(100% - 32px)',
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              background: 'rgba(18, 20, 31, 0.96)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: matchingActiveRoadmap
                ? '1.5px solid rgba(74, 222, 128, 0.5)'
                : '1.5px solid rgba(152, 164, 247, 0.35)',
              boxShadow:
                '0 18px 45px rgba(0, 0, 0, 0.8), 0 0 25px rgba(91, 99, 211, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.2)',
              borderRadius: 16,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              zIndex: 60,
              animation: 'podFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              boxSizing: 'border-box',
            }}
          >
            {/* Pod Header Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    fontSize: '0.67rem',
                    fontWeight: 600,
                    color: 'var(--color-periwinkle-glow, #98a4f7)',
                    background: 'rgba(91, 99, 211, 0.18)',
                    border: '1px solid rgba(152, 164, 247, 0.3)',
                    padding: '2px 7px',
                    borderRadius: 9999,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {activePath.category}
                </span>

                {matchingActiveRoadmap ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 7px',
                      borderRadius: 9999,
                      background: 'rgba(34, 197, 94, 0.22)',
                      border: '1px solid rgba(74, 222, 128, 0.45)',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: '#4ADE80',
                    }}
                  >
                    <CheckCircle2 size={11} />
                    <span>Active • {matchingActiveRoadmap.progressPercent}%</span>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 7px',
                      borderRadius: 9999,
                      background: 'rgba(134, 239, 172, 0.15)',
                      border: '1px solid rgba(134, 239, 172, 0.3)',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: '#86EFAC',
                    }}
                  >
                    <CheckCircle2 size={11} />
                    <span>{activePath.matchScore}% Readiness Match</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setActivePodId(null)}
                aria-label="Close pod"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-muted-steel, #646e87)',
                  cursor: 'pointer',
                  padding: 3,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Title & Description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Heading
                level={2}
                weight="semibold"
                style={{ fontSize: '1.1rem', color: '#ffffff', margin: 0 }}
              >
                {activePath.title}
              </Heading>
              <Text
                type="supporting"
                color="secondary"
                style={{ fontSize: '0.77rem', lineHeight: 1.45, margin: 0 }}
              >
                {activePath.description}
              </Text>
            </div>

            {/* Key Metrics Mini-Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 6,
                padding: '7px 9px',
                borderRadius: 8,
                background: 'var(--color-void-black, #0f101a)',
                border: '1px solid var(--color-gunmetal, #1f2433)',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.62rem',
                    color: 'var(--color-muted-steel, #646e87)',
                    textTransform: 'uppercase',
                  }}
                >
                  Est. Horizon
                </span>
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    color: '#ffffff',
                    marginTop: 1,
                  }}
                >
                  {activePath.timeline}
                </div>
              </div>

              <div>
                <span
                  style={{
                    fontSize: '0.62rem',
                    color: 'var(--color-muted-steel, #646e87)',
                    textTransform: 'uppercase',
                  }}
                >
                  Market Demand
                </span>
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: '#67E8F9',
                    marginTop: 1,
                  }}
                >
                  {activePath.marketDemand}
                </div>
              </div>

              <div
                style={{
                  gridColumn: 'span 2',
                  borderTop: '1px solid var(--color-gunmetal, #1f2433)',
                  paddingTop: 4,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <span
                  style={{
                    fontSize: '0.62rem',
                    color: 'var(--color-muted-steel, #646e87)',
                    textTransform: 'uppercase',
                  }}
                >
                  Compensation Index
                </span>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#86EFAC',
                  }}
                >
                  {activePath.salaryRange}
                </span>
              </div>
            </div>

            {/* Critical Competency Bridge Chips */}
            {activePath.bridgeSkills.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'var(--color-frost, #c9d3ee)',
                  }}
                >
                  Critical Competency Bridge ({activePath.bridgeSkills.length} skills):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {activePath.bridgeSkills.map((skill) => (
                    <div
                      key={skill}
                      style={{
                        padding: '2px 6px',
                        borderRadius: 5,
                        background: 'rgba(91, 99, 211, 0.14)',
                        border: '1px solid rgba(152, 164, 247, 0.25)',
                        color: 'var(--color-frost, #c9d3ee)',
                        fontSize: '0.68rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Zap size={9} style={{ color: '#FDE047' }} />
                      <span>{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submission / Generation Real Error Callout */}
            {submitError && (
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#FCA5A5',
                  fontSize: '0.72rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                  <AlertTriangle size={12} />
                  <span>Roadmap Generation Error</span>
                </div>
                <span>{submitError}</span>
                <button
                  type="button"
                  onClick={() => handleSelectAsTarget(activePath)}
                  style={{
                    alignSelf: 'flex-start',
                    background: 'transparent',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: '0.68rem',
                    cursor: 'pointer',
                    marginTop: 2,
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Primary Action Button */}
            {matchingActiveRoadmap ? (
              <button
                type="button"
                id="open-in-track-btn"
                onClick={() =>
                  router.push(`/dashboard/track?roadmapId=${matchingActiveRoadmap.id}`)
                }
                style={{
                  width: '100%',
                  background:
                    'linear-gradient(353deg, rgb(34, 197, 94) 17.51%, rgb(74, 222, 128) 183.08%)',
                  color: '#0f172a',
                  border: 'none',
                  borderRadius: 9999,
                  padding: '9px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 0 16px rgba(74, 222, 128, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                <span>
                  Open in Track View ({matchingActiveRoadmap.progressPercent}% Complete)
                </span>
                <ArrowRight size={13} />
              </button>
            ) : (
              <button
                type="button"
                id="set-target-role-btn"
                disabled={isSubmitting}
                onClick={() => handleSelectAsTarget(activePath)}
                style={{
                  width: '100%',
                  background: isSubmitting
                    ? 'rgba(91, 99, 211, 0.5)'
                    : 'linear-gradient(353deg, rgb(91, 99, 211) 17.51%, rgb(124, 135, 247) 183.08%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 9999,
                  padding: '9px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow:
                    '0 0 16px rgba(91, 99, 211, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                {isSubmitting ? (
                  <>
                    <span style={{ fontSize: '0.82rem' }}>⏳</span>
                    <span>Generating 5-Sprint Roadmap...</span>
                  </>
                ) : (
                  <>
                    <span>Set as Target &amp; Update Roadmap</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            )}

            {/* Advisory Footnote */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 6,
                padding: '5px 8px',
                fontSize: '0.65rem',
                color: 'var(--color-muted-steel, #646e87)',
                lineHeight: 1.3,
              }}
            >
              Advisory Trajectory • Non-binding recommendations based on your verified baseline.
            </div>
          </div>
        )}
      </div>
    </InternalPageLayout>
  );
}

export default ExplorePathsPage;
