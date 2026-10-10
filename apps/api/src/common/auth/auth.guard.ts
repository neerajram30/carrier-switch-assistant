import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  CURRENT_USER_PROVIDER,
  type CurrentUserProvider,
} from './current-user.provider.js';
import type { CurrentUser } from './current-user.interface.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(CURRENT_USER_PROVIDER)
    private readonly userProvider: CurrentUserProvider,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: CurrentUser }>();
    request.user = this.userProvider.resolveUser(request);
    return true;
  }
}
