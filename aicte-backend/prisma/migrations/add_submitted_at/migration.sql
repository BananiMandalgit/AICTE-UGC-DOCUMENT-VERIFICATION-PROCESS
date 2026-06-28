-- AlterTable
-- Add submittedAt timestamp to track when application was submitted
ALTER TABLE "UniversityApplication" ADD COLUMN "submittedAt" TIMESTAMP(3);

-- Update existing SUBMITTED applications to have a submittedAt timestamp
-- (using createdOn as fallback for historical data)
UPDATE "UniversityApplication"
SET "submittedAt" = "createdOn"
WHERE "status" IN ('SUBMITTED', 'PROCESSING', 'IN_REVIEW', 'VERIFIED', 'APPROVED', 'REJECTED')
AND "submittedAt" IS NULL;
