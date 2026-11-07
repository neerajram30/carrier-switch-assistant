'use client';

import { useMemo } from 'react';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';

interface TrajectoryStrengthGaugeProps {
  currentRole: string;
  yearsOfExperience: string;
  skillsCount: number;
  targetRole: string;
}

export function TrajectoryStrengthGauge({
  currentRole,
  yearsOfExperience,
  skillsCount,
  targetRole,
}: TrajectoryStrengthGaugeProps) {
  const { score, statusLabel, statusColor, checklist } = useMemo(() => {
    let calculated = 0;
    const hasRole = Boolean(currentRole.trim());
    const hasExp = Boolean(yearsOfExperience.trim() && !Number.isNaN(Number(yearsOfExperience)));
    const hasSkills = skillsCount >= 3;
    const hasManySkills = skillsCount >= 5;
    const hasTarget = Boolean(targetRole.trim());

    if (hasRole) calculated += 30;
    if (hasExp) calculated += 20;
    if (hasManySkills) {
      calculated += 25;
    } else if (hasSkills) {
      calculated += 15;
    }
    if (hasTarget) calculated += 25;

    let label = 'Baseline Initializing';
    let color = 'var(--color-text-secondary, #94a3b8)';

    if (calculated >= 100) {
      label = 'Trajectory 100% Locked 🚀';
      color = 'var(--color-text-green, #10b981)';
    } else if (calculated >= 75) {
      label = 'Trajectory Aligning';
      color = 'var(--color-text-cyan, #06b6d4)';
    } else if (calculated >= 50) {
      label = 'Telemetry Calibrated';
      color = 'var(--color-text-blue, #3b82f6)';
    }

    return {
      score: Math.min(100, calculated),
      statusLabel: label,
      statusColor: color,
      checklist: [
        { label: 'Origin Role', completed: hasRole },
        { label: 'Experience Timeline', completed: hasExp },
        { label: `Arsenal (${skillsCount}/5+ skills)`, completed: hasManySkills },
        { label: 'Target Horizon', completed: hasTarget },
      ],
    };
  }, [currentRole, yearsOfExperience, skillsCount, targetRole]);

  // SVG circular gauge math
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card
      variant="default"
      elevation="none"
      style={{
        border: '1px solid var(--color-gunmetal, #1f2433)',
        background: 'var(--color-carbon-surface, #151621)',
        borderRadius: 16,
      }}
    >
      <HStack gap={4} align="center" justify="between" padding={3} wrap="wrap">
        {/* Left: Interactive Circular Meter */}
        <HStack gap={3} align="center">
          <div
            style={{
              position: 'relative',
              width: 64,
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              style={{ transform: 'rotate(-90deg)' }}
            >
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke="currentColor"
                strokeWidth="5"
                fill="transparent"
                style={{ color: 'var(--color-gunmetal, #1f2433)' }}
              />
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke="url(#trajectoryGaugeGradient)"
                strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
              <defs>
                <linearGradient id="trajectoryGaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-iris-blue, #5b63d3)" />
                  <stop offset="100%" stopColor="var(--color-periwinkle-glow, #98a4f7)" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <Text type="body" weight="bold" style={{ fontSize: '0.95rem', lineHeight: '1' }}>
                {score}%
              </Text>
            </div>
          </div>

          <VStack gap={1}>
            <HStack gap={2} align="center">
              <StatusDot
                variant={score === 100 ? 'success' : score >= 50 ? 'accent' : 'neutral'}
                label={statusLabel}
                isPulsing={score < 100}
              />
              <Heading level={4} weight="semibold" style={{ color: statusColor }}>
                {statusLabel}
              </Heading>
            </HStack>
            <Text type="supporting" color="secondary">
              {score === 100
                ? 'Your baseline and target role are fully calibrated.'
                : 'Calibrate your profile to unlock full readiness mapping.'}
            </Text>
          </VStack>
        </HStack>

        {/* Right: Telemetry Milestone Checklist */}
        <HStack gap={2} wrap="wrap">
          {checklist.map((item) => (
            <div
              key={item.label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 500,
                border: item.completed
                  ? '1px solid var(--color-border-green, #22C55E)'
                  : '1px solid var(--color-gunmetal, #1f2433)',
                background: item.completed
                  ? 'rgba(34, 197, 94, 0.12)'
                  : 'transparent',
                color: item.completed
                  ? 'var(--color-text-green, #86EFAC)'
                  : 'var(--color-muted-steel, #646e87)',
                transition: 'all 0.25s ease',
              }}
            >
              <span>{item.completed ? '✓' : '○'}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </HStack>
      </HStack>
    </Card>
  );
}
