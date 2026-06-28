/*
  Warnings:

  - Added the required column `updatedAt` to the `UniversityApplication` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Evaluator" ALTER COLUMN "password" SET DEFAULT 'abcdefgh';

-- AlterTable
ALTER TABLE "University" ALTER COLUMN "password" SET DEFAULT 'abcdefgh';

-- AlterTable
ALTER TABLE "UniversityApplication" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
