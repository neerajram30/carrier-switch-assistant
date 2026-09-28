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
  async create(createCareerProfileDto: CreateCareerProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: createCareerProfileDto.userId },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID "${createCareerProfileDto.userId}" not found`,
      );
    }

    const existing = await this.prisma.careerProfile.findUnique({
      where: { userId: createCareerProfileDto.userId },
    });
    if (existing) {
      throw new ConflictException(
        `Career profile already exists for user "${createCareerProfileDto.userId}"`,
      );
    }

    return this.prisma.careerProfile.create({
      data: {
        userId: createCareerProfileDto.userId,
        currentRole: createCareerProfileDto.currentRole,
        yearsOfExperience: createCareerProfileDto.yearsOfExperience,
        targetRole: createCareerProfileDto.targetRole,
        summary: createCareerProfileDto.summary,
      },
    });
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
    return profile;
  }

  async update(userId: string, dto: UpdateCareerProfileDto) {
    // Ensure profile exists first
    await this.findByUserId(userId);
    return this.prisma.careerProfile.update({
      where: { userId },
      data: dto,
    });
  }
}
