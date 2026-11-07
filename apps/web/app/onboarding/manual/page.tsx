import ManualOnboardingPage from '@/features/onboarding/pages/ManualOnboardingPage';

export const metadata = {
  title: 'Manual Career Baseline | Career Switch Assistant',
  description: 'Enter your technical role, years of experience, and competencies manually.',
};

export default function ManualOnboardingRoute() {
  return <ManualOnboardingPage />;
}
