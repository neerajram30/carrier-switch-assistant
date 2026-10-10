import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/auth/auth.guard.js';
import { CurrentUser } from '../common/auth/current-user.decorator.js';
import type { CurrentUser as ICurrentUser } from '../common/auth/current-user.interface.js';
import { CompleteResumeUploadDto } from './dto/complete-upload.dto.js';
import { CreateUploadIntentDto } from './dto/create-upload-intent.dto.js';
import { ResumeService } from './resume.service.js';

@Controller('resumes')
@UseGuards(AuthGuard)
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post('upload-intent')
  createUploadIntent(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: CreateUploadIntentDto,
  ) {
    return this.resumeService.createUploadIntent(user, dto);
  }

  @Post(':id/complete')
  completeUpload(
    @CurrentUser() user: ICurrentUser,
    @Param('id') resumeId: string,
    @Body() dto: CompleteResumeUploadDto,
  ) {
    return this.resumeService.completeUpload(user, resumeId, dto);
  }
}
