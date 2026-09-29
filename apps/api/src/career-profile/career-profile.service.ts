import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCareerProfileDto } from './dto/create-career-profile.dto.js';
import { UpdateCareerProfileDto } from './dto/update-career-profile.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CareerProfileService {
  constructor(private readonly prisma: PrismaService) {}

  private serializeProfile<T extends { yearsOfExperience: unknown }>(profile: T) {
    return {
      ...profile,
      yearsOfExperience: Number(profile.yearsOfExperience),
    };
  }

  async create(userId: string, createCareerProfileDto: CreateCareerProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const existing = await this.prisma.careerProfile.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException(
        `Career profile already exists for user "${userId}"`,
      );
    }

    const created = await this.prisma.careerProfile.create({
      data: {
        userId,
        currentRole: createCareerProfileDto.currentRole,
        yearsOfExperience: createCareerProfileDto.yearsOfExperience,
        targetRole: createCareerProfileDto.targetRole,
        summary: createCareerProfileDto.summary,
      },
    });

    return this.serializeProfile(created);
  }

  async findByUserId(userId: string) {
    const profile = await this.prisma.careerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
    if (!profile) {
      throw new NotFoundException(
        `Career profile for user "${userId}" not found`,
      );
    }
    return this.serializeProfile(profile);
  }

  async update(userId: string, dto: UpdateCareerProfileDto) {
    // Ensure profile exists first
    await this.findByUserId(userId);
    const updated = await this.prisma.careerProfile.update({
      where: { userId },
      data: dto,
    });
    return this.serializeProfile(updated);
  }
}
