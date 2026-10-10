import { Global, Module, OnModuleInit } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import {
  CURRENT_USER_PROVIDER,
  DevHeaderUserProvider,
} from './current-user.provider.js';
import { AuthGuard } from './auth.guard.js';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: CURRENT_USER_PROVIDER,
      useClass: DevHeaderUserProvider,
    },
    DevHeaderUserProvider,
    AuthGuard,
  ],
  exports: [CURRENT_USER_PROVIDER, DevHeaderUserProvider, AuthGuard],
})
export class AuthModule implements OnModuleInit {
  onModuleInit(): void {
    const env = process.env.NODE_ENV;
    if (env !== 'development' && env !== 'test') {
      throw new Error(
        `DevHeaderUserProvider cannot be loaded in "${env ?? 'undefined'}" environment. A production authentication provider must be configured.`,
      );
    }
  }
}
