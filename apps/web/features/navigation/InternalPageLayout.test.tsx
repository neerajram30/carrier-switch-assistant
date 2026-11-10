import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InternalPageHeader, InternalPageActions } from './InternalPageHeader';
import { InternalPageLayout } from './InternalPageLayout';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/dashboard',
}));

describe('InternalPageHeader and InternalPageActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page badge, title, and description without a dedicated navbar container', () => {
    render(
      <InternalPageHeader
        badge="Dashboard"
        badgeSecondaryText="Baseline Ready"
        title="Roadmap study progress"
        description="Track your journey"
        current="dashboard"
      />,
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Baseline Ready')).toBeInTheDocument();
    expect(screen.getByText('Roadmap study progress')).toBeInTheDocument();
    expect(screen.getByText('Track your journey')).toBeInTheDocument();

    // Verify action buttons exist directly
    expect(screen.getByText('Re-upload Resume')).toBeInTheDocument();
    expect(screen.getByText('Explore Paths')).toBeInTheDocument();
    expect(screen.getByText('Edit Experience')).toBeInTheDocument();
  });

  it('renders Re-upload Resume button on dashboard and navigates to /onboarding', () => {
    render(<InternalPageActions current="dashboard" />);

    const reuploadBtn = screen.getByRole('button', {
      name: /Re-upload Resume/i,
    });
    expect(reuploadBtn).toBeInTheDocument();
    fireEvent.click(reuploadBtn);

    expect(mockPush).toHaveBeenCalledWith('/onboarding');
  });

  it('renders Return to Dashboard when on non-dashboard page and triggers navigation', () => {
    render(<InternalPageActions current="experience" />);

    const returnBtn = screen.getByRole('button', {
      name: /Return to Dashboard/i,
    });
    expect(returnBtn).toBeInTheDocument();
    fireEvent.click(returnBtn);

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });
});

describe('InternalPageLayout', () => {
  it('renders children within standard layout flow', () => {
    render(
      <InternalPageLayout
        showHeader
        badge="Test Badge"
        title="Test Page Title"
        current="dashboard"
      >
        <div data-testid="test-content">Main page content</div>
      </InternalPageLayout>,
    );

    expect(screen.getAllByText('Test Page Title').length).toBeGreaterThan(0);
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('renders in fullHeight mode for zero-scroll full canvas pages', () => {
    const { container } = render(
      <InternalPageLayout
        fullHeight
        showHeader
        badge="Constellation"
        title="Explore Canvas"
        current="explore"
      >
        <div>Full-screen Canvas</div>
      </InternalPageLayout>,
    );

    expect(screen.getAllByText('Explore Canvas').length).toBeGreaterThan(0);
    expect(container.firstChild).toHaveStyle({ height: '100%' });
  });

  it('renders transparent internal navbar by default and can be hidden via showNavbar', () => {
    const { rerender } = render(
      <InternalPageLayout title="Dashboard Overview" current="dashboard">
        <div>Content</div>
      </InternalPageLayout>,
    );

    expect(screen.getByTestId('internal-navbar')).toBeInTheDocument();
    expect(screen.getByLabelText(/User Profile Menu/i)).toBeInTheDocument();

    rerender(
      <InternalPageLayout title="Dashboard Overview" current="dashboard" showNavbar={false}>
        <div>Content</div>
      </InternalPageLayout>,
    );

    expect(screen.queryByTestId('internal-navbar')).not.toBeInTheDocument();
  });
});
