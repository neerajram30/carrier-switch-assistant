import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import type { CurrentUser as ICurrentUser } from './current-user.interface.js';
import { DevHeaderUserProvider } from './current-user.provider.js';

const defaultProvider = new DevHeaderUserProvider();

/**
 * Resolves the current user identity at the controller boundary.
 * Keeps downstream domain services completely decoupled from HTTP transport details.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ICurrentUser => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return defaultProvider.resolveUser(request);
  },
);
