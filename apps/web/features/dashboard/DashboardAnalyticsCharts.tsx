'use client';

import React from 'react';
import Link from 'next/link';
import '@astryxdesign/charts/charts.css';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { VStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import {
  Chart,
  bar,
  line,
  area,
  ChartAxis,
  ChartGrid,
} from '@astryxdesign/charts';
import { BarChart3, TrendingUp } from 'lucide-react';

export interface DashboardAnalyticsChartsProps {
  weeklyVelocityData: Array<{ day: string; tasks: number }>;
  sprintTrajectoryData: Array<{ sprint: string; readiness: number }>;
  targetRole?: string | null;
}

export function DashboardAnalyticsChartsSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(380px, 1.2fr) minmax(340px, 1fr)',
        gap: 20,
        width: '100%',
      }}
    >
      <div
        className="animate-pulse"
        style={{
          height: 310,
          background: 'var(--color-carbon-surface, #151621)',
          border: '1px solid var(--color-gunmetal, #1f2433)',
          borderRadius: 8,
        }}
      />
      <div
        className="animate-pulse"
        style={{
          height: 310,
          background: 'var(--color-carbon-surface, #151621)',
          border: '1px solid var(--color-gunmetal, #1f2433)',
          borderRadius: 8,
        }}
      />
    </div>
  );
}

export default function DashboardAnalyticsCharts({
  weeklyVelocityData,
  sprintTrajectoryData,
  targetRole,
}: DashboardAnalyticsChartsProps) {
  return (
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
            <span
              style={{
                fontSize: '0.74rem',
                color: weeklyVelocityData.some((d) => d.tasks > 0) ? '#86EFAC' : 'var(--color-muted-steel, #646e87)',
                fontWeight: 600,
              }}
            >
              {weeklyVelocityData.some((d) => d.tasks > 0) ? 'Active Cadence' : '0 Tasks This Week'}
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
            {targetRole ? (
              <span style={{ fontSize: '0.74rem', color: 'var(--color-periwinkle-glow, #98a4f7)', fontWeight: 600 }}>
                {targetRole}
              </span>
            ) : null}
          </div>
          <Text type="supporting" color="secondary" style={{ fontSize: '0.8rem' }}>
            Estimated cumulative transition competency across progressive sprint milestones.
          </Text>

          {/* Astryx Area & Line Chart */}
          <div style={{ width: '100%', marginTop: 8 }}>
            {sprintTrajectoryData.length > 0 ? (
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
            ) : (
              <div
                style={{
                  height: 210,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'rgba(15, 16, 26, 0.4)',
                  border: '1px dashed var(--color-gunmetal, #1f2433)',
                  borderRadius: 8,
                  padding: 16,
                  textAlign: 'center',
                }}
              >
                <Text type="supporting" color="secondary">
                  No active roadmap selected yet.
                </Text>
                <Link href="/explore" style={{ textDecoration: 'none' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-periwinkle-glow, #98a4f7)' }}>
                    Explore Career Paths &amp; Generate Roadmap →
                  </span>
                </Link>
              </div>
            )}
          </div>
        </VStack>
      </Card>
    </div>
  );
}
