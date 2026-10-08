import { Module } from '@nestjs/common';
import { StorageModule } from '../infrastructure/storage/storage.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ResumeController } from './resume.controller.js';
import { ResumeService } from './resume.service.js';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [ResumeController],
  providers: [ResumeService],
  exports: [ResumeService],
})
export class ResumeModule {}
