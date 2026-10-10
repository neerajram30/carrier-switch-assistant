import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  CURRENT_USER_PROVIDER,
  type CurrentUserProvider,
} from './current-user.provider.js';
import type { CurrentUser } from './current-user.interface.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(CURRENT_USER_PROVIDER)
    private readonly userProvider: CurrentUserProvider,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: CurrentUser }>();
    const user = this.userProvider.resolveUser(request);

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    });

    if (!dbUser) {
      throw new UnauthorizedException(
        `User account with ID "${user.id}" does not exist in the database. Auto-provisioning is forbidden.`,
      );
    }

    request.user = user;
    return true;
  }
}
