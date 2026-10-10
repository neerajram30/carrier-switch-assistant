import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
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

    // Enforce identity existence: unauthenticated user manufacturing is forbidden
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      throw new UnauthorizedException(
        `User account with ID "${user.id}" does not exist in the database. Auto-provisioning is forbidden.`,
      );
    }

    const resumeId = randomUUID();
    const trimmedFileName = dto.fileName.trim();
    const lastDotIndex = trimmedFileName.lastIndexOf('.');
    const extension = trimmedFileName.slice(lastDotIndex).toLowerCase();
    const storageKey = `users/${user.id}/resumes/${resumeId}/original${extension}`;

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

    let clientToken: string;
    try {
      const tokenResult = await this.storage.generateUploadToken({
        pathname: storageKey,
        contentType: dto.contentType.trim(),
        maximumSizeInBytes: MAX_FILE_SIZE_BYTES,
        access: 'private',
      });
      clientToken = tokenResult.clientToken;
    } catch (error) {
      this.logger.error(
        `Failed to generate upload token for resume "${resumeId}": ${(error as Error).message}`,
      );
      await this.prisma.resume.delete({ where: { id: resumeId } }).catch((cleanupError) => {
        this.logger.error(
          `Failed to cleanup orphaned resume record "${resumeId}": ${(cleanupError as Error).message}`,
        );
      });
      throw error;
    }

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
    _dto?: CompleteResumeUploadDto,
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

    // Idempotency: repeating completion on an already confirmed upload succeeds safely
    if (resume.status === 'UPLOADED') {
      this.logger.debug(
        `Resume "${resumeId}" is already UPLOADED. Returning existing record idempotently.`,
      );
      return {
        id: resume.id,
        userId: resume.userId,
        originalFileName: resume.originalFileName,
        contentType: resume.contentType,
        fileSize: resume.fileSize,
        storageKey: resume.storageKey,
        status: resume.status,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
      };
    }

    // Canonical verification: query storage using server-derived immutable storageKey
    const metadata = await this.storage.head(resume.storageKey);
    if (!metadata) {
      throw new BadRequestException(
        `Cannot mark resume as UPLOADED: the object at canonical storage path "${resume.storageKey}" does not exist in storage.`,
      );
    }

    // Verify stored object's pathname matches canonical storageKey
    if (metadata.pathname !== resume.storageKey) {
      throw new BadRequestException(
        `Stored object pathname "${metadata.pathname}" does not match expected storage key "${resume.storageKey}".`,
      );
    }

    // Verify stored object's reported size matches the recorded intent metadata
    if (metadata.size !== resume.fileSize) {
      throw new BadRequestException(
        `Stored object size (${metadata.size} bytes) does not match expected file size (${resume.fileSize} bytes).`,
      );
    }

    // Verify stored object's content type matches the recorded intent metadata
    if (metadata.contentType !== resume.contentType) {
      throw new BadRequestException(
        `Stored object content type "${metadata.contentType}" does not match expected content type "${resume.contentType}".`,
      );
    }

    this.logger.debug(
      `Marking resume "${resumeId}" as UPLOADED after canonical storage verification`,
    );

    const updated = await this.prisma.resume.update({
      where: { id: resumeId },
      data: {
        status: 'UPLOADED',
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
