import CareerOnboardingPage from '@/features/onboarding/CareerOnboardingPage';
import type { OnboardingStep } from '@/features/onboarding/types';

export const metadata = {
  title: 'Career Onboarding | Career Switch Assistant',
  description: 'Build your career baseline and set your target career transition goal.',
};

interface OnboardingRouteProps {
  initialStep?: OnboardingStep;
}

export default function OnboardingRoute({
  initialStep = 'upload',
}: OnboardingRouteProps = {}) {
  return <CareerOnboardingPage initialStep={initialStep} />;
}

