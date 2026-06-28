const express = require("express");

const InstitutionsRouter = express.Router();

const instituteNames = [
  "Aurora Institute of Technology",
  "Nalanda School of Engineering",
  "Himalayan Advanced Studies",
  "Saraswati Institute of Science",
  "Vivekananda Innovation College",
  "Lotus School of Management"
];

const cities = ["Pune", "Hyderabad", "Bengaluru", "Chandigarh", "Ahmedabad", "Kochi"];
const riskLevels = ["Low", "Moderate", "Elevated"];

const seededValue = (seed, min, max) => {
  const x = Math.sin(seed) * 10000;
  const normalized = x - Math.floor(x);
  return Math.round(min + normalized * (max - min));
};

const buildPerformancePayload = (institutionId) => {
  const numericSeed = institutionId
    .toString()
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 91);

  const summaryScore = seededValue(numericSeed, 74, 92);

  return {
    institutionId,
    generatedOn: new Date().toISOString(),
    summary: {
      name: instituteNames[numericSeed % instituteNames.length],
      city: cities[numericSeed % cities.length],
      affiliationTier: numericSeed % 2 === 0 ? "Tier 1" : "Tier 2",
      overallScore: summaryScore,
      riskLevel: riskLevels[numericSeed % riskLevels.length],
      complianceStatus: summaryScore > 85 ? "On Track" : summaryScore > 80 ? "Monitor" : "Needs Attention",
      evaluationWindow: "FY 2024-25",
      complianceDelta: summaryScore > 85 ? "+4 vs last audit" : "+1 vs last audit"
    },
    peerComparison: {
      percentile: seededValue(numericSeed + 11, 70, 95),
      betterThan: seededValue(numericSeed + 5, 60, 90),
      focusAreas: [
        "Faculty Research Output",
        "Digital Infrastructure",
        "Industry Partnerships"
      ]
    },
    keyMetrics: [
      {
        id: "compliance",
        label: "Compliance Score",
        value: seededValue(numericSeed + 7, 78, 95),
        change: 3.2,
        description: "Documentation accuracy vs last cycle"
      },
      {
        id: "infrastructure",
        label: "Infrastructure Readiness",
        value: seededValue(numericSeed + 13, 72, 94),
        change: 1.8,
        description: "Labs, safety and accessibility"
      },
      {
        id: "faculty",
        label: "Faculty Credentials",
        value: seededValue(numericSeed + 17, 68, 91),
        change: -0.6,
        description: "Renewals and workload balance"
      },
      {
        id: "digital",
        label: "Digital Readiness",
        value: seededValue(numericSeed + 23, 70, 96),
        change: 2.1,
        description: "LMS, MIS, and automation coverage"
      }
    ],
    documentInsights: [
      {
        section: "Infrastructure & Safety",
        readiness: seededValue(numericSeed + 31, 80, 98),
        blockers: ["Transport inspection photos", "Hostel evacuation drill log"],
        strengths: ["Fresh fire NOC", "Lab inventory digitized"],
        lastUpdated: "10 days ago"
      },
      {
        section: "Academic Governance",
        readiness: seededValue(numericSeed + 37, 72, 96),
        blockers: ["IQAC minutes for Q2"] ,
        strengths: ["Curriculum gap audit closed", "Board of Studies constituted"],
        lastUpdated: "6 days ago"
      },
      {
        section: "Financial Compliance",
        readiness: seededValue(numericSeed + 41, 68, 92),
        blockers: ["CSR utilization certificate"],
        strengths: ["Statutory audit complete"],
        lastUpdated: "14 days ago"
      }
    ],
    riskAlerts: [
      {
        title: "Faculty renewal letters pending",
        severity: numericSeed % 3 === 0 ? "high" : "medium",
        detail: "12 contracts expire within 30 days",
        action: "Upload renewal offer letters"
      },
      {
        title: "Environmental audit window closes soon",
        severity: "medium",
        detail: "State Pollution Control Board filing due in 5 days",
        action: "Share acknowledgement receipt"
      },
      {
        title: "Transport fitness certificates",
        severity: "low",
        detail: "2 vehicles awaiting RTO appointment",
        action: "Update inspection schedule"
      }
    ],
    actionItems: [
      {
        title: "Submit 2024 environmental compliance report",
        owner: "Campus Operations",
        dueInDays: 5,
        status: "Pending",
        impact: "Mandatory for renewal"
      },
      {
        title: "Upload revised faculty workload matrix",
        owner: "HR & Academics",
        dueInDays: 9,
        status: "In Progress",
        impact: "Needed for Tier-1 consideration"
      },
      {
        title: "Share updated industry MoUs",
        owner: "Innovation Cell",
        dueInDays: 14,
        status: "Scheduled",
        impact: "Strengthens employability indicators"
      }
    ],
    timeline: [
      { label: "Q1", score: seededValue(numericSeed + 2, 68, 88), status: "Stabilized" },
      { label: "Q2", score: seededValue(numericSeed + 4, 72, 90), status: "Improving" },
      { label: "Q3", score: seededValue(numericSeed + 6, 75, 93), status: "Peak" },
      { label: "Current", score: summaryScore, status: "Review" }
    ]
  };
};

InstitutionsRouter.get("/:institutionId/performance", (req, res) => {
  const { institutionId } = req.params;

  if (!institutionId) {
    return res.status(400).json({ success: false, message: "Institution ID is required" });
  }

  const payload = buildPerformancePayload(institutionId);
  res.json({ success: true, data: payload });
});

module.exports = InstitutionsRouter;
