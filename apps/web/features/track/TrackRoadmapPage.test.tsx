import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TrackRoadmapPage } from './TrackRoadmapPage';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/dashboard/track',
}));

const mockRoadmapData = {
  id: 'rm-1',
  targetRole: 'Cloud Solutions Architect',
  estimatedMonths: 6,
  progressPercent: 20,
  milestones: [
    {
      id: 'm-1',
      weekRange: 'Week 1 - 2',
      title: 'Distributed Systems & Consensus Fundamentals',
      description: 'Master CAP theorem and Paxos/Raft consensus algorithms.',
      duration: '15 hrs',
      isCompleted: false,
      category: 'Architecture',
      dailyTasks: [
        {
          id: 'd1',
          dayNumber: 1,
          dayLabel: 'Day 1',
          title: 'CAP Theorem & PACELC Trade-off Deep Dive',
          learningFocus: 'Study consistency models and network partition scenarios.',
          actionItem: 'Draft a short engineering RFC on PACELC trade-offs.',
          duration: '2.5 hrs',
          isCompleted: true,
        },
        {
          id: 'd2',
          dayNumber: 2,
          dayLabel: 'Day 2',
          title: 'Raft Consensus Protocol & Leader Election',
          learningFocus: 'Analyze heartbeat timeouts and split-vote mitigation.',
          actionItem: 'Implement a minimal Raft state-machine simulation.',
          duration: '3.0 hrs',
          isCompleted: false,
        },
      ],
    },
    {
      id: 'm-2',
      weekRange: 'Week 3 - 4',
      title: 'AWS Well-Architected Framework & VPC Networking',
      description: 'Multi-AZ VPCs, Transit Gateways, and Direct Connect routing.',
      duration: '18 hrs',
      isCompleted: true,
      category: 'Cloud',
      dailyTasks: [
        {
          id: 'd3',
          dayNumber: 1,
          dayLabel: 'Day 1',
          title: 'VPC Subnetting & CIDR Block Allocation',
          learningFocus: 'RFC 1918 private networking guidelines.',
          actionItem: 'Write Terraform module for 3-tier VPC.',
          duration: '2.5 hrs',
          isCompleted: true,
        },
      ],
    },
  ],
};

describe('TrackRoadmapPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    // Reset global fetch mock
    global.fetch = vi.fn();
  });

  it('renders empty state when no target path or roadmap is set', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    } as unknown as Response);

    render(<TrackRoadmapPage />);

    await waitFor(() => {
      expect(
        screen.getByText('No Target Career Path Selected Yet'),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText('Explore & Select Career Path'),
    ).toBeInTheDocument();
  });

  it('loads roadmap from API and displays milestones and daily tasks', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRoadmapData,
    } as unknown as Response);

    render(<TrackRoadmapPage />);

    // Target role is displayed
    await waitFor(() => {
      expect(
        screen.getByText('Cloud Solutions Architect'),
      ).toBeInTheDocument();
    });

    // Milestone titles rendered
    expect(
      screen.getByText('Distributed Systems & Consensus Fundamentals'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('AWS Well-Architected Framework & VPC Networking'),
    ).toBeInTheDocument();

    // Verify first active milestone starts expanded showing daily tasks
    expect(
      screen.getByText('CAP Theorem & PACELC Trade-off Deep Dive'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Raft Consensus Protocol & Leader Election'),
    ).toBeInTheDocument();

    // Verify concepts & lab sections rendered
    expect(screen.getAllByText('Concepts & Theory').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Hands-on Lab Exercise').length).toBeGreaterThan(0);
    expect(
      screen.getByText('Study consistency models and network partition scenarios.'),
    ).toBeInTheDocument();
  });

  it('toggles individual daily tasks and calls the API endpoint', async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoadmapData,
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          milestone: { id: 'm-1', isCompleted: false },
          progressPercent: 66,
        }),
      } as unknown as Response);

    render(<TrackRoadmapPage />);

    await waitFor(() => {
      expect(
        screen.getByText('Raft Consensus Protocol & Leader Election'),
      ).toBeInTheDocument();
    });

    // Find and click the checkbox for Day 2
    const taskCheckbox = screen.getByLabelText(
      'Toggle Day 2: Raft Consensus Protocol & Leader Election',
    );
    expect(taskCheckbox).not.toBeChecked();

    fireEvent.click(taskCheckbox);

    // Optimistically checked
    expect(taskCheckbox).toBeChecked();

    // Verify PATCH was sent to task toggle endpoint
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/roadmap/milestones/m-1/tasks/d2/toggle'),
      expect.objectContaining({
        method: 'PATCH',
      }),
    );
  });

  it('toggles full milestone completion state and calls API endpoint', async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoadmapData,
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          milestone: { id: 'm-1', isCompleted: true },
          progressPercent: 100,
        }),
      } as unknown as Response);

    render(<TrackRoadmapPage />);

    await waitFor(() => {
      expect(
        screen.getByText('Distributed Systems & Consensus Fundamentals'),
      ).toBeInTheDocument();
    });

    const sprintCheckbox = screen.getByLabelText(
      'Mark sprint Distributed Systems & Consensus Fundamentals as completed',
    );
    expect(sprintCheckbox).not.toBeChecked();

    fireEvent.click(sprintCheckbox);

    expect(sprintCheckbox).toBeChecked();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/roadmap/milestones/m-1/toggle'),
      expect.objectContaining({
        method: 'PATCH',
      }),
    );
  });

  it('filters milestones by All, In Progress, and Completed', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRoadmapData,
    } as unknown as Response);

    render(<TrackRoadmapPage />);

    await waitFor(() => {
      expect(
        screen.getByText('Distributed Systems & Consensus Fundamentals'),
      ).toBeInTheDocument();
    });

    // Click "Completed" filter
    fireEvent.click(screen.getByRole('button', { name: /Completed \(1\)/i }));

    // Completed milestone is present
    expect(
      screen.getByText('AWS Well-Architected Framework & VPC Networking'),
    ).toBeInTheDocument();

    // In-progress milestone is filtered out
    expect(
      screen.queryByText('Distributed Systems & Consensus Fundamentals'),
    ).not.toBeInTheDocument();

    // Click "In Progress" filter
    fireEvent.click(screen.getByRole('button', { name: /In Progress \(1\)/i }));

    expect(
      screen.getByText('Distributed Systems & Consensus Fundamentals'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('AWS Well-Architected Framework & VPC Networking'),
    ).not.toBeInTheDocument();
  });
});
