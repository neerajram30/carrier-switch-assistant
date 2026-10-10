import type { CareerProfileApiResponse, CareerProfileData } from '../types';

export const DEFAULT_API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const DEFAULT_DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function parseErrorMessage(response: Response, defaultMessage: string): Promise<string> {
  try {
    const errorData = await response.json();
    if (Array.isArray(errorData.message)) {
      return errorData.message.join(', ');
    }
    return errorData.message || defaultMessage;
  } catch {
    return `${defaultMessage} (Status: ${response.status})`;
  }
}

export async function getCareerProfile(
  apiUrl = DEFAULT_API_URL,
  userId = DEFAULT_DEV_USER_ID,
): Promise<CareerProfileApiResponse | null> {
  const response = await fetch(`${apiUrl}/api/v1/career-profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const message = await parseErrorMessage(
      response,
      'Failed to load career profile',
    );
    throw new ApiError(message, response.status);
  }

  return response.json();
}

export async function createCareerProfile(
  data: CareerProfileData,
  apiUrl = DEFAULT_API_URL,
  userId = DEFAULT_DEV_USER_ID,
): Promise<CareerProfileApiResponse> {
  const payload = {
    currentRole: data.currentRole.trim(),
    yearsOfExperience: Number(data.yearsOfExperience),
    skills: data.skills ?? [],
    ...(data.summary?.trim() ? { summary: data.summary.trim() } : {}),
    ...(data.targetRole?.trim() ? { targetRole: data.targetRole.trim() } : {}),
  };

  const response = await fetch(`${apiUrl}/api/v1/career-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await parseErrorMessage(
      response,
      'Failed to create career profile',
    );
    throw new ApiError(message, response.status);
  }

  return response.json();
}

export async function updateCareerProfile(
  data: Partial<CareerProfileData>,
  apiUrl = DEFAULT_API_URL,
  userId = DEFAULT_DEV_USER_ID,
): Promise<CareerProfileApiResponse> {
  const payload: Record<string, unknown> = {};

  if (data.currentRole !== undefined) {
    payload.currentRole = data.currentRole.trim();
  }
  if (data.yearsOfExperience !== undefined) {
    payload.yearsOfExperience = Number(data.yearsOfExperience);
  }
  if (data.skills !== undefined) {
    payload.skills = data.skills;
  }
  if (data.summary !== undefined) {
    payload.summary = data.summary.trim() || undefined;
  }
  if (data.targetRole !== undefined) {
    payload.targetRole = data.targetRole.trim() || undefined;
  }

  const response = await fetch(`${apiUrl}/api/v1/career-profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await parseErrorMessage(
      response,
      'Failed to update career profile',
    );
    throw new ApiError(message, response.status);
  }

  return response.json();
}

export async function saveCareerProfile(
  data: CareerProfileData,
  isExisting: boolean,
  apiUrl = DEFAULT_API_URL,
  userId = DEFAULT_DEV_USER_ID,
): Promise<CareerProfileApiResponse> {
  if (isExisting) {
    return updateCareerProfile(data, apiUrl, userId);
  }

  try {
    return await createCareerProfile(data, apiUrl, userId);
  } catch (error) {
    // If concurrent creation resulted in 409 Conflict, fall back to update
    if (error instanceof ApiError && error.statusCode === 409) {
      return updateCareerProfile(data, apiUrl, userId);
    }
    throw error;
  }
}
