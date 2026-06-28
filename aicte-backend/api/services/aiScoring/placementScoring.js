const SCORE_WEIGHTS = {
  placement: 0.6,
  salary: 0.2,
  industry: 0.1,
  higherEducation: 0.1
};

const ratingBands = [
  { label: "Exemplary", min: 85, riskLevel: "Low" },
  { label: "Compliant", min: 70, riskLevel: "Medium" },
  { label: "Watch", min: 55, riskLevel: "Medium" },
  { label: "High Risk", min: 0, riskLevel: "High" }
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeGrowth = (growthPercent) => {
  if (!Number.isFinite(growthPercent)) return 0;
  const bounded = clamp(growthPercent, -25, 45);
  return clamp(((bounded + 25) / 70) * 100, 0, 100);
};

const derivePerformanceRating = (score) => {
  const band = ratingBands.find((item) => score >= item.min) || ratingBands[ratingBands.length - 1];
  return {
    rating: band.label,
    riskLevel: band.riskLevel
  };
};

const buildComplianceFlags = ({ latest, placementDelta, salaryGrowthPercent, internshipRatio }) => {
  const flags = [];

  if (latest.placementPercent < 40) {
    flags.push({
      id: "low_placement",
      title: "Placement coverage below 40%",
      severity: "critical",
      description: "Less than 40% of eligible students were placed in the latest cycle.",
      recommendedAction: "Activate bridge programs with Tier-I recruiters and publish a 90-day placement sprint."
    });
  }

  if (100 - latest.placementPercent > 45) {
    flags.push({
      id: "unemployment_pressure",
      title: "High unemployment backlog",
      severity: "critical",
      description: "Unplaced graduates exceed 45% which violates AICTE readiness norms.",
      recommendedAction: "Deploy alumni placement squads and submit fortnightly progress updates to the evaluator."
    });
  }

  if (!latest.industryMoUs || latest.industryMoUs < 4) {
    flags.push({
      id: "no_mou",
      title: "Insufficient industry MoUs",
      severity: "warning",
      description: "Less than four active industry collaborations were reported.",
      recommendedAction: "File at least two new MoUs with sector skill councils or MSME clusters within this AY."
    });
  }

  if (internshipRatio < 0.25) {
    flags.push({
      id: "internship_gap",
      title: "Internship coverage gap",
      severity: latest.placementPercent < 55 ? "critical" : "warning",
      description: "Internship exposure covers under 25% of eligible students.",
      recommendedAction: "Convert final-year projects to paid internships and register cohorts on AICTE Internship portal."
    });
  }

  if (salaryGrowthPercent < 8) {
    flags.push({
      id: "salary_stagnation",
      title: "Average salary stagnation",
      severity: "warning",
      description: "Salary CAGR is below 8%, signalling weak quality of offers.",
      recommendedAction: "Negotiate core job roles through COE partners and publish new recruiter mix."
    });
  }

  if (latest.corePlacementPercent < 50) {
    flags.push({
      id: "core_job_gap",
      title: "Low core job ratio",
      severity: "warning",
      description: "Core domain roles are below 50% of total placements.",
      recommendedAction: "Pair core faculty with Training & Placement Cell to curate competency drills for strategic recruiters."
    });
  }

  if (placementDelta < -5) {
    flags.push({
      id: "negative_trend",
      title: "Downward placement trend",
      severity: "warning",
      description: "Placement percentage has dropped for two consecutive years.",
      recommendedAction: "Submit a corrective action plan to AICTE within 15 days with milestones for arresting the decline."
    });
  }

  return flags;
};

const buildSuggestedActions = ({ latest, flags, salaryGrowthPercent, internshipRatio }) => {
  const actions = new Set();

  if (latest.placementPercent < 70) {
    actions.add("Launch an AI-assisted placement war room with weekly dashboards shared to the evaluator.");
  }

  if (salaryGrowthPercent < 12) {
    actions.add("Prioritise higher CTC recruiters via alumni councils and run negotiation workshops for final-year students.");
  }

  if (latest.industryMoUs < 8) {
    actions.add("Sign cross-sector MoUs (EV, semicon, defence) and log them on the AICTE MoU tracker.");
  }

  if (internshipRatio < 0.35) {
    actions.add("Transition skill labs into internship pods with outcome credits recorded on the skill passport.");
  }

  if (latest.higherEducationPercent < 18) {
    actions.add("Partner with GATE/National Fellowship cells to raise higher education progression above 18%.");
  }

  if (!actions.size) {
    actions.add("Continue quarterly reviews with AICTE evaluator and share success stories on the compliance portal.");
  }

  flags.forEach((flag) => actions.add(flag.recommendedAction));

  return Array.from(actions);
};

const calculatePlacementScore = (records = []) => {
  if (!records.length) {
    return {
      placementScore: 0,
      riskLevel: "High",
      performanceRating: "High Risk",
      remarks: "No placement records were found for this institution.",
      suggested_actions: ["Upload the last ten academic years of placement data for scoring."],
      breakdown: {
        placementPercent: 0,
        avgSalaryGrowth: 0,
        industryImmersion: 0,
        higherEducation: 0
      },
      complianceFlags: [],
      qualitySignals: {
        latestPlacementPercent: 0,
        avgSalaryLpa: 0,
        salaryGrowthPercent: 0,
        coreVsNonCore: { core: 0, nonCore: 0 }
      }
    };
  }

  const sorted = [...records].sort((a, b) => a.academicYear - b.academicYear);
  const latest = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2] || sorted[sorted.length - 1];
  const earliest = sorted[0];

  const placementComponent = clamp(latest.placementPercent, 0, 100);
  const salaryGrowthPercent = earliest.avgSalaryLpa > 0
    ? ((latest.avgSalaryLpa - earliest.avgSalaryLpa) / earliest.avgSalaryLpa) * 100
    : latest.avgSalaryLpa > 0
      ? 100
      : 0;
  const salaryComponent = normalizeGrowth(salaryGrowthPercent);

  const industryMoUScore = clamp((latest.industryMoUs / 22) * 100, 0, 100);
  const internshipRatio = latest.eligibleStudents ? latest.internshipsCount / latest.eligibleStudents : 0;
  const internshipScore = clamp(internshipRatio * 100, 0, 100);
  const industryComponent = clamp(industryMoUScore * 0.6 + internshipScore * 0.4, 0, 100);

  const higherEducationComponent = clamp(latest.higherEducationPercent, 0, 100);

  const finalScore =
    placementComponent * SCORE_WEIGHTS.placement +
    salaryComponent * SCORE_WEIGHTS.salary +
    industryComponent * SCORE_WEIGHTS.industry +
    higherEducationComponent * SCORE_WEIGHTS.higherEducation;

  const placementDelta = latest.placementPercent - previous.placementPercent;
  const complianceFlags = buildComplianceFlags({
    latest,
    placementDelta,
    salaryGrowthPercent,
    internshipRatio
  });

  const suggestedActions = buildSuggestedActions({
    latest,
    flags: complianceFlags,
    salaryGrowthPercent,
    internshipRatio
  });

  const { rating, riskLevel } = derivePerformanceRating(finalScore);

  const remarks =
    rating === "Exemplary"
      ? "Placement engine exceeds AICTE/NAAC benchmarks. Maintain quarterly disclosures."
      : rating === "Compliant"
        ? "Performance is compliant with NAAC emphasis. Track MoU expansion for the next audit."
        : rating === "Watch"
          ? "Performance is adequate but requires focussed mentoring on industry linkages."
          : "Immediate compliance action required; placement outcomes fall below mandated thresholds.";

  return {
    placementScore: Number(finalScore.toFixed(1)),
    riskLevel,
    performanceRating: rating,
    remarks,
    suggested_actions: suggestedActions,
    breakdown: {
      placementPercent: Number((placementComponent * SCORE_WEIGHTS.placement).toFixed(1)),
      avgSalaryGrowth: Number((salaryComponent * SCORE_WEIGHTS.salary).toFixed(1)),
      industryImmersion: Number((industryComponent * SCORE_WEIGHTS.industry).toFixed(1)),
      higherEducation: Number((higherEducationComponent * SCORE_WEIGHTS.higherEducation).toFixed(1))
    },
    complianceFlags,
    qualitySignals: {
      latestPlacementPercent: Number(placementComponent.toFixed(1)),
      avgSalaryLpa: Number((latest.avgSalaryLpa || 0).toFixed(1)),
      salaryGrowthPercent: Number(salaryGrowthPercent.toFixed(1)),
      coreVsNonCore: {
        core: Number((latest.corePlacementPercent || 0).toFixed(1)),
        nonCore: Number((100 - (latest.corePlacementPercent || 0)).toFixed(1))
      },
      industryMoUs: latest.industryMoUs,
      internshipCoveragePercent: Number((internshipRatio * 100).toFixed(1)),
      higherEducationPercent: Number(higherEducationComponent.toFixed(1))
    }
  };
};

