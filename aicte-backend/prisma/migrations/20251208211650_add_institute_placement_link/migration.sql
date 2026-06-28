-- AlterTable
ALTER TABLE "PlacementData" ADD COLUMN     "instituteId" TEXT;

-- CreateIndex
CREATE INDEX "PlacementData_instituteId_idx" ON "PlacementData"("instituteId");

-- AddForeignKey
ALTER TABLE "PlacementData" ADD CONSTRAINT "PlacementData_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;
