import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from './auth.guard.js';
import type { CurrentUserProvider } from './current-user.provider.js';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockUserProvider: CurrentUserProvider;

  beforeEach(() => {
    mockUserProvider = {
      resolveUser: vi.fn(),
    };
    guard = new AuthGuard(mockUserProvider);
  });

  it('resolves user via userProvider and attaches it to request.user', () => {
    const mockRequest: any = {
      headers: {
        'x-user-id': '00000000-0000-0000-0000-000000000001',
      },
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    vi.mocked(mockUserProvider.resolveUser).mockReturnValue({
      id: '00000000-0000-0000-0000-000000000001',
    });

    const canActivate = guard.canActivate(mockContext);

    expect(canActivate).toBe(true);
    expect(mockUserProvider.resolveUser).toHaveBeenCalledWith(mockRequest);
    expect(mockRequest.user).toEqual({
      id: '00000000-0000-0000-0000-000000000001',
    });
  });
});
