import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { CareerProfileService } from './career-profile.service.js';
import { CreateCareerProfileDto } from './dto/create-career-profile.dto.js';
import { UpdateCareerProfileDto } from './dto/update-career-profile.dto.js';

@Controller('career-profile')
export class CareerProfileController {
  constructor(private readonly careerProfileService: CareerProfileService) {}

  @Post()
  create(@Body() createCareerProfileDto: CreateCareerProfileDto) {
    return this.careerProfileService.create(createCareerProfileDto);
  }

  @Get(':userId')
  findByUserId(@Param('userId') userId: string) {
    return this.careerProfileService.findByUserId(userId);
  }
  @Put(':userId')
  update(@Param('userId') userId: string, @Body() dto: UpdateCareerProfileDto) {
    return this.careerProfileService.update(userId, dto);
  }
}
