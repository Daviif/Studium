-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('OBRIGATORIA', 'ELETIVA', 'FACULTATIVA');

-- AlterTable
ALTER TABLE "subjects" ADD COLUMN     "type" "SubjectType" NOT NULL DEFAULT 'OBRIGATORIA';
