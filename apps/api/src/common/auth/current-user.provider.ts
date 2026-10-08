import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { CurrentUser } from './current-user.interface.js';

export const CURRENT_USER_PROVIDER = Symbol('CURRENT_USER_PROVIDER');

export interface CurrentUserProvider {
  resolveUser(request: Request): CurrentUser;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class DevHeaderUserProvider implements CurrentUserProvider {
  resolveUser(request: Request): CurrentUser {
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

    return { id: userId };
  }
}
