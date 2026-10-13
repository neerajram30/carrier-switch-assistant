-- AlterTable
ALTER TABLE "career_profiles" ADD COLUMN "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "targetRole" DROP NOT NULL;
