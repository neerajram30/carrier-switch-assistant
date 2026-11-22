import {
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import type { CurrentUser } from './current-user.interface.js';
import type { CurrentUserProvider } from './current-user.provider.js';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class HybridAuthUserProvider implements CurrentUserProvider {
  constructor(
    @Optional()
    private readonly configService?: ConfigService,
  ) {}

  private getJwtSecret(): string {
    return (
      this.configService?.get<string>('AUTH_SECRET') ||
      process.env.AUTH_SECRET ||
      'csa-default-dev-jwt-secret-do-not-use-in-production'
    );
  }

  resolveUser(request: Request): CurrentUser {
    // 1. Check Bearer token (JWT session issued by NextAuth / AuthService)
    const authHeader = request.headers['authorization'];
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      try {
        const decoded = jwt.verify(token, this.getJwtSecret()) as {
          sub?: string;
          id?: string;
          userId?: string;
        };
        const userId = decoded.sub || decoded.id || decoded.userId;
        if (userId && (UUID_REGEX.test(userId) || typeof userId === 'string')) {
          return { id: userId };
        }
      } catch {
        throw new UnauthorizedException('Invalid or expired Bearer authentication token');
      }
    }

    // 2. Fallback to x-user-id in development or test environment
    const env =
      this.configService?.get<string>('NODE_ENV') || process.env.NODE_ENV;
    const isAllowedDevEnv = env === 'development' || env === 'test' || !env;

    const devHeaderValue = request.headers['x-user-id'];
    if (devHeaderValue && typeof devHeaderValue === 'string' && devHeaderValue.trim()) {
      if (!isAllowedDevEnv) {
        throw new UnauthorizedException(
          `Development identity header ("x-user-id") is strictly disabled in "${env}" environment. Bearer token required.`,
        );
      }

      const userId = devHeaderValue.trim();
      if (!UUID_REGEX.test(userId)) {
        throw new UnauthorizedException(
          'Invalid "x-user-id" development authentication header: must be a valid UUID',
        );
      }

      return { id: userId };
    }

    throw new UnauthorizedException(
      'Missing authentication credentials. Provide a valid Bearer token or development identity header.',
    );
  }
}

