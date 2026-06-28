-- CreateTable
CREATE TABLE "PlacementData" (
    "id" TEXT NOT NULL,
    "collegeCode" TEXT NOT NULL,
    "collegeName" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "university" TEXT,
    "academicYear" INTEGER NOT NULL,
    "academicSession" TEXT,
    "eligibleStudents" INTEGER NOT NULL,
    "studentsPlaced" INTEGER NOT NULL,
    "placementPercent" DOUBLE PRECISION NOT NULL,
    "avgSalaryLpa" DOUBLE PRECISION NOT NULL,
    "corePlacementPercent" DOUBLE PRECISION NOT NULL,
    "industryMoUs" INTEGER NOT NULL,
    "internshipsCount" INTEGER NOT NULL,
    "higherEducationPercent" DOUBLE PRECISION NOT NULL,
    "complianceRemarks" TEXT,
    "aiScore" DOUBLE PRECISION,
    "riskLevel" TEXT,
    "analysisJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlacementData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlacementData_state_idx" ON "PlacementData"("state");

-- CreateIndex
CREATE INDEX "PlacementData_university_idx" ON "PlacementData"("university");

-- CreateIndex
CREATE UNIQUE INDEX "PlacementData_collegeCode_academicYear_key" ON "PlacementData"("collegeCode", "academicYear");
