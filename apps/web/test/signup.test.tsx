import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SignupPage from '../features/auth/SignupPage';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('SignupPage Unit and Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        user: { id: 'user-1', name: 'Jane Doe', email: 'jane@example.com' },
        token: 'mock-jwt-token',
      }),
    } as Response);
  });

  it('renders all required signup inputs and buttons', () => {
    render(<SignupPage />);

    expect(
      screen.getByRole('heading', { name: /Create an account/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Start your personalized career transition journey/i),
    ).toBeInTheDocument();

    expect(screen.getByPlaceholderText('Enter your full name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Create password (min. 8 chars)'),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm password')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Create account/i }),
    ).toBeInTheDocument();

    expect(screen.getByText(/OR SIGN UP WITH/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Sign up with Google/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Sign up with GitHub/i }),
    ).toBeInTheDocument();

    expect(screen.getByText(/Already have an account\?/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Log in/i })).toBeInTheDocument();
  });

  it('toggles password and confirm-password visibility', () => {
    render(<SignupPage />);

    const passwordInput = screen.getByPlaceholderText('Create password (min. 8 chars)');
    const togglePassBtn = screen.getByRole('button', { name: /Show password/i });

    expect(passwordInput).toHaveAttribute('type', 'password');
    fireEvent.click(togglePassBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    const confirmInput = screen.getByPlaceholderText('Confirm password');
    const toggleConfirmBtn = screen.getByRole('button', { name: /Show confirm password/i });

    expect(confirmInput).toHaveAttribute('type', 'password');
    fireEvent.click(toggleConfirmBtn);
    expect(confirmInput).toHaveAttribute('type', 'text');
  });

  it('validates name, email, password length, and password matching', () => {
    render(<SignupPage />);

    const submitBtn = screen.getByRole('button', { name: /Create account/i });

    // Empty name
    fireEvent.click(submitBtn);
    expect(screen.getByText('Please enter your full name')).toBeInTheDocument();

    // Fill name, empty email
    fireEvent.change(screen.getByPlaceholderText('Enter your full name'), {
      target: { value: 'Jane Doe' },
    });
    fireEvent.click(submitBtn);
    expect(screen.getByText('Please enter your email address')).toBeInTheDocument();

    // Invalid email format
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { value: 'not-an-email' },
    });
    fireEvent.click(submitBtn);
    expect(screen.getByText('Please enter a valid email format')).toBeInTheDocument();

    // Password too short (<8 chars)
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Create password (min. 8 chars)'), {
      target: { value: 'short' },
    });
    fireEvent.click(submitBtn);
    expect(
      screen.getByText('Password must be at least 8 characters long'),
    ).toBeInTheDocument();

    // Passwords mismatch
    fireEvent.change(screen.getByPlaceholderText('Create password (min. 8 chars)'), {
      target: { value: 'validPassword123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
      target: { value: 'differentPassword456' },
    });
    fireEvent.click(submitBtn);
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  it('completes signup and redirects to /onboarding upon valid submission', async () => {
    const handleSignupSuccess = vi.fn();
    render(<SignupPage onSignupSuccess={handleSignupSuccess} />);

    fireEvent.change(screen.getByPlaceholderText('Enter your full name'), {
      target: { value: 'Jane Doe' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Create password (min. 8 chars)'), {
      target: { value: 'superSecure123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
      target: { value: 'superSecure123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Create account/i }));

    await waitFor(() => {
      expect(handleSignupSuccess).toHaveBeenCalledWith('jane@example.com', 'Jane Doe');
      expect(mockPush).toHaveBeenCalledWith('/onboarding');
    });
  });

  it('supports OAuth signup buttons', async () => {
    const handleSignupSuccess = vi.fn();
    render(<SignupPage onSignupSuccess={handleSignupSuccess} />);

    fireEvent.click(screen.getByRole('button', { name: /Sign up with Google/i }));

    await waitFor(() => {
      expect(handleSignupSuccess).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/onboarding');
    });
  });
});

