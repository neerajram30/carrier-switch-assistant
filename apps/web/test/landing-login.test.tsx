import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LandingLoginPage from '../features/landing/LandingLoginPage';
import Home from '../app/page';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Landing & Login Page Unit and Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders landing page with full project details, value pillars, and login interface', () => {
    render(<Home />);

    // Brand and Header
    expect(screen.getAllByText('Career Switch Assistant').length).toBeGreaterThan(0);
    expect(screen.getByText('Software Career Readiness')).toBeInTheDocument();
    expect(screen.getByText('Evidence-Based Transition Platform')).toBeInTheDocument();

    // Value Proposition and Details
    expect(
      screen.getByRole('heading', {
        name: /Turn your career goals into an actionable roadmap/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByText('Resume Extraction')).toBeInTheDocument();
    expect(screen.getByText('Readiness Indicators')).toBeInTheDocument();
    expect(screen.getByText('Advisory & Private')).toBeInTheDocument();

    // Form inputs and Action Buttons
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Developer Name/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Sign In & Open Onboarding/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /One-Click Demo Access/i }),
    ).toBeInTheDocument();

    // Architecture & Status links
    expect(screen.getAllByRole('link', { name: /System Status/i }).length).toBeGreaterThanOrEqual(1);
  });

  it('validates email input and shows error message for empty or invalid email', async () => {
    render(<LandingLoginPage />);

    const emailInput = screen.getByLabelText(/Email Address/i);
    const submitButton = screen.getByRole('button', { name: /Sign In & Open Onboarding/i });

    // Empty email test
    fireEvent.change(emailInput, { target: { value: '' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Please enter your email address')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();

    // Invalid email test
    fireEvent.change(emailInput, { target: { value: 'invalid-email-format' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Please enter a valid email format')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('navigates to /onboarding upon valid login submission and triggers callback', async () => {
    const handleLoginSuccess = vi.fn();
    render(<LandingLoginPage onLoginSuccess={handleLoginSuccess} />);

    const emailInput = screen.getByLabelText(/Email Address/i);
    const submitButton = screen.getByRole('button', { name: /Sign In & Open Onboarding/i });

    fireEvent.change(emailInput, { target: { value: 'test.user@company.org' } });
    fireEvent.click(submitButton);

    expect(handleLoginSuccess).toHaveBeenCalledWith('test.user@company.org', 'Alex Morgan');

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding');
    });
  });

  it('supports one-click quick demo login', async () => {
    const handleLoginSuccess = vi.fn();
    render(<LandingLoginPage onLoginSuccess={handleLoginSuccess} />);

    const quickDemoButton = screen.getByRole('button', { name: /One-Click Demo Access/i });
    fireEvent.click(quickDemoButton);

    expect(handleLoginSuccess).toHaveBeenCalledWith('dev-user@example.com', 'Alex Morgan');

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding');
    });
  });
});
