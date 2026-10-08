import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator.js';
import type { CurrentUser as ICurrentUser } from '../common/auth/current-user.interface.js';
import { CreateUploadIntentDto } from './dto/create-upload-intent.dto.js';
import { ResumeService } from './resume.service.js';

@Controller('api/v1/resumes')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post('upload-intent')
  createUploadIntent(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: CreateUploadIntentDto,
  ) {
    return this.resumeService.createUploadIntent(user, dto);
  }
}
