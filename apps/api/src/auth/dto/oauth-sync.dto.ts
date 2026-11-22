import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class OAuthSyncDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Provider is required' })
  provider: string;

  @IsString()
  @IsNotEmpty({ message: 'Provider Account ID is required' })
  providerAccountId: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  image?: string;
}

