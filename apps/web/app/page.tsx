import DashboardPage from '@/features/dashboard/DashboardPage';
import DashboardLayout from './dashboard/layout';

export const metadata = {
  title: 'Dashboard | Career Switch Assistant',
  description:
    'Evidence-based career readiness dashboard, skill gap analysis, and transition roadmap.',
};

export default function Home() {
  return (
    <DashboardLayout>
      <DashboardPage />
    </DashboardLayout>
  );
}
