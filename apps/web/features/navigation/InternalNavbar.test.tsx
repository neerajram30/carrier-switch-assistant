import { render, screen } from '@testing-library/react';
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

  it('renders compact navbar containing only the breadcrumb', () => {
    render(<InternalNavbar />);

    const navbar = screen.getByTestId('internal-navbar');
    expect(navbar).toBeInTheDocument();
    expect(navbar).toHaveStyle({ height: '42px' });
    expect(navbar).toHaveStyle({ backdropFilter: 'blur(10px)' });

    // Breadcrumb items
    expect(screen.getByText('Career Switch Assistant')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();

    // Verify no user profile or action items are populated on navbar
    expect(screen.queryByLabelText(/View system status/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/User Profile Menu/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Re-upload resume/i)).not.toBeInTheDocument();
  });

  it('infers section label from pathname dynamically', () => {
    mockPathname = '/dashboard/explore';
    render(<InternalNavbar />);
    expect(screen.getByText('Explore Paths')).toBeInTheDocument();
  });

  it('renders custom title override when provided in breadcrumb', () => {
    render(<InternalNavbar title="Career Diagnostic" />);
    expect(screen.getByText('Career Diagnostic')).toBeInTheDocument();
  });
});
