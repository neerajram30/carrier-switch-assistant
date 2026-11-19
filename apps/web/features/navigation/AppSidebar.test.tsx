import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signOut } from 'next-auth/react';
import { AppSidebar } from './AppSidebar';

const mockPush = vi.fn();
let mockPathname = '/dashboard/experience';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname,
}));

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/dashboard/experience';
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders the brand logo, navigation items with shortcuts, and bottom user section', () => {
    render(<AppSidebar />);

    expect(screen.getByText('Career Switch')).toBeInTheDocument();
    expect(screen.getByText('Assistant Flight Deck')).toBeInTheDocument();

    // Verify nav items
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Explore Paths')).toBeInTheDocument();
    expect(screen.getByText('Track')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();

    // Verify shortcuts
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();

    // Verify engine status and advisory note are not present on sidebar
    expect(screen.queryByText('Engine Online')).not.toBeInTheDocument();
    expect(screen.queryByText('Private & Advisory Only')).not.toBeInTheDocument();

    // Verify user profile section at bottom of sidebar
    const profileBtn = screen.getByLabelText(/User Profile Menu/i);
    expect(profileBtn).toBeInTheDocument();
    expect(profileBtn).toHaveTextContent('Alex Morgan');
    expect(profileBtn).toHaveTextContent('A');
  });

  it('toggles user profile popover on user section click', () => {
    render(<AppSidebar />);

    const profileBtn = screen.getByLabelText(/User Profile Menu/i);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    // Open popover
    fireEvent.click(profileBtn);

    const menu = screen.getByRole('menu');
    expect(menu).toBeInTheDocument();
    expect(screen.getAllByText(/Alex Morgan's Workspace/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Free Plan/i)).toBeInTheDocument();
    expect(screen.getByText('dev-user@example.com')).toBeInTheDocument();

    // Reference actions
    expect(screen.getByText('Upgrade')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('System Diagnostics')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Log out/i })).toBeInTheDocument();

    // Toggle close
    fireEvent.click(profileBtn);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes popover when Escape key is pressed', () => {
    render(<AppSidebar />);

    const profileBtn = screen.getByLabelText(/User Profile Menu/i);
    fireEvent.click(profileBtn);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes popover on outside click', () => {
    render(
      <div>
        <div data-testid="outside-area">Outside</div>
        <AppSidebar />
      </div>,
    );

    const profileBtn = screen.getByLabelText(/User Profile Menu/i);
    fireEvent.click(profileBtn);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside-area'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('signs out, clears local storage, and redirects to /login when Log out is clicked', async () => {
    localStorage.setItem('csa_auth_token', 'token-123');
    sessionStorage.setItem('csa_career_profile', JSON.stringify({ currentRole: 'Frontend Developer' }));

    render(<AppSidebar />);

    const profileBtn = screen.getByLabelText(/User Profile Menu/i);
    fireEvent.click(profileBtn);

    const logoutBtn = screen.getByRole('button', { name: /Log out/i });
    expect(logoutBtn).toBeInTheDocument();
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledWith({ redirect: false });
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    expect(localStorage.getItem('csa_auth_token')).toBeNull();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('triggers router push when number key shortcut is pressed', () => {
    render(<AppSidebar />);

    // Press '1' to go to Dashboard (/dashboard)
    fireEvent.keyDown(window, { key: '1' });
    expect(mockPush).toHaveBeenCalledWith('/dashboard');

    // Press '2' to go to Explore Paths (/dashboard/explore)
    fireEvent.keyDown(window, { key: '2' });
    expect(mockPush).toHaveBeenCalledWith('/dashboard/explore');

    // Press '3' to go to Track (/dashboard/track)
    fireEvent.keyDown(window, { key: '3' });
    expect(mockPush).toHaveBeenCalledWith('/dashboard/track');

    // Press '4' to go to Edit Experience (/dashboard/experience)
    fireEvent.keyDown(window, { key: '4' });
    expect(mockPush).toHaveBeenCalledWith('/dashboard/experience');
  });

  it('does not trigger shortcut navigation when user is typing in an input', () => {
    render(
      <div>
        <AppSidebar />
        <input data-testid="test-input" />
      </div>,
    );

    const input = screen.getByTestId('test-input');
    input.focus();

    fireEvent.keyDown(input, { key: '1' });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
