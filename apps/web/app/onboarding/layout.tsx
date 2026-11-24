import { ThemeProvider } from '../theme-provider';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
