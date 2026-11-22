import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthApiController } from './auth.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [AuthApiController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthApiModule {}

