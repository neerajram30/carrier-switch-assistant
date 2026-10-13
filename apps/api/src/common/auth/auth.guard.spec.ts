import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { AuthGuard } from './auth.guard.js';
import type { CurrentUserProvider } from './current-user.provider.js';
import type { PrismaService } from '../../prisma/prisma.service.js';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockUserProvider: CurrentUserProvider;
  let mockPrisma: any;

  beforeEach(() => {
    mockUserProvider = {
      resolveUser: vi.fn(),
    };
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
    };
    guard = new AuthGuard(mockUserProvider, mockPrisma as unknown as PrismaService);
  });

  it('resolves user via userProvider, validates existence in database, and attaches it to request.user', async () => {
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
    mockPrisma.user.findUnique.mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000001',
    });

    const canActivate = await guard.canActivate(mockContext);

    expect(canActivate).toBe(true);
    expect(mockUserProvider.resolveUser).toHaveBeenCalledWith(mockRequest);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      select: { id: true },
    });
    expect(mockRequest.user).toEqual({
      id: '00000000-0000-0000-0000-000000000001',
    });
  });

  it('throws UnauthorizedException when user does not exist in database', async () => {
    const mockRequest: any = {
      headers: {
        'x-user-id': '00000000-0000-0000-0000-999999999999',
      },
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    vi.mocked(mockUserProvider.resolveUser).mockReturnValue({
      id: '00000000-0000-0000-0000-999999999999',
    });
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(mockRequest.user).toBeUndefined();
  });
});
