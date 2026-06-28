const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const { placementRecords } = require("../prisma/placementSampleData");

const outputDir = path.join(__dirname, "../public/documents");
const outputFile = path.join(outputDir, "placement_sample.xlsx");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const rows = placementRecords.map((row) => ({
  "College Code": row.collegeCode,
  "College Name": row.collegeName,
  State: row.state,
  University: row.university,
  "Academic Year": row.academicSession || `${row.academicYear}-${String((row.academicYear + 1) % 100).padStart(2, "0")}`,
  "Eligible Students": row.eligibleStudents,
  "Students Placed": row.studentsPlaced,
  "Placement %": row.placementPercent,
  "Avg Salary (LPA)": row.avgSalaryLpa,
  "Core Placement %": row.corePlacementPercent,
  "Industry MoUs": row.industryMoUs,
  "Internships Count": row.internshipsCount,
  "Higher Education %": row.higherEducationPercent,
  "Compliance Remarks": row.complianceRemarks
}));

const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(rows, { skipHeader: false });
XLSX.utils.book_append_sheet(workbook, worksheet, "PlacementData");
XLSX.writeFile(workbook, outputFile);

console.log(`✔ Placement compliance sample generated at ${outputFile}`);
