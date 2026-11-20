import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EditExperiencePage } from './EditExperiencePage';
import type { ExtractedCareerData } from '@/features/onboarding/types';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/dashboard/experience',
}));

describe('EditExperiencePage', () => {
  const mockInitialData: ExtractedCareerData = {
    name: 'Sarah Connor',
    currentRole: 'DevOps Specialist',
    yearsOfExperience: 5,
    skills: ['Docker', 'Kubernetes', 'Terraform'],
    workExperience: [
      {
        id: 'old-exp-1',
        company: 'Old Corp',
        role: 'DevOps Specialist',
        startDate: '2020',
        endDate: '2025',
        description: 'Managed old clusters',
      },
    ],
    education: [],
    projects: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders the profile and experience page with title and calibration form', () => {
    render(<EditExperiencePage initialData={mockInitialData} />);

    expect(screen.getByDisplayValue('DevOps Specialist')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    expect(screen.getByText('Docker')).toBeInTheDocument();
    expect(screen.getByText('Kubernetes')).toBeInTheDocument();
  });

  it('allows saving updated profile and returns to dashboard', async () => {
    const mockSaveProfile = vi.fn().mockResolvedValue({
      id: 'prof-internal-1',
      userId: 'user-1',
      currentRole: 'DevOps Specialist',
      yearsOfExperience: 5,
      skills: ['Docker', 'Kubernetes', 'Terraform'],
      summary: '',
      targetRole: '',
      createdAt: '2026-10-20T00:00:00Z',
      updatedAt: '2026-10-20T00:00:00Z',
    });

    render(
      <EditExperiencePage
        initialData={mockInitialData}
        saveProfileFn={mockSaveProfile}
      />,
    );

    const saveBtn = screen.getByRole('button', {
      name: /Confirm & Save Profile →/i,
    });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockSaveProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          currentRole: 'DevOps Specialist',
          yearsOfExperience: '5',
          skills: expect.arrayContaining(['Docker', 'Kubernetes']),
        }),
        true,
      );
    });

    expect(
      screen.getByText(/Career profile and experience saved successfully!/i),
    ).toBeInTheDocument();
  });

  it('replaces "Back to upload" button with "Re-upload resume" option and opens dialog with warning message', () => {
    render(<EditExperiencePage initialData={mockInitialData} />);

    // Verify "← Back to upload" is not present
    expect(screen.queryByRole('button', { name: /← Back to upload/i })).not.toBeInTheDocument();

    // Verify "Re-upload resume" is present
    const reuploadBtn = screen.getByRole('button', { name: /Re-upload resume/i });
    expect(reuploadBtn).toBeInTheDocument();

    // Click Re-upload resume
    fireEvent.click(reuploadBtn);

    // Verify dialog is open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Re-upload Resume')).toBeInTheDocument();

    // Verify warning message explaining that all experience will be cleared and recreated
    expect(
      screen.getByText(/If you re-upload your resume, all current experience details will be cleared and new ones will be added/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Your Dashboard, Roadmap Tracker, and Explore Paths will be automatically recreated based on this new resume/i),
    ).toBeInTheDocument();

    // Cancel closes dialog
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('recreates experience section with newly uploaded resume and updates dashboard/tracker context upon confirmation', async () => {
    const mockSaveProfile = vi.fn().mockResolvedValue({
      id: 'prof-internal-2',
      userId: 'user-1',
      currentRole: 'AI Systems Architect',
      yearsOfExperience: 7,
      skills: ['PyTorch', 'Rust', 'Distributed Systems'],
      summary: '',
      targetRole: '',
    });

    const mockUploadFn = vi.fn().mockResolvedValue({
      resumeId: 'resume-new-123',
      storageKey: 'key-123',
      status: 'UPLOADED' as const,
    });

    const mockProcessFn = vi.fn().mockResolvedValue({
      resumeId: 'resume-new-123',
      structuredData: {
        name: 'Alex AI',
        currentRole: 'AI Systems Architect',
        yearsOfExperience: 7,
        skills: ['PyTorch', 'Rust', 'Distributed Systems'],
        workExperience: [
          {
            id: 'new-exp-1',
            company: 'Deep AI Labs',
            role: 'Lead Architect',
            startDate: '2024',
            endDate: 'Present',
            description: 'Building multi-agent reasoning platforms.',
          },
        ],
        education: [],
        projects: [],
      },
    });

    render(
      <EditExperiencePage
        initialData={mockInitialData}
        saveProfileFn={mockSaveProfile}
        uploadFn={mockUploadFn}
        processFn={mockProcessFn}
      />,
    );

    // Open reupload dialog
    const reuploadBtn = screen.getByRole('button', { name: /Re-upload resume/i });
    fireEvent.click(reuploadBtn);

    // Select file in input
    const fileInput = screen.getByTestId('reupload-file-input');
    const newResumeFile = new File(['dummy-content'], 'ai-architect-resume.pdf', {
      type: 'application/pdf',
    });
    fireEvent.change(fileInput, { target: { files: [newResumeFile] } });

    await waitFor(() => {
      expect(mockUploadFn).toHaveBeenCalledWith(newResumeFile);
      expect(mockProcessFn).toHaveBeenCalledWith('resume-new-123');
    });

    // Preview shows extracted details
    expect(screen.getByText(/Resume parsed successfully/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Systems Architect/i)).toBeInTheDocument();

    // Confirm & Recreate
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Recreate Profile/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockSaveProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          currentRole: 'AI Systems Architect',
          yearsOfExperience: '7',
          skills: expect.arrayContaining(['PyTorch', 'Rust']),
          workExperience: expect.arrayContaining([
            expect.objectContaining({ company: 'Deep AI Labs' }),
          ]),
        }),
        true,
      );
    });

    // Dialog is closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Success notification banner is displayed
    expect(
      screen.getByText(/Your experience section has been recreated with the new resume/i),
    ).toBeInTheDocument();

    // Verify session storage holds the newly recreated profile for dashboard and tracker
    const stored = JSON.parse(sessionStorage.getItem('csa_career_profile') || '{}');
    expect(stored.currentRole).toBe('AI Systems Architect');
    expect(stored.workExperience[0].company).toBe('Deep AI Labs');
  });
});
