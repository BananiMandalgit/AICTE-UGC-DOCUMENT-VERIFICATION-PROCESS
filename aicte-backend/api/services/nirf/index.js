const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const { v4: uuid } = require("uuid");
const pdfjsLib = require("pdfjs-dist/build/pdf.js");
const shouldDebugPdf = process.env.DEBUG_NIRF_PDF === "true";
pdfjsLib.disableFontFace = true;
pdfjsLib.useSystemFonts = true;
pdfjsLib.disableWorker = true;

let pdfTableExtractor;
try {
  const { Canvas, Image } = require("canvas");
  global.Canvas = Canvas;
  global.Image = Image;
  pdfTableExtractor = require("pdf-table-extractor");
} catch (error) {
  pdfTableExtractor = null;
  console.warn("pdf-table-extractor unavailable", error?.message || error);
}


const COMPONENT_HEADERS = [
  "component",
  "component name",
  "component title",
  "category",
  "criteria",
  "criterion",
  "metric",
  "metric name",
  "parameter",
  "indicator",
  "section",
  "pillar",
  "dimension",
  "domain",
  "key"
];
const LABEL_HEADERS = [
  "label",
  "component",
  "component name",
  "component title",
  "category",
  "criteria",
  "criterion",
  "metric",
  "metric name",
  "parameter",
  "indicator",
  "pillar",
  "heading"
];
const SCORE_HEADERS = [
  "score",
  "scores",
  "nirf score",
  "composite score",
  "value",
  "points",
  "rating"
];
const WEIGHT_HEADERS = [
  "weight",
  "weightage",
  "weight %",
  "weight%",
  "weightage %",
  "weightage (in %)",
  "weightage (out of 100)",
  "percentage",
  "percentage share",
  "factor",
  "share"
];

const slugifyKey = (input, fallbackSuffix = "") => {
  if (!input || typeof input !== "string") {
    return `component${fallbackSuffix}`;
  }
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .substring(0, 40) || `component${fallbackSuffix}`;
};

const findFirstIndex = (headers, candidates) => {
  return headers.findIndex((header) => candidates.includes(header));
};

const coerceNumber = (value, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed.length) {
      return fallback;
    }

    const normalized = trimmed
      .replace(/[,]/g, "")
      .replace(/[^0-9.+-]/g, "");

    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  return fallback;
};

const normalizeHeaderValue = (cell) => {
  if (cell === null || cell === undefined) return "";
  if (typeof cell === "string") return cell.trim().toLowerCase();
  return String(cell).trim().toLowerCase();
};

const detectHeaderRowIndex = (rows) => {
  for (let i = 0; i < rows.length; i += 1) {
    const normalized = rows[i].map(normalizeHeaderValue);
    const hasComponentColumn = normalized.some((value) => COMPONENT_HEADERS.includes(value) || LABEL_HEADERS.includes(value));
    const hasScoreColumn = normalized.some((value) => SCORE_HEADERS.includes(value));
    if (hasComponentColumn && hasScoreColumn) {
      return i;
    }
  }
  return -1;
};

