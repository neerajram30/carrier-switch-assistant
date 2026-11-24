import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LandingPage, { metadata } from '../app/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => '/',
}));

describe('SSR Landing Page & SEO Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports proper comprehensive SEO metadata for SSR search engine crawlers', () => {
    expect(metadata.title).toContain('Career Switch Assistant');
    expect(metadata.description).toBeDefined();
    expect(metadata.openGraph).toBeDefined();
    expect(metadata.openGraph?.title).toContain('Career Switch Assistant');
    expect(metadata.twitter).toBeDefined();
    expect(metadata.robots).toBeDefined();
    expect(metadata.keywords).toBeDefined();
    expect(metadata.keywords).toContain('software engineering career roadmap');
  });

  it('renders high-impact hero headline and CTAs matching the reference design', () => {
    render(<LandingPage />);

    // Check high-impact multi-line punchy headline
    expect(screen.getByText(/Assess Skills\./i)).toBeInTheDocument();
    expect(screen.getByText(/Target Roles\./i)).toBeInTheDocument();
    expect(screen.getByText(/Bridge The Gaps\./i)).toBeInTheDocument();
    expect(screen.getByText(/One Platform\./i)).toBeInTheDocument();

    // Check CTAs connecting to signup and login
    const signupLinks = screen.getAllByRole('link', { name: /Get Started Free|Sign up free/i });
    expect(signupLinks.length).toBeGreaterThan(0);
    const loginLinks = screen.getAllByRole('link', { name: /Log in/i });
    expect(loginLinks.length).toBeGreaterThan(0);
  });

  it('renders interactive role switch simulator and recalculates on selection', () => {
    render(<LandingPage />);

    expect(screen.getByText(/Simulate Your Transition Velocity/i)).toBeInTheDocument();

    // Select Backend Developer role
    const backendBtn = screen.getByRole('button', { name: /Backend Developer/i });
    fireEvent.click(backendBtn);

    // Verify readiness updates
    expect(screen.getByText(/Your Transferable Strengths/i)).toBeInTheDocument();
    expect(screen.getByText(/Key Gaps To Bridge/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Build My Tailored Roadmap/i })).toBeInTheDocument();
  });

  it('renders core SRE features and traditional vs assistant comparison matrix', () => {
    render(<LandingPage />);

    expect(
      screen.getByText(/Built Like An SRE Console For Your Career/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/One-Click Experience Telemetry/i)).toBeInTheDocument();
    expect(screen.getByText(/Market-Calibrated Gap Analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/12-Week Day-by-Day Roadmaps/i)).toBeInTheDocument();

    // Comparison section
    expect(
      screen.getByText(/Traditional Guesswork vs\. SRE Telemetry/i)
    ).toBeInTheDocument();
  });

  it('renders accessible FAQ section with expandable details', () => {
    render(<LandingPage />);

    expect(
      screen.getByText(/Frequently Asked Questions/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/How does Career Switch Assistant benchmark my existing skills\?/i)
    ).toBeInTheDocument();
  });

  it('renders footer with proper branding adhering to product principles', () => {
    render(<LandingPage />);

    expect(
      screen.getByText(/The evidence-based career transition platform for software engineers/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Built with Next.js and NestJS/i)
    ).toBeInTheDocument();
  });
});
