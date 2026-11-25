import { cookies } from 'next/headers';
import { auth } from '@/auth';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardPage from '@/features/dashboard/DashboardPage';
import { LandingView } from '@/features/landing/LandingView';

export { metadata } from '@/features/landing/metadata';

export default async function RootPage() {
  const cookieStore = await cookies();
  const hasSessionToken =
    cookieStore.has('__Secure-authjs.session-token') ||
    cookieStore.has('authjs.session-token') ||
    cookieStore.has('__Secure-next-auth.session-token') ||
    cookieStore.has('next-auth.session-token');

  let session = null;
  if (hasSessionToken) {
    try {
      session = await auth();
    } catch {
      session = null;
    }
  }

  if (session?.user) {
    return (
      <DashboardLayout>
        <DashboardPage />
      </DashboardLayout>
    );
  }

  return <LandingView />;
}
