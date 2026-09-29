import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Temporary development user ID resolution decorator for ENG-003 milestone.
 * Extracts the user identity from the `x-user-id` header on the server side.
 * Replaces client-supplied path/body user IDs to enforce proper authorization boundaries.
 */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const headerValue = request.headers['x-user-id'];

    if (!headerValue || typeof headerValue !== 'string' || !headerValue.trim()) {
      throw new UnauthorizedException(
        'Missing required "x-user-id" development authentication header',
      );
    }

    const userId = headerValue.trim();

    if (!UUID_REGEX.test(userId)) {
      throw new UnauthorizedException(
        'Invalid "x-user-id" development authentication header: must be a valid UUID',
      );
    }

    return userId;
  },
);
