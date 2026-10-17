-- AlterEnum
ALTER TYPE "ResumeStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "ResumeStatus" ADD VALUE 'PROCESSED';
ALTER TYPE "ResumeStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "resumes" ADD COLUMN "extractedText" TEXT,
ADD COLUMN "processingError" TEXT,
ADD COLUMN "processedAt" TIMESTAMP(3);
