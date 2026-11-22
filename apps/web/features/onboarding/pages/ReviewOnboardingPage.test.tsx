import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ReviewOnboardingPage from './ReviewOnboardingPage';
import type { ExtractedCareerData } from '../types';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('ReviewOnboardingPage', () => {
  const mockInitialData: ExtractedCareerData = {
    name: 'Alice Developer',
    currentRole: 'Senior Cloud Engineer',
    yearsOfExperience: 6,
    skills: ['AWS', 'Kubernetes', 'Go'],
    workExperience: [],
    education: [],
    projects: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders extracted data and confirms profile to dashboard', async () => {
    const mockSaveProfile = vi.fn().mockResolvedValue({
      id: 'prof-rev-1',
      userId: 'user-1',
      currentRole: 'Senior Cloud Engineer',
      yearsOfExperience: 6,
      skills: ['AWS', 'Kubernetes', 'Go'],
      summary: '',
      targetRole: '',
      createdAt: '2026-10-20T00:00:00Z',
      updatedAt: '2026-10-20T00:00:00Z',
    });

    render(
      <ReviewOnboardingPage
        initialData={mockInitialData}
        saveProfileFn={mockSaveProfile}
      />,
    );

    expect(screen.getByText('Review extracted career data')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Senior Cloud Engineer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('6')).toBeInTheDocument();
    expect(screen.getByText('AWS')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', {
      name: /Confirm & Save Profile →/i,
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockSaveProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          currentRole: 'Senior Cloud Engineer',
          yearsOfExperience: '6',
          skills: expect.arrayContaining(['AWS', 'Kubernetes', 'Go']),
        }),
        false,
      );
    });

    expect(
      screen.getByText(/Career profile saved successfully!/i),
    ).toBeInTheDocument();
  });

  it('does not render manual entry button in review flow', () => {
    render(<ReviewOnboardingPage initialData={mockInitialData} />);

    expect(
      screen.queryByRole('button', {
        name: /Switch to manual form/i,
      }),
    ).not.toBeInTheDocument();
  });

  it('allows navigating back to upload page', () => {
    render(<ReviewOnboardingPage initialData={mockInitialData} />);

    const backBtn = screen.getByRole('button', {
      name: /← Back to upload/i,
    });
    fireEvent.click(backBtn);

    expect(mockPush).toHaveBeenCalledWith('/onboarding');
  });
});
