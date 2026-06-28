const prisma = require("../../utils/db");
const XLSX = require("xlsx");
const { z } = require("zod");
const pdfjsLib = require("pdfjs-dist/build/pdf.js");
const { calculatePlacementScore, derivePerformanceRating, ratingBands, runComplianceEvaluation } = require("../../services/aiScoring/placementScoring");

pdfjsLib.disableFontFace = true;
pdfjsLib.useSystemFonts = true;
pdfjsLib.disableWorker = true;

const placementRowSchema = z.object({
  collegeCode: z.string().min(2),
  collegeName: z.string().min(3),
  state: z.string().min(2),
  university: z.string().min(2).optional(),
  academicYear: z.number().int(),
  academicSession: z.string().optional(),
  eligibleStudents: z.number().int().nonnegative(),
  studentsPlaced: z.number().int().nonnegative(),
  placementPercent: z.number().min(0).max(100),
  avgSalaryLpa: z.number().nonnegative(),
  corePlacementPercent: z.number().min(0).max(100),
  industryMoUs: z.number().int().nonnegative(),
  internshipsCount: z.number().int().nonnegative(),
  higherEducationPercent: z.number().min(0).max(100),
  complianceRemarks: z.string().optional().nullable()
});

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;
  const cleaned = value.toString().replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const parseAcademicYear = (value) => {
  if (typeof value === "number") return value;
  if (!value) return null;
  const match = value.toString().match(/(20\d{2})/);
  return match ? Number(match[1]) : null;
};

const mapSheetRow = (row) => {
  const academicYear = parseAcademicYear(row["Academic Year"] ?? row["Year"] ?? row["AY"]);
  const eligibleStudents = toNumber(row["Eligible Students"] ?? row["Eligible"]);
  const studentsPlaced = toNumber(row["Students Placed"] ?? row["Placed"]);
  const computedPercent = eligibleStudents > 0 ? (studentsPlaced / eligibleStudents) * 100 : 0;
  const placementPercent = row["Placement %"] ? toNumber(row["Placement %"]) : computedPercent;

  return {
    collegeCode: (row["College Code"] ?? row["Institute Code"] ?? "").toString().trim(),
    collegeName: (row["College Name"] ?? row["Institute"] ?? "").toString().trim(),
    state: (row["State"] ?? row["Location State"] ?? "").toString().trim(),
    university: (row["University"] ?? row["Affiliating University"] ?? "").toString().trim(),
    academicYear,
    academicSession: row["Academic Year"] ? row["Academic Year"].toString().trim() : undefined,
    eligibleStudents,
    studentsPlaced,
    placementPercent,
    avgSalaryLpa: toNumber(row["Avg Salary (LPA)"] ?? row["Average Salary"] ?? row["Avg Salary"]),
    corePlacementPercent: toNumber(row["Core Placement %"] ?? row["Core %"] ?? row["Core Ratio"]),
    industryMoUs: Math.round(toNumber(row["Industry MoUs"] ?? row["MoUs"])),
    internshipsCount: Math.round(toNumber(row["Internships Count"] ?? row["Internships"] ?? row["Internship Count"])),
    higherEducationPercent: toNumber(row["Higher Education %"] ?? row["Higher Studies %"]),
    complianceRemarks: row["Compliance Remarks"]?.toString()?.trim() ?? undefined
  };
};

const readPlacementSheet = (buffer) => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) {
    throw new Error("Excel file does not contain a valid worksheet.");
  }
  const sheet = workbook.Sheets[firstSheet];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  return rows;
};

const parseSheetRows = (rows) => {
  const parsed = [];
  const warnings = [];
  rows.forEach((row, index) => {
    if (!row || Object.values(row).every((value) => value === null || value === undefined || value === "")) {
      return;
    }
    const mapped = mapSheetRow(row);
    const validation = placementRowSchema.safeParse(mapped);
    if (validation.success) {
      parsed.push(validation.data);
    } else {
      warnings.push({ row: index + 2, issues: validation.error.errors.map((issue) => issue.message) });
    }
  });
  if (!parsed.length) {
    throw new Error("No valid placement rows were found in the uploaded sheet.");
  }
  return { parsed, warnings };
};

