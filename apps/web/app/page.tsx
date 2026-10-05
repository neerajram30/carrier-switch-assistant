import CareerOnboardingPage from '@/features/onboarding/CareerOnboardingPage';

export const metadata = {
  title: 'Career Switch Assistant',
  description:
    'Turn your career goal into an actionable roadmap. Start by uploading your resume or entering your background.',
};

export default function Home() {
  return <CareerOnboardingPage />;
}