const deriveTabularComponentsFromRows = (rows = [], { startingIndex = 0 } = {}) => {
  if (!Array.isArray(rows) || !rows.length) {
    return [];
  }

  const headerRowIndex = detectHeaderRowIndex(rows);
  if (headerRowIndex < 0 || !rows[headerRowIndex]) {
    return [];
  }

  const headerRow = rows[headerRowIndex].map(normalizeHeaderValue);
  const dataRows = rows
    .slice(headerRowIndex + 1)
    .filter((row) =>
      Array.isArray(row) && row.some((cell) => cell !== null && cell !== undefined && String(cell).trim().length)
    );

  if (!dataRows.length) {
    return [];
  }

  const headerIndexes = {
    component: findFirstIndex(headerRow, COMPONENT_HEADERS),
    label: findFirstIndex(headerRow, LABEL_HEADERS),
    score: findFirstIndex(headerRow, SCORE_HEADERS),
    weight: findFirstIndex(headerRow, WEIGHT_HEADERS)
  };

  const components = [];

  dataRows.forEach((row) => {
    const labelColumnIndex = headerIndexes.label >= 0
      ? headerIndexes.label
      : headerIndexes.component >= 0
        ? headerIndexes.component
        : 0;

    const scoreColumnIndex = headerIndexes.score >= 0 ? headerIndexes.score : labelColumnIndex + 1;
    const weightColumnIndex = headerIndexes.weight >= 0 ? headerIndexes.weight : labelColumnIndex + 2;

    const getCellValue = (columnIndex) =>
      columnIndex >= 0 && columnIndex < row.length ? row[columnIndex] : undefined;

    const fallbackIndex = startingIndex + components.length + 1;
    const componentLabel = getCellValue(labelColumnIndex);
    const normalizedLabel =
      typeof componentLabel === "string" && componentLabel.trim().length
        ? componentLabel.trim()
        : `Component ${fallbackIndex}`;

    const scoreValue = coerceNumber(getCellValue(scoreColumnIndex));
    const weightValue = coerceNumber(getCellValue(weightColumnIndex), 1);

    if (!normalizedLabel.trim()) {
      return;
    }

    components.push({
      key: slugifyKey(normalizedLabel, `_${fallbackIndex}`),
      label: normalizedLabel,
      score: scoreValue,
      weight: weightValue > 0 ? weightValue : 1
    });
  });

  return components;
};

const deduplicateComponents = (components = []) => {
  const seen = new Set();
  return components.filter((component) => {
    if (!component || !component.label) {
      return false;
    }
    const dedupeKey = component.key || slugifyKey(component.label);
    if (seen.has(dedupeKey)) {
      return false;
    }
    seen.add(dedupeKey);
    return true;
  });
};

const parseNirfWorkbook = (filePath) => {
  const resolvedPath = path.resolve(filePath);
  const workbook = xlsx.readFile(resolvedPath, { raw: true, type: "file" });

  if (!workbook.SheetNames.length) {
    return { tabularComponents: [], metrics: {} };
  }

  let rows = [];
  for (let i = 0; i < workbook.SheetNames.length; i += 1) {
    const candidateSheet = workbook.Sheets[workbook.SheetNames[i]];
    const candidateRows = xlsx.utils.sheet_to_json(candidateSheet, { header: 1, defval: null });
    if (candidateRows?.length) {
      rows = candidateRows;
      break;
    }
  }

  if (!rows.length) {
    return { tabularComponents: [], metrics: {} };
  }

  const allRowsForMetrics = workbook.SheetNames.reduce((acc, sheetName) => {
    const currentSheet = workbook.Sheets[sheetName];
    const currentRows = xlsx.utils.sheet_to_json(currentSheet, { header: 1, defval: null });
    if (currentRows?.length) {
      acc.push(...currentRows);
    }
    return acc;
  }, []);

  const tabularComponents = deriveTabularComponentsFromRows(rows);
  const metrics = extractMetricsFromRows(allRowsForMetrics.length ? allRowsForMetrics : rows);

  return { tabularComponents, metrics };
};

const extractMetricsFromPdfText = (text = "") => {
  if (!text.trim()) {
    return {};
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length);

  const metrics = {};

  lines.forEach((line) => {
    const [rawKey, ...valueParts] = line.split(/[:\-–]/);
    if (rawKey && valueParts.length) {
      const resolved = resolveMetricKey(rawKey);
      if (resolved && metrics[resolved] === undefined) {
        const numericMatch = valueParts.join(" ").match(/[-+]?\d*[.,]?\d+/g);
        if (numericMatch && numericMatch.length) {
          metrics[resolved] = coerceNumber(numericMatch[numericMatch.length - 1]);
          return;
        }
      }
    }

    const normalizedLine = normalizeMetricKey(line);
    for (const [metricKey, synonyms] of Object.entries(METRIC_ALIASES)) {
      if (metrics[metricKey] !== undefined) {
        continue;
      }
      if (synonyms.some((synonym) => normalizedLine.includes(synonym))) {
        const valueMatch = line.match(/[-+]?\d*[.,]?\d+/g);
        if (valueMatch && valueMatch.length) {
          metrics[metricKey] = coerceNumber(valueMatch[valueMatch.length - 1]);
          break;
        }
      }
    }
  });

  return metrics;
};