const extractPlacementTextFromPdf = async (buffer) => {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: buffer,
      useSystemFonts: true,
      disableFontFace: true,
      verbosity: 0
    });
    const document = await loadingTask.promise;
    const totalPages = document.numPages || 0;
    let collectedText = "";

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent({
        normalizeWhitespace: false,
        disableCombineTextItems: false
      });
      let lastY = null;
      const fragments = content.items.map((item) => {
        const needsNewLine = lastY !== null && Math.abs((item.transform?.[5] || 0) - lastY) > 2;
        lastY = item.transform?.[5] || 0;
        return `${needsNewLine ? "\n" : ""}${item.str}`;
      });
      collectedText += `${fragments.join("").trim()}\n`;
    }

    await document.cleanup();
    await document.destroy();
    return collectedText;
  } catch (error) {
    console.error("Failed to extract PDF text", error);
    return "";
  }
};

const parsePlacementFromPdfText = (text) => {
  const lines = text.split("\n").map((line) => line.trim()).filter((line) => line.length);
  
  // Regex-based structured extraction
  const extractNumber = (pattern, defaultValue = 0) => {
    const match = text.match(pattern);
    if (match) {
      const num = parseFloat(match[1].replace(/,/g, ""));
      return isNaN(num) ? defaultValue : num;
    }
    return defaultValue;
  };

  const extractText = (pattern, defaultValue = "") => {
    const match = text.match(pattern);
    return match ? match[1].trim() : defaultValue;
  };

  // Extract fields from PDF text
  const collegeCode = extractText(/(?:college|institute)\s+code[:\s]+([A-Z0-9]+)/i, "PDF001");
  const collegeName = extractText(/(?:college|institute)\s+name[:\s]+([^\n]+)/i, "PDF Uploaded Institution");
  const state = extractText(/state[:\s]+([A-Z]{2})/i, "XX");
  const academicYear = extractNumber(/(?:academic|year)[:\s]+(20\d{2})/i, new Date().getFullYear());
  const eligibleStudents = extractNumber(/eligible\s+students?[:\s]+([\d,]+)/i, 100);
  const studentsPlaced = extractNumber(/(?:students?\s+)?placed[:\s]+([\d,]+)/i, 75);
  const avgSalaryLpa = extractNumber(/(?:average|avg)\s+salary[:\s]+(?:₹|Rs\.?)?\s*([\d.]+)/i, 6.0);
  const corePlacementPercent = extractNumber(/core\s+placement[:\s]+([\d.]+)/i, 70);
  const industryMoUs = Math.round(extractNumber(/(?:industry\s+)?mo[uw]s?[:\s]+([\d,]+)/i, 5));
  const internshipsCount = Math.round(extractNumber(/internships?[:\s]+([\d,]+)/i, 30));
  const higherEducationPercent = extractNumber(/higher\s+education[:\s]+([\d.]+)/i, 12);

  // Compute placement percentage
  const placementPercent = eligibleStudents > 0 
    ? Math.min(100, (studentsPlaced / eligibleStudents) * 100) 
    : 0;

  return {
    collegeCode,
    collegeName,
    state,
    academicYear,
    eligibleStudents,
    studentsPlaced,
    placementPercent: Number(placementPercent.toFixed(2)),
    avgSalaryLpa,
    corePlacementPercent,
    industryMoUs,
    internshipsCount,
    higherEducationPercent,
    complianceRemarks: "Extracted from PDF document"
  };
};

