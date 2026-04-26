-- CreateTable
CREATE TABLE "evaluations" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "grade" DOUBLE PRECISION NOT NULL,
    "maxGrade" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "evaluations_taskId_key" ON "evaluations"("taskId");

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