const deriveMetricsFromTable = (table = []) => {
  if (!Array.isArray(table) || table.length < 2) {
    return {};
  }

  const headerRow = table[0].map((cell) => (typeof cell === "string" ? cell.trim() : cell));
  const dataRows = table.slice(1).filter((row) => Array.isArray(row) && row.some((cell) => cell !== null && cell !== undefined && String(cell).trim().length));
  if (!dataRows.length) {
    return {};
  }

  const rowWithYear = dataRows
    .map((row) => ({ row, year: coerceNumber(row[0], Number.NEGATIVE_INFINITY) }))
    .sort((a, b) => a.year - b.year);

  const selectedRow = rowWithYear.length ? rowWithYear[rowWithYear.length - 1].row : dataRows[dataRows.length - 1];
  if (!selectedRow) {
    return {};
  }

  const metrics = {};
  headerRow.forEach((header, columnIndex) => {
    const normalizedHeader = normalizeMetricKey(header);
    const resolvedKey = resolveMetricKey(normalizedHeader || header);
    if (!resolvedKey || metrics[resolvedKey] !== undefined) {
      if (shouldDebugPdf) {
        console.log("[NIRF][PDF] skipping header", header, "normalized", normalizedHeader, "resolved", resolvedKey);
      }
      return;
    }

    const cellValue = columnIndex < selectedRow.length ? selectedRow[columnIndex] : undefined;
    if (cellValue === null || cellValue === undefined) {
      return;
    }

    let numericValue = coerceNumber(cellValue, null);
    if (numericValue === null) {
      if (shouldDebugPdf) {
        console.log("[NIRF][PDF] non-numeric value", cellValue, "for", header);
      }
      return;
    }

    if (normalizedHeader === "median_salary_lpa") {
      numericValue *= 100000;
    }
    if (normalizedHeader === "pwd_facilities_score_out_of_15") {
      numericValue = Math.max(0, Math.min(15, numericValue));
    }

    metrics[resolvedKey] = numericValue;
    if (shouldDebugPdf) {
      console.log("[NIRF][PDF] mapped", header, "->", resolvedKey, "=", numericValue);
    }
  });

  return metrics;
};

