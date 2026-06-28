/*
  Warnings:

  - Added the required column `category` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "role" TEXT NOT NULL;
