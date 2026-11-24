import { ThemeProvider } from '../theme-provider';

export default function StatusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
