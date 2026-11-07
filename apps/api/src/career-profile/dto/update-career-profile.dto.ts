import { PartialType } from '@nestjs/mapped-types';
import { CreateCareerProfileDto } from './create-career-profile.dto.js';

export class UpdateCareerProfileDto extends PartialType(CreateCareerProfileDto) {}
