/*
  Warnings:

  - You are about to drop the column `filename` on the `files` table. All the data in the column will be lost.
  - You are about to drop the column `originalName` on the `files` table. All the data in the column will be lost.
  - You are about to drop the column `path` on the `files` table. All the data in the column will be lost.
  - Made the column `url` on table `files` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "files" DROP COLUMN "filename",
DROP COLUMN "originalName",
DROP COLUMN "path",
ADD COLUMN     "cloudinaryId" TEXT,
ADD COLUMN     "name" TEXT,
ALTER COLUMN "mimeType" DROP NOT NULL,
ALTER COLUMN "size" DROP NOT NULL,
ALTER COLUMN "url" SET NOT NULL;
