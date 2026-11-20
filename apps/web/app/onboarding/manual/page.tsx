import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Onboarding | Career Switch Assistant',
  description: 'Evidence-based career readiness onboarding and resume analysis.',
};

export default function ManualOnboardingRoute() {
  redirect('/onboarding');
}
