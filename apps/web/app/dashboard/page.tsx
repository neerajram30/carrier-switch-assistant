import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Dashboard | Career Switch Assistant',
  description: 'Evidence-based career readiness dashboard, skill gap analysis, and transition roadmap.',
};

export default function DashboardRoute() {
  redirect('/');
}
