'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import {
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
  marketDemand: 'Very High' | 'High' | 'Explosive';
  salaryRange: string;
  description: string;
  bridgeSkills: string[];
  x: number;
  y: number;
}

export const CAREER_PATHS: CareerPathOption[] = [
  {
    id: 'cloud-architect',
    title: 'Cloud Solutions Architect',
    matchScore: 84,
    category: 'Architecture & Cloud',
    icon: <Cloud size={16} />,
    timeline: '4 - 6 Months',
    marketDemand: 'Very High',
    salaryRange: '$175k - $235k',
    description:
      'Design fault-tolerant, scalable multi-region architectures on AWS/GCP with Well-Architected governance and infrastructure automation.',
    bridgeSkills: [
      'Distributed Consensus',
      'AWS Well-Architected',
      'Terraform IaC',
      'System Design',
    ],
    x: 35,
    y: -160,
  },
  {
    id: 'ai-ml-engineer',
    title: 'AI / ML Platform Engineer',
    matchScore: 72,
    category: 'AI & Systems',
    icon: <BrainCircuit size={16} />,
    timeline: '6 - 9 Months',
    marketDemand: 'Explosive',
    salaryRange: '$185k - $250k',
    description:
      'Build infrastructure for LLM deployment, fine-tuning pipelines, vector stores, and model evaluation telemetry for generative AI products.',
    bridgeSkills: [
      'Python & PyTorch',
      'Vector DBs (Pinecone/Milvus)',
      'vLLM / Triton Inference',
      'LangChain / Agents',
    ],
    x: 230,
    y: -105,
  },
  {
    id: 'staff-engineer',
    title: 'Staff Software Engineer',
    matchScore: 88,
    category: 'Technical Leadership',
    icon: <Rocket size={16} />,
    timeline: '3 - 5 Months',
    marketDemand: 'Very High',
    salaryRange: '$190k - $260k',
    description:
      'Set cross-organization architectural direction, solve ambiguous technical bottlenecks, and act as a leadership force multiplier.',
    bridgeSkills: [
      'Cross-System RFCs',
      'High-Scale Data Pipelines',
      'Engineering Strategy',
      'Mentorship & Alignment',
    ],
    x: 275,
    y: 35,
  },
  {
    id: 'sre-engineer',
    title: 'Site Reliability Engineer',
    matchScore: 80,
    category: 'Reliability & Infra',
    icon: <Cpu size={16} />,
    timeline: '4 - 6 Months',
    marketDemand: 'Very High',
    salaryRange: '$170k - $225k',
    description:
      'Ensure 99.99% system availability, automate chaos experiments, engineer incident observability, and eliminate operational toil.',
    bridgeSkills: [
      'Prometheus / OpenTelemetry',
      'Kubernetes Internals',
      'SLO / Error Budgets',
      'Chaos Engineering',
    ],
    x: 125,
    y: 155,
  },
  {
    id: 'devops-architect',
    title: 'DevOps & Platform Specialist',
    matchScore: 82,
    category: 'Platform Engineering',
    icon: <GitBranch size={16} />,
    timeline: '4 - 6 Months',
    marketDemand: 'High',
    salaryRange: '$165k - $220k',
    description:
      'Build internal developer platforms (IDP), optimize zero-downtime CI/CD workflows, and govern containerized fleet orchestration.',
    bridgeSkills: [
      'ArgoCD / GitOps',
      'Docker Fleet Security',
      'Helm Charts',
      'GitHub Actions Workflows',
    ],
    x: -130,
    y: 155,
  },
  {
    id: 'data-architect',
    title: 'Data Systems Architect',
    matchScore: 70,
    category: 'Data & Analytics',
    icon: <Database size={16} />,
    timeline: '6 - 8 Months',
    marketDemand: 'High',
    salaryRange: '$175k - $230k',
    description:
      'Architect real-time event streaming architectures, lakehouse query engines, data mesh governance, and analytical schemas.',
    bridgeSkills: [
      'Apache Kafka',
      'DuckDB / ClickHouse',
      'Data Modeling',
      'Event-Driven Systems',
    ],
    x: -275,
    y: 40,
  },
  {
    id: 'security-specialist',
    title: 'Security & DevSecOps Engineer',
    matchScore: 66,
    category: 'Cybersecurity',
    icon: <Shield size={16} />,
    timeline: '6 - 9 Months',
    marketDemand: 'Very High',
    salaryRange: '$170k - $230k',
    description:
      'Implement zero-trust security postures, automated static/dynamic scanning, cryptographic key hygiene, and container runtime auditing.',
    bridgeSkills: [
      'OAuth 2.1 & OIDC',
      'Zero-Trust Architecture',
      'Trivy / Snyk Scanning',
      'CloudTrail / SIEM Audit',
    ],
    x: -230,
    y: -90,
  },
  {
    id: 'engineering-manager',
    title: 'Engineering Manager / Lead',
    matchScore: 86,
    category: 'People & Delivery',
    icon: <Network size={16} />,
    timeline: '3 - 6 Months',
    marketDemand: 'High',
    salaryRange: '$180k - $240k',
    description:
      'Lead high-performing software squads, calibrate engineering velocity with product ROI, and guide long-term career growth.',
    bridgeSkills: [
      'Agile Sprint Calibration',
      'Stakeholder Alignment',
      'Tech Debt Prioritization',
      'Talent Development',
    ],
    x: -75,
    y: -160,
  },
];