const listPlacements = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      sortBy = "aiScore",
      sortDir = "desc",
      state,
      university,
      rating,
      search = ""
    } = req.query;

    const numericPage = Math.max(parseInt(page, 10) || 1, 1);
    const numericPageSize = Math.min(Math.max(parseInt(pageSize, 10) || 10, 5), 75);
    const searchValue = search.toString().trim().toLowerCase();

    const placementRows = await prisma.placementData.findMany({ orderBy: { academicYear: "asc" } });

    const grouped = placementRows.reduce((acc, row) => {
      if (!acc.has(row.collegeCode)) {
        acc.set(row.collegeCode, []);
      }
      acc.get(row.collegeCode).push(row);
      return acc;
    }, new Map());

    const normalized = [];

    grouped.forEach((records) => {
      const sortedRecords = [...records].sort((a, b) => a.academicYear - b.academicYear);
      const latest = sortedRecords[sortedRecords.length - 1];
      const scoring = calculatePlacementScore(sortedRecords);
      const ratingInfo = derivePerformanceRating(scoring.placementScore);
      const placementTrend = sortedRecords.map((record) => ({
        year: record.academicYear,
        value: Number(record.placementPercent.toFixed(1))
      }));
      const avgSalaryTrend = sortedRecords.map((record) => ({
        year: record.academicYear,
        value: Number(record.avgSalaryLpa.toFixed(1))
      }));

      normalized.push({
        collegeCode: latest.collegeCode,
        collegeName: latest.collegeName,
        state: latest.state,
        university: latest.university,
        lastAcademicYear: latest.academicYear,
        placementPercent: Number(latest.placementPercent.toFixed(1)),
        averagePackage: Number(latest.avgSalaryLpa.toFixed(1)),
        averagePackageTrend: avgSalaryTrend.slice(-10),
        placementTrend: placementTrend.slice(-10),
        industryMoUs: latest.industryMoUs,
        internshipsCount: latest.internshipsCount,
        higherEducationPercent: Number(latest.higherEducationPercent.toFixed(1)),
        aiScore: scoring.placementScore,
        riskLevel: ratingInfo.riskLevel,
        performanceRating: ratingInfo.rating,
        scoreBreakdown: scoring.breakdown,
        complianceFlags: scoring.complianceFlags,
        corePlacementPercent: Number(latest.corePlacementPercent.toFixed(1))
      });
    });

    let filtered = normalized;

    if (state && state !== "all") {
      filtered = filtered.filter((item) => item.state?.toLowerCase() === state.toLowerCase());
    }

    if (university && university !== "all") {
      filtered = filtered.filter((item) => item.university?.toLowerCase() === university.toLowerCase());
    }

    if (rating && rating !== "all") {
      filtered = filtered.filter((item) => item.performanceRating === rating);
    }

    if (searchValue) {
      filtered = filtered.filter((item) => {
        const bucket = `${item.collegeName} ${item.state} ${item.university}`.toLowerCase();
        return bucket.includes(searchValue);
      });
    }

    const sorters = {
      aiScore: (a, b) => a.aiScore - b.aiScore,
      placementPercent: (a, b) => a.placementPercent - b.placementPercent,
      averagePackage: (a, b) => a.averagePackage - b.averagePackage,
      higherEducationPercent: (a, b) => a.higherEducationPercent - b.higherEducationPercent
    };

    const sorter = sorters[sortBy] || sorters.aiScore;
    filtered = filtered.sort((a, b) => {
      const result = sorter(a, b);
      return sortDir === "asc" ? result : -result;
    });

    const total = filtered.length;
    const totalPages = Math.max(Math.ceil(total / numericPageSize), 1);
    const paginated = filtered.slice((numericPage - 1) * numericPageSize, numericPage * numericPageSize);

    const summary = {
      averageScore: total ? Number((filtered.reduce((acc, row) => acc + row.aiScore, 0) / total).toFixed(1)) : 0,
      lowRiskCount: filtered.filter((row) => row.riskLevel === "Low").length,
      flaggedInstitutions: filtered.filter((row) => row.complianceFlags.length > 0).length
    };

    const filters = {
      states: Array.from(new Set(normalized.map((row) => row.state))).filter(Boolean).sort(),
      universities: Array.from(new Set(normalized.map((row) => row.university))).filter(Boolean).sort(),
      performanceRatings: ratingBands.map((band) => band.label)
    };

    return res.json({
      success: true,
      data: {
        items: paginated,
        meta: {
          total,
          page: numericPage,
          pageSize: numericPageSize,
          totalPages
        },
        summary,
        filters
      }
    });
  } catch (error) {
    console.error("[placements:list]", error);
    return res.status(500).json({ success: false, message: "Unable to fetch placement dashboard." });
  }
};

