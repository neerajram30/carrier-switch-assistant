import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExplorePathsPage } from './ExplorePathsPage';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/dashboard/explore',
}));

const mockPaths = [
  {
    id: 'cloud-architect',
    title: 'Cloud Solutions Architect',
    matchScore: 84,
    category: 'Architecture & Cloud',
    timeline: '4 - 6 Months',
    marketDemand: 'Very High',
    salaryRange: '$175k - $235k',
    description: 'Design fault-tolerant, scalable architectures on cloud.',
    bridgeSkills: ['Distributed Consensus', 'AWS Well-Architected'],
  },
  {
    id: 'ai-ml-engineer',
    title: 'AI / ML Platform Engineer',
    matchScore: 72,
    category: 'AI & Systems',
    timeline: '6 - 9 Months',
    marketDemand: 'Explosive',
    salaryRange: '$185k - $250k',
    description: 'Build infrastructure for LLM deployment and fine-tuning.',
    bridgeSkills: ['Python & PyTorch', 'Vector DBs'],
  },
];

describe('ExplorePathsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/v1/career-paths/select')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 'new-rm-123', targetRole: 'Cloud Solutions Architect' }),
        } as unknown as Response);
      }
      if (url.includes('/api/v1/career-paths')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockPaths,
        } as unknown as Response);
      }
      if (url.includes('/api/v1/roadmap')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ roadmaps: [] }),
        } as unknown as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      } as unknown as Response);
    });
  });

  it('renders loading state then displays bubbles and central baseline hub', async () => {
    render(<ExplorePathsPage />);

    // Initially or upon fetch resolution
    await waitFor(() => {
      expect(screen.getByText('Technical Baseline')).toBeInTheDocument();
    });

    expect(screen.getByText('2 Paths Calibrated')).toBeInTheDocument();
    expect(screen.getByText('Cloud Solutions Architect')).toBeInTheDocument();
    expect(screen.getByText('AI / ML Platform Engineer')).toBeInTheDocument();

    // Verify no inspector pod is open initially
    expect(
      screen.queryByRole('button', {
        name: /Set as Target & Update Roadmap/i,
      }),
    ).not.toBeInTheDocument();
  });

  it('displays the floating inspector pod only when a bubble is hovered', async () => {
    render(<ExplorePathsPage />);

    await waitFor(() => {
      expect(screen.getByText('AI / ML Platform Engineer')).toBeInTheDocument();
    });

    const aiBubble = screen.getByText('AI / ML Platform Engineer');
    fireEvent.mouseEnter(aiBubble);

    expect(screen.getByText('AI & Systems')).toBeInTheDocument();
    expect(screen.getByText('72% Readiness Match')).toBeInTheDocument();
    expect(screen.getByText('6 - 9 Months')).toBeInTheDocument();
    expect(screen.getByText('Explosive')).toBeInTheDocument();
    expect(screen.getByText('$185k - $250k')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /Set as Target & Update Roadmap/i,
      }),
    ).toBeInTheDocument();
  });

  it('closes inspector pod when close button is clicked', async () => {
    render(<ExplorePathsPage />);

    await waitFor(() => {
      expect(screen.getByText('AI / ML Platform Engineer')).toBeInTheDocument();
    });

    const aiBubble = screen.getByText('AI / ML Platform Engineer');
    fireEvent.mouseEnter(aiBubble);

    const closeBtn = screen.getByRole('button', { name: /Close pod/i });
    fireEvent.click(closeBtn);

    expect(
      screen.queryByRole('button', {
        name: /Set as Target & Update Roadmap/i,
      }),
    ).not.toBeInTheDocument();
  });

  it('generates roadmap dynamically and navigates to track page with roadmapId', async () => {
    render(<ExplorePathsPage />);

    await waitFor(() => {
      expect(screen.getByText('Cloud Solutions Architect')).toBeInTheDocument();
    });

    const cloudBubble = screen.getByText('Cloud Solutions Architect');
    fireEvent.mouseEnter(cloudBubble);

    const setTargetBtn = screen.getByRole('button', {
      name: /Set as Target & Update Roadmap/i,
    });
    fireEvent.click(setTargetBtn);

    await waitFor(() => {
      const stored = sessionStorage.getItem('csa_career_profile');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.targetRole).toBe('Cloud Solutions Architect');
      expect(mockPush).toHaveBeenCalledWith('/dashboard/track?roadmapId=new-rm-123');
    });
  });

  it('renders transparent error card with real message when career paths call fails', async () => {
    vi.mocked(global.fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/v1/career-paths')) {
        return Promise.resolve({
          ok: false,
          status: 502,
          statusText: 'Bad Gateway',
          json: async () => ({ message: 'Gemini rate limit exceeded' }),
        } as unknown as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      } as unknown as Response);
    });

    render(<ExplorePathsPage />);

    await waitFor(() => {
      expect(
        screen.getByText('Trajectory Calibration Unavailable'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Gemini rate limit exceeded'),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Retry Calibration/i }),
      ).toBeInTheDocument();
    });
  });
});