export function ExplorePathsPage() {
  const router = useRouter();

  const [careerPaths, setCareerPaths] = useState<CareerPathOption[]>(CAREER_PATHS);
  // Selected path (for confirmed choice)
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);

  // Active Pod state: only populated when hovering on a bubble or when cursor is inside the pod
  // Initialized to null: if no item is hovered, ONLY show bubbles
  const [activePodId, setActivePodId] = useState<string | null>(null);
  const [hoveredBubbleId, setHoveredBubbleId] = useState<string | null>(null);

  // Grace timer to allow user to move mouse from bubble to the pod smoothly
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Fetch calibrated career paths from backend
  useEffect(() => {
    async function loadPaths() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/v1/career-paths`, {
          headers: {
            'x-user-id': '00000000-0000-0000-0000-000000000001',
          },
        });
        if (res.ok) {
          const data = (await res.json()) as Array<{
            id?: string;
            title?: string;
            category?: string;
            matchScore?: number;
            timeline?: string;
            marketDemand?: CareerPathOption['marketDemand'];
            salaryRange?: string;
            description?: string;
            bridgeSkills?: string[];
          }>;
          if (Array.isArray(data) && data.length > 0) {
            setCareerPaths((prev) =>
              prev.map((defaultOption, index) => {
                const backendMatch =
                  data[index] ||
                  data.find((d) => d.id === defaultOption.id);
                if (!backendMatch) return defaultOption;
                return {
                  ...defaultOption,
                  id: backendMatch.id || defaultOption.id,
                  title: backendMatch.title || defaultOption.title,
                  category: backendMatch.category || defaultOption.category,
                  matchScore:
                    typeof backendMatch.matchScore === 'number'
                      ? backendMatch.matchScore
                      : defaultOption.matchScore,
                  timeline: backendMatch.timeline || defaultOption.timeline,
                  marketDemand:
                    backendMatch.marketDemand || defaultOption.marketDemand,
                  salaryRange:
                    backendMatch.salaryRange || defaultOption.salaryRange,
                  description:
                    backendMatch.description || defaultOption.description,
                  bridgeSkills:
                    Array.isArray(backendMatch.bridgeSkills) &&
                    backendMatch.bridgeSkills.length > 0
                      ? backendMatch.bridgeSkills
                      : defaultOption.bridgeSkills,
                };
              }),
            );
          }
        }
      } catch {
        // Fallback to local CAREER_PATHS seamlessly
      }
    }
    void loadPaths();
  }, []);

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

  const handleBubbleMouseEnter = (pathId: string) => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setHoveredBubbleId(pathId);
    setActivePodId(pathId);
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
    setSelectedPathId(path.id);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      await fetch(`${apiUrl}/api/v1/career-paths/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '00000000-0000-0000-0000-000000000001',
        },
        body: JSON.stringify({
          pathId: path.id,
          title: path.title,
        }),
      });
    } catch {
      // Backend may be offline; fallback smoothly to session profile
    }

    router.push('/dashboard');
  };

  // Calculate pod floating coordinates strictly clamped inside the bubble canvas viewport
  const getPodPosition = (path: CareerPathOption) => {
    // If bubble is on the right half (x >= 0), place pod to the left of the bubble
    // If bubble is on the left half (x < 0), place pod to the right of the bubble
    const leftOffset = path.x >= 0 ? path.x - 355 : path.x + 25;
    // Align pod vertically centered with bubble
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
      badgeSecondaryText="8 Trajectories Mapped to Your Baseline"
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
      `}</style>

      {/* FULL-SCREEN BUBBLE CONSTELLATION CANVAS (Zero Scroll, Strict Viewport Fit) */}
      <div
        ref={canvasRef}
        onMouseLeave={handleCanvasMouseLeave}
        style={{
          flex: 1,
          width: '100%',
          minHeight: 0, // Critical for zero-scroll flex layout
          height: '100%',
          background: 'var(--color-carbon-surface, #151621)',
          border: '1px solid var(--color-gunmetal, #1f2433)',
          boxShadow: 'var(--shadow-subtle, rgba(255, 255, 255, 0.25) 0px 1px 3px 0px inset)',
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

        {/* Central Baseline Hub */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            width: 124,
            height: 124,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #1f2433 0%, #0f101a 100%)',
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
            8 Paths Calibrated
          </span>
        </div>

        {/* Radiating Interactive Career Bubbles with Micro-Movement Animations */}
        {careerPaths.map((path, index) => {
          const isPodActive = activePodId === path.id;
          const isBubbleHovered = hoveredBubbleId === path.id;
          const isSelected = selectedPathId === path.id;

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
                  background: isPodActive || isSelected
                    ? 'linear-gradient(135deg, rgba(91, 99, 211, 0.45) 0%, rgba(21, 22, 33, 0.95) 100%)'
                    : isBubbleHovered
                      ? 'rgba(31, 36, 51, 0.95)'
                      : 'rgba(21, 22, 33, 0.88)',
                  border: isPodActive || isSelected
                    ? '2px solid var(--color-periwinkle-glow, #98a4f7)'
                    : isBubbleHovered
                      ? '1.5px solid var(--color-frost, #c9d3ee)'
                      : '1px solid var(--color-gunmetal, #1f2433)',
                  boxShadow: isPodActive || isSelected
                    ? '0 0 20px rgba(152, 164, 247, 0.45), inset 0 1px 3px rgba(255, 255, 255, 0.25)'
                    : isBubbleHovered
                      ? '0 0 12px rgba(152, 164, 247, 0.25)'
                      : 'none',
                  color: isPodActive || isSelected ? '#ffffff' : 'var(--color-frost, #c9d3ee)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  animation: `${animationName} ${animationDuration} ease-in-out infinite alternate`,
                  animationDelay,
                  animationPlayState: isBubbleHovered || isPodActive ? 'paused' : 'running',
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
                  color: isPodActive || isSelected
                    ? 'var(--color-periwinkle-glow, #98a4f7)'
                    : 'var(--color-muted-steel, #646e87)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {path.icon}
              </span>

              <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{path.title}</span>

              <span
                style={{
                  fontSize: '0.67rem',
                  fontWeight: 600,
                  padding: '2px 5px',
                  borderRadius: 9999,
                  background: isPodActive || isSelected
                    ? 'rgba(134, 239, 172, 0.22)'
                    : 'rgba(255, 255, 255, 0.06)',
                  color: isPodActive || isSelected
                    ? '#86EFAC'
                    : 'var(--color-muted-steel, #646e87)',
                }}
              >
                {path.matchScore}%
              </span>
            </button>
          );
        })}

        {/* FLOATING INSPECTOR POD (ONLY OPEN ON HOVER, STRICTLY CONTAINED INSIDE VIEWPORT) */}
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
              border: '1.5px solid rgba(152, 164, 247, 0.35)',
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

            {/* Primary Action Button: Set as Target */}
            <button
              type="button"
              id="set-target-role-btn"
              onClick={() => handleSelectAsTarget(activePath)}
              style={{
                width: '100%',
                background:
                  'linear-gradient(353deg, rgb(91, 99, 211) 17.51%, rgb(124, 135, 247) 183.08%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 9999,
                padding: '9px 16px',
                fontSize: '0.82rem',
                fontWeight: 500,
                cursor: 'pointer',
                boxShadow:
                  '0 0 16px rgba(91, 99, 211, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <span>Set as Target &amp; Update Roadmap</span>
              <ArrowRight size={13} />
            </button>

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
