import { Metadata } from 'next';
import { TrackRoadmapPage } from '@/features/track/TrackRoadmapPage';

export const metadata: Metadata = {
  title: 'Track Roadmap & Daily Execution | Career Switch Assistant',
  description:
    'Detailed weekly milestone sprints and daily micro-tasks calibrated against your engineering career baseline.',
};

export default function TrackRoadmapRoute() {
  return <TrackRoadmapPage />;
}
