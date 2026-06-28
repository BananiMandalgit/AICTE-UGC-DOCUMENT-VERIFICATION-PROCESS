-- CreateEnum
CREATE TYPE "NirfRunStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "FeedbackRole" AS ENUM ('INSTITUTE', 'EVALUATOR');

-- CreateTable
CREATE TABLE "NirfRun" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "academicYear" INTEGER NOT NULL,
    "status" "NirfRunStatus" NOT NULL DEFAULT 'QUEUED',
    "finalScore" DOUBLE PRECISION,
    "jobId" TEXT,
    "uploadKey" TEXT,
    "originalFileName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NirfRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NirfComponentScore" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NirfComponentScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "role" "FeedbackRole" NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NirfRun_instituteId_academicYear_idx" ON "NirfRun"("instituteId", "academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "NirfComponentScore_runId_key_key" ON "NirfComponentScore"("runId", "key");

-- AddForeignKey
ALTER TABLE "NirfRun" ADD CONSTRAINT "NirfRun_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NirfComponentScore" ADD CONSTRAINT "NirfComponentScore_runId_fkey" FOREIGN KEY ("runId") REFERENCES "NirfRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
