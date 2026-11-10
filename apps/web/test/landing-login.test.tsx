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

  it('renders elegant focused login interface without marketing jargons', () => {
    render(<Home />);

    // Header & Greeting
    expect(
      screen.getByRole('heading', { name: /Welcome back/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Please enter your details.')).toBeInTheDocument();

    // Form inputs and Controls
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByText('Remember for 30 days')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Login$/i })).toBeInTheDocument();

    // Social and Quick Sign-In
    expect(screen.getByText(/OR SIGN IN WITH/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in with GitHub/i })).toBeInTheDocument();

    // Branding and Status
    expect(screen.getByText('Career Switch Assistant')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Systems Operational/i })).toBeInTheDocument();
  });

  it('toggles password visibility with the eye icon button', () => {
    render(<LandingLoginPage />);

    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const toggleButton = screen.getByRole('button', { name: /Show password/i });

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    const hideButton = screen.getByRole('button', { name: /Hide password/i });
    fireEvent.click(hideButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('validates email input and shows error message for empty or invalid email', async () => {
    render(<LandingLoginPage />);

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const submitButton = screen.getByRole('button', { name: /^Login$/i });

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

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: /^Login$/i });

    fireEvent.change(emailInput, { target: { value: 'test.user@company.org' } });
    fireEvent.change(passwordInput, { target: { value: 'securePass123' } });
    fireEvent.click(submitButton);

    expect(handleLoginSuccess).toHaveBeenCalledWith('test.user@company.org', 'Alex Morgan');

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding');
    });
  });

  it('supports social sign-in with Google and navigates to /onboarding', async () => {
    const handleLoginSuccess = vi.fn();
    render(<LandingLoginPage onLoginSuccess={handleLoginSuccess} />);

    const googleButton = screen.getByRole('button', { name: /Sign in with Google/i });
    fireEvent.click(googleButton);

    expect(handleLoginSuccess).toHaveBeenCalledWith('dev-user@example.com', 'Alex Morgan');

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding');
    });
  });

  it('supports social sign-in with GitHub and navigates to /onboarding', async () => {
    const handleLoginSuccess = vi.fn();
    render(<LandingLoginPage onLoginSuccess={handleLoginSuccess} />);

    const githubButton = screen.getByRole('button', { name: /Sign in with GitHub/i });
    fireEvent.click(githubButton);

    expect(handleLoginSuccess).toHaveBeenCalledWith('github-dev@example.com', 'Alex Morgan');

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding');
    });
  });

  it('supports quick demo fill button', async () => {
    const handleLoginSuccess = vi.fn();
    render(<LandingLoginPage onLoginSuccess={handleLoginSuccess} />);

    const demoFillButton = screen.getByRole('button', { name: /Demo fill/i });
    fireEvent.click(demoFillButton);

    expect(handleLoginSuccess).toHaveBeenCalledWith('dev-user@example.com', 'Alex Morgan');

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding');
    });
  });
});
