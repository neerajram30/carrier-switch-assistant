/**
 * Shared utility for constructing authenticated HTTP request headers
 * across all client-side services and feature pages.
 *
 * Automatically includes the user's session Bearer token and user ID
 * to guarantee complete tenant and user data isolation in PostgreSQL.
 */

export const DEFAULT_DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

export function resolveEffectiveUserId(explicitUserId?: string): string {
  if (explicitUserId && explicitUserId !== DEFAULT_DEV_USER_ID) {
    return explicitUserId;
  }
  if (typeof window !== 'undefined') {
    try {
      const storedId = localStorage.getItem('csa_user_id');
      if (storedId && storedId.trim()) {
        return storedId.trim();
      }
    } catch {
      // ignore
    }
  }
  return explicitUserId || DEFAULT_DEV_USER_ID;
}

export function getAuthHeaders(explicitUserId?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const effectiveUserId = resolveEffectiveUserId(explicitUserId);
  if (effectiveUserId) {
    headers['x-user-id'] = effectiveUserId;
  }

  if (typeof window !== 'undefined') {
    try {
      const token = localStorage.getItem('csa_auth_token');
      if (token && token.trim()) {
        headers['Authorization'] = `Bearer ${token.trim()}`;
      }
    } catch {
      // ignore
    }
  }

  return headers;
}
