import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  });

  it('renders the brand logo and navigation items with shortcuts', () => {
    render(<AppSidebar />);

    expect(screen.getByText('Career Switch')).toBeInTheDocument();
    expect(screen.getByText('Assistant Flight Deck')).toBeInTheDocument();

    // Verify wireframe items are present
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Explore Paths')).toBeInTheDocument();
    expect(screen.getByText('Track')).toBeInTheDocument();
    expect(screen.getByText('Edit Experience')).toBeInTheDocument();
    expect(screen.queryByText('Transition Plan')).not.toBeInTheDocument();
    expect(screen.queryByText('Competencies')).not.toBeInTheDocument();

    // Verify shortcuts are present for Dashboard (1), Explore Paths (2), Track (3), and Edit Experience (4)
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();

    // Verify online status
    expect(screen.getByText('Engine Online')).toBeInTheDocument();
    expect(screen.getByText('Private & Advisory Only')).toBeInTheDocument();
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