const extractPlainTextFromPdf = async (buffer) => {
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

const extractTablesFromPdf = (resolvedPath) =>
  new Promise((resolve) => {
    if (!pdfTableExtractor) {
      resolve([]);
      return;
    }

    try {
      pdfTableExtractor(
        resolvedPath,
        (result) => {
          if (!result?.pageTables?.length) {
            resolve([]);
            return;
          }

          const tables = [];
          result.pageTables.forEach((page) => {
            page?.tables?.forEach((table) => {
              if (Array.isArray(table) && table.length) {
                tables.push(table);
              }
            });
          });
          resolve(tables);
        },
        () => resolve([])
      );
    } catch (error) {
      console.warn("Failed to extract PDF tables", error?.message || error);
      resolve([]);
    }
  });


const parseNirfPdf = async (filePath) => {
  const resolvedPath = path.resolve(filePath);
  const buffer = fs.readFileSync(resolvedPath);

  const [textContent, tables] = await Promise.all([
    extractPlainTextFromPdf(buffer),
    extractTablesFromPdf(resolvedPath)
  ]);

  const sanitizedTables = tables.map((table) =>
    Array.isArray(table)
      ? table.map((row) => (Array.isArray(row) ? row : [row]))
      : []
  );

  const textMetrics = extractMetricsFromPdfText(textContent);
  const tableMetrics = sanitizedTables.reduce((acc, table) => ({
    ...acc,
    ...deriveMetricsFromTable(table)
  }), {});

  let componentIndex = 0;
  const derivedComponents = sanitizedTables.flatMap((table) => {
    const components = deriveTabularComponentsFromRows(table, { startingIndex: componentIndex });
    componentIndex += components.length;
    return components;
  });

  const tabularComponents = deduplicateComponents(derivedComponents);
  const metrics = { ...textMetrics, ...tableMetrics };

  return { tabularComponents, metrics };
};

const parseNirfDataset = async (filePath) => {
  const extension = path.extname(filePath || "").toLowerCase();
  if (extension === ".pdf") {
    return parseNirfPdf(filePath);
  }
  return parseNirfWorkbook(filePath);
};

const normalizeMetricKey = (value) =>
  typeof value === "string"
    ? value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
    : typeof value === "number" && Number.isFinite(value)
      ? String(value)
      : "";

const METRIC_ALIASES = {
  studentStrengthScore: [
    "student_strength_score",
    "student_strength",
    "student_strength_percent",
    "student_strength_marks",
    "ss",
    "ss_score",
    "tlr_ss"
  ],
  studentStrengthActual: [
    "student_strength_actual",
    "student_strength_value",
    "student_strength_enrollment",
    "ss_actual",
    "student_strength"
  ],
  studentStrengthReference: ["student_strength_reference", "reference_strength", "ss_reference"],
  fsrRatio: ["faculty_student_ratio", "fsr_ratio", "fsr_actual_ratio"],
  fsrScore: ["fsr", "fsr_score", "fsr_marks"],
  facultyPhdPercent: ["faculty_phd_percent", "faculty_with_phd", "phd_percent", "faculty_with_phd"],
  facultyPhdScore: ["fqe", "fqe_score", "faculty_phd_score"],
  financialResourcesScore: [
    "financial_resources_score",
    "financial_resources",
    "financial_resources_percent",
    "financial_resources_in_cr_inr",
    "fru",
    "fru_score"
  ],
  publicationCount: ["publications", "publication_count", "p", "pu_count"],
  publicationScore: ["pu", "pu_score", "publications_score"],
  normalizedFaculty: ["nfr", "normalized_faculty", "faculty_normalized"],
  citationCount: ["citations", "citation_count", "cc"],
  citationScore: ["qp", "qp_score", "citations_score"],
  top25PercentPapers: ["top25_papers", "top_25_percent_papers", "top25percent_papers", "top_25_publications"],
  iprPatentsScore: ["ipr_patent_score", "ipr_patents", "ipr", "ipr_score", "patents_filed"],
  fundingAmount: ["funding", "project_funding", "fppp_funding", "research_funding", "research_funding_in_cr_inr"],
  consultancyAmount: ["consultancy", "consultancy_amount", "fppp_consultancy", "consultancy_in_cr_inr"],
  edpScore: ["edp", "entrepreneur_development", "edp_score", "fppp_edp"],
  fpppScore: ["fppp", "fppp_score"],
  placementPercent: ["placement_percent", "placement_%", "placement", "placement_percentage"],
  placementScore: ["gue", "gue_score", "gue_percent"],
  higherStudiesPercent: ["higher_studies_percent", "higher_studies_%", "higher_studies", "higher_studies_percentage"],
  higherStudiesScore: ["hs", "hs_score", "higher_studies_score"],
  medianSalary: ["median_salary", "median_ctc", "median_salary_ppp", "median_salary_lpa"],
  medianSalaryScore: ["ms", "median_salary_score"],
  gphdPerFaculty: ["gphd", "gphd_per_faculty", "phd_awarded_per_faculty", "phds_awarded_per_year"],
  gphdScore: ["gph", "gph_score"],
  womenPercent: ["women_percent", "women_%", "women_participation", "women_students"],
  womenScore: ["wd", "wd_score"],
  disadvantagedPercent: [
    "economically_challenged_percent",
    "esc_percent",
    "socially_challenged_percent",
    "economically_disadvantaged"
  ],
  disadvantagedScore: ["escs", "escs_score"],
  regionalDiversityScore: ["regional_diversity", "ner_jk_percent", "region_diversity", "rd", "rd_score", "ner_jk_students"],
  pwdFacilitiesScore: ["pwd_facilities", "pwd_score", "facilities_for_pwd", "pcs", "pcs_score", "pwd_facilities_score_out_of_15"],
  perceptionPeerScore: ["peer_score", "perception_peer", "peer_voting", "pr_peer"],
  perceptionEmployerScore: ["employer_score", "perception_employer", "employer_voting", "pr_employer"],
  perceptionOverallScore: ["pr", "pr_score", "perception_score", "peer_employer_perception_score", "peer_employer_perception_score_out_of_100"]
};

const resolveMetricKey = (rawKey) => {
  const normalized = normalizeMetricKey(rawKey);
  if (!normalized) return null;

  for (const [metricKey, synonyms] of Object.entries(METRIC_ALIASES)) {
    if (synonyms.includes(normalized)) {
      return metricKey;
    }
  }

  return null;
};

const extractMetricsFromRows = (rows) => {
  const metrics = {};

  rows.forEach((row) => {
    if (!row) return;
    const normalizedRow = Array.isArray(row) ? row : [row];
    if (!normalizedRow.length) return;

    for (let columnIndex = 0; columnIndex < normalizedRow.length; columnIndex += 1) {
      const keyCandidate = resolveMetricKey(normalizedRow[columnIndex]);
      if (!keyCandidate || metrics[keyCandidate] !== undefined) {
        continue;
      }

      const valueCell = normalizedRow.slice(columnIndex + 1).find((cell) =>
        typeof cell === "number" || (typeof cell === "string" && cell.trim().length)
      );

      if (valueCell === undefined || valueCell === null) {
        continue;
      }

      const numericValue = coerceNumber(valueCell);
      metrics[keyCandidate] = numericValue;
      break;
    }
  });

  return metrics;
};

const detectScoreScaleFactor = (components = []) => {
  const numericScores = components
    .map((component) => (Number.isFinite(component.score) ? Math.abs(component.score) : null))
    .filter((value) => value !== null && value !== undefined)
    .sort((a, b) => a - b);

  if (!numericScores.length) {
    return 1;
  }

  const median = numericScores[Math.floor(numericScores.length / 2)] || 0;

  if (median >= 10000) return 1000;
  if (median >= 1000) return 100;
  if (median >= 100) return 10;
  return 1;
};

const scaleComponentScores = (components = []) => {
  const scaleFactor = detectScoreScaleFactor(components);
  if (scaleFactor === 1) {
    return components;
  }
  return components.map((component) => ({
    ...component,
    score: Number(((component.score || 0) / scaleFactor).toFixed(2))
  }));
};

const normalizeComponentWeights = (components = []) => {
  if (!components.length) {
    return [];
  }

  const sanitized = components.map((component) => ({
    ...component,
    weight: component.weight > 0 ? component.weight : 1,
    score: Number.isFinite(component.score) ? component.score : 0
  }));

  const scaledComponents = scaleComponentScores(sanitized);

  const totalWeight = scaledComponents.reduce((sum, component) => sum + component.weight, 0) || scaledComponents.length;

  return scaledComponents.map((component) => ({
    ...component,
    weight: Number((component.weight / totalWeight).toFixed(4)),
    score: Number(component.score.toFixed(2))
  }));
};

const calculateCompositeScore = (components = []) => {
  if (!components.length) {
    return 0;
  }
  const weightedScore = components.reduce((sum, component) => sum + component.score * component.weight, 0);
  return Number(weightedScore.toFixed(2));
};

const clamp = (value, min, max) => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};

