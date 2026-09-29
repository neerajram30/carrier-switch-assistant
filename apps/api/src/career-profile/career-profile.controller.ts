import { Controller, Get, Post, Body, Put } from '@nestjs/common';
import { CareerProfileService } from './career-profile.service.js';
import { CreateCareerProfileDto } from './dto/create-career-profile.dto.js';
import { UpdateCareerProfileDto } from './dto/update-career-profile.dto.js';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator.js';

@Controller('career-profile')
export class CareerProfileController {
  constructor(private readonly careerProfileService: CareerProfileService) {}

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Body() createCareerProfileDto: CreateCareerProfileDto,
  ) {
    return this.careerProfileService.create(userId, createCareerProfileDto);
  }

  @Get()
  find(@CurrentUserId() userId: string) {
    return this.careerProfileService.findByUserId(userId);
  }

  @Put()
  update(
    @CurrentUserId() userId: string,
    @Body() dto: UpdateCareerProfileDto,
  ) {
    return this.careerProfileService.update(userId, dto);
  }
}