const computeReadinessIndex = (score, complianceFlags) => {
  // Base score from placement score
  let readinessIndex = score;

  // Apply penalty for each compliance flag
  const criticalPenalty = 3;
  const warningPenalty = 1.5;

  complianceFlags.forEach((flag) => {
    if (flag.severity === "critical") {
      readinessIndex -= criticalPenalty;
    } else if (flag.severity === "warning") {
      readinessIndex -= warningPenalty;
    }
  });

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, Math.round(readinessIndex)));
};

const generateGapAnalysis = (latestRecord) => {
  const gaps = [];

  // Reuse existing thresholds from buildComplianceFlags logic
  if (latestRecord.placementPercent < 40) {
    gaps.push({
      metric: "Placement Coverage",
      currentValue: latestRecord.placementPercent.toFixed(1) + "%",
      threshold: "40%",
      gap: (40 - latestRecord.placementPercent).toFixed(1) + "%",
      issue: "Placement coverage below minimum threshold",
      recommendation: "Activate bridge programs with Tier-I recruiters and publish a 90-day placement sprint."
    });
  }

  if (100 - latestRecord.placementPercent > 45) {
    gaps.push({
      metric: "Unemployment Rate",
      currentValue: (100 - latestRecord.placementPercent).toFixed(1) + "%",
      threshold: "45%",
      gap: ((100 - latestRecord.placementPercent) - 45).toFixed(1) + "%",
      issue: "High unemployment backlog violates AICTE readiness norms",
      recommendation: "Deploy alumni placement squads and submit fortnightly progress updates to the evaluator."
    });
  }

  if (!latestRecord.industryMoUs || latestRecord.industryMoUs < 4) {
    gaps.push({
      metric: "Industry MoUs",
      currentValue: String(latestRecord.industryMoUs || 0),
      threshold: "4",
      gap: String(Math.max(0, 4 - (latestRecord.industryMoUs || 0))),
      issue: "Insufficient industry collaborations",
      recommendation: "File at least two new MoUs with sector skill councils or MSME clusters within this AY."
    });
  }

  const internshipRatio = latestRecord.eligibleStudents ? latestRecord.internshipsCount / latestRecord.eligibleStudents : 0;
  if (internshipRatio < 0.25) {
    gaps.push({
      metric: "Internship Coverage",
      currentValue: (internshipRatio * 100).toFixed(1) + "%",
      threshold: "25%",
      gap: ((0.25 - internshipRatio) * 100).toFixed(1) + "%",
      issue: "Internship exposure covers under 25% of eligible students",
      recommendation: "Convert final-year projects to paid internships and register cohorts on AICTE Internship portal."
    });
  }

  if (latestRecord.corePlacementPercent < 50) {
    gaps.push({
      metric: "Core Job Ratio",
      currentValue: latestRecord.corePlacementPercent.toFixed(1) + "%",
      threshold: "50%",
      gap: (50 - latestRecord.corePlacementPercent).toFixed(1) + "%",
      issue: "Core domain roles below 50% of total placements",
      recommendation: "Pair core faculty with Training & Placement Cell to curate competency drills for strategic recruiters."
    });
  }

  if (latestRecord.higherEducationPercent < 18) {
    gaps.push({
      metric: "Higher Education Progression",
      currentValue: latestRecord.higherEducationPercent.toFixed(1) + "%",
      threshold: "18%",
      gap: (18 - latestRecord.higherEducationPercent).toFixed(1) + "%",
      issue: "Higher education progression below recommended level",
      recommendation: "Partner with GATE/National Fellowship cells to raise higher education progression above 18%."
    });
  }

  return gaps;
};

const runComplianceEvaluation = (historyRecords) => {
  // Step 1: Calculate base placement score
  const scoring = calculatePlacementScore(historyRecords);

  // Step 2: Compute readiness index
  const readinessIndex = computeReadinessIndex(scoring.placementScore, scoring.complianceFlags);

  // Step 3: Get latest record for gap analysis
  const sortedRecords = [...historyRecords].sort((a, b) => a.academicYear - b.academicYear);
  const latestRecord = sortedRecords[sortedRecords.length - 1];

  // Step 4: Generate gap analysis
  const gapAnalysis = generateGapAnalysis(latestRecord);

  // Step 5: Return unified evaluation
  return {
    ...scoring,
    readinessIndex,
    gapAnalysis,
    evaluationTimestamp: new Date().toISOString()
  };
};

module.exports = {
  calculatePlacementScore,
  derivePerformanceRating,
  ratingBands,
  runComplianceEvaluation
};
