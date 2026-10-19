import { Module } from '@nestjs/common';
import { StorageModule } from '../infrastructure/storage/storage.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CAREER_DATA_EXTRACTOR } from './career-data-extractor.interface.js';
import { DeterministicCareerDataExtractor } from './extractors/deterministic-career-data.extractor.js';
import { DocxExtractor } from './extractors/docx.extractor.js';
import { GeminiCareerDataExtractor } from './extractors/gemini-career-data.extractor.js';
import { PdfExtractor } from './extractors/pdf.extractor.js';
import { ResumeProcessingService } from './resume-processing.service.js';
import { ResumeController } from './resume.controller.js';
import { ResumeService } from './resume.service.js';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [ResumeController],
  providers: [
    ResumeService,
    PdfExtractor,
    DocxExtractor,
    DeterministicCareerDataExtractor,
    GeminiCareerDataExtractor,
    {
      provide: CAREER_DATA_EXTRACTOR,
      useClass: GeminiCareerDataExtractor,
    },
    ResumeProcessingService,
  ],
  exports: [ResumeService, ResumeProcessingService],
})
export class ResumeModule {}
