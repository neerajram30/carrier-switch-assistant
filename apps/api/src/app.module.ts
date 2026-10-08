import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { HealthController } from './health/health.controller.js';
import { CareerProfileModule } from './career-profile/career-profile.module.js';
import { ResumeModule } from './resume/resume.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', 'apps/api/.env'],
    }),
    PrismaModule,
    CareerProfileModule,
    ResumeModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
