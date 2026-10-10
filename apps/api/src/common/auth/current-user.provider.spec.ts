import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { beforeEach, describe, expect, it } from 'vitest';
import { DevHeaderUserProvider } from './current-user.provider.js';

describe('DevHeaderUserProvider', () => {
  let provider: DevHeaderUserProvider;

  beforeEach(() => {
    provider = new DevHeaderUserProvider();
  });

  it('resolves CurrentUser when a valid UUID x-user-id header is provided', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';
    const mockRequest = {
      headers: {
        'x-user-id': validUuid,
      },
    } as unknown as Request;

    const user = provider.resolveUser(mockRequest);

    expect(user).toEqual({ id: validUuid });
  });

  it('trims whitespace from valid UUID x-user-id header', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';
    const mockRequest = {
      headers: {
        'x-user-id': `   ${validUuid}   `,
      },
    } as unknown as Request;

    const user = provider.resolveUser(mockRequest);

    expect(user).toEqual({ id: validUuid });
  });

  it('throws UnauthorizedException when x-user-id header is missing', () => {
    const mockRequest = {
      headers: {},
    } as unknown as Request;

    expect(() => provider.resolveUser(mockRequest)).toThrow(
      UnauthorizedException,
    );
    expect(() => provider.resolveUser(mockRequest)).toThrow(
      'Missing required "x-user-id" development authentication header',
    );
  });

  it('throws UnauthorizedException when x-user-id header is empty', () => {
    const mockRequest = {
      headers: {
        'x-user-id': '   ',
      },
    } as unknown as Request;

    expect(() => provider.resolveUser(mockRequest)).toThrow(
      UnauthorizedException,
    );
    expect(() => provider.resolveUser(mockRequest)).toThrow(
      'Missing required "x-user-id" development authentication header',
    );
  });

  it('throws UnauthorizedException when x-user-id is not a valid UUID', () => {
    const mockRequest = {
      headers: {
        'x-user-id': 'invalid-uuid-format',
      },
    } as unknown as Request;

    expect(() => provider.resolveUser(mockRequest)).toThrow(
      UnauthorizedException,
    );
    expect(() => provider.resolveUser(mockRequest)).toThrow(
      'Invalid "x-user-id" development authentication header: must be a valid UUID',
    );
  });

  it('throws UnauthorizedException when NODE_ENV is production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const mockRequest = {
        headers: {
          'x-user-id': '123e4567-e89b-12d3-a456-426614174000',
        },
      } as unknown as Request;

      expect(() => provider.resolveUser(mockRequest)).toThrow(
        UnauthorizedException,
      );
      expect(() => provider.resolveUser(mockRequest)).toThrow(
        /forbidden in production/i,
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});