const percentToScore = (percent, maxScore) => {
  if (!Number.isFinite(percent)) return 0;
  return clamp((percent / 100) * maxScore, 0, maxScore);
};

const scoreFromPercentOrAbsolute = (value, maxScore) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (value <= maxScore) {
    return clamp(value, 0, maxScore);
  }

  return percentToScore(value, maxScore);
};

const computeTlrMarks = (metrics) => {
  const studentStrength = Number.isFinite(metrics.studentStrengthScore)
    ? clamp(metrics.studentStrengthScore, 0, 100)
    : (() => {
        if (Number.isFinite(metrics.studentStrengthActual) && Number.isFinite(metrics.studentStrengthReference) && metrics.studentStrengthReference > 0) {
          return clamp((metrics.studentStrengthActual / metrics.studentStrengthReference) * 100, 0, 100);
        }
        return 0;
      })();

  const fsrRatio = Number.isFinite(metrics.fsrRatio) ? metrics.fsrRatio : null;
  const fsrScore = Number.isFinite(metrics.fsrScore)
    ? scoreFromPercentOrAbsolute(metrics.fsrScore, 80)
    : fsrRatio && fsrRatio > 0
      ? clamp(80 * (15 / fsrRatio), 0, 80)
      : 0;

  const phdScore = Number.isFinite(metrics.facultyPhdScore)
    ? scoreFromPercentOrAbsolute(metrics.facultyPhdScore, 60)
    : percentToScore(metrics.facultyPhdPercent, 60);
  const financialResources = scoreFromPercentOrAbsolute(metrics.financialResourcesScore, 60);

  return studentStrength + fsrScore + phdScore + financialResources;
};