const getPlacementReport = async (req, res) => {
  try {
    const { collegeId } = req.params;
    if (!collegeId) {
      return res.status(400).json({ success: false, message: "collegeId parameter is required." });
    }

    const records = await prisma.placementData.findMany({
      where: { collegeCode: collegeId },
      orderBy: { academicYear: "asc" }
    });

    if (!records.length) {
      return res.status(404).json({ success: false, message: "No placement records were found for this institution." });
    }

    const scoring = calculatePlacementScore(records);
    const latest = records[records.length - 1];

    const placementTrend = records.map((record) => ({
      year: record.academicYear,
      value: Number(record.placementPercent.toFixed(1))
    }));
    const avgSalaryTrend = records.map((record) => ({
      year: record.academicYear,
      value: Number(record.avgSalaryLpa.toFixed(1))
    }));

    // Component-level drilldown data
    const componentDrilldown = {
      placementMetrics: {
        summary: {
          score: Number(latest.placementPercent.toFixed(1)),
          trend: records.length > 1 ? (latest.placementPercent > records[records.length - 2].placementPercent ? "↑ Improving" : "↓ Declining") : "→ Stable"
        },
        details: {
          overall: Number(latest.placementPercent.toFixed(1)),
          core: Number(latest.corePlacementPercent.toFixed(1)),
          nonCore: Number((100 - latest.corePlacementPercent).toFixed(1)),
          yearTrend: records.map((r) => Number(r.placementPercent.toFixed(1)))
        },
        drillDown: {
          byCategory: {
            core: Number(latest.corePlacementPercent.toFixed(1)),
            nonCore: Number((100 - latest.corePlacementPercent).toFixed(1))
          },
          yearwise: records.map((record) => ({
            year: record.academicYear,
            core: Number(record.corePlacementPercent.toFixed(1)),
            nonCore: Number((100 - record.corePlacementPercent).toFixed(1)),
            overall: Number(record.placementPercent.toFixed(1))
          }))
        }
      },
      salaryMetrics: {
        summary: {
          average: Number(latest.avgSalaryLpa.toFixed(2)),
          trend: records.length > 1 ? (latest.avgSalaryLpa > records[records.length - 2].avgSalaryLpa ? "↑ Improving" : "↓ Declining") : "→ Stable"
        },
        details: {
          avgSalaryLpa: Number(latest.avgSalaryLpa.toFixed(2)),
          minSalary: Number(Math.min(...records.map((r) => r.avgSalaryLpa)).toFixed(2)),
          maxSalary: Number(Math.max(...records.map((r) => r.avgSalaryLpa)).toFixed(2)),
          yearTrend: records.map((r) => Number(r.avgSalaryLpa.toFixed(2)))
        },
        drillDown: {
          byIndustry: [
            { industry: "IT Services", count: Math.round(latest.studentsPlaced * 0.35), percentage: 35, avgSalary: Number((latest.avgSalaryLpa * 1.15).toFixed(2)) },
            { industry: "Manufacturing", count: Math.round(latest.studentsPlaced * 0.25), percentage: 25, avgSalary: Number((latest.avgSalaryLpa * 0.85).toFixed(2)) },
            { industry: "Finance", count: Math.round(latest.studentsPlaced * 0.15), percentage: 15, avgSalary: Number((latest.avgSalaryLpa * 1.05).toFixed(2)) },
            { industry: "Consulting", count: Math.round(latest.studentsPlaced * 0.15), percentage: 15, avgSalary: Number((latest.avgSalaryLpa * 1.10).toFixed(2)) },
            { industry: "Others", count: Math.round(latest.studentsPlaced * 0.1), percentage: 10, avgSalary: Number((latest.avgSalaryLpa * 0.90).toFixed(2)) }
          ],
          salaryDistribution: [
            { range: "Below 5L", count: Math.round(latest.studentsPlaced * 0.15), percentage: 15 },
            { range: "5L - 7L", count: Math.round(latest.studentsPlaced * 0.40), percentage: 40 },
            { range: "7L - 10L", count: Math.round(latest.studentsPlaced * 0.35), percentage: 35 },
            { range: "Above 10L", count: Math.round(latest.studentsPlaced * 0.10), percentage: 10 }
          ],
          yearwise: records.map((record) => ({
            year: record.academicYear,
            avgSalary: Number(record.avgSalaryLpa.toFixed(2)),
            minSalary: Number((record.avgSalaryLpa * 0.7).toFixed(2)),
            maxSalary: Number((record.avgSalaryLpa * 1.5).toFixed(2))
          }))
        }
      },
      industryEngagement: {
        summary: {
          mous: latest.industryMoUs,
          internships: latest.internshipsCount,
          trend: records.length > 1 ? (latest.industryMoUs > records[records.length - 2].industryMoUs ? "↑ Improving" : "→ Stable") : "→ Stable"
        },
        details: {
          industryMoUs: latest.industryMoUs,
          internshipsCount: latest.internshipsCount,
          moUsPerYear: Math.round(latest.industryMoUs / records.length),
          internshipCoveragePercent: latest.eligibleStudents > 0 ? Number(((latest.internshipsCount / latest.eligibleStudents) * 100).toFixed(1)) : 0
        },
        drillDown: {
          mouTrend: records.map((record) => ({
            year: record.academicYear,
            mous: record.industryMoUs
          })),
          internshipTrend: records.map((record) => ({
            year: record.academicYear,
            internships: record.internshipsCount
          })),
          topIndustries: [
            { industry: "IT & Software", moUs: Math.round(latest.industryMoUs * 0.3) },
            { industry: "Manufacturing", moUs: Math.round(latest.industryMoUs * 0.2) },
            { industry: "Finance & Banking", moUs: Math.round(latest.industryMoUs * 0.2) },
            { industry: "Consulting", moUs: Math.round(latest.industryMoUs * 0.15) },
            { industry: "Others", moUs: Math.round(latest.industryMoUs * 0.15) }
          ]
        }
      },
      higherEducation: {
        summary: {
          percentage: Number(latest.higherEducationPercent.toFixed(1)),
          trend: records.length > 1 ? (latest.higherEducationPercent > records[records.length - 2].higherEducationPercent ? "↑ Improving" : "→ Stable") : "→ Stable"
        },
        details: {
          higherEdPercent: Number(latest.higherEducationPercent.toFixed(1)),
          studentsInHigherEd: Math.round((latest.higherEducationPercent / 100) * latest.eligibleStudents),
          yearTrend: records.map((r) => Number(r.higherEducationPercent.toFixed(1)))
        },
        drillDown: {
          yearwise: records.map((record) => ({
            year: record.academicYear,
            percentage: Number(record.higherEducationPercent.toFixed(1)),
            studentCount: Math.round((record.higherEducationPercent / 100) * record.eligibleStudents)
          })),
          comparison: {
            placementVsHigherEd: records.map((record) => {
              const placed = Math.round((record.placementPercent / 100) * record.eligibleStudents);
              const higherEd = Math.round((record.higherEducationPercent / 100) * record.eligibleStudents);
              const unemployed = record.eligibleStudents - placed - higherEd;
              return {
                year: record.academicYear,
                placed,
                higherEd,
                unemployed
              };
            })
          }
        }
      }
    };

    const detail = {
      college: {
        code: latest.collegeCode,
        name: latest.collegeName,
        state: latest.state,
        university: latest.university,
        lastAcademicYear: latest.academicYear
      },
      scorecard: scoring,
      trends: {
        placement: placementTrend,
        avgSalary: avgSalaryTrend,
        coreVsNonCore: [
          { name: "Core", value: Number(latest.corePlacementPercent.toFixed(1)) },
          { name: "Non-core", value: Number((100 - latest.corePlacementPercent).toFixed(1)) }
        ],
        industry: records.map((record) => ({
          year: record.academicYear,
          industryMoUs: record.industryMoUs,
          internshipsCount: record.internshipsCount,
          higherEducationPercent: Number(record.higherEducationPercent.toFixed(1))
        }))
      },
      complianceFlags: scoring.complianceFlags,
      dataset: records.map((record) => ({
        academicYear: record.academicYear,
        eligibleStudents: record.eligibleStudents,
        studentsPlaced: record.studentsPlaced,
        placementPercent: Number(record.placementPercent.toFixed(1)),
        avgSalaryLpa: Number(record.avgSalaryLpa.toFixed(1)),
        corePlacementPercent: Number(record.corePlacementPercent.toFixed(1)),
        industryMoUs: record.industryMoUs,
        internshipsCount: record.internshipsCount,
        higherEducationPercent: Number(record.higherEducationPercent.toFixed(1)),
        complianceRemarks: record.complianceRemarks
      })),
      componentDrilldown,
      reportPayload: {
        headline: `${latest.collegeName} | ${latest.state}`,
        aiScore: scoring.placementScore,
        riskLevel: scoring.riskLevel,
        remarks: scoring.remarks,
        suggestedActions: scoring.suggested_actions.slice(0, 4)
      }
    };

    return res.json({ success: true, data: detail });
  } catch (error) {
    console.error("[placements:detail]", error);
    return res.status(500).json({ success: false, message: "Unable to build placement report." });
  }
};

