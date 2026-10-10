import { Module, OnModuleInit } from '@nestjs/common';
import {
  CURRENT_USER_PROVIDER,
  DevHeaderUserProvider,
} from './current-user.provider.js';

@Module({
  providers: [
    {
      provide: CURRENT_USER_PROVIDER,
      useClass: DevHeaderUserProvider,
    },
    DevHeaderUserProvider,
  ],
  exports: [CURRENT_USER_PROVIDER, DevHeaderUserProvider],
})
export class AuthModule implements OnModuleInit {
  onModuleInit(): void {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'DevHeaderUserProvider cannot be loaded in production. A production authentication provider must be configured.',
      );
    }
  }
}
