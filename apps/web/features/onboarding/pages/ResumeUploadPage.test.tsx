import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ResumeUploadPage from './ResumeUploadPage';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('ResumeUploadPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders resume upload baseline page', () => {
    render(<ResumeUploadPage />);

    expect(screen.getByText('Build your career baseline')).toBeInTheDocument();
    expect(
      screen.getByText('Drop your resume here, or browse files'),
    ).toBeInTheDocument();
  });

  it('navigates to /onboarding/manual when selecting manual entry', () => {
    render(<ResumeUploadPage />);

    const manualBtn = screen.getByRole('button', {
      name: /Enter details manually →/i,
    });
    fireEvent.click(manualBtn);

    expect(mockPush).toHaveBeenCalledWith('/onboarding/manual');
  });

  it('provides an option to return to dashboard when career data is already created', async () => {
    sessionStorage.setItem(
      'csa_career_profile',
      JSON.stringify({
        currentRole: 'Backend Engineer',
        skills: ['Node.js', 'PostgreSQL'],
      }),
    );

    render(<ResumeUploadPage />);

    const returnBtn = await screen.findByRole('button', {
      name: /← Return to Dashboard/i,
    });
    expect(returnBtn).toBeInTheDocument();

    fireEvent.click(returnBtn);
    expect(mockPush).toHaveBeenCalledWith('/dashboard');

    sessionStorage.clear();
  });

  it('does not render a boxed navbar header on the external upload page', () => {
    render(<ResumeUploadPage />);

    // Should not render the top header navbar
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  });
});
