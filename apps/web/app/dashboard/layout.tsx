import { AppSidebar } from '@/features/navigation/AppSidebar';
import SessionProvider from '@/components/SessionProvider';
import { ThemeProvider } from '../theme-provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <div
          style={{
            display: 'flex',
            height: '100vh',
            maxHeight: '100vh',
            width: '100%',
            background: 'var(--color-void-black, #0f101a)',
            overflow: 'hidden',
          }}
        >
          <AppSidebar />
          <div
            style={{
              flex: 1,
              minWidth: 0,
              height: '100%',
              maxHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              justifyContent: 'flex-start',
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
          >
            {children}
          </div>
        </div>
      </ThemeProvider>
    </SessionProvider>
  );
}
