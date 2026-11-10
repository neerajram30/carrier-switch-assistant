import { Suspense } from 'react';
import { Metadata } from 'next';
import { TrackRoadmapPage } from '@/features/track/TrackRoadmapPage';

export const metadata: Metadata = {
  title: 'Track Roadmap & Daily Execution | Career Switch Assistant',
  description:
    'Detailed weekly milestone sprints and daily micro-tasks calibrated against your engineering career baseline.',
};

export default function TrackRoadmapRoute() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            background: 'var(--color-void-black, #0f101a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-periwinkle-glow, #98a4f7)',
            fontSize: '0.95rem',
          }}
        >
          Loading Roadmap Telemetry...
        </div>
      }
    >
      <TrackRoadmapPage />
    </Suspense>
  );
}
