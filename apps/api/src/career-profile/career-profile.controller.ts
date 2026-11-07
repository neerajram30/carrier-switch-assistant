import { Controller, Get, Post, Body, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/auth/auth.guard.js';
import { CurrentUser } from '../common/auth/current-user.decorator.js';
import { CareerProfileService } from './career-profile.service.js';
import { CreateCareerProfileDto } from './dto/create-career-profile.dto.js';
import { UpdateCareerProfileDto } from './dto/update-career-profile.dto.js';

@Controller('career-profile')
@UseGuards(AuthGuard)
export class CareerProfileController {
  constructor(private readonly careerProfileService: CareerProfileService) {}

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() createCareerProfileDto: CreateCareerProfileDto,
  ) {
    return this.careerProfileService.create(userId, createCareerProfileDto);
  }

  @Get()
  find(@CurrentUser('id') userId: string) {
    return this.careerProfileService.findByUserId(userId);
  }

  @Put()
  update(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCareerProfileDto,
  ) {
    return this.careerProfileService.update(userId, dto);
  }
}
