import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardPage from '../features/dashboard/DashboardPage';
import { useSession } from 'next-auth/react';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/',
}));

describe('User-Specific Dashboard & Session Access Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /login when user session is not found (unauthenticated)', async () => {
    vi.mocked(useSession).mockReturnValueOnce({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('renders user-specific profile, verified skills, and progress when authenticated', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: 'user-alice-1234',
          name: 'Alice Johnson',
          email: 'alice@example.com',
          apiToken: 'alice-bearer-token',
        },
        expires: '2099-01-01',
      },
      status: 'authenticated',
      update: vi.fn(),
    });

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/v1/career-profile')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            id: 'cp-alice',
            userId: 'user-alice-1234',
            currentRole: 'Cloud Solutions Architect',
            yearsOfExperience: 6,
            skills: ['AWS', 'Terraform', 'Kubernetes', 'Go'],
            targetRole: 'VP of Cloud Infrastructure',
          }),
        } as Response);
      }

      if (url.includes('/api/v1/career-paths')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [
            {
              id: 'path-vp-cloud',
              title: 'VP of Cloud Infrastructure',
              description: 'Executive cloud architecture leadership',
              fitScore: 92,
              bridgeSkills: ['Executive Strategy', 'Cost Governance'],
              timelineMonths: 6,
            },
          ],
        } as Response);
      }

      if (url.includes('/api/v1/roadmap/activity')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            activity: [],
            totalActiveDays: 14,
            currentStreak: 5,
            longestStreak: 12,
          }),
        } as Response);
      }

      if (url.includes('/api/v1/roadmap')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            id: 'rm-alice-1',
            targetRole: 'VP of Cloud Infrastructure',
            progressPercent: 40,
            milestones: [
              {
                id: 'm-1',
                weekRange: 'Sprint 1',
                title: 'Cloud Governance Alignment',
                description: 'Review organizational multi-account structures',
                duration: '10 hrs',
                isCompleted: true,
                category: 'Architecture',
                dailyTasks: [],
              },
            ],
            roadmaps: [
              {
                id: 'rm-alice-1',
                targetRole: 'VP of Cloud Infrastructure',
                progressPercent: 40,
              },
            ],
          }),
        } as Response);
      }

      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as Response);
    });

    render(<DashboardPage />);

    // Check that user-specific role is displayed
    await waitFor(() => {
      expect(screen.getByText(/Cloud Solutions Architect/i)).toBeInTheDocument();
      expect(screen.getByText(/6 yrs/i)).toBeInTheDocument();
    });

    // Check that Alice's specific target role and suggestions are rendered
    await waitFor(() => {
      expect(screen.getAllByText(/VP of Cloud Infrastructure/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/AWS/i)).toBeInTheDocument();
      expect(screen.getByText(/Kubernetes/i)).toBeInTheDocument();
      expect(screen.getByText(/Terraform/i)).toBeInTheDocument();
    });

    // Check tailored career suggestions section
    await waitFor(() => {
      expect(screen.getByText(/Tailored Career Suggestions/i)).toBeInTheDocument();
      expect(screen.getByText(/92% Fit/i)).toBeInTheDocument();
    });

    // Verify fetch calls sent the authorization token or headers
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/career-profile'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });
});
