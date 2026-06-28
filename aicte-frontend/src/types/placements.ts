export type PlacementSortField = "aiScore" | "placementPercent" | "averagePackage" | "higherEducationPercent";
export type SortDirection = "asc" | "desc";

export interface PlacementTrendPoint {
  year: number;
  value: number;
}

export interface IndustryDrilldown {
  industry: string;
  count: number;
  percentage: number;
  avgSalary: number;
}

export interface SalaryRangeDrilldown {
  range: string;
  count: number;
  percentage: number;
}

export interface ComponentDrilldown {
  placementMetrics: {
    summary: {
      score: number;
      trend: string;
    };
    details: {
      overall: number;
      core: number;
      nonCore: number;
      yearTrend: number[];
    };
    drillDown: {
      byCategory: {
        core: number;
        nonCore: number;
      };
      yearwise: Array<{
        year: number;
        core: number;
        nonCore: number;
        overall: number;
      }>;
    };
  };
  salaryMetrics: {
    summary: {
      average: number;
      trend: string;
    };
    details: {
      avgSalaryLpa: number;
      minSalary: number;
      maxSalary: number;
      yearTrend: number[];
    };
    drillDown: {
      byIndustry: IndustryDrilldown[];
      salaryDistribution: SalaryRangeDrilldown[];
      yearwise: Array<{
        year: number;
        avgSalary: number;
        minSalary: number;
        maxSalary: number;
      }>;
    };
  };
  industryEngagement: {
    summary: {
      mous: number;
      internships: number;
      trend: string;
    };
    details: {
      industryMoUs: number;
      internshipsCount: number;
      moUsPerYear: number;
      internshipCoveragePercent: number;
    };
    drillDown: {
      mouTrend: Array<{
        year: number;
        mous: number;
      }>;
      internshipTrend: Array<{
        year: number;
        internships: number;
      }>;
      topIndustries: Array<{
        industry: string;
        moUs: number;
      }>;
    };
  };
  higherEducation: {
    summary: {
      percentage: number;
      trend: string;
    };
    details: {
      higherEdPercent: number;
      studentsInHigherEd: number;
      yearTrend: number[];
    };
    drillDown: {
      yearwise: Array<{
        year: number;
        percentage: number;
        studentCount: number;
      }>;
      comparison: {
        placementVsHigherEd: Array<{
          year: number;
          placed: number;
          higherEd: number;
          unemployed: number;
        }>;
      };
    };
  };
}

export interface PlacementDashboardRow {
  collegeCode: string;
  collegeName: string;
  state: string;
  university?: string;
  lastAcademicYear: number;
  placementPercent: number;
  averagePackage: number;
  averagePackageTrend: PlacementTrendPoint[];
  placementTrend: PlacementTrendPoint[];
  industryMoUs: number;
  internshipsCount: number;
  higherEducationPercent: number;
  aiScore: number;
  riskLevel: string;
  performanceRating: string;
  scoreBreakdown: Record<string, number>;
  complianceFlags: PlacementFlag[];
  corePlacementPercent: number;
}

export interface PlacementMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PlacementFiltersResponse {
  states: string[];
  universities: string[];
  performanceRatings: string[];
}

export interface PlacementDashboardSummary {
  averageScore: number;
  lowRiskCount: number;
  flaggedInstitutions: number;
}

export interface PlacementDashboardResponse {
  items: PlacementDashboardRow[];
  meta: PlacementMeta;
  filters: PlacementFiltersResponse;
  summary: PlacementDashboardSummary;
}

export interface PlacementQueryParams {
  page: number;
  pageSize: number;
  sortBy: PlacementSortField;
  sortDir: SortDirection;
  state?: string;
  university?: string;
  rating?: string;
  search?: string;
}

export type PlacementFlagSeverity = "critical" | "warning" | "info";

export interface PlacementFlag {
  id: string;
  title: string;
  severity: PlacementFlagSeverity;
  description: string;
  recommendedAction: string;
}

export interface PlacementScorecard {
  placementScore: number;
  riskLevel: string;
  performanceRating: string;
  remarks: string;
  suggested_actions: string[];
  breakdown: Record<string, number>;
  complianceFlags: PlacementFlag[];
  qualitySignals: {
    latestPlacementPercent: number;
    avgSalaryLpa: number;
    salaryGrowthPercent: number;
    coreVsNonCore: { core: number; nonCore: number };
    industryMoUs: number;
    internshipCoveragePercent: number;
    higherEducationPercent: number;
  };
}

export interface PlacementReportDatasetRow {
  academicYear: number;
  eligibleStudents: number;
  studentsPlaced: number;
  placementPercent: number;
  avgSalaryLpa: number;
  corePlacementPercent: number;
  industryMoUs: number;
  internshipsCount: number;
  higherEducationPercent: number;
  complianceRemarks?: string | null;
}

export interface PlacementReportResponse {
  college: {
    code: string;
    name: string;
    state: string;
    university?: string;
    lastAcademicYear: number;
  };
  scorecard: PlacementScorecard;
  trends: {
    placement: PlacementTrendPoint[];
    avgSalary: PlacementTrendPoint[];
    coreVsNonCore: { name: string; value: number }[];
    industry: Array<{
      year: number;
      industryMoUs: number;
      internshipsCount: number;
      higherEducationPercent: number;
    }>;
  };
  complianceFlags: PlacementFlag[];
  dataset: PlacementReportDatasetRow[];
  componentDrilldown: ComponentDrilldown;
  reportPayload: {
    headline: string;
    aiScore: number;
    riskLevel: string;
    remarks: string;
    suggestedActions: string[];
  };
}

export interface PlacementUploadResponse {
  message: string;
  data: {
    collegesUpdated: number;
    rescored: Array<{ collegeCode: string; aiScore: number; riskLevel: string }>;
    warnings: Array<{ row: number; issues: string[] }>;
  };
}

export interface InstitutePlacementSummary {
  instituteId: string;
  collegeCode: string;
  collegeName: string;
  lastAcademicYear: number;
  placementPercent: number;
  avgSalaryLpa: number;
  aiScore: number;
  riskLevel: string;
  performanceRating: string;
  complianceFlags: PlacementFlag[];
  suggestedActions: string[];
  lastUpdatedAt: string;
  historyLength: number;
}
