import { ExplorePathsPage } from '@/features/explore/ExplorePathsPage';
import DashboardLayout from '@/components/DashboardLayout';

export const metadata = {
  title: 'Explore Career Paths | Career Switch Assistant',
  description: 'Explore interactive career options and benchmark readiness against your profile baseline.',
};

export default function ExplorePathsRoute() {
  return (
    <DashboardLayout>
      <ExplorePathsPage />
    </DashboardLayout>
  );
}
