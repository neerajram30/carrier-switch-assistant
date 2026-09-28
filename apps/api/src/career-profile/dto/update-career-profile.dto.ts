import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateCareerProfileDto {
  @IsString({ message: 'currentRole must be a string' })
  @IsNotEmpty({ message: 'currentRole cannot be empty' })
  @MaxLength(100, { message: 'currentRole must not exceed 100 characters' })
  @IsOptional()
  currentRole?: string;

  @IsNumber(
    { maxDecimalPlaces: 1 },
    { message: 'yearsOfExperience must be a valid number (e.g. 3 or 3.4)' },
  )
  @Min(0, { message: 'yearsOfExperience cannot be negative' })
  @IsOptional()
  yearsOfExperience?: number;

  @IsString({ message: 'targetRole must be a string' })
  @IsNotEmpty({ message: 'targetRole cannot be empty' })
  @MaxLength(100, { message: 'targetRole must not exceed 100 characters' })
  @IsOptional()
  targetRole?: string;

  @IsString({ message: 'summary must be a string' })
  @MaxLength(1000, { message: 'summary must not exceed 1000 characters' })
  @IsOptional()
  summary?: string;
}