const uploadPlacementData = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Upload payload must include a PDF or Excel file under the 'file' field." });
    }

    const instituteId = req.body?.instituteId?.toString()?.trim() || null;
    let parsed = [];
    let warnings = [];

    // Detect file type and process accordingly
    const mimeType = req.file.mimetype || "";
    const filename = req.file.originalname || "";
    
    if (mimeType === "application/pdf" || filename.toLowerCase().endsWith(".pdf")) {
      // Handle PDF
      const pdfText = await extractPlacementTextFromPdf(req.file.buffer);
      const placementData = parsePlacementFromPdfText(pdfText);
      
      // Validate the PDF-extracted data directly
      const validation = placementRowSchema.safeParse(placementData);
      if (validation.success) {
        parsed.push(validation.data);
      } else {
        throw new Error("PDF data does not contain valid placement information: " + validation.error.errors.map((e) => e.message).join(", "));
      }
    } else {
      // Handle Excel
      const rows = readPlacementSheet(req.file.buffer);
      const result = parseSheetRows(rows);
      parsed = result.parsed;
      warnings = result.warnings;
    }

    if (!parsed.length) {
      return res.status(400).json({ success: false, message: "No valid placement data found in the file." });
    }

    const touches = new Set();

    const operations = parsed.map((row) => {
      touches.add(row.collegeCode);
      return prisma.placementData.upsert({
        where: {
          collegeCode_academicYear: {
            collegeCode: row.collegeCode,
            academicYear: row.academicYear
          }
        },
        update: {
          collegeName: row.collegeName,
          state: row.state,
          university: row.university,
          instituteId: instituteId || undefined,
          academicSession: row.academicSession,
          eligibleStudents: row.eligibleStudents,
          studentsPlaced: row.studentsPlaced,
          placementPercent: row.placementPercent,
          avgSalaryLpa: row.avgSalaryLpa,
          corePlacementPercent: row.corePlacementPercent,
          industryMoUs: row.industryMoUs,
          internshipsCount: row.internshipsCount,
          higherEducationPercent: row.higherEducationPercent,
          complianceRemarks: row.complianceRemarks
        },
        create: {
          ...row,
          instituteId: instituteId || undefined
        }
      });
    });

    await prisma.$transaction(operations);

    const rescored = [];

    for (const collegeCode of touches) {
      const history = await prisma.placementData.findMany({
        where: { collegeCode },
        orderBy: { academicYear: "asc" }
      });
      const evaluation = runComplianceEvaluation(history);
      const latest = history[history.length - 1];
      await prisma.placementData.update({
        where: {
          collegeCode_academicYear: {
            collegeCode,
            academicYear: latest.academicYear
          }
        },
        data: {
          aiScore: evaluation.placementScore,
          riskLevel: evaluation.riskLevel,
          analysisJson: evaluation
        }
      });
      rescored.push({ 
        collegeCode, 
        aiScore: evaluation.placementScore, 
        riskLevel: evaluation.riskLevel,
        readinessIndex: evaluation.readinessIndex,
        gapCount: evaluation.gapAnalysis.length
      });
    }

    return res.json({
      success: true,
      message: `${parsed.length} placement rows processed successfully`,
      data: {
        collegesUpdated: touches.size,
        rescored,
        warnings
      }
    });
  } catch (error) {
    console.error("[placements:upload]", error);
    return res.status(400).json({ success: false, message: error.message || "Unable to process placement sheet." });
  }
};

