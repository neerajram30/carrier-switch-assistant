import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import { DevHeaderUserProvider } from '../auth/current-user.provider.js';

const defaultProvider = new DevHeaderUserProvider();

/**
 * Temporary development user ID resolution decorator.
 * Delegates to DevHeaderUserProvider to enforce consistent user identity resolution.
 */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return defaultProvider.resolveUser(request).id;
  },
);
