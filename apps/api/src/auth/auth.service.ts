import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { OAuthSyncDto } from './dto/oauth-sync.dto.js';

export interface AuthTokenPayload {
  sub: string;
  email: string;
  name?: string | null;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  };
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private getJwtSecret(): string {
    return (
      this.configService.get<string>('AUTH_SECRET') ||
      process.env.AUTH_SECRET ||
      'csa-default-dev-jwt-secret-do-not-use-in-production'
    );
  }

  generateToken(user: { id: string; email: string; name?: string | null }): string {
    const payload: AuthTokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };
    return jwt.sign(payload, this.getJwtSecret(), { expiresIn: '7d' });
  }

  verifyToken(token: string): AuthTokenPayload {
    try {
      return jwt.verify(token, this.getJwtSecret()) as AuthTokenPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException('An account with this email address already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        name: dto.name?.trim() || null,
        passwordHash,
      },
    });

    const accessToken = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
      accessToken,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
      accessToken,
    };
  }

  async syncOAuthUser(dto: OAuthSyncDto): Promise<AuthResponse> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    // Check if account already linked
    const existingAccount = await this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: dto.provider,
          providerAccountId: dto.providerAccountId,
        },
      },
      include: { user: true },
    });

    if (existingAccount) {
      const accessToken = this.generateToken(existingAccount.user);
      return {
        user: {
          id: existingAccount.user.id,
          email: existingAccount.user.email,
          name: existingAccount.user.name,
          image: existingAccount.user.image,
        },
        accessToken,
      };
    }

    // Link or create user
    let user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          name: dto.name?.trim() || null,
          image: dto.image || null,
        },
      });
    }

    // Link account
    await this.prisma.account.create({
      data: {
        userId: user.id,
        provider: dto.provider,
        providerAccountId: dto.providerAccountId,
        type: 'oauth',
      },
    });

    const accessToken = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
      accessToken,
    };
  }
}

