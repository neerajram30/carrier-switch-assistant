import { Module } from '@nestjs/common';
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
export class AuthModule {}
