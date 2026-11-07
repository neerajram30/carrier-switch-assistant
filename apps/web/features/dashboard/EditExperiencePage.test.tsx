import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EditExperiencePage } from './EditExperiencePage';
import type { ExtractedCareerData } from '@/features/onboarding/types';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('EditExperiencePage', () => {
  const mockInitialData: ExtractedCareerData = {
    name: 'Sarah Connor',
    currentRole: 'DevOps Specialist',
    yearsOfExperience: 5,
    skills: ['Docker', 'Kubernetes', 'Terraform'],
    workExperience: [],
    education: [],
    projects: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the edit experience internal page with title and calibration form', () => {
    render(<EditExperiencePage initialData={mockInitialData} />);

    // Top header removed by design
    // Title removed with top header
    expect(screen.getByDisplayValue('DevOps Specialist')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    expect(screen.getByText('Docker')).toBeInTheDocument();
    expect(screen.getByText('Kubernetes')).toBeInTheDocument();
  });

  it('allows saving updated profile and returns to dashboard', async () => {
    const mockSaveProfile = vi.fn().mockResolvedValue({
      id: 'prof-internal-1',
      userId: 'user-1',
      currentRole: 'DevOps Specialist',
      yearsOfExperience: 5,
      skills: ['Docker', 'Kubernetes', 'Terraform'],
      summary: '',
      targetRole: '',
      createdAt: '2026-10-20T00:00:00Z',
      updatedAt: '2026-10-20T00:00:00Z',
    });

    render(
      <EditExperiencePage
        initialData={mockInitialData}
        saveProfileFn={mockSaveProfile}
      />,
    );

    const saveBtn = screen.getByRole('button', {
      name: /Confirm & Save Profile →/i,
    });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockSaveProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          currentRole: 'DevOps Specialist',
          yearsOfExperience: '5',
          skills: expect.arrayContaining(['Docker', 'Kubernetes']),
        }),
        true,
      );
    });

    expect(
      screen.getByText(/Career profile and experience saved successfully!/i),
    ).toBeInTheDocument();
  });

  it('navigates back to dashboard when back button is clicked', () => {
    render(<EditExperiencePage initialData={mockInitialData} />);

    const backBtn = screen.getByRole('button', {
      name: /← Back to upload/i,
    });
    fireEvent.click(backBtn);

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });
});
