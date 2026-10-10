import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  createCareerProfile,
  getCareerProfile,
  saveCareerProfile,
  updateCareerProfile,
} from './career-profile.service';
import type { CareerProfileApiResponse, CareerProfileData } from '../types';

describe('career-profile.service', () => {
  const mockApiUrl = 'http://localhost:3001';
  const mockUserId = 'user-test-123';

  const mockProfileResponse: CareerProfileApiResponse = {
    id: 'prof-1',
    userId: mockUserId,
    currentRole: 'Frontend Developer',
    yearsOfExperience: 3.5,
    skills: ['React', 'TypeScript'],
    summary: 'Senior developer looking to switch',
    targetRole: 'Full Stack Engineer',
    createdAt: '2026-10-10T00:00:00Z',
    updatedAt: '2026-10-10T00:00:00Z',
  };

  const sampleFormData: CareerProfileData = {
    currentRole: 'Frontend Developer',
    yearsOfExperience: '3.5',
    skills: ['React', 'TypeScript'],
    summary: 'Senior developer looking to switch',
    targetRole: 'Full Stack Engineer',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCareerProfile', () => {
    it('returns career profile when found (200)', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockProfileResponse,
      } as Response);

      const result = await getCareerProfile(mockApiUrl, mockUserId);

      expect(result).toEqual(mockProfileResponse);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/api/v1/career-profile`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': mockUserId,
          },
        },
      );
    });

    it('returns null when profile does not exist (404)', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Career profile not found' }),
      } as Response);

      const result = await getCareerProfile(mockApiUrl, mockUserId);

      expect(result).toBeNull();
    });

    it('throws ApiError on server error (500)', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' }),
      } as Response);

      await expect(getCareerProfile(mockApiUrl, mockUserId)).rejects.toThrow(
        ApiError,
      );
      await expect(getCareerProfile(mockApiUrl, mockUserId)).rejects.toThrow(
        'Internal Server Error',
      );
    });

    it('throws ApiError on unauthorized request (401)', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response);

      await expect(getCareerProfile(mockApiUrl, mockUserId)).rejects.toThrow(
        'Unauthorized',
      );
    });
  });

  describe('createCareerProfile', () => {
    it('successfully creates profile via POST', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockProfileResponse,
      } as Response);

      const result = await createCareerProfile(
        sampleFormData,
        mockApiUrl,
        mockUserId,
      );

      expect(result).toEqual(mockProfileResponse);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/api/v1/career-profile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': mockUserId,
          },
          body: JSON.stringify({
            currentRole: 'Frontend Developer',
            yearsOfExperience: 3.5,
            skills: ['React', 'TypeScript'],
            summary: 'Senior developer looking to switch',
            targetRole: 'Full Stack Engineer',
          }),
        },
      );
    });

    it('handles class-validator array error messages on 400 Bad Request', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          message: [
            'currentRole cannot be empty',
            'yearsOfExperience cannot be negative',
          ],
        }),
      } as Response);

      await expect(
        createCareerProfile(sampleFormData, mockApiUrl, mockUserId),
      ).rejects.toThrow(
        'currentRole cannot be empty, yearsOfExperience cannot be negative',
      );
    });
  });

  describe('updateCareerProfile', () => {
    it('successfully updates profile via PUT', async () => {
      const updatedResponse = {
        ...mockProfileResponse,
        currentRole: 'Lead Engineer',
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => updatedResponse,
      } as Response);

      const result = await updateCareerProfile(
        { currentRole: 'Lead Engineer' },
        mockApiUrl,
        mockUserId,
      );

      expect(result).toEqual(updatedResponse);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/api/v1/career-profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': mockUserId,
          },
          body: JSON.stringify({ currentRole: 'Lead Engineer' }),
        },
      );
    });
  });

  describe('saveCareerProfile', () => {
    it('calls updateCareerProfile when isExisting is true', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockProfileResponse,
      } as Response);

      await saveCareerProfile(sampleFormData, true, mockApiUrl, mockUserId);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/api/v1/career-profile`,
        expect.objectContaining({ method: 'PUT' }),
      );
    });

    it('calls createCareerProfile when isExisting is false', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockProfileResponse,
      } as Response);

      await saveCareerProfile(sampleFormData, false, mockApiUrl, mockUserId);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/api/v1/career-profile`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('falls back to PUT if POST returns 409 Conflict', async () => {
      // First call (POST) returns 409
      // Second call (PUT) returns 200
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: async () => ({ message: 'Profile already exists' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockProfileResponse,
        } as Response);

      const result = await saveCareerProfile(
        sampleFormData,
        false,
        mockApiUrl,
        mockUserId,
      );

      expect(result).toEqual(mockProfileResponse);
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
      expect(globalThis.fetch).toHaveBeenNthCalledWith(
        1,
        `${mockApiUrl}/api/v1/career-profile`,
        expect.objectContaining({ method: 'POST' }),
      );
      expect(globalThis.fetch).toHaveBeenNthCalledWith(
        2,
        `${mockApiUrl}/api/v1/career-profile`,
        expect.objectContaining({ method: 'PUT' }),
      );
    });
  });
});
