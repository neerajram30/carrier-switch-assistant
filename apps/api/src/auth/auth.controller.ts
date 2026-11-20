import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { OAuthSyncDto } from './dto/oauth-sync.dto.js';

@Controller('auth')
export class AuthApiController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('oauth/sync')
  @HttpCode(HttpStatus.OK)
  syncOAuthUser(@Body() dto: OAuthSyncDto) {
    return this.authService.syncOAuthUser(dto);
  }
}

