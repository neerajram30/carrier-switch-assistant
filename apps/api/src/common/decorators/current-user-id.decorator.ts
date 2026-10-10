import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { CurrentUser as ICurrentUser } from '../auth/current-user.interface.js';

/**
 * Temporary development user ID resolution decorator.
 * Reads the identity resolved and attached to request.user by AuthGuard.
 */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: ICurrentUser }>();

    if (!request.user) {
      throw new UnauthorizedException(
        'Request is unauthenticated. Ensure AuthGuard is applied.',
      );
    }

    return request.user.id;
  },
);
