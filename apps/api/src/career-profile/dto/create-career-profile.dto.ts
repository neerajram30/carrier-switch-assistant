import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCareerProfileDto {
  @IsString({ message: 'currentRole must be a string' })
  @IsNotEmpty({ message: 'currentRole cannot be empty' })
  @MaxLength(100, { message: 'currentRole must not exceed 100 characters' })
  currentRole: string;

  @IsNumber(
    { maxDecimalPlaces: 1 },
    { message: 'yearsOfExperience must be a valid number (e.g. 3 or 3.4)' },
  )
  @Min(0, { message: 'yearsOfExperience cannot be negative' })
  yearsOfExperience: number;

  @IsString({ message: 'targetRole must be a string' })
  @IsNotEmpty({ message: 'targetRole cannot be empty' })
  @MaxLength(100, { message: 'targetRole must not exceed 100 characters' })
  @IsOptional()
  targetRole?: string;

  @IsArray({ message: 'skills must be an array of strings' })
  @IsString({ each: true, message: 'each skill must be a string' })
  @IsOptional()
  skills?: string[];

  @IsString({ message: 'summary must be a string' })
  @IsOptional()
  @MaxLength(1000, { message: 'summary must not exceed 1000 characters' })
  summary?: string;
}