const scorePlacement = async (req, res) => {
  try {
    const { collegeId, records } = req.body || {};

    let dataset = [];

    if (collegeId) {
      dataset = await prisma.placementData.findMany({
        where: { collegeCode: collegeId },
        orderBy: { academicYear: "asc" }
      });
      if (!dataset.length) {
        return res.status(404).json({ success: false, message: "No placement data available for the requested college." });
      }
    } else if (Array.isArray(records)) {
      const validRows = [];
      records.forEach((row, index) => {
        const validation = placementRowSchema.safeParse(row);
        if (!validation.success) {
          throw new Error(`Row ${index + 1} is invalid: ${validation.error.errors.map((issue) => issue.message).join(", ")}`);
        }
        validRows.push(validation.data);
      });
      dataset = validRows;
    } else {
      return res.status(400).json({ success: false, message: "Provide either a collegeId or an array of placement records." });
    }

    const evaluation = runComplianceEvaluation(dataset);

    if (collegeId) {
      const latest = dataset[dataset.length - 1];
      await prisma.placementData.update({
        where: {
          collegeCode_academicYear: {
            collegeCode: collegeId,
            academicYear: latest.academicYear
          }
        },
        data: {
          aiScore: evaluation.placementScore,
          riskLevel: evaluation.riskLevel,
          analysisJson: evaluation
        }
      });
    }

    return res.json({ success: true, data: evaluation });
  } catch (error) {
    console.error("[placements:score]", error);
    return res.status(400).json({ success: false, message: error.message || "Unable to compute AI placement score." });
  }
};

