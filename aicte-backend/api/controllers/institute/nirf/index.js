const path = require("path");
const prisma = require("../../../utils/db");
const {
  parseNirfDataset,
  normalizeComponentWeights,
  calculateCompositeScore,
  calculateNirfFromMetrics,
  scaleComponentScores,
  enqueueNirfScoring
} = require("../../../services/nirf");

const sanitizeInstituteId = (req) => {
  return req?.authData?.institute_id || req?.body?.institute_id || req?.body?.instituteId || req?.query?.instituteId;
};

const transformComponentsForResponse = (components = []) =>
  components.map((component) => ({
    key: component.key,
    label: component.label,
    score: component.score,
    weight: component.weight
  }));

const uploadNirfWorkbook = async (req, res) => {
  const instituteId = sanitizeInstituteId(req);
  const academicYear = Number(req.body?.academicYear) || new Date().getFullYear();

  if (!instituteId) {
    return res.status(400).json({ success: false, message: "instituteId is required" });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: "NIRF dataset file is missing" });
  }

  let createdRunId;

  try {
    const { tabularComponents, metrics } = await parseNirfDataset(req.file.path);
    const calculated = calculateNirfFromMetrics(metrics);

    if (!tabularComponents.length && !calculated) {
      return res.status(400).json({ success: false, message: "No components detected in the uploaded workbook" });
    }

    const baseComponents = calculated?.components || normalizeComponentWeights(tabularComponents);
    const normalizedComponents = scaleComponentScores(baseComponents);
    const uploadKey = path.relative(path.resolve(__dirname, "../../../.."), req.file.path);
    const finalScoreOverride = calculated?.finalScore || calculateCompositeScore(normalizedComponents);

    const run = await prisma.nirfRun.create({
      data: {
        instituteId,
        academicYear,
        status: "PROCESSING",
        uploadKey,
        originalFileName: req.file.originalname,
        components: {
          create: normalizedComponents.map((component) => ({
            key: component.key,
            label: component.label,
            score: component.score,
            weight: component.weight
          }))
        }
      },
      include: { components: true }
    });

    createdRunId = run.id;

    const job = await enqueueNirfScoring({ prisma, runId: run.id, components: normalizedComponents, finalScoreOverride });

    return res.status(201).json({
      success: true,
      data: {
        id: job.run.id,
        jobId: job.id,
        status: job.run.status,
        academicYear: job.run.academicYear,
        finalScore: job.finalScore,
        components: transformComponentsForResponse(job.run.components)
      }
    });
  } catch (error) {
    console.error("NIRF upload processing failed", error);
    if (createdRunId) {
      await prisma.nirfRun
        .update({
          where: { id: createdRunId },
          data: { status: "FAILED", notes: error.message }
        })
        .catch(() => undefined);
    }
    return res.status(500).json({ success: false, message: error.message || "Unable to process NIRF workbook" });
  }
};

const getNirfHistory = async (req, res) => {
  const instituteId = sanitizeInstituteId(req);
  if (!instituteId) {
    return res.status(400).json({ success: false, message: "instituteId is required" });
  }

  const page = Math.max(Number(req.query?.page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(req.query?.pageSize) || 10, 1), 50);
  const skip = (page - 1) * pageSize;

  try {
    const [runs, total] = await Promise.all([
      prisma.nirfRun.findMany({
        where: { instituteId },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: { components: true }
      }),
      prisma.nirfRun.count({ where: { instituteId } })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        runs: runs.map((run) => ({
          id: run.id,
          finalScore: run.finalScore,
          status: run.status,
          createdAt: run.createdAt,
          academicYear: run.academicYear,
          components: transformComponentsForResponse(run.components)
        })),
        total
      }
    });
  } catch (error) {
    console.error("Failed to fetch NIRF history", error);
    return res.status(500).json({ success: false, message: "Unable to fetch NIRF run history" });
  }
};

module.exports = {
  uploadNirfWorkbook,
  getNirfHistory
};
