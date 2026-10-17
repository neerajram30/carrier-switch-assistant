import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExtractedDataReviewStep } from './ExtractedDataReviewStep';
import type { ExtractedCareerData } from '../types';

describe('ExtractedDataReviewStep Component', () => {
  const sampleExtracted: ExtractedCareerData = {
    name: 'Alice Cooper',
    currentRole: 'Senior Backend Engineer',
    yearsOfExperience: 6.5,
    skills: ['Go', 'Kubernetes', 'PostgreSQL', 'Docker'],
    workExperience: [
      {
        company: 'CloudTech Inc',
        role: 'Senior Backend Engineer',
        startDate: '2021',
        endDate: 'Present',
        description: 'Led distributed database transition',
      },
    ],
    projects: [
      {
        name: 'OpenMetrics Exporter',
        description: 'Prometheus exporter in Go',
        technologies: ['Go', 'Prometheus'],
      },
    ],
    education: [
      {
        institution: 'Georgia Tech',
        qualification: 'M.S. Computer Science',
        graduationYear: 2018,
      },
    ],
  };

  it('renders extracted data accurately in editable inputs', () => {
    render(
      <ExtractedDataReviewStep
        initialData={sampleExtracted}
        onConfirm={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText('Review extracted career data')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Senior Backend Engineer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('6.5')).toBeInTheDocument();
    expect(screen.getAllByText('Go').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Kubernetes')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
    expect(screen.getByText('Docker')).toBeInTheDocument();
    expect(screen.getByText(/CloudTech Inc/)).toBeInTheDocument();
    expect(screen.getByText('OpenMetrics Exporter')).toBeInTheDocument();
    expect(screen.getByText('Georgia Tech • 2018')).toBeInTheDocument();
  });

  it('allows removing and adding skills', () => {
    render(
      <ExtractedDataReviewStep
        initialData={sampleExtracted}
        onConfirm={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText('Docker')).toBeInTheDocument();

    // Find remove button on Docker token
    const dockerToken = screen.getByText('Docker').closest('span');
    const removeBtn = dockerToken?.querySelector('button') || dockerToken?.nextElementSibling;
    if (removeBtn) {
      fireEvent.click(removeBtn);
    }

    // Add a new skill
    const skillInput = screen.getByPlaceholderText(/e\.g\. Docker, TypeScript/i);
    fireEvent.change(skillInput, { target: { value: 'Rust' } });

    const addBtn = screen.getByRole('button', { name: /Add skill/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Rust')).toBeInTheDocument();
  });

  it('shows incomplete section alert when role or experience is missing', () => {
    const incompleteData: ExtractedCareerData = {
      name: null,
      currentRole: null,
      yearsOfExperience: null,
      skills: [],
      workExperience: [],
      education: [],
      projects: [],
    };

    render(
      <ExtractedDataReviewStep
        initialData={incompleteData}
        onConfirm={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText('Some sections need your attention')).toBeInTheDocument();
    expect(
      screen.getByText(/Your role and years of experience were not clearly detected/i),
    ).toBeInTheDocument();
  });

  it('validates required fields before submitting', async () => {
    const onConfirm = vi.fn();
    const incompleteData: ExtractedCareerData = {
      name: null,
      currentRole: null,
      yearsOfExperience: null,
      skills: ['React'],
      workExperience: [],
      education: [],
      projects: [],
    };

    render(
      <ExtractedDataReviewStep
        initialData={incompleteData}
        onConfirm={onConfirm}
        onBack={vi.fn()}
      />,
    );

    const confirmBtn = screen.getByRole('button', {
      name: /Confirm & Save Profile →/i,
    });
    fireEvent.click(confirmBtn);

    expect(
      screen.getByText(/Current role is required to establish your career baseline/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Years of experience is required/i),
    ).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('successfully submits confirmed data after correction', async () => {
    const onConfirm = vi.fn();
    render(
      <ExtractedDataReviewStep
        initialData={sampleExtracted}
        onConfirm={onConfirm}
        onBack={vi.fn()}
      />,
    );

    // Edit role
    const roleInput = screen.getByDisplayValue('Senior Backend Engineer');
    fireEvent.change(roleInput, { target: { value: 'Staff Platform Engineer' } });

    const confirmBtn = screen.getByRole('button', {
      name: /Confirm & Save Profile →/i,
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          currentRole: 'Staff Platform Engineer',
          yearsOfExperience: '6.5',
          skills: expect.arrayContaining(['Go', 'Kubernetes']),
        }),
        expect.objectContaining({
          currentRole: 'Staff Platform Engineer',
          yearsOfExperience: 6.5,
        }),
      );
    });
  });

  it('preserves user edits when saveError occurs and allows retry', async () => {
    const onConfirm = vi.fn();
    const { rerender } = render(
      <ExtractedDataReviewStep
        initialData={sampleExtracted}
        onConfirm={onConfirm}
        onBack={vi.fn()}
        saveError={null}
      />,
    );

    const roleInput = screen.getByDisplayValue('Senior Backend Engineer');
    fireEvent.change(roleInput, { target: { value: 'Principal Architect' } });

    // Simulate save error from parent
    rerender(
      <ExtractedDataReviewStep
        initialData={sampleExtracted}
        onConfirm={onConfirm}
        onBack={vi.fn()}
        saveError="Server connection failed. Could not write to PostgreSQL."
      />,
    );

    expect(screen.getByText('Failed to save career profile')).toBeInTheDocument();
    expect(
      screen.getByText('Server connection failed. Could not write to PostgreSQL.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Your edits have been preserved/i),
    ).toBeInTheDocument();

    // Verify user edit was kept in state
    expect(screen.getByDisplayValue('Principal Architect')).toBeInTheDocument();
  });

  it('allows adding and removing work experience entries', () => {
    render(
      <ExtractedDataReviewStep
        initialData={sampleExtracted}
        onConfirm={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText(/CloudTech Inc/)).toBeInTheDocument();

    // Click remove on existing work entry
    const removeWorkBtn = screen.getAllByRole('button', { name: /^Remove$/i })[0];
    fireEvent.click(removeWorkBtn);

    expect(screen.queryByText(/CloudTech Inc/)).not.toBeInTheDocument();

    // Add new work entry
    fireEvent.click(screen.getByRole('button', { name: /\+ Add experience/i }));

    const companyInput = screen.getByPlaceholderText(/e\.g\. Acme Tech/i);
    const roleInput = screen.getByPlaceholderText(/e\.g\. Senior Software Engineer/i);
    fireEvent.change(companyInput, { target: { value: 'FinTech Labs' } });
    fireEvent.change(roleInput, { target: { value: 'Lead Engineer' } });

    fireEvent.click(screen.getByRole('button', { name: /Save entry/i }));

    expect(screen.getByText(/Lead Engineer at FinTech Labs/i)).toBeInTheDocument();
  });
});