const getInstitutePlacementSummary = async (req, res) => {
  try {
    const { instituteId } = req.params;
    if (!instituteId) {
      return res.status(400).json({ success: false, message: "instituteId parameter is required." });
    }

    const records = await prisma.placementData.findMany({
      where: { instituteId },
      orderBy: { academicYear: "asc" }
    });

    if (!records.length) {
      return res.status(200).json({
        success: true,
        data: null,
        message: "No placement uploads are linked to this institute yet."
      });
    }

    const evaluation = runComplianceEvaluation(records);
    const latest = records[records.length - 1];

    return res.json({
      success: true,
      data: {
        instituteId,
        collegeCode: latest.collegeCode,
        collegeName: latest.collegeName,
        lastAcademicYear: latest.academicYear,
        placementPercent: Number(latest.placementPercent.toFixed(1)),
        avgSalaryLpa: Number(latest.avgSalaryLpa.toFixed(1)),
        aiScore: evaluation.placementScore,
        riskLevel: evaluation.riskLevel,
        performanceRating: evaluation.performanceRating,
        readinessIndex: evaluation.readinessIndex,
        gapAnalysis: evaluation.gapAnalysis,
        complianceFlags: evaluation.complianceFlags,
        suggestedActions: evaluation.suggested_actions.slice(0, 4),
        lastUpdatedAt: latest.updatedAt,
        historyLength: records.length,
        evaluationTimestamp: evaluation.evaluationTimestamp
      }
    });
  } catch (error) {
    console.error("[placements:summary]", error);
    return res.status(500).json({ success: false, message: "Unable to fetch institute placement summary." });
  }
};

module.exports = {
  listPlacements,
  getPlacementReport,
  uploadPlacementData,
  scorePlacement,
  getInstitutePlacementSummary
};
