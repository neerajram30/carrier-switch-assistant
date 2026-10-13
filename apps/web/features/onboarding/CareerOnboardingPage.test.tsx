import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CareerOnboardingPage from './CareerOnboardingPage';
import type { CareerProfileApiResponse } from './types';

describe('CareerOnboardingPage Integration', () => {
  const existingProfileData: CareerProfileApiResponse = {
    id: 'prof-existing-1',
    userId: 'user-1',
    currentRole: 'Existing Backend Dev',
    yearsOfExperience: 5,
    skills: ['Go', 'Kubernetes'],
    summary: 'Experienced cloud engineer',
    targetRole: 'Staff Architect',
    createdAt: '2026-10-10T00:00:00Z',
    updatedAt: '2026-10-10T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles new user flow: 404 on get -> enters manual entry -> saves via createProfile (POST)', async () => {
    const mockGetProfile = vi.fn().mockResolvedValue(null);
    const mockSaveProfile = vi.fn().mockResolvedValue({
      id: 'prof-new-1',
      userId: 'user-1',
      currentRole: 'Junior Frontend Dev',
      yearsOfExperience: 2,
      skills: ['HTML', 'CSS', 'JavaScript'],
      summary: '',
      targetRole: '',
      createdAt: '2026-10-10T00:00:00Z',
      updatedAt: '2026-10-10T00:00:00Z',
    });

    render(
      <CareerOnboardingPage
        getProfileFn={mockGetProfile}
        saveProfileFn={mockSaveProfile}
      />,
    );

    // Switch to manual entry
    fireEvent.click(
      screen.getByRole('button', { name: /Enter details manually →/i }),
    );

    // Profile check completed
    await waitFor(() => {
      expect(mockGetProfile).toHaveBeenCalled();
    });

    // Enter details
    const roleInput = screen.getByLabelText(/Current Role \*/i);
    const expInput = screen.getByLabelText(/Years of Experience \*/i);

    fireEvent.change(roleInput, { target: { value: 'Junior Frontend Dev' } });
    fireEvent.change(expInput, { target: { value: '2' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Continue to Goal →/i }));

    // Verified save was called with isExisting = false
    await waitFor(() => {
      expect(mockSaveProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          currentRole: 'Junior Frontend Dev',
          yearsOfExperience: '2',
        }),
        false, // isExisting
      );
    });

    // Success banner is displayed
    await waitFor(() => {
      expect(
        screen.getByText(/Career profile saved successfully!/i),
      ).toBeInTheDocument();
    });
  });

  it('handles existing profile flow: loads profile -> pre-fills form -> updates via PUT', async () => {
    const mockGetProfile = vi.fn().mockResolvedValue(existingProfileData);
    const mockSaveProfile = vi.fn().mockResolvedValue({
      ...existingProfileData,
      currentRole: 'Lead Architect',
      yearsOfExperience: 6,
    });

    render(
      <CareerOnboardingPage
        getProfileFn={mockGetProfile}
        saveProfileFn={mockSaveProfile}
      />,
    );

    // Switch to manual entry
    fireEvent.click(
      screen.getByRole('button', { name: /Enter details manually →/i }),
    );

    // Verify existing profile values were pre-populated after API loads
    await waitFor(() => {
      expect(screen.getByDisplayValue('Existing Backend Dev')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    expect(screen.getByText('Go')).toBeInTheDocument();
    expect(screen.getByText('Kubernetes')).toBeInTheDocument();

    // Modify current role
    const roleInput = screen.getByDisplayValue('Existing Backend Dev');
    fireEvent.change(roleInput, { target: { value: 'Lead Architect' } });

    // Submit update
    fireEvent.click(screen.getByRole('button', { name: /Continue to Goal →/i }));

    // Verified save was called with isExisting = true
    await waitFor(() => {
      expect(mockSaveProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          currentRole: 'Lead Architect',
          yearsOfExperience: '5',
          skills: ['Go', 'Kubernetes'],
        }),
        true, // isExisting = true -> PUT
      );
    });

    // Success banner is displayed
    await waitFor(() => {
      expect(
        screen.getByText(/Career profile saved successfully!/i),
      ).toBeInTheDocument();
    });
  });

  it('preserves form data and displays actionable error message when save fails', async () => {
    const mockGetProfile = vi.fn().mockResolvedValue(null);
    const mockSaveProfile = vi
      .fn()
      .mockRejectedValue(new Error('Network error: Database unavailable'));

    render(
      <CareerOnboardingPage
        getProfileFn={mockGetProfile}
        saveProfileFn={mockSaveProfile}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: /Enter details manually →/i }),
    );

    await waitFor(() => {
      expect(mockGetProfile).toHaveBeenCalled();
    });

    const roleInput = screen.getByLabelText(/Current Role \*/i);
    const expInput = screen.getByLabelText(/Years of Experience \*/i);

    fireEvent.change(roleInput, { target: { value: 'DevOps Specialist' } });
    fireEvent.change(expInput, { target: { value: '4' } });

    fireEvent.click(screen.getByRole('button', { name: /Continue to Goal →/i }));

    // Error alert is displayed
    await waitFor(() => {
      expect(
        screen.getByText('Network error: Database unavailable'),
      ).toBeInTheDocument();
    });

    // Form data is NOT cleared
    expect(screen.getByDisplayValue('DevOps Specialist')).toBeInTheDocument();
    expect(screen.getByDisplayValue('4')).toBeInTheDocument();
  });

  it('blocks submit and shows retry option when profile fetch fails, then unblocks after retry succeeds', async () => {
    const mockGetProfile = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network connection timeout'))
      .mockResolvedValueOnce(null);

    const mockSaveProfile = vi.fn().mockResolvedValue({
      id: 'prof-new-1',
      userId: 'user-1',
      currentRole: 'Backend Engineer',
      yearsOfExperience: 3,
      skills: [],
      summary: '',
      targetRole: '',
      createdAt: '2026-10-10T00:00:00Z',
      updatedAt: '2026-10-10T00:00:00Z',
    });

    render(
      <CareerOnboardingPage
        getProfileFn={mockGetProfile}
        saveProfileFn={mockSaveProfile}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: /Enter details manually →/i }),
    );

    // Should show error and retry button
    await waitFor(() => {
      expect(
        screen.getByText(/Could not verify existing profile status/i),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText('Network connection timeout'),
    ).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /Retry check/i });
    expect(retryButton).toBeInTheDocument();

    const continueBtn = screen.getByRole('button', {
      name: /Continue to Goal →/i,
    });
    expect(continueBtn).toBeDisabled();

    // Now click Retry check
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(mockGetProfile).toHaveBeenCalledTimes(2);
    });

    // Error is dismissed and continue button is enabled
    await waitFor(() => {
      expect(
        screen.queryByText(/Could not verify existing profile status/i),
      ).not.toBeInTheDocument();
    });

    // Enter details and submit
    const roleInput = screen.getByLabelText(/Current Role \*/i);
    const expInput = screen.getByLabelText(/Years of Experience \*/i);

    fireEvent.change(roleInput, { target: { value: 'Backend Engineer' } });
    fireEvent.change(expInput, { target: { value: '3' } });

    const submitBtn = screen.getByRole('button', {
      name: /Continue to Goal →/i,
    });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSaveProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          currentRole: 'Backend Engineer',
          yearsOfExperience: '3',
        }),
        false,
      );
    });
  });
});