const computeRpcMarks = (metrics) => {
  const publications = Number.isFinite(metrics.publicationCount) ? metrics.publicationCount : null;
  const normalizedFaculty = Number.isFinite(metrics.normalizedFaculty) ? metrics.normalizedFaculty : null;
  const citationCount = Number.isFinite(metrics.citationCount) ? metrics.citationCount : null;
  const top25Papers = Number.isFinite(metrics.top25PercentPapers) ? metrics.top25PercentPapers : null;

  const pu = Number.isFinite(metrics.publicationScore)
    ? scoreFromPercentOrAbsolute(metrics.publicationScore, 35)
    : publications && normalizedFaculty && normalizedFaculty > 0
      ? clamp(35 * Math.sqrt(publications / normalizedFaculty), 0, 35)
      : 0;

  const qp = Number.isFinite(metrics.citationScore)
    ? scoreFromPercentOrAbsolute(metrics.citationScore, 35)
    : (() => {
        const qpCitations = citationCount && normalizedFaculty && normalizedFaculty > 0
          ? 20 * Math.sqrt(citationCount / normalizedFaculty)
          : 0;
        const qpTopPapers = top25Papers && publications && publications > 0
          ? 15 * (top25Papers / publications)
          : 0;
        return clamp(qpCitations + qpTopPapers, 0, 35);
      })();

  const ipr = percentToScore(metrics.iprPatentsScore, 15);

  const fppp = Number.isFinite(metrics.fpppScore)
    ? scoreFromPercentOrAbsolute(metrics.fpppScore, 15)
    : (() => {
        const fundingComponent = Number.isFinite(metrics.fundingAmount) && metrics.fundingAmount > 0
          ? clamp(5 * Math.sqrt(metrics.fundingAmount), 0, 5)
          : 0;
        const consultancyComponent = Number.isFinite(metrics.consultancyAmount) && metrics.consultancyAmount > 0
          ? clamp(5 * Math.sqrt(metrics.consultancyAmount), 0, 5)
          : 0;
        const edpComponent = percentToScore(metrics.edpScore, 5);
        return clamp(fundingComponent + consultancyComponent + edpComponent, 0, 15);
      })();

  const total = pu + qp + ipr + fppp; // out of 100
  return total * 3; // scale to 300 marks
};

const computeGoMarks = (metrics) => {
  const placement = Number.isFinite(metrics.placementScore)
    ? scoreFromPercentOrAbsolute(metrics.placementScore, 100)
    : percentToScore(metrics.placementPercent, 100);

  const higherStudies = Number.isFinite(metrics.higherStudiesScore)
    ? scoreFromPercentOrAbsolute(metrics.higherStudiesScore, 40)
    : percentToScore(metrics.higherStudiesPercent, 40);

  const medianSalary = Number.isFinite(metrics.medianSalaryScore)
    ? scoreFromPercentOrAbsolute(metrics.medianSalaryScore, 40)
    : Number.isFinite(metrics.medianSalary) && metrics.medianSalary > 0
      ? clamp((metrics.medianSalary / 30000) * 40, 0, 40)
      : 0;

  const gphd = Number.isFinite(metrics.gphdScore)
    ? scoreFromPercentOrAbsolute(metrics.gphdScore, 20)
    : percentToScore(metrics.gphdPerFaculty, 20);
  return placement + higherStudies + medianSalary + gphd;
};

