import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ManualEntryStep } from './ManualEntryStep';
import type { CareerProfileData } from '../types';

describe('ManualEntryStep', () => {
  const defaultInitialData: Partial<CareerProfileData> = {
    currentRole: 'Backend Engineer',
    yearsOfExperience: '4',
    skills: ['Node.js', 'PostgreSQL'],
    summary: 'Building backend systems',
    targetRole: 'Staff Engineer',
  };

  const mockOnContinue = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form inputs with initial data when provided', () => {
    render(
      <ManualEntryStep
        initialData={defaultInitialData}
        onContinue={mockOnContinue}
        onBack={mockOnBack}
      />,
    );

    expect(screen.getByDisplayValue('Backend Engineer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('4')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Building backend systems')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Staff Engineer')).toBeInTheDocument();
  });

  it('validates required fields and displays validation errors', () => {
    render(
      <ManualEntryStep
        initialData={{ currentRole: '', yearsOfExperience: '', skills: [] }}
        onContinue={mockOnContinue}
        onBack={mockOnBack}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Continue to Goal →/i }));

    expect(screen.getByText('Current role is required')).toBeInTheDocument();
    expect(screen.getByText('Years of experience is required')).toBeInTheDocument();
    expect(mockOnContinue).not.toHaveBeenCalled();
  });

  it('validates that yearsOfExperience is a valid non-negative number', () => {
    render(
      <ManualEntryStep
        initialData={{ currentRole: 'Software Developer', yearsOfExperience: 'invalid-num', skills: [] }}
        onContinue={mockOnContinue}
        onBack={mockOnBack}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Continue to Goal →/i }));

    expect(
      screen.getByText('Years of experience must be a non-negative number'),
    ).toBeInTheDocument();
    expect(mockOnContinue).not.toHaveBeenCalled();
  });

  it('allows adding and removing skills dynamically', () => {
    render(
      <ManualEntryStep
        initialData={{ currentRole: 'Dev', yearsOfExperience: '2', skills: ['React'] }}
        onContinue={mockOnContinue}
        onBack={mockOnBack}
      />,
    );

    expect(screen.getByText('React')).toBeInTheDocument();

    // Add a new skill
    const skillInput = screen.getByPlaceholderText(/e\.g\. Node\.js, Python/i);
    fireEvent.change(skillInput, { target: { value: 'Docker' } });
    fireEvent.click(screen.getByRole('button', { name: /\+ Add/i }));

    expect(screen.getByText('Docker')).toBeInTheDocument();

    // Submit form and verify updated skills are emitted
    fireEvent.click(screen.getByRole('button', { name: /Continue to Goal →/i }));

    expect(mockOnContinue).toHaveBeenCalledWith(
      expect.objectContaining({
        skills: ['React', 'Docker'],
      }),
    );
  });

  it('shows saving state and disables actions when isSaving is true', () => {
    render(
      <ManualEntryStep
        initialData={defaultInitialData}
        onContinue={mockOnContinue}
        onBack={mockOnBack}
        isSaving={true}
      />,
    );

    // Continue button shows saving label and is disabled
    const continueBtn = screen.getByRole('button', { name: /Saving\.\.\./i });
    expect(continueBtn).toBeDisabled();

    // Back button is disabled
    const backBtn = screen.getByRole('button', { name: /← Back to Upload/i });
    expect(backBtn).toBeDisabled();

    // Text inputs are disabled
    expect(screen.getByDisplayValue('Backend Engineer')).toBeDisabled();
  });

  it('shows loading indicator when isLoadingExisting is true', () => {
    render(
      <ManualEntryStep
        initialData={{}}
        onContinue={mockOnContinue}
        onBack={mockOnBack}
        isLoadingExisting={true}
      />,
    );

    expect(
      screen.getByText(/Checking for existing career profile\.\.\./i),
    ).toBeInTheDocument();
  });

  it('displays actionable error message when errorMessage prop is provided and preserves form data', () => {
    render(
      <ManualEntryStep
        initialData={defaultInitialData}
        onContinue={mockOnContinue}
        onBack={mockOnBack}
        errorMessage="Database connection refused"
      />,
    );

    expect(screen.getByText('Could not save profile')).toBeInTheDocument();
    expect(screen.getByText('Database connection refused')).toBeInTheDocument();

    // Form data is preserved
    expect(screen.getByDisplayValue('Backend Engineer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('4')).toBeInTheDocument();
  });
});
