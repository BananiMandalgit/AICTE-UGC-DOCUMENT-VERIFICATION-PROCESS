/*
  Warnings:

  - Changed the type of `role` on the `Document` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "DocumentRole" AS ENUM ('AICTE', 'UGC');

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "role",
ADD COLUMN     "role" "DocumentRole" NOT NULL;