const computeOiMarks = (metrics) => {
  const women = Number.isFinite(metrics.womenScore)
    ? scoreFromPercentOrAbsolute(metrics.womenScore, 30)
    : percentToScore(metrics.womenPercent, 30);
  const disadvantaged = Number.isFinite(metrics.disadvantagedScore)
    ? scoreFromPercentOrAbsolute(metrics.disadvantagedScore, 30)
    : percentToScore(metrics.disadvantagedPercent, 30);
  const regional = scoreFromPercentOrAbsolute(metrics.regionalDiversityScore, 25);
  const pwd = scoreFromPercentOrAbsolute(metrics.pwdFacilitiesScore, 15);
  return women + disadvantaged + regional + pwd;
};

const computePrMarks = (metrics) => {
  const direct = scoreFromPercentOrAbsolute(metrics.perceptionOverallScore, 100);
  if (direct > 0) {
    return direct;
  }
  const peer = percentToScore(metrics.perceptionPeerScore, 100);
  const employer = percentToScore(metrics.perceptionEmployerScore, 100);
  if (peer === 0 && employer === 0) {
    return 0;
  }
  const average = (peer + employer) / 2;
  return clamp(average, 0, 100);
};

const calculateNirfFromMetrics = (metrics = {}) => {
  if (!metrics || typeof metrics !== "object" || !Object.keys(metrics).length) {
    return null;
  }

  const tlr = computeTlrMarks(metrics);
  const rpc = computeRpcMarks(metrics);
  const go = computeGoMarks(metrics);
  const oi = computeOiMarks(metrics);
  const pr = computePrMarks(metrics);

  const hasSignal = tlr > 0 || rpc > 0 || go > 0 || oi > 0 || pr > 0;
  if (!hasSignal) {
    return null;
  }

  const components = [
    {
      key: "TLR",
      label: "Teaching, Learning & Resources",
      score: Number(((tlr / 300) * 100).toFixed(2)),
      weight: 0.3,
    },
    {
      key: "RPC",
      label: "Research & Professional Practice",
      score: Number(((rpc / 300) * 100).toFixed(2)),
      weight: 0.3,
    },
    {
      key: "GO",
      label: "Graduation Outcomes",
      score: Number(((go / 200) * 100).toFixed(2)),
      weight: 0.2,
    },
    {
      key: "OI",
      label: "Outreach & Inclusivity",
      score: Number(((oi / 100) * 100).toFixed(2)),
      weight: 0.1,
    },
    {
      key: "PR",
      label: "Perception",
      score: Number(((pr / 100) * 100).toFixed(2)),
      weight: 0.1,
    },
  ];

  const finalScore = components.reduce((sum, component) => sum + component.score * component.weight, 0);

  return {
    components,
    finalScore: Number(finalScore.toFixed(2)),
  };
};

const enqueueNirfScoring = async ({ prisma, runId, components, finalScoreOverride }) => {
  const jobId = uuid();
  const finalScore = Number.isFinite(finalScoreOverride)
    ? Number(finalScoreOverride.toFixed(2))
    : calculateCompositeScore(components);

  const updatedRun = await prisma.nirfRun.update({
    where: { id: runId },
    data: {
      status: "COMPLETED",
      finalScore,
      jobId
    },
    include: { components: true }
  });

  return {
    id: jobId,
    finalScore,
    run: updatedRun
  };
};

module.exports = {
  parseNirfDataset,
  normalizeComponentWeights,
  scaleComponentScores,
  calculateCompositeScore,
  calculateNirfFromMetrics,
  enqueueNirfScoring
};
