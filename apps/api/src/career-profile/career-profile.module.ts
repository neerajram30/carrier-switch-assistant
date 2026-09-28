import { Module } from '@nestjs/common';
import { CareerProfileService } from './career-profile.service.js';
import { CareerProfileController } from './career-profile.controller.js';

@Module({
  controllers: [CareerProfileController],
  providers: [CareerProfileService],
})
export class CareerProfileModule {}
