/*
  Warnings:

  - You are about to drop the column `professor` on the `subjects` table. All the data in the column will be lost.
  - You are about to drop the column `semestre` on the `subjects` table. All the data in the column will be lost.

  Migration Strategy:
  1. Create new tables: professors, professor_subjects
  2. Create a legacy professor for existing data
  3. Create ProfessorSubject entries for existing Subjects
  4. Add new columns to Task, Routine, File (nullable)
  5. Populate new columns with data from existing relationships
  6. Drop old columns and add constraints
*/

-- Step 1: Create the professors table
CREATE TABLE "professors" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professors_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create the professor_subjects table
CREATE TABLE "professor_subjects" (
    "id" SERIAL NOT NULL,
    "semestre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "professorId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,

    CONSTRAINT "professor_subjects_pkey" PRIMARY KEY ("id")
);

-- Step 3: Add unique index for professor_subjects
CREATE UNIQUE INDEX "professor_subjects_professorId_subjectId_semestre_key" ON "professor_subjects"("professorId", "subjectId", "semestre");

-- Step 4: Add foreign keys to professor_subjects
ALTER TABLE "professor_subjects" ADD CONSTRAINT "professor_subjects_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "professors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "professor_subjects" ADD CONSTRAINT "professor_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 5: Create a default professor for legacy data
INSERT INTO "professors" ("name", "email", "createdAt", "updatedAt") VALUES ('Professor Legado', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Step 6: Create ProfessorSubject entries for all existing subjects with their old professor/semestre data
INSERT INTO "professor_subjects" ("semestre", "professorId", "subjectId", "createdAt", "updatedAt")
SELECT 
    COALESCE("subjects"."semestre", '2025/1') as "semestre",
    1 as "professorId",
    "subjects"."id" as "subjectId",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "subjects"
WHERE TRUE;

-- Step 7: Drop old columns from subjects
ALTER TABLE "subjects" DROP COLUMN "professor",
DROP COLUMN "semestre";

-- Step 8: Add nullable professorSubjectId columns to existing tables
ALTER TABLE "tasks" ADD COLUMN "professorSubjectId" INTEGER;
ALTER TABLE "routines" ADD COLUMN "professorSubjectId" INTEGER;
ALTER TABLE "files" ADD COLUMN "professorSubjectId" INTEGER;

-- Step 9: Drop old foreign keys
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_subjectId_fkey";
ALTER TABLE "routines" DROP CONSTRAINT "routines_subjectId_fkey";
ALTER TABLE "files" DROP CONSTRAINT "files_subjectId_fkey";

-- Step 10: Populate professorSubjectId based on existing subjectId
UPDATE "tasks" 
SET "professorSubjectId" = (
    SELECT "professor_subjects"."id" 
    FROM "professor_subjects" 
    WHERE "professor_subjects"."subjectId" = "tasks"."subjectId" 
    LIMIT 1
)
WHERE "subjectId" IS NOT NULL;

UPDATE "routines" 
SET "professorSubjectId" = (
    SELECT "professor_subjects"."id" 
    FROM "professor_subjects" 
    WHERE "professor_subjects"."subjectId" = "routines"."subjectId" 
    LIMIT 1
)
WHERE "subjectId" IS NOT NULL;

UPDATE "files" 
SET "professorSubjectId" = (
    SELECT "professor_subjects"."id" 
    FROM "professor_subjects" 
    WHERE "professor_subjects"."subjectId" = "files"."subjectId" 
    LIMIT 1
)
WHERE "subjectId" IS NOT NULL;

-- Step 11: Drop old subjectId columns
ALTER TABLE "tasks" DROP COLUMN "subjectId";
ALTER TABLE "routines" DROP COLUMN "subjectId";
ALTER TABLE "files" DROP COLUMN "subjectId";

-- Step 12: Make professorSubjectId NOT NULL and add foreign keys
ALTER TABLE "tasks" ALTER COLUMN "professorSubjectId" SET NOT NULL;
ALTER TABLE "routines" ALTER COLUMN "professorSubjectId" SET NOT NULL;
ALTER TABLE "files" ALTER COLUMN "professorSubjectId" SET NOT NULL;

ALTER TABLE "tasks" ADD CONSTRAINT "tasks_professorSubjectId_fkey" FOREIGN KEY ("professorSubjectId") REFERENCES "professor_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "routines" ADD CONSTRAINT "routines_professorSubjectId_fkey" FOREIGN KEY ("professorSubjectId") REFERENCES "professor_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "files" ADD CONSTRAINT "files_professorSubjectId_fkey" FOREIGN KEY ("professorSubjectId") REFERENCES "professor_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
