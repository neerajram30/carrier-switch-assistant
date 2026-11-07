import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ManualOnboardingPage from './ManualOnboardingPage';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('ManualOnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders guided manual onboarding page and saves profile', async () => {
    const mockSaveProfile = vi.fn().mockResolvedValue({
      id: 'prof-manual-1',
      userId: 'user-1',
      currentRole: 'Backend Engineer',
      yearsOfExperience: 4,
      skills: ['Python', 'Docker'],
      summary: '',
      targetRole: 'AI Platform Engineer',
      createdAt: '2026-10-20T00:00:00Z',
      updatedAt: '2026-10-20T00:00:00Z',
    });

    render(<ManualOnboardingPage saveProfileFn={mockSaveProfile} />);

    // Step 1: Current role & experience
    expect(
      screen.getByText(/What is your current role & background\?/i),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Current role \*/i), {
      target: { value: 'Backend Engineer' },
    });
    fireEvent.change(screen.getByLabelText(/Years of experience \*/i), {
      target: { value: '4' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Continue to Goal →/i }));

    // Step 2: Target destination
    expect(
      screen.getByText(/Where do you want to switch to\?/i),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /AI \/ ML Platform Engineer/i }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Continue to Skills →/i }),
    );

    // Step 3: Core skills
    expect(
      screen.getByText(/What are your core technical skills\?/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /\+ Python/i }));
    fireEvent.click(screen.getByRole('button', { name: /\+ Docker/i }));

    fireEvent.click(
      screen.getByRole('button', {
        name: /Lock Baseline & Go to Dashboard →/i,
      }),
    );

    await waitFor(() => {
      expect(mockSaveProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          currentRole: 'Backend Engineer',
          yearsOfExperience: '4',
          targetRole: 'AI / ML Platform Engineer',
          skills: expect.arrayContaining(['Python', 'Docker']),
        }),
        false,
      );
    });

    expect(
      screen.getByText(/Career profile saved successfully!/i),
    ).toBeInTheDocument();
  });

  it('navigates back to /onboarding when clicking back button', () => {
    render(<ManualOnboardingPage />);

    const backBtn = screen.getByRole('button', { name: /← Back to upload/i });
    fireEvent.click(backBtn);

    expect(mockPush).toHaveBeenCalledWith('/onboarding');
  });
});
