-- CreateEnum
CREATE TYPE "SubjectStatus" AS ENUM ('PENDENTE', 'ATIVA', 'APROVADA', 'REPROVADA', 'TRANCADA', 'DISPENSADA');

-- AlterTable
ALTER TABLE "subjects" ADD COLUMN     "status" "SubjectStatus" NOT NULL DEFAULT 'PENDENTE';

-- CreateTable
CREATE TABLE "subject_status_history" (
    "id" SERIAL NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "status" "SubjectStatus" NOT NULL,
    "semester" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subject_status_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "subject_status_history" ADD CONSTRAINT "subject_status_history_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
