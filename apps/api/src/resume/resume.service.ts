import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CurrentUser } from '../common/auth/current-user.interface.js';
import {
  OBJECT_STORAGE_PORT,
  type ObjectStoragePort,
} from '../infrastructure/storage/object-storage.port.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CompleteResumeUploadDto } from './dto/complete-upload.dto.js';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  type CreateUploadIntentDto,
} from './dto/create-upload-intent.dto.js';

export const ALLOWED_EXTENSIONS = ['.pdf', '.docx'] as const;

export const MIME_EXTENSION_MAP: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export interface UploadIntentResponse {
  resumeId: string;
  storageKey: string;
  clientToken: string;
  status: string;
}

export interface ResumeResponse {
  id: string;
  userId: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  storageKey: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ResumeService {
  private readonly logger = new Logger(ResumeService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(OBJECT_STORAGE_PORT)
    private readonly storage: ObjectStoragePort,
  ) {}

  async createUploadIntent(
    user: CurrentUser,
    dto: CreateUploadIntentDto,
  ): Promise<UploadIntentResponse> {
    this.validateFileMetadata(dto);

    // Ensure user exists in database to satisfy foreign key constraint
    let dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      dbUser = await this.prisma.user.create({
        data: {
          id: user.id,
          email: `${user.id}@dev.local`,
          name: 'Current User',
        },
      });
    }

    const resumeId = randomUUID();
    const storageKey = `users/${user.id}/resumes/${resumeId}/original`;

    this.logger.debug(
      `Creating upload intent for user "${user.id}" and resume "${resumeId}"`,
    );

    const resume = await this.prisma.resume.create({
      data: {
        id: resumeId,
        userId: user.id,
        originalFileName: dto.fileName.trim(),
        contentType: dto.contentType.trim(),
        fileSize: dto.fileSize,
        storageKey,
        status: 'UPLOADING',
      },
    });

    const { clientToken } = await this.storage.generateUploadToken({
      pathname: storageKey,
      contentType: dto.contentType.trim(),
      maximumSizeInBytes: MAX_FILE_SIZE_BYTES,
    });

    return {
      resumeId: resume.id,
      storageKey: resume.storageKey,
      clientToken,
      status: resume.status,
    };
  }

  async completeUpload(
    user: CurrentUser,
    resumeId: string,
    dto: CompleteResumeUploadDto,
  ): Promise<ResumeResponse> {
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      throw new NotFoundException(`Resume with ID "${resumeId}" not found`);
    }

    if (resume.userId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to modify this resume',
      );
    }

    // Verify that the object actually exists in object storage before updating state
    const objectExists = await this.storage.exists(dto.blobUrl);
    if (!objectExists) {
      throw new BadRequestException(
        `Cannot mark resume as UPLOADED: the uploaded object at "${dto.blobUrl}" does not exist in storage.`,
      );
    }

    this.logger.debug(
      `Marking resume "${resumeId}" as UPLOADED after storage verification`,
    );

    const updated = await this.prisma.resume.update({
      where: { id: resumeId },
      data: {
        status: 'UPLOADED',
        storageKey: dto.blobUrl,
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      originalFileName: updated.originalFileName,
      contentType: updated.contentType,
      fileSize: updated.fileSize,
      storageKey: updated.storageKey,
      status: updated.status,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  private validateFileMetadata(dto: CreateUploadIntentDto): void {
    if (!dto.fileName || typeof dto.fileName !== 'string' || !dto.fileName.trim()) {
      throw new BadRequestException('fileName is required and cannot be empty.');
    }

    if (
      !dto.contentType ||
      typeof dto.contentType !== 'string' ||
      !dto.contentType.trim()
    ) {
      throw new BadRequestException(
        'contentType is required and cannot be empty.',
      );
    }

    if (
      typeof dto.fileSize !== 'number' ||
      !Number.isInteger(dto.fileSize) ||
      dto.fileSize <= 0
    ) {
      throw new BadRequestException(
        'fileSize must be a valid positive integer greater than 0.',
      );
    }

    if (dto.fileSize > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `File size (${dto.fileSize} bytes) exceeds maximum limit of 5 MB (${MAX_FILE_SIZE_BYTES} bytes).`,
      );
    }

    const trimmedFileName = dto.fileName.trim();
    const lastDotIndex = trimmedFileName.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === trimmedFileName.length - 1) {
      throw new BadRequestException(
        'fileName must include a valid file extension (.pdf or .docx).',
      );
    }

    const extension = trimmedFileName.slice(lastDotIndex).toLowerCase();
    const isExtensionAllowed = (ALLOWED_EXTENSIONS as readonly string[]).includes(
      extension,
    );
    const isMimeAllowed = (ALLOWED_MIME_TYPES as readonly string[]).includes(
      dto.contentType.trim(),
    );

    if (!isExtensionAllowed || !isMimeAllowed) {
      throw new BadRequestException(
        `Unsupported format. Only PDF (.pdf) and DOCX (.docx) files are permitted. Received: "${trimmedFileName}" with content-type "${dto.contentType}".`,
      );
    }

    // Enforce consistency between file extension and declared MIME content-type
    const expectedMime = MIME_EXTENSION_MAP[extension];
    if (expectedMime !== dto.contentType.trim()) {
      throw new BadRequestException(
        `File extension "${extension}" does not match content type "${dto.contentType}". Expected "${expectedMime}".`,
      );
    }
  }
}
