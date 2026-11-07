import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { CurrentUser as ICurrentUser } from './current-user.interface.js';

/**
 * Resolves the current user identity at the controller boundary.
 * Reads the identity resolved and attached to request.user by AuthGuard.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof ICurrentUser | undefined, ctx: ExecutionContext): any => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: ICurrentUser }>();

    if (!request.user) {
      throw new UnauthorizedException(
        'Request is unauthenticated. Ensure AuthGuard is applied.',
      );
    }

    return data ? request.user[data] : request.user;
  },
);
