import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExplorePathsPage } from './ExplorePathsPage';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('ExplorePathsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('renders only bubbles and central baseline hub when no item is hovered', () => {
    render(<ExplorePathsPage />);

    // Top header removed by design
    // Badge removed with top header
    expect(screen.getByText('Technical Baseline')).toBeInTheDocument();

    // Verify bubbles exist
    expect(screen.getByText('Cloud Solutions Architect')).toBeInTheDocument();
    expect(screen.getByText('AI / ML Platform Engineer')).toBeInTheDocument();
    expect(screen.getByText('Staff Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Site Reliability Engineer')).toBeInTheDocument();

    // Verify no inspector pod is open initially
    expect(
      screen.queryByRole('button', {
        name: /Set as Target & Update Roadmap/i,
      }),
    ).not.toBeInTheDocument();
  });

  it('displays the floating inspector pod only when a bubble is hovered', () => {
    render(<ExplorePathsPage />);

    const aiBubble = screen.getByText('AI / ML Platform Engineer');
    fireEvent.mouseEnter(aiBubble);

    // Inspector pod should display AI/ML Platform details
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

  it('closes inspector pod when close button is clicked', () => {
    render(<ExplorePathsPage />);

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

  it('updates target role in storage and navigates to dashboard on select', async () => {
    render(<ExplorePathsPage />);

    const cloudBubble = screen.getByText('Cloud Solutions Architect');
    fireEvent.mouseEnter(cloudBubble);

    const setTargetBtn = screen.getByRole('button', {
      name: /Set as Target & Update Roadmap/i,
    });
    fireEvent.click(setTargetBtn);

    const stored = sessionStorage.getItem('csa_career_profile');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.targetRole).toBe('Cloud Solutions Architect');
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });
});
