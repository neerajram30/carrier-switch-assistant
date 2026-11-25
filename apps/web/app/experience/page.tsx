import { EditExperiencePage } from '@/features/dashboard/EditExperiencePage';
import DashboardLayout from '@/components/DashboardLayout';

export const metadata = {
  title: 'Edit Experience | Career Switch Assistant',
  description: 'Calibrate your technical baseline, work experience, competencies, and achievements.',
};

export default function ExperienceRoute() {
  return (
    <DashboardLayout>
      <EditExperiencePage />
    </DashboardLayout>
  );
}
