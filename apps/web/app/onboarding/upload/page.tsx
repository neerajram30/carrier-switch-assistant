import ResumeUploadPage from '@/features/onboarding/pages/ResumeUploadPage';

export const metadata = {
  title: 'Upload Resume | Career Switch Assistant',
  description: 'Upload your resume to extract skills, experience, and baseline profile.',
};

export default function ResumeUploadRoute() {
  return <ResumeUploadPage />;
}
