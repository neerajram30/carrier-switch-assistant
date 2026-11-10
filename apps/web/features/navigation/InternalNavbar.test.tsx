import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InternalNavbar } from './InternalNavbar';

const mockPush = vi.fn();
let mockPathname = '/dashboard';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname,
}));

describe('InternalNavbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/dashboard';
  });

  it('renders compact navbar with transparent styling and small height', () => {
    render(<InternalNavbar />);

    const navbar = screen.getByTestId('internal-navbar');
    expect(navbar).toBeInTheDocument();
    expect(navbar).toHaveStyle({ height: '42px' });
    expect(navbar).toHaveStyle({ backdropFilter: 'blur(10px)' });

    // Breadcrumb and status
    expect(screen.getByText('Career Switch Assistant')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
    expect(screen.getByLabelText(/View system status/i)).toBeInTheDocument();

    // Profile button with avatar initials AM
    const profileBtn = screen.getByLabelText(/User Profile Menu/i);
    expect(profileBtn).toBeInTheDocument();
    expect(profileBtn).toHaveTextContent('AM');
  });

  it('infers section label from pathname dynamically', () => {
    mockPathname = '/dashboard/explore';
    render(<InternalNavbar />);
    expect(screen.getByText('Explore Paths')).toBeInTheDocument();
  });

  it('toggles profile dropdown menu on avatar button click', () => {
    render(<InternalNavbar />);

    const profileBtn = screen.getByLabelText(/User Profile Menu/i);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.click(profileBtn);

    const menu = screen.getByRole('menu');
    expect(menu).toBeInTheDocument();
    expect(screen.getByText('Alex Morgan')).toBeInTheDocument();
    expect(screen.getByText('dev-user@example.com')).toBeInTheDocument();
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();

    // Links inside menu
    expect(screen.getByText('Edit Experience')).toBeInTheDocument();
    expect(screen.getByText('System Diagnostics')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Out/i })).toBeInTheDocument();

    // Toggle close
    fireEvent.click(profileBtn);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes dropdown when Escape key is pressed', () => {
    render(<InternalNavbar />);

    const profileBtn = screen.getByLabelText(/User Profile Menu/i);
    fireEvent.click(profileBtn);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('navigates to / when Sign Out is clicked', () => {
    render(<InternalNavbar />);

    const profileBtn = screen.getByLabelText(/User Profile Menu/i);
    fireEvent.click(profileBtn);

    const signOutBtn = screen.getByRole('button', { name: /Sign Out/i });
    fireEvent.click(signOutBtn);

    expect(mockPush).toHaveBeenCalledWith('/');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

