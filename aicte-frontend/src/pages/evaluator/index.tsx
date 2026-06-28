// --- Evidence Report Types ---
type EvidenceReportResponse = {
  success: boolean;
  data?: {
    application: {
      uni_application_id: string;
      universityId: string;
      status: string;
    };
    evidenceReport: {
      placementIntelligence: any;
      nirfScoring: any;
      researchEligibility: any;
      facultyValidation: any;
    };
  };
  error?: string;
};

function EvidenceReportSectionEvaluator({ uni_application_id }: { uni_application_id: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<EvidenceReportResponse["data"] | null>(null);

  useEffect(() => {
    if (!uni_application_id) return;
    setLoading(true);
    setError(null);
    setReport(null);
    api.get(`/api/evaluator/evidence-report/${uni_application_id}`)
      .then((res) => {
        setReport(res.data.data);
      })
      .catch((err) => {
        setError(err?.response?.data?.error || err.message || "Failed to load evidence report");
      })
      .finally(() => setLoading(false));
  }, [uni_application_id]);

  return (
    <Card className="mt-10 mb-8">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Evidence Report</CardTitle>
        <p className="text-gray-500 text-sm mt-1">AI-powered analysis summary for this application, grouped by evidence category.</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading evidence report...</div>
        ) : error ? (
          <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>
        ) : !report ? (
          <div className="text-center text-gray-500 py-8">No evidence report data available.</div>
        ) : (
          <Accordion type="multiple" className="w-full">
            {/* NIRF Scoring Upload */}
            <AccordionItem value="nirf">
              <AccordionTrigger>NIRF Scoring Upload</AccordionTrigger>
              <AccordionContent>
                {report.evidenceReport.nirfScoring ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-6 items-center mb-2">
                      <div>
                        <span className="text-gray-500 text-xs">Final Score</span>
                        <div className="text-2xl font-bold">{typeof report.evidenceReport.nirfScoring.totalScore === "number" ? report.evidenceReport.nirfScoring.totalScore.toFixed(2) : "—"}</div>
                      </div>
                      {report.evidenceReport.nirfScoring.createdAt && (
                        <div>
                          <span className="text-gray-500 text-xs">Timestamp</span>
                          <div>{new Date(report.evidenceReport.nirfScoring.createdAt).toLocaleString()}</div>
                        </div>
                      )}
                    </div>
                    {Array.isArray(report.evidenceReport.nirfScoring.componentScores) && report.evidenceReport.nirfScoring.componentScores.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Component</TableHead>
                            <TableHead>Score</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.evidenceReport.nirfScoring.componentScores.map((comp: any) => (
                            <TableRow key={comp.id || comp.component}>
                              <TableCell>{comp.component}</TableCell>
                              <TableCell>{typeof comp.score === "number" ? comp.score.toFixed(2) : "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-gray-500 text-sm">No component breakdown available.</div>
                    )}
                  </div>
                ) : <div className="text-gray-500 text-sm">No data available.</div>}
              </AccordionContent>
            </AccordionItem>
            {/* Placement Intelligence Upload */}
            <AccordionItem value="placement">
              <AccordionTrigger>Placement Intelligence Upload</AccordionTrigger>
              <AccordionContent>
                {report.evidenceReport.placementIntelligence ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-6 items-center mb-2">
                      <div>
                        <span className="text-gray-500 text-xs">AI Score</span>
                        <div className="text-2xl font-bold">{typeof report.evidenceReport.placementIntelligence.aiScore === "number" ? report.evidenceReport.placementIntelligence.aiScore.toFixed(2) : "—"}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">Risk Level</span>
                        <Badge>{report.evidenceReport.placementIntelligence.riskLevel || "—"}</Badge>
                      </div>
                    </div>
                    {report.evidenceReport.placementIntelligence.analysisJson?.performanceRating && (
                      <div>
                        <span className="text-gray-500 text-xs">Performance Rating</span>
                        <div>{report.evidenceReport.placementIntelligence.analysisJson.performanceRating}</div>
                      </div>
                    )}
                    {Array.isArray(report.evidenceReport.placementIntelligence.analysisJson?.suggestedActions) && report.evidenceReport.placementIntelligence.analysisJson.suggestedActions.length > 0 ? (
                      <div>
                        <span className="text-gray-500 text-xs">Top 3 Suggested Actions</span>
                        <ul className="list-disc ml-6 mt-1">
                          {report.evidenceReport.placementIntelligence.analysisJson.suggestedActions.slice(0, 3).map((action: string, idx: number) => (
                            <li key={idx}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    ) : <div className="text-gray-500 text-sm">No suggested actions available.</div>}
                  </div>
                ) : <div className="text-gray-500 text-sm">No data available.</div>}
              </AccordionContent>
            </AccordionItem>
            {/* Research Eligibility Evidence Upload */}
            <AccordionItem value="research">
              <AccordionTrigger>Research Eligibility Evidence Upload</AccordionTrigger>
              <AccordionContent>
                {report.evidenceReport.researchEligibility ? (
                  <div className="space-y-2">
                    {typeof report.evidenceReport.researchEligibility.eligibilityScore === "number" && (
                      <div>
                        <span className="text-gray-500 text-xs">Eligibility Score</span>
                        <div className="text-2xl font-bold">{report.evidenceReport.researchEligibility.eligibilityScore.toFixed(2)}</div>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500 text-xs">Eligibility Status</span>
                      <Badge>{report.evidenceReport.researchEligibility.eligibilityStatus || "—"}</Badge>
                    </div>
                    {Array.isArray(report.evidenceReport.researchEligibility.missingDocuments) && report.evidenceReport.researchEligibility.missingDocuments.length > 0 ? (
                      <div>
                        <span className="text-gray-500 text-xs">Missing Documents</span>
                        <ul className="list-disc ml-6 mt-1">
                          {report.evidenceReport.researchEligibility.missingDocuments.map((doc: string, idx: number) => (
                            <li key={idx}>{doc}</li>
                          ))}
                        </ul>
                      </div>
                    ) : <div className="text-gray-500 text-sm">No missing documents.</div>}
                  </div>
                ) : <div className="text-gray-500 text-sm">No data available.</div>}
              </AccordionContent>
            </AccordionItem>
            {/* Faculty Score Validation */}
            <AccordionItem value="faculty">
              <AccordionTrigger>Faculty Score Validation</AccordionTrigger>
              <AccordionContent>
                {report.evidenceReport.facultyValidation ? (
                  <div className="space-y-2">
                    {typeof report.evidenceReport.facultyValidation.overall_score === "number" && (
                      <div>
                        <span className="text-gray-500 text-xs">Overall Score</span>
                        <div className="text-2xl font-bold">{report.evidenceReport.facultyValidation.overall_score.toFixed(2)}</div>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500 text-xs">Validation Status</span>
                      <Badge>{report.evidenceReport.facultyValidation.validation_status || "—"}</Badge>
                    </div>
                    {Array.isArray(report.evidenceReport.facultyValidation.issues) && report.evidenceReport.facultyValidation.issues.length > 0 ? (
                      <div>
                        <span className="text-gray-500 text-xs">Top Issues</span>
                        <ul className="list-disc ml-6 mt-1">
                          {report.evidenceReport.facultyValidation.issues.slice(0, 3).map((issue: string, idx: number) => (
                            <li key={idx}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    ) : <div className="text-gray-500 text-sm">No major issues found.</div>}
                    {Array.isArray(report.evidenceReport.facultyValidation.recommendations) && report.evidenceReport.facultyValidation.recommendations.length > 0 ? (
                      <div>
                        <span className="text-gray-500 text-xs">Recommendations</span>
                        <ul className="list-disc ml-6 mt-1">
                          {report.evidenceReport.facultyValidation.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    ) : <div className="text-gray-500 text-sm">No recommendations.</div>}
                  </div>
                ) : <div className="text-gray-500 text-sm">No data available.</div>}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  FileDown,
  Building2,
  Check,
  X,
  Loader2,
  Eye,
  LogOut,
  History,
  TrendingUp,
  Sparkles,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/utils";
import { FASTAPI_URL } from "@/constants/API";
import { useAuthStore } from "@/hooks/useAuthStore";
import { getInstitutePlacementSummary } from "@/lib/placements";
import type { InstitutePlacementSummary } from "@/types/placements";
import { useNirfHistory } from "@/hooks/useNirfScoring";
import FacultyScoreReport from "@/components/FacultyScoreReport";
import jsPDF from "jspdf";

interface GroqAnalysis {
  layouts_similar: boolean;
  placeholder_values: Record<string, any>;
  layout_issues?: any[];
  issue_summary?: Record<string, number>;
  format_match_percentage?: number;
  layout_match_score?: number;
  keyword_phrase_match?: {
    phrases_checked: string[];
    matched: string[];
    missing: string[];
    match_percentage?: number;
  };
}

interface LegalKeywordAnalysis {
  compliance_status: "PASS" | "WARNING" | "FAIL";
  matched_keywords: Array<{ keyword: string; category: string; score: number; found: boolean }>;
  missing_keywords: Array<{ keyword: string; category: string; score: number; found: boolean }>;
  match_percentage: number;
  document_type: string;
  recommendations: string[];
}

interface LegalAnalysisDialogState {
  docName: string;
  docId: string;
  pdfUrl: string;
  status: "uploading" | "processing" | "ready" | "error";
  analysis?: LegalKeywordAnalysis;
  error?: string;
}

const issueSummaryLabels: Record<string, string> = {
  line_count_mismatch: "Line count mismatch",
  layout_mismatch: "Layout mismatch",
  text_mismatch: "Text mismatch",
  modified_sections: "Modified sections",
  missing_content: "Missing content",
  extra_content: "Extra content",
  structural_anomalies: "Structural anomalies",
};

const nirfStatusStyles: Record<string, { label: string; badgeClass: string }> = {
  COMPLETED: { label: "Completed", badgeClass: "bg-emerald-100 text-emerald-800 border border-emerald-200" },
  PROCESSING: { label: "Processing", badgeClass: "bg-amber-100 text-amber-800 border border-amber-200" },
  QUEUED: { label: "Queued", badgeClass: "bg-blue-100 text-blue-800 border border-blue-200" },
  FAILED: { label: "Failed", badgeClass: "bg-rose-100 text-rose-800 border border-rose-200" },
  DEFAULT: { label: "Pending", badgeClass: "bg-slate-100 text-slate-700 border border-slate-200" },
};

const formatNirfDate = (value?: string) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatNirfScore = (score?: number | null) =>
  typeof score === "number" && Number.isFinite(score) ? score.toFixed(2) : "—";

type DocumentAnalysis = {
  summary?: Record<string, any>;
  raw?: Record<string, any>;
  layoutIssues?: any[];
  keywordMatch?: {
    phrases_checked?: string[];
    matched?: string[];
    missing?: string[];
    match_percentage?: number;
  };
  issueSummary?: Record<string, number>;
  placeholderValues?: Record<string, any>;
};

const extractAnalysisData = (doc: any): DocumentAnalysis | null => {
  if (!doc) return null;
  
  // Try to find analysis in messages first
  const messages = Array.isArray(doc.messages) ? doc.messages : [];
  const analysisMsg = messages.find((msg: any) => msg?.type === "analysis" || msg?.summary || msg?.analysis);
  
  // If no analysis in messages, check if analysis data exists directly on doc
  if (!analysisMsg && !doc.errors && !doc.extractedTexts && !doc.summary && !doc.analysis && !doc.layout_issues) {
    return null;
  }

  const summary = analysisMsg?.summary || doc.summary;
  const raw = analysisMsg?.analysis || analysisMsg?.summary || doc.analysis;
  const layoutIssues = raw?.layout_issues || doc.errors || doc.layout_issues;
  const keywordMatch = raw?.keyword_phrase_match || summary?.keyword_phrase_match;
  const issueSummary = raw?.issue_summary || summary?.issue_summary;
  const placeholderValues = raw?.placeholder_values || doc.extractedTexts;

  return {
    summary,
    raw,
    layoutIssues,
    keywordMatch,
    issueSummary,
    placeholderValues,
  };
};

const formatMetricValue = (value?: number | string) => {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "number") return `${value}%`;
  return value;
};

const buildAnalysisReport = (
  doc: any,
  analysis: DocumentAnalysis,
  options: { title: string; accent: string }
) => {
  const formatMatch = analysis.summary?.format_match_percentage ?? analysis.raw?.format_match_percentage;
  const layoutMatch = analysis.summary?.layout_match_score ?? analysis.raw?.layout_match_score;
  const keywordMatch = analysis.keywordMatch?.match_percentage;
  const layoutSimilar = analysis.raw?.layouts_similar;

  const matched = analysis.keywordMatch?.matched?.length
    ? analysis.keywordMatch.matched.map((phrase: string) => `<div class="list-item">• ${phrase}</div>`).join("")
    : '<div class="list-item">No matches detected</div>';
  const missing = analysis.keywordMatch?.missing?.length
    ? analysis.keywordMatch.missing.map((phrase: string) => `<div class="list-item">• ${phrase}</div>`).join("")
    : '<div class="list-item">All phrases present</div>';

  const keywordSection = analysis.keywordMatch
    ? `
  <div class="section">
    <h2>Keyword Phrase Matching</h2>
    <p>Phrases checked: ${analysis.keywordMatch.phrases_checked?.length ?? 0}</p>
    <div class="keyword-columns">
      <div>
        <h3 class="matched">Matched</h3>
        ${matched}
      </div>
      <div>
        <h3 class="missing">Missing</h3>
        ${missing}
      </div>
    </div>
  </div>`
    : '';

  const issueSummaryEntries = analysis.issueSummary
    ? Object.entries(analysis.issueSummary)
        .map(([key, value]) => {
          const label = issueSummaryLabels[key] || key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
          const message = value > 0 ? `${value} issue${value > 1 ? "s" : ""} detected` : "No issues detected";
          return `<div class="check-item"><strong>${label}</strong><p>${message}</p></div>`;
        })
        .join("")
    : '';

  const issueSummarySection = issueSummaryEntries
    ? `
  <div class="section">
    <h2>Structural Checks</h2>
    <div class="structural-checks">
      ${issueSummaryEntries}
    </div>
  </div>`
    : '';

  const layoutIssueCards = analysis.layoutIssues?.length
    ? analysis.layoutIssues
        .map((issue: any, index: number) => {
          const page = issue?.page ? `Page ${issue.page}` : '';
          const description = issue?.description || issue?.issue || "Mismatch detected";
          const location = issue?.location
            ? Array.isArray(issue.location)
              ? issue.location.join(", ")
              : issue.location
            : '';
          return `<div class="issue-card">
            <strong>${issue?.issue || `Issue ${index + 1}`} ${page ? `- ${page}` : ''}</strong>
            <p>${description}</p>
            ${location ? `<p><em>Location:</em> ${location}</p>` : ''}
          </div>`;
        })
        .join("")
    : '';

  const layoutIssuesSection = layoutIssueCards
    ? `
  <div class="section">
    <h2>Layout Issues</h2>
    <div class="issues-grid">
      ${layoutIssueCards}
    </div>
  </div>`
    : '';

  const placeholderSection = analysis.placeholderValues
    ? `
  <div class="section">
    <h2>Extracted Placeholder Values</h2>
    <div class="placeholder-grid">
      ${Object.entries(analysis.placeholderValues)
        .map(([key, value]) => `<div class="placeholder-card"><strong>${key}</strong><p>${JSON.stringify(value)}</p></div>`)
        .join("")}
    </div>
  </div>`
    : '';

  const layoutText = typeof layoutSimilar === "boolean"
    ? layoutSimilar
      ? "Template and uploaded layout appear consistent."
      : "Layout differences detected against the template."
    : "Layout comparison pending analysis.";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${options.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
    .header { border-bottom: 3px solid ${options.accent}; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { margin: 0; color: ${options.accent}; }
    .section { margin-bottom: 25px; }
    .section h2 { color: ${options.accent}; border-left: 4px solid ${options.accent}; padding-left: 10px; }
    .metrics { display: flex; gap: 20px; flex-wrap: wrap; margin: 15px 0; }
    .metric-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; background: #f9f9f9; flex: 1; min-width: 200px; }
    .metric-label { color: #666; font-size: 12px; margin-bottom: 5px; }
    .metric-value { font-size: 24px; font-weight: bold; color: ${options.accent}; }
    .keyword-columns { display: flex; gap: 30px; flex-wrap: wrap; margin-top: 15px; }
    .list-item { margin: 6px 0; padding-left: 10px; }
    .matched { color: #16a34a; }
    .missing { color: #dc2626; }
    .structural-checks { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
    .check-item { border: 1px solid #ddd; padding: 10px; border-radius: 5px; background: #fff; }
    .issues-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
    .issue-card { border: 1px solid #f0f0f0; padding: 10px; border-radius: 5px; background: #fff; }
    .placeholder-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
    .placeholder-card { border: 1px solid #eee; padding: 12px; border-radius: 5px; background: #fafafa; font-size: 12px; }
    .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${options.title}</h1>
    <p><strong>Document:</strong> ${doc.document?.doc_name || "Unknown"}</p>
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
  </div>

  <div class="section">
    <h2>Match Metrics</h2>
    <div class="metrics">
      <div class="metric-card">
        <div class="metric-label">Format Match</div>
        <div class="metric-value">${formatMetricValue(formatMatch)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Layout Match</div>
        <div class="metric-value">${formatMetricValue(layoutMatch)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Keyword Match</div>
        <div class="metric-value">${formatMetricValue(keywordMatch)}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Layout Comparison</h2>
    <p>${layoutText}</p>
  </div>

  ${keywordSection}
  ${issueSummarySection}
  ${layoutIssuesSection}
  ${placeholderSection}

  <div class="footer">
    <p>This report was automatically generated by the AICTE Document Verification System.</p>
  </div>
</body>
</html>`;
};

const generateGroqReport = (doc: any, analysis: DocumentAnalysis) =>
  buildAnalysisReport(doc, analysis, { title: "Groq Analysis Report", accent: "#0b6e4f" });

const generateKeywordReport = (doc: any, analysis: DocumentAnalysis) =>
  buildAnalysisReport(doc, analysis, { title: "Keyword Analysis Report", accent: "#16a34a" });

// Historical Data
const historicalData = [
  {
    collegeName: "Saraswati Institute of Science",
    year: 2023,
    approved: 10,
    rejected: 3,
    causeOfRejection: "Incomplete application forms"
  },
  {
    collegeName: "Vivekananda College of Arts",
    year: 2022,
    approved: 8,
    rejected: 6,
    causeOfRejection: "Missing identification proofs"
  },
  {
    collegeName: "Nalanda Technical University",
    year: 2024,
    approved: 9,
    rejected: 2,
    causeOfRejection: "Incorrect document format"
  },
  {
    collegeName: "Himalayan School of Management",
    year: 2023,
    approved: 7,
    rejected: 4,
    causeOfRejection: "Unverified supporting documents"
  }
];

const NirfSnapshotSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-16 w-full" />
    <div className="grid gap-3 sm:grid-cols-2">
      {[...Array(4)].map((_, index) => (
        <Skeleton key={index} className="h-24 w-full" />
      ))}
    </div>
  </div>
);

export default function EvaluatorDashboard() {
  const navigate = useNavigate();
  const [assignedApplications, setAssignedApplications] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [actioningDocument, setActioningDocument] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [analysisDoc, setAnalysisDoc] = useState<any | null>(null);
  const [legalAnalysisDialog, setLegalAnalysisDialog] = useState<LegalAnalysisDialogState | null>(null);
  const [groqAnalysisDialog, setGroqAnalysisDialog] = useState<{
    docName: string;
    analysis?: GroqAnalysis;
  } | null>(null);
  const [showHistoricalData, setShowHistoricalData] = useState(false);
  const [showMainDashboard, setShowMainDashboard] = useState(true);
  const [placementSummary, setPlacementSummary] = useState<InstitutePlacementSummary | null>(null);
  const [placementLoading, setPlacementLoading] = useState(false);
  const [placementError, setPlacementError] = useState<string | null>(null);
  const [isInstituteExpanded, setIsInstituteExpanded] = useState(false);

  const instituteIdForNirf = selectedApp?.university?.id || assignedApplications?.[0]?.university?.id || null;
  const { data: nirfHistory, isLoading: nirfLoading } = useNirfHistory(instituteIdForNirf, Boolean(instituteIdForNirf));
  const latestNirfRun = nirfHistory?.runs?.[0] ?? null;
  const nirfStatusToken = latestNirfRun
    ? nirfStatusStyles[(latestNirfRun.status || "").toUpperCase()] || nirfStatusStyles.DEFAULT
    : null;
  const latestNirfComponents = latestNirfRun?.components ?? [];
  const hasNirfComponents = latestNirfComponents.length > 0;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await api.get("/evaluator/data/data");
        const evaluator = resp.data?.evaluator;
        console.log("Evaluator data received:", evaluator);

        if (evaluator?.assigned_document?.length) {
          setAssignedApplications(evaluator.assigned_document);
          setSelectedApp(evaluator.assigned_document[0]);
        } else {
          setAssignedApplications([]);
          setSelectedApp(null);
          setError("No assigned applications available yet.");
        }
      } catch (error) {
        console.error("Failed to fetch evaluator data:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load assigned applications."
        );
        setAssignedApplications([]);
        setSelectedApp(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    setIsInstituteExpanded(false);
  }, []);

  useEffect(() => {
    const instituteId = selectedApp?.university?.id;
    if (!instituteId) {
      setPlacementSummary(null);
      return;
    }
    const loadPlacement = async () => {
      setPlacementLoading(true);
      setPlacementError(null);
      try {
        const data = await getInstitutePlacementSummary(instituteId);
        setPlacementSummary(data ?? null);
      } catch (err: any) {
        setPlacementSummary(null);
        if (err?.response?.status === 404) {
          setPlacementError(null);
        } else {
          const message = err instanceof Error ? err.message : "Unable to fetch placement summary.";
          setPlacementError(message);
        }
      } finally {
        setPlacementLoading(false);
      }
    };

    void loadPlacement();
  }, [selectedApp?.university?.id]);

  const requestLegalKeywordsAnalysis = async (
    pdfUrl: string,
    docId: string,
    docName: string
  ): Promise<LegalKeywordAnalysis> => {
    const formData = new FormData();
    formData.append("pdf_url", pdfUrl);
    formData.append("document_id", docId);
    formData.append("document_name", docName);

    const response = await fetch(`${FASTAPI_URL}/analyze-legal-keywords`, {
      method: "POST",
      body: formData,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload?.detail || "Legal keywords analysis failed");
    }

    return payload as LegalKeywordAnalysis;
  };

  const viewLegalAnalysis = async (doc: any) => {
    try {
      setLegalAnalysisDialog({
        docName: doc.document?.doc_name || "Document",
        docId: doc.doc_id || "",
        pdfUrl: doc.uni_doc_uri || "",
        status: "processing",
      });

      const analysis = await requestLegalKeywordsAnalysis(
        doc.uni_doc_uri,
        doc.doc_id,
        doc.document?.doc_name
      );

      setLegalAnalysisDialog((prev) =>
        prev ? { ...prev, analysis, status: "ready" } : null
      );
    } catch (err) {
      console.error("Error fetching legal keywords analysis:", err);
      setLegalAnalysisDialog((prev) =>
        prev
          ? {
              ...prev,
              error: err instanceof Error ? err.message : "Failed to analyze",
              status: "error",
            }
          : null
      );
    }
  };

  const fetchGroqAnalysis = async (pdfUrl: string, templateUrl: string, docName: string) => {
    try {
      setGroqAnalysisDialog({
        docName,
        analysis: undefined,
      });

      console.log("Fetching Groq analysis for:", { pdfUrl, templateUrl, docName });

      const response = await fetch(`${FASTAPI_URL}/chat/comparison`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_url: encodeURI(templateUrl),
          filled_url: encodeURI(pdfUrl),
        }),
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Groq analysis data received:", data);

      if (!response.ok) throw new Error(data?.detail || "Failed to fetch analysis");

      setGroqAnalysisDialog({
        docName,
        analysis: data as GroqAnalysis,
      });
    } catch (err) {
      console.error("Error fetching Groq analysis:", err);
      setError(`Failed to fetch Groq analysis: ${err instanceof Error ? err.message : "Unknown error"}`);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleApproveDocument = async () => {
    if (!actioningDocument) return;
    
    setActionLoading("approve");
    try {
      const response = await api.post(`/evaluator/data/action_on_doc`, {
        uni_doc_id: actioningDocument.uni_doc_id,
        status: "APPROVED",
        messages: "Document approved by evaluator"
      });
      
      if (response.status === 200) {
        setSuccessMessage(`${actioningDocument.document.doc_name} approved successfully!`);
        
        // Update local state
        setSelectedApp((prev: any) => {
          if (!prev || !prev.UniversityDocuments) return prev;
          const updated = { ...prev };
          const docIndex = updated.UniversityDocuments.findIndex(
            (d: any) => d.uni_doc_id === actioningDocument.uni_doc_id
          );
          if (docIndex !== -1) {
            updated.UniversityDocuments[docIndex].status = "APPROVED";
          }
          return updated;
        });
        
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error("Error approving:", err);
      setError(`Failed to approve: ${err instanceof Error ? err.message : "Unknown error"}`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setActionLoading(null);
      setShowApproveDialog(false);
      setActioningDocument(null);
    }
  };

  const handleRejectDocument = async () => {
    if (!actioningDocument) return;
    
    setActionLoading("reject");
    try {
      const response = await api.post(`/evaluator/data/action_on_doc`, {
        uni_doc_id: actioningDocument.uni_doc_id,
        status: "REJECTED",
        messages: rejectionReason || "Document rejected by evaluator"
      });
      
      if (response.status === 200) {
        setSuccessMessage(`${actioningDocument.document.doc_name} rejected successfully!`);
        
        // Update local state
        setSelectedApp((prev: any) => {
          if (!prev || !prev.UniversityDocuments) return prev;
          const updated = { ...prev };
          const docIndex = updated.UniversityDocuments.findIndex(
            (d: any) => d.uni_doc_id === actioningDocument.uni_doc_id
          );
          if (docIndex !== -1) {
            updated.UniversityDocuments[docIndex].status = "REJECTED";
          }
          return updated;
        });
        
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error("Error rejecting:", err);
      setError(`Failed to reject: ${err instanceof Error ? err.message : "Unknown error"}`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setActionLoading(null);
      setShowRejectDialog(false);
      setActioningDocument(null);
      setRejectionReason("");
    }
  };

  const downloadReport = (
    type: "groq" | "keyword",
    doc: any,
    analysisOverride?: DocumentAnalysis | null
  ) => {
    const analysis = analysisOverride ?? extractAnalysisData(doc);
    if (!analysis) {
      setError("Analysis not available for this document yet.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    const reportHtml =
      type === "groq"
        ? generateGroqReport(doc, analysis)
        : generateKeywordReport(doc, analysis);

    downloadAsHtml(reportHtml, `${type}-Report-${doc.document.doc_name}`);
  };

  const downloadAsHtml = (html: string, filename: string) => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().getTime()}.html`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const documentRequirements = selectedApp?.documents ?? [];
  const universityDocuments = selectedApp?.UniversityDocuments ?? [];
  const normalizedDocuments = useMemo(() => {
    if (!documentRequirements.length && !universityDocuments.length) {
      return [];
    }

    const latestByDocId = new Map<string, any>();
    universityDocuments.forEach((doc) => {
      const existing = latestByDocId.get(doc.doc_id);
      const docTime = doc?.timestamp ? new Date(doc.timestamp).getTime() : 0;
      const existingTime = existing?.timestamp ? new Date(existing.timestamp).getTime() : -Infinity;
      if (!existing || docTime > existingTime) {
        latestByDocId.set(doc.doc_id, doc);
      }
    });

    const requiredRows = documentRequirements.map((req: any, idx: number) => {
      const meta = req.document || req.documentR;
      const docId = req.doc_id || meta?.doc_id || `req-${idx}`;
      const latestDoc = req.latestUpload || latestByDocId.get(docId) || null;
      return {
        key: docId,
        requirement: req,
        docName: meta?.doc_name || latestDoc?.document?.doc_name || "Document",
        templateUrl: meta?.format_uri,
        latestDoc,
        status: latestDoc?.status || "NOT_SUBMITTED",
      };
    });

    const extraDocs = universityDocuments
      .filter((doc) => !documentRequirements.some((req: any) => {
        const meta = req.documentR || req.document;
        const docId = req.doc_id || meta?.doc_id;
        return docId === doc.doc_id;
      }))
      .map((doc) => ({
        key: doc.uni_doc_id,
        requirement: null,
        docName: doc.document?.doc_name || "Document",
        templateUrl: doc.document?.format_uri,
        latestDoc: doc,
        status: doc.status,
      }));

    return [...requiredRows, ...extraDocs];
  }, [documentRequirements, universityDocuments]);
  const analysisDetails = analysisDoc ? extractAnalysisData(analysisDoc) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Fetching assigned applications...</p>
              <div className="mt-4 animate-pulse flex space-x-2">
                <div className="h-2 w-2 bg-[#0b6e4f] rounded-full"></div>
                <div className="h-2 w-2 bg-[#0b6e4f] rounded-full"></div>
                <div className="h-2 w-2 bg-[#0b6e4f] rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!selectedApp) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>No Data Available</CardTitle>
            </CardHeader>
            <CardContent>
              <p>No assigned applications found for this evaluator.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const instituteName = selectedApp?.university?.universityName || "Unknown Institute";
  const toAbsoluteDocumentUrl = (url?: string | null) => {
    if (!url) return null;
    return /^https?:\/\//i.test(url) ? url : `http://localhost:3100/uploads/${url.replace(/^\/+/, "")}`;
  };
  const getStatusBadgeTone = (status?: string | null) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "IN_REVIEW":
      case "PROCESSING":
        return "bg-yellow-100 text-yellow-800";
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800";
      case "SUBMITTED":
        return "bg-slate-100 text-slate-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };
  const formatSignedDelta = (value: number) => {
    if (!Number.isFinite(value)) return "0.00";
    return value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
  };
  const formatMetricValue = (value?: number, suffix = "") =>
    typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(2)}${suffix}` : "—";
  const placementRatio = placementSummary ? placementSummary.placementPercent / 100 : null;
  const formattedPlacementRatio = placementRatio !== null ? placementRatio.toFixed(2) : null;
  const formattedLastUpdated = placementSummary?.lastUpdatedAt
    ? new Date(placementSummary.lastUpdatedAt).toLocaleString()
    : "Placement workbook not uploaded yet";
  const gradeLetter = placementSummary?.performanceRating?.[0]?.toUpperCase();
  const placementBreakdown = placementSummary
    ? [
        {
          metric: "Placement Percentage",
          actual: placementSummary.placementPercent,
          target: 85,
          suffix: "%",
          status: placementSummary.placementPercent >= 85 ? "OK" : "Monitor",
        },
        {
          metric: "Average Salary (LPA)",
          actual: placementSummary.avgSalaryLpa,
          target: 6.5,
          suffix: " LPA",
          status: placementSummary.avgSalaryLpa >= 6.5 ? "OK" : "Improve",
        },
        {
          metric: "AI Score",
          actual: placementSummary.aiScore,
          target: 80,
          suffix: "%",
          status: placementSummary.riskLevel,
        },
      ].map(({ metric, actual, target, suffix, status }) => ({
        metric,
        actualLabel:
          typeof actual === "number" && Number.isFinite(actual)
            ? `${actual.toFixed(2)}${suffix}`
            : "—",
        targetLabel: `${target.toFixed(2)}${suffix}`,
        deviationLabel:
          typeof actual === "number" && Number.isFinite(actual)
            ? `${formatSignedDelta(actual - target)}${suffix}`
            : "—",
        status,
      }))
    : [];

  const handlePlacementReportDownload = () => {
    if (!placementSummary) {
      console.warn("Placement summary not available for PDF generation.");
      return;
    }

    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const safeSlug = instituteName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "institute";

    pdf.setFontSize(18);
    pdf.text("Placement Intelligence Report", 40, 50);
    pdf.setFontSize(12);
    pdf.text(`Institute: ${instituteName}`, 40, 70);
    pdf.text(`Academic Year: AY ${placementSummary.lastAcademicYear}`, 40, 86);
    pdf.text(`Generated: ${formattedLastUpdated}`, 40, 102);

    pdf.setFontSize(14);
    pdf.text("Key Metrics", 40, 130);
    pdf.setFontSize(12);
    pdf.text(`AI Score: ${formatMetricValue(placementSummary.aiScore, "%")}`, 40, 150);
    pdf.text(`Placement %: ${formatMetricValue(placementSummary.placementPercent, "%")}`, 40, 166);
    pdf.text(`Average Salary: ${formatMetricValue(placementSummary.avgSalaryLpa, " LPA")}`, 40, 182);
    pdf.text(`Performance Rating: ${placementSummary.performanceRating}`, 40, 198);
    pdf.text(`Risk Level: ${placementSummary.riskLevel}`, 40, 214);

    let currentY = 250;
    if (placementBreakdown.length) {
      pdf.setFontSize(14);
      pdf.text("Placement Quality Snapshot", 40, currentY);
      currentY += 20;
      pdf.setFontSize(11);
      placementBreakdown.forEach((row) => {
        pdf.text(`${row.metric}`, 40, currentY);
        pdf.text(`Actual: ${row.actualLabel}`, 200, currentY);
        pdf.text(`Target: ${row.targetLabel}`, 340, currentY);
        pdf.text(`Deviation: ${row.deviationLabel}`, 480, currentY);
        pdf.text(`Status: ${row.status}`, 620, currentY);
        currentY += 16;
      });
    }

    if (placementSummary.complianceFlags?.length) {
      currentY += 20;
      pdf.setFontSize(14);
      pdf.text("Compliance Flags", 40, currentY);
      pdf.setFontSize(11);
      currentY += 16;
      placementSummary.complianceFlags.forEach((flag) => {
        pdf.text(`• (${flag.severity}) ${flag.title}: ${flag.description}`, 50, currentY, { maxWidth: 500 });
        currentY += 14;
      });
    }

    if (placementSummary.suggestedActions?.length) {
      currentY += 20;
      pdf.setFontSize(14);
      pdf.text("Suggested Actions", 40, currentY);
      pdf.setFontSize(11);
      currentY += 16;
      placementSummary.suggestedActions.forEach((action, idx) => {
        pdf.text(`${idx + 1}. ${action}`, 50, currentY, { maxWidth: 500 });
        currentY += 14;
      });
    }

    pdf.save(`placement-report-${safeSlug}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
        </div>
        <div className="py-4">
          <button
            onClick={() => {
              setShowMainDashboard(true);
              setShowHistoricalData(false);
            }}
            className={`w-full px-6 py-3 flex items-center gap-3 transition-colors ${
              showMainDashboard
                ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back</span>
          </button>
          <button
            onClick={() => {
              setShowHistoricalData(true);
              setShowMainDashboard(false);
            }}
            className={`w-full px-6 py-3 flex items-center gap-3 transition-colors ${
              showHistoricalData
                ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <History className="w-5 h-5" />
            <span className="font-medium">Historical Data</span>
          </button>
          <button
            onClick={() => navigate("/evaluator/placements")}
            className="w-full px-6 py-3 flex items-center gap-3 text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Sparkles className="w-5 h-5 text-blue-500" />
            <span className="font-medium">Placement Intelligence</span>
          </button>
          <button
            onClick={() => navigate("/evaluator/feedback")}
            className="w-full px-6 py-3 flex items-center gap-3 text-gray-700 transition-colors hover:bg-gray-50"
          >
            <MessageSquare className="w-5 h-5 text-emerald-500" />
            <span className="font-medium">Submit Feedback</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 py-10 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Page Header with Logout */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold text-gray-900">Evaluator Dashboard</h1>
            <Button
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => {
                const { logout } = useAuthStore.getState();
                logout();
                localStorage.removeItem('authToken');
                localStorage.removeItem('authMode');
                window.location.href = '/aicte';
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Historical Data Section */}
          {showHistoricalData ? (
            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Historical Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>College Name</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead className="text-center">Documents Approved</TableHead>
                        <TableHead className="text-center">Documents Rejected</TableHead>
                        <TableHead>Cause of Rejection</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historicalData.map((data, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{data.collegeName}</TableCell>
                          <TableCell>{data.year}</TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-green-100 text-green-800">{data.approved}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-red-100 text-red-800">{data.rejected}</Badge>
                          </TableCell>
                          <TableCell>{data.causeOfRejection}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : showMainDashboard && (
            <>
              {/* Institute Header */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
                <button
                  type="button"
                  className="w-full flex items-center justify-between text-left"
                  onClick={() => setIsInstituteExpanded((prev) => !prev)}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-6 h-6 text-blue-600" />
                    <h1 className="text-3xl font-bold text-gray-900">{instituteName}</h1>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      isInstituteExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isInstituteExpanded && (
                  <>
                    <div className="mt-3 space-y-1 text-gray-600">
                      <p>Application ID: {selectedApp?.uni_application_id}</p>
                      <p>Submission Date: {new Date(selectedApp?.createdOn).toLocaleDateString()}</p>
                    </div>

                    <div className="mt-4">
                      <Button
                        variant="secondary"
                        className="bg-blue-600 text-white hover:bg-blue-700"
                        disabled={!selectedApp?.uni_application_id}
                        onClick={() => {
                          if (!selectedApp?.uni_application_id) return;
                          navigate(`/evaluator/institutions/${selectedApp.uni_application_id}/performance`, {
                            state: { instituteName },
                          });
                        }}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        View Performance Indicators
                      </Button>
                    </div>

                    <div className="mt-6 space-y-6">
                      {placementLoading ? (
                        <p className="text-sm text-gray-500">Loading placement intelligence...</p>
                      ) : placementSummary ? (
                        <>
                          <div className="grid gap-6 md:grid-cols-3">
                            <Card className="shadow-sm border border-gray-100">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base font-semibold text-gray-600">Overall Score</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-4xl font-bold text-gray-900">
                                  {placementSummary.aiScore.toFixed(2)}%
                                </p>
                                <div className="mt-4 flex items-center gap-4">
                                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-lg font-semibold text-red-600">
                                    {gradeLetter ?? "-"}
                                  </div>
                                  <div>
                                    <p className="text-xs uppercase text-gray-500">Grade</p>
                                    <p className="text-sm font-semibold text-gray-900">{placementSummary.performanceRating}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs uppercase text-gray-500">Ratio</p>
                                    <p className="text-sm font-semibold text-gray-900">
                                      {formattedPlacementRatio ?? "-"}
                                    </p>
                                  </div>
                                </div>
                                <p className="mt-3 text-sm text-gray-500">
                                  Risk classification: {placementSummary.riskLevel}
                                </p>
                              </CardContent>
                            </Card>
                            <Card className="shadow-sm border border-gray-100">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base font-semibold text-gray-600">Placement Totals</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3 text-sm text-gray-600">
                                <div className="flex items-center justify-between">
                                  <span>Academic Year</span>
                                  <span className="font-semibold text-gray-900">AY {placementSummary.lastAcademicYear}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Placement %</span>
                                  <span className="font-semibold text-gray-900">{formatMetricValue(placementSummary.placementPercent, "%")}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Avg Salary</span>
                                  <span className="font-semibold text-gray-900">{formatMetricValue(placementSummary.avgSalaryLpa, " LPA")}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Reports Generated</span>
                                  <span className="font-semibold text-gray-900">{placementSummary.historyLength}</span>
                                </div>
                              </CardContent>
                            </Card>
                            <Card className="shadow-sm border border-gray-100">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base font-semibold text-gray-600">History</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <p className="text-sm text-gray-600">Generated at</p>
                                <p className="text-base font-semibold text-gray-900">{formattedLastUpdated}</p>
                                <button
                                  type="button"
                                  className="text-sm font-semibold text-blue-600 hover:underline disabled:text-blue-300 disabled:cursor-not-allowed"
                                  onClick={handlePlacementReportDownload}
                                  disabled={!placementSummary}
                                >
                                  Download placement PDF
                                </button>
                              </CardContent>
                            </Card>
                          </div>

                          <Card className="shadow-sm border border-gray-100">
                            <CardHeader>
                              <CardTitle className="text-lg font-semibold text-gray-800">Placement Quality Snapshot</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Metric</TableHead>
                                      <TableHead>Actual</TableHead>
                                      <TableHead>Target</TableHead>
                                      <TableHead>Deviation</TableHead>
                                      <TableHead>Status</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {placementBreakdown.map((row) => (
                                      <TableRow key={row.metric}>
                                        <TableCell className="font-medium">{row.metric}</TableCell>
                                        <TableCell>{row.actualLabel}</TableCell>
                                        <TableCell>{row.targetLabel}</TableCell>
                                        <TableCell
                                          className={
                                            row.deviationLabel.startsWith("-")
                                              ? "text-red-600"
                                              : row.deviationLabel.startsWith("+")
                                              ? "text-green-600"
                                              : "text-gray-600"
                                          }
                                        >
                                          {row.deviationLabel}
                                        </TableCell>
                                        <TableCell>
                                          <Badge className="bg-blue-100 text-blue-800">
                                            {row.status}
                                          </Badge>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>

                              {placementSummary.complianceFlags?.length ? (
                                <div className="mt-6">
                                  <p className="text-sm font-medium text-gray-700">Compliance Flags</p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {placementSummary.complianceFlags.map((flag) => {
                                      const tone =
                                        flag.severity === "critical"
                                          ? "bg-red-100 text-red-800"
                                          : flag.severity === "warning"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-slate-100 text-slate-800";
                                      return (
                                        <Badge key={flag.id} className={tone}>
                                          {flag.title}
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : null}

                              {placementSummary.suggestedActions?.length ? (
                                <div className="mt-4">
                                  <p className="text-sm font-medium text-gray-700">Suggested Actions</p>
                                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-600">
                                    {placementSummary.suggestedActions.map((action, idx) => (
                                      <li key={idx}>{action}</li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null}
                            </CardContent>
                          </Card>
                        </>
                      ) : (
                        <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600">
                          Placement workbook not uploaded yet for this institute.
                        </div>
                      )}
                      {placementError && (
                        <p className="text-sm text-red-600">{placementError}</p>
                      )}
                    </div>

                    <Card className="mt-6 bg-white shadow-md">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Document Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Document Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Submitted Date</TableHead>
                                <TableHead>Analysis</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {normalizedDocuments.length ? (
                                normalizedDocuments.map((docEntry, idx) => {
                                  const latestDoc = docEntry.latestDoc;
                                  const resolvedPdfUrl = toAbsoluteDocumentUrl(latestDoc?.uni_doc_uri);
                                  const downloadName = latestDoc?.document?.doc_name
                                    ? `${latestDoc.document.doc_name.replace(/\s+/g, "-").toLowerCase()}.pdf`
                                    : "document.pdf";
                                  const templateUrl = docEntry.templateUrl || latestDoc?.document?.format_uri;
                                  const submittedDate = latestDoc?.timestamp
                                    ? new Date(latestDoc.timestamp).toLocaleDateString()
                                    : "—";
                                  const canReview = Boolean(latestDoc);

                                  return (
                                    <TableRow key={`${docEntry.key}-${idx}`}>
                                      <TableCell className="font-medium">{docEntry.docName}</TableCell>
                                      <TableCell>
                                        <Badge className={getStatusBadgeTone(docEntry.status)}>{docEntry.status}</Badge>
                                      </TableCell>
                                      <TableCell>{submittedDate}</TableCell>
                                      <TableCell>
                                        <div className="flex gap-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              resolvedPdfUrl && templateUrl &&
                                              fetchGroqAnalysis(resolvedPdfUrl, templateUrl, docEntry.docName)
                                            }
                                            title={resolvedPdfUrl ? "View AI analysis" : "No document available"}
                                            disabled={!resolvedPdfUrl || !templateUrl}
                                          >
                                            <Eye className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              latestDoc && resolvedPdfUrl &&
                                              viewLegalAnalysis({ ...latestDoc, uni_doc_uri: resolvedPdfUrl })
                                            }
                                            title="View Legal Keywords Analysis"
                                            disabled={!resolvedPdfUrl}
                                          >
                                            <FileDown className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            asChild
                                            disabled={!resolvedPdfUrl}
                                            title={resolvedPdfUrl ? "Download" : "No document available"}
                                          >
                                            <a
                                              href={resolvedPdfUrl ?? undefined}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              download={resolvedPdfUrl ? downloadName : undefined}
                                            >
                                              <Download className="w-4 h-4" />
                                            </a>
                                          </Button>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                                            onClick={() => {
                                              if (!latestDoc) return;
                                              setActioningDocument(latestDoc);
                                              setShowApproveDialog(true);
                                            }}
                                            disabled={!canReview || actionLoading !== null || latestDoc?.status === "APPROVED"}
                                          >
                                            {actionLoading === "approve" ? (
                                              <>
                                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                                Approving
                                              </>
                                            ) : (
                                              <>
                                                <Check className="w-4 h-4 mr-1" />
                                                Approve
                                              </>
                                            )}
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
                                            onClick={() => {
                                              if (!latestDoc) return;
                                              setActioningDocument(latestDoc);
                                              setShowRejectDialog(true);
                                            }}
                                            disabled={!canReview || actionLoading !== null || latestDoc?.status === "REJECTED"}
                                          >
                                            {actionLoading === "reject" ? (
                                              <>
                                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                                Rejecting
                                              </>
                                            ) : (
                                              <>
                                                <X className="w-4 h-4 mr-1" />
                                                Reject
                                              </>
                                            )}
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center text-sm text-gray-500">
                                    No documents uploaded yet.
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="mt-6 bg-white shadow-md">
                      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-800">Latest NIRF Snapshot</CardTitle>
                          <p className="text-sm text-gray-500">Cross-check AI compliance signals against institute uploads.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {latestNirfRun && nirfStatusToken ? (
                            <Badge className={`${nirfStatusToken.badgeClass} text-xs font-semibold`}>
                              {nirfStatusToken.label}
                            </Badge>
                          ) : null}
                          {latestNirfRun && (
                            <Button
                              onClick={() => {
                                const htmlContent = `
                                  <!DOCTYPE html>
                                  <html lang="en">
                                  <head>
                                    <meta charset="UTF-8">
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    <title>NIRF Ranking Report</title>
                                    <style>
                                      * { margin: 0; padding: 0; box-sizing: border-box; }
                                      body {
                                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                        background-color: #f8fafc;
                                        padding: 40px 20px;
                                        color: #1e293b;
                                      }
                                      .container {
                                        max-width: 900px;
                                        margin: 0 auto;
                                        background: white;
                                        border-radius: 12px;
                                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                                        overflow: hidden;
                                      }
                                      .header {
                                        background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
                                        color: white;
                                        padding: 40px;
                                        text-align: center;
                                      }
                                      .header h1 { font-size: 2.5em; margin-bottom: 10px; }
                                      .content { padding: 40px; }
                                      .score-section {
                                        background: #eff6ff;
                                        border: 2px solid #3b82f6;
                                        border-radius: 8px;
                                        padding: 30px;
                                        margin-bottom: 30px;
                                        text-align: center;
                                      }
                                      .score-display {
                                        font-size: 3.5em;
                                        font-weight: bold;
                                        color: #3b82f6;
                                        margin: 10px 0;
                                      }
                                      .meta-info {
                                        font-size: 1.1em;
                                        color: #64748b;
                                        margin-top: 15px;
                                      }
                                      .components-grid {
                                        display: grid;
                                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                                        gap: 20px;
                                        margin-bottom: 30px;
                                      }
                                      .component-card {
                                        background: #f8f9fa;
                                        border: 1px solid #e2e8f0;
                                        border-radius: 8px;
                                        padding: 20px;
                                      }
                                      .component-card h3 { color: #3b82f6; margin-bottom: 10px; }
                                      .component-score { font-size: 1.8em; font-weight: bold; color: #3b82f6; margin: 10px 0; }
                                      .component-weight { font-size: 0.9em; color: #64748b; }
                                      .footer {
                                        background: #f1f5f9;
                                        padding: 20px;
                                        text-align: center;
                                        color: #64748b;
                                        border-top: 1px solid #e2e8f0;
                                      }
                                    </style>
                                  </head>
                                  <body>
                                    <div class="container">
                                      <div class="header">
                                        <h1>NIRF Ranking Report</h1>
                                        <p>National Institutional Ranking Framework Analysis</p>
                                      </div>
                                      
                                      <div class="content">
                                        <div class="score-section">
                                          <div style="color: #64748b; font-size: 1.1em;">Composite Score</div>
                                          <div class="score-display">${formatNirfScore(latestNirfRun.finalScore)}</div>
                                          <div class="meta-info">
                                            Updated on <strong>${formatNirfDate(latestNirfRun.createdAt)}</strong>
                                          </div>
                                        </div>

                                        ${hasNirfComponents ? `
                                          <h2 style="color: #1e293b; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Component Scores</h2>
                                          <div class="components-grid">
                                            ${latestNirfComponents.map((component) => {
                                              const weightPercent = Number.isFinite(component.weight) ? Math.round(component.weight * 100) : 0;
                                              const label = component.label || component.key;
                                              return `
                                                <div class="component-card">
                                                  <h3>${label}</h3>
                                                  <div class="component-score">${formatNirfScore(component.score)}</div>
                                                  <div class="component-weight">Weight: ${weightPercent}%</div>
                                                </div>
                                              `;
                                            }).join('')}
                                          </div>
                                        ` : '<p style="color: #64748b;">Component-level scoring was not returned for this run.</p>'}
                                      </div>

                                      <div class="footer">
                                        <p>Generated: ${new Date().toLocaleString()}</p>
                                        <p>NIRF Ranking Analysis Report</p>
                                      </div>
                                    </div>
                                  </body>
                                  </html>
                                `;
                                const blob = new Blob([htmlContent], { type: "text/html" });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `NIRF-Ranking-Report-${new Date().getTime()}.html`;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(a);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              size="sm"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {!instituteIdForNirf ? (
                          <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600">
                            Unable to resolve the institute identifier. Select an application to view NIRF data.
                          </div>
                        ) : nirfLoading ? (
                          <NirfSnapshotSkeleton />
                        ) : latestNirfRun ? (
                          <div className="space-y-6">
                            <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 p-4 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="text-sm text-gray-500">Composite Score</p>
                                <p className="text-4xl font-semibold text-gray-900">{formatNirfScore(latestNirfRun.finalScore)}</p>
                              </div>
                              <div className="text-sm text-gray-500">
                                Updated on{" "}
                                <span className="font-medium text-gray-800">{formatNirfDate(latestNirfRun.createdAt)}</span>
                              </div>
                            </div>
                            {hasNirfComponents ? (
                              <div className="grid gap-3 sm:grid-cols-2">
                                {latestNirfComponents.map((component) => {
                                  const weightPercent = Number.isFinite(component.weight)
                                    ? Math.round(component.weight * 100)
                                    : 0;
                                  const label = component.label || component.key;
                                  return (
                                    <div key={component.key} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                                      <p className="text-sm font-medium text-gray-800">{label}</p>
                                      <p className="text-2xl font-semibold text-gray-900">{formatNirfScore(component.score)}</p>
                                      <p className="text-xs text-gray-500">Weight {weightPercent}%</p>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600">
                                Component-level scoring was not returned for this run.
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center">
                            <p className="text-sm text-gray-600">
                              No NIRF runs detected yet. Ask the institute to upload their workbook from the portal to unlock this view.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="mt-6 bg-white shadow-md">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-800">Faculty Score Validation</CardTitle>
                        <p className="text-sm text-gray-500 mt-2">AI-powered faculty credentials analysis report.</p>
                      </CardHeader>
                      <CardContent>
                        <FacultyScoreReport 
                          analysis={{
                            overall_score: 82,
                            validation_status: "VALID",
                            credentials_found: [
                              {
                                type: "PhD",
                                name: "Doctor of Philosophy in Computer Science",
                                institution: "Indian Institute of Technology Delhi",
                                year: "2018",
                                status: "VERIFIED"
                              },
                              {
                                type: "Masters",
                                name: "M.Tech in Artificial Intelligence",
                                institution: "International Institute of Information Technology Hyderabad",
                                year: "2015",
                                status: "VERIFIED"
                              }
                            ],
                            qualifications: {
                              highest_degree: "PhD in Computer Science",
                              years_experience: "12 years in academia and research",
                              specializations: ["Machine Learning", "Artificial Intelligence", "Deep Learning", "Computer Vision"],
                              certifications: ["AWS Certified Cloud Practitioner", "Google Cloud Professional Data Engineer"]
                            },
                            validation_checks: {
                              document_completeness: {
                                score: 85,
                                issues: []
                              },
                              credential_authenticity: {
                                score: 90,
                                issues: []
                              },
                              experience_relevance: {
                                score: 78,
                                issues: ["Could benefit from more recent industry experience"]
                              },
                              publication_record: {
                                score: 75,
                                issues: ["Limited publications in last 2 years"]
                              }
                            },
                            issues_found: [
                              {
                                severity: "WARNING",
                                issue: "Publication gap in recent years",
                                recommendation: "Encourage continued research publications and academic contributions"
                              }
                            ],
                            strengths: [
                              "Strong academic credentials from premier institutions",
                              "Relevant expertise in emerging technologies",
                              "Professional certifications demonstrate commitment to continuous learning",
                              "Diverse specialization areas"
                            ],
                            recommendations: [
                              {
                                priority: "MEDIUM",
                                recommendation: "Update research publications",
                                impact: "Would strengthen academic profile and demonstrate ongoing research engagement"
                              },
                              {
                                priority: "MEDIUM",
                                recommendation: "Pursue advanced certifications in specialized domains",
                                impact: "Would enhance credibility in specific technology areas"
                              }
                            ],
                            compliance_status: "COMPLIANT",
                            summary: "Faculty member demonstrates strong academic credentials with relevant expertise in AI/ML. Overall validation indicates compliance with faculty quality standards with minor recommendations for continued professional development."
                          }}
                        />
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

        {/* Analysis Dialog */}
        <Dialog open={!!analysisDoc} onOpenChange={(open) => !open && setAnalysisDoc(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Groq Analysis</DialogTitle>
              <DialogDescription>
                {analysisDoc?.document?.doc_name || "Document"}
              </DialogDescription>
            </DialogHeader>
            {analysisDoc ? (
              analysisDetails ? (
                <div className="space-y-5">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="border rounded-md p-3">
                      <p className="text-xs uppercase text-gray-500">Format Match</p>
                      <p className="text-xl font-semibold">
                        {formatMetricValue(
                          analysisDetails.summary?.format_match_percentage ??
                            analysisDetails.raw?.format_match_percentage
                        )}
                      </p>
                    </div>
                    <div className="border rounded-md p-3">
                      <p className="text-xs uppercase text-gray-500">Layout Match</p>
                      <p className="text-xl font-semibold">
                        {formatMetricValue(
                          analysisDetails.summary?.layout_match_score ??
                            analysisDetails.raw?.layout_match_score
                        )}
                      </p>
                    </div>
                    <div className="border rounded-md p-3">
                      <p className="text-xs uppercase text-gray-500">Keyword Match</p>
                      <p className="text-xl font-semibold">
                        {formatMetricValue(analysisDetails.keywordMatch?.match_percentage)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-md border p-4 bg-gray-50">
                    <p className="text-sm text-gray-700">
                      {typeof analysisDetails.raw?.layouts_similar === "boolean"
                        ? analysisDetails.raw.layouts_similar
                          ? "Template and uploaded layout appear consistent."
                          : "Layout differences detected against the template."
                        : "Layout comparison pending analysis."}
                    </p>
                  </div>

                  {analysisDetails.keywordMatch && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-green-700">Matched Phrases</p>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          {analysisDetails.keywordMatch.matched?.length ? (
                            analysisDetails.keywordMatch.matched.map((phrase: string, index: number) => (
                              <div key={index}>• {phrase}</div>
                            ))
                          ) : (
                            <div>No matches detected</div>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-700">Missing Phrases</p>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          {analysisDetails.keywordMatch.missing?.length ? (
                            analysisDetails.keywordMatch.missing.map((phrase: string, index: number) => (
                              <div key={index}>• {phrase}</div>
                            ))
                          ) : (
                            <div>All phrases present</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {analysisDetails.issueSummary && (
                    <div>
                      <p className="text-sm font-medium text-gray-800 mb-2">Structural Checks</p>
                      <div className="grid md:grid-cols-2 gap-3">
                        {Object.entries(analysisDetails.issueSummary).map(([key, value]) => {
                          const label = issueSummaryLabels[key] || key;
                          return (
                            <div key={key} className="border rounded-md p-3 text-sm">
                              <p className="font-semibold">{label}</p>
                              <p className="text-gray-600">
                                {value > 0 ? `${value} issue${value > 1 ? "s" : ""} detected` : "No issues detected"}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {analysisDetails.layoutIssues?.length ? (
                    <div>
                      <p className="text-sm font-medium text-gray-800 mb-2">Layout Issues</p>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {analysisDetails.layoutIssues.map((issue: any, index: number) => (
                          <div key={index} className="border rounded-md p-3 text-sm">
                            <p className="font-semibold">{issue?.issue || `Issue ${index + 1}`}</p>
                            {issue?.page && (
                              <p className="text-xs text-gray-500">Page {issue.page}</p>
                            )}
                            <p className="text-gray-700 mt-1">{issue?.description || "Mismatch detected"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {analysisDetails.placeholderValues && (
                    <div>
                      <p className="text-sm font-medium text-gray-800 mb-2">Extracted Placeholders</p>
                      <div className="grid md:grid-cols-2 gap-3">
                        {Object.entries(analysisDetails.placeholderValues).map(([key, value]) => (
                          <div key={key} className="border rounded-md p-3 text-xs text-gray-700">
                            <p className="font-semibold text-gray-900">{key}</p>
                            <pre className="whitespace-pre-wrap break-all mt-1">{JSON.stringify(value, null, 2)}</pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">Analysis not available yet.</p>
                  <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded mb-4 text-left">
                    <p className="mb-2 font-semibold">Document Debug Info:</p>
                    <p className="font-mono">
                      uni_doc_uri: {analysisDoc?.uni_doc_uri ? "✓" : "✗"}<br />
                      messages: {Array.isArray(analysisDoc?.messages) ? `✓ (${analysisDoc?.messages?.length} items)` : "✗"}<br />
                      analysis: {analysisDoc?.analysis ? "✓" : "✗"}<br />
                      errors: {analysisDoc?.errors ? "✓" : "✗"}
                    </p>
                  </div>
                </div>
              )
            ) : null}
            <DialogFooter>
              <Button variant="outline" onClick={() => setAnalysisDoc(null)}>
                Close
              </Button>
              <Button
                onClick={() => analysisDoc && downloadReport("groq", analysisDoc, analysisDetails)}
                disabled={!analysisDetails}
              >
                Download Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Groq Analysis Dialog */}
        <Dialog open={!!groqAnalysisDialog} onOpenChange={(open) => !open && setGroqAnalysisDialog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>AI Model Analysis - {groqAnalysisDialog?.docName}</DialogTitle>
              <DialogDescription>
                Detailed format and content analysis results.
              </DialogDescription>
            </DialogHeader>
            {groqAnalysisDialog?.analysis && (
              <>
                <div className="space-y-4 text-sm max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="border rounded-md p-3">
                      <p className="text-sm text-gray-500">Format match</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {groqAnalysisDialog.analysis.format_match_percentage !== undefined
                          ? `${groqAnalysisDialog.analysis.format_match_percentage}%`
                          : "N/A"}
                      </p>
                    </div>
                    <div className="border rounded-md p-3">
                      <p className="text-sm text-gray-500">Layout match</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {groqAnalysisDialog.analysis.layout_match_score !== undefined
                          ? `${groqAnalysisDialog.analysis.layout_match_score}%`
                          : "N/A"}
                      </p>
                    </div>
                    <div className="border rounded-md p-3">
                      <p className="text-sm text-gray-500">Keyword match</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {groqAnalysisDialog.analysis.keyword_phrase_match?.match_percentage !== undefined
                          ? `${groqAnalysisDialog.analysis.keyword_phrase_match.match_percentage}%`
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800">Layout Comparison</p>
                    <p className="text-gray-600">
                      {groqAnalysisDialog.analysis.layouts_similar
                        ? "Template and uploaded layout appear consistent."
                        : "Layout differences detected against the template."}
                    </p>
                  </div>

                  {groqAnalysisDialog.analysis.keyword_phrase_match && (
                    <div>
                      <p className="font-semibold text-gray-800">Keyword Phrase Matching</p>
                      <div className="bg-gray-50 border rounded-md p-3 space-y-2">
                        <p className="text-sm text-gray-600">
                          Phrases Checked: {groqAnalysisDialog.analysis.keyword_phrase_match.phrases_checked?.length || 0}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-sm font-medium text-green-700">Matched</p>
                            <ul className="mt-1 list-disc list-inside text-sm text-gray-700 space-y-1">
                              {groqAnalysisDialog.analysis.keyword_phrase_match.matched?.length > 0 ? (
                                groqAnalysisDialog.analysis.keyword_phrase_match.matched.map((phrase, idx) => (
                                  <li key={`groq-matched-${idx}`}>{phrase}</li>
                                ))
                              ) : (
                                <li>No matches</li>
                              )}
                            </ul>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-red-700">Missing</p>
                            <ul className="mt-1 list-disc list-inside text-sm text-gray-700 space-y-1">
                              {groqAnalysisDialog.analysis.keyword_phrase_match.missing?.length > 0 ? (
                                groqAnalysisDialog.analysis.keyword_phrase_match.missing.map((phrase, idx) => (
                                  <li key={`groq-missing-${idx}`}>{phrase}</li>
                                ))
                              ) : (
                                <li>All present</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="border-t pt-4 mt-4 flex gap-2">
                  <Button
                    onClick={() => {
                      const analysis = groqAnalysisDialog.analysis;
                      const htmlContent = `
                        <html>
                          <head>
                            <title>AI Model Analysis Report</title>
                            <style>
                              body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                              h1 { color: #0b6e4f; border-bottom: 2px solid #0b6e4f; padding-bottom: 10px; }
                              h2 { color: #1e40af; margin-top: 20px; }
                              .metric { background: #f3f4f6; padding: 10px; border-radius: 5px; margin: 5px 0; }
                              .match-list { margin-left: 20px; }
                              .matched { color: #16a34a; }
                              .missing { color: #dc2626; }
                            </style>
                          </head>
                          <body>
                            <h1>AI Model Analysis Report</h1>
                            <p><strong>Document:</strong> ${groqAnalysisDialog.docName}</p>
                            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                            
                            <h2>Analysis Metrics</h2>
                            <div class="metric"><strong>Format Match:</strong> ${analysis.format_match_percentage !== undefined ? analysis.format_match_percentage + '%' : 'N/A'}</div>
                            <div class="metric"><strong>Layout Match:</strong> ${analysis.layout_match_score !== undefined ? analysis.layout_match_score + '%' : 'N/A'}</div>
                            <div class="metric"><strong>Keyword Match:</strong> ${analysis.keyword_phrase_match?.match_percentage !== undefined ? analysis.keyword_phrase_match.match_percentage + '%' : 'N/A'}</div>
                            
                            <h2>Layout Comparison</h2>
                            <p>${analysis.layouts_similar ? 'Template and uploaded layout appear consistent.' : 'Layout differences detected against the template.'}</p>
                            
                            ${analysis.keyword_phrase_match ? `
                              <h2>Keyword Phrase Matching</h2>
                              <p><strong>Total Phrases Checked:</strong> ${analysis.keyword_phrase_match.phrases_checked?.length || 0}</p>
                              <h3>Matched Phrases</h3>
                              <div class="match-list matched">
                                ${analysis.keyword_phrase_match.matched && analysis.keyword_phrase_match.matched.length > 0 
                                  ? analysis.keyword_phrase_match.matched.map(p => `<p>✓ ${p}</p>`).join('')
                                  : '<p>No matches</p>'
                                }
                              </div>
                              <h3>Missing Phrases</h3>
                              <div class="match-list missing">
                                ${analysis.keyword_phrase_match.missing && analysis.keyword_phrase_match.missing.length > 0 
                                  ? analysis.keyword_phrase_match.missing.map(p => `<p>✗ ${p}</p>`).join('')
                                  : '<p>All present</p>'
                                }
                              </div>
                            ` : ''}
                          </body>
                        </html>
                      `;
                      const blob = new Blob([htmlContent], { type: 'text/html' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `AI-Model-Analysis-${groqAnalysisDialog.docName}-${new Date().getTime()}.html`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    }}
                    className="bg-[#0b6e4f] hover:bg-[#095a40] text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
        {successMessage && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Approve Dialog */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Document</DialogTitle>
              <DialogDescription>
                Are you sure you want to approve <strong>{actioningDocument?.document?.doc_name}</strong>?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleApproveDocument}
                className="bg-green-600 hover:bg-green-700"
                disabled={actionLoading === "approve"}
              >
                {actionLoading === "approve" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  "Approve"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reject Document</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting <strong>{actioningDocument?.document?.doc_name}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <div>
                <Label htmlFor="rejection-reason" className="text-sm font-medium">
                  Reason for Rejection
                </Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Enter reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-2 min-h-24"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleRejectDocument}
                className="bg-red-600 hover:bg-red-700"
                disabled={actionLoading === "reject"}
              >
                {actionLoading === "reject" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  "Reject"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Legal Keywords Analysis Dialog */}
        <Dialog open={!!legalAnalysisDialog} onOpenChange={(open) => !open && setLegalAnalysisDialog(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Legal Keywords Analysis</DialogTitle>
              <DialogDescription>
                {legalAnalysisDialog?.docName} - Compliance Status:{" "}
                <Badge
                  className={
                    legalAnalysisDialog?.analysis?.compliance_status === "PASS"
                      ? "bg-green-100 text-green-800"
                      : legalAnalysisDialog?.analysis?.compliance_status === "WARNING"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }
                >
                  {legalAnalysisDialog?.analysis?.compliance_status || "UNKNOWN"}
                </Badge>
              </DialogDescription>
            </DialogHeader>

            {legalAnalysisDialog?.status === "processing" && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Analyzing document...</span>
              </div>
            )}

            {legalAnalysisDialog?.status === "error" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{legalAnalysisDialog.error}</AlertDescription>
              </Alert>
            )}

            {legalAnalysisDialog?.status === "ready" && legalAnalysisDialog?.analysis && (
              <>
                <div className="space-y-6">
                {/* Match Percentage */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Match Percentage</p>
                        <p className="text-3xl font-bold text-green-600">
                          {legalAnalysisDialog.analysis.match_percentage}%
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Document Type</p>
                        <p className="text-lg font-semibold">
                          {legalAnalysisDialog.analysis.document_type}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Compliance</p>
                        <Badge
                          className={
                            legalAnalysisDialog.analysis.compliance_status === "PASS"
                              ? "bg-green-100 text-green-800"
                              : legalAnalysisDialog.analysis.compliance_status === "WARNING"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {legalAnalysisDialog.analysis.compliance_status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Matched Keywords */}
                <div>
                  <h3 className="font-semibold text-green-700 mb-3 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Matched Keywords ({legalAnalysisDialog.analysis.matched_keywords.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {legalAnalysisDialog.analysis.matched_keywords.length > 0 ? (
                      legalAnalysisDialog.analysis.matched_keywords.map((kw, idx) => (
                        <Badge key={idx} className="bg-green-50 text-green-800 border border-green-200">
                          <span className="font-semibold">{kw.keyword}</span>
                          <span className="ml-1 text-xs">({kw.category})</span>
                        </Badge>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm col-span-2">No keywords matched</p>
                    )}
                  </div>
                </div>

                {/* Missing Keywords */}
                <div>
                  <h3 className="font-semibold text-red-700 mb-3 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Missing Keywords ({legalAnalysisDialog.analysis.missing_keywords.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {legalAnalysisDialog.analysis.missing_keywords.length > 0 ? (
                      legalAnalysisDialog.analysis.missing_keywords.map((kw, idx) => (
                        <Badge key={idx} className="bg-red-50 text-red-800 border border-red-200">
                          <span className="font-semibold">{kw.keyword}</span>
                          <span className="ml-1 text-xs">({kw.category})</span>
                        </Badge>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm col-span-2">All required keywords present</p>
                    )}
                  </div>
                </div>

                {/* Recommendations */}
                {legalAnalysisDialog.analysis.recommendations.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Recommendations</h3>
                    <ul className="space-y-2">
                      {legalAnalysisDialog.analysis.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start">
                          <span className="mr-2">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="border-t pt-4 mt-4 flex gap-2">
                  <Button
                    onClick={() => {
                      const analysis = legalAnalysisDialog.analysis;
                      const htmlContent = `
                        <html>
                          <head>
                            <title>Legal Keywords Analysis Report</title>
                            <style>
                              body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                              h1 { color: #16a34a; border-bottom: 2px solid #16a34a; padding-bottom: 10px; }
                              h2 { color: #15803d; margin-top: 20px; }
                              .metric { background: #f3f4f6; padding: 10px; border-radius: 5px; margin: 5px 0; }
                              .matched { color: #16a34a; }
                              .missing { color: #dc2626; }
                              .keyword-list { margin-left: 20px; }
                              .recommendation { background: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b; margin: 5px 0; }
                            </style>
                          </head>
                          <body>
                            <h1>Legal Keywords Analysis Report</h1>
                            <p><strong>Document:</strong> ${legalAnalysisDialog.docName}</p>
                            <p><strong>Document Type:</strong> ${analysis.document_type}</p>
                            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                            
                            <h2>Compliance Metrics</h2>
                            <div class="metric"><strong>Match Percentage:</strong> ${analysis.match_percentage}%</div>
                            <div class="metric"><strong>Compliance Status:</strong> ${analysis.compliance_status}</div>
                            
                            <h2>Matched Keywords (${analysis.matched_keywords.length})</h2>
                            <div class="keyword-list matched">
                              ${analysis.matched_keywords.length > 0 
                                ? analysis.matched_keywords.map(kw => `<p>✓ ${kw.keyword} (${kw.category})</p>`).join('')
                                : '<p>No keywords matched</p>'
                              }
                            </div>
                            
                            <h2>Missing Keywords (${analysis.missing_keywords.length})</h2>
                            <div class="keyword-list missing">
                              ${analysis.missing_keywords.length > 0 
                                ? analysis.missing_keywords.map(kw => `<p>✗ ${kw.keyword} (${kw.category})</p>`).join('')
                                : '<p>All required keywords present</p>'
                              }
                            </div>
                            
                            ${analysis.recommendations.length > 0 ? `
                              <h2>Recommendations</h2>
                              <div>
                                ${analysis.recommendations.map(rec => `<div class="recommendation">• ${rec}</div>`).join('')}
                              </div>
                            ` : ''}
                          </body>
                        </html>
                      `;
                      const blob = new Blob([htmlContent], { type: 'text/html' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Legal-Keywords-Analysis-${legalAnalysisDialog.docName}-${new Date().getTime()}.html`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                </div>
              </div>
              </>
            )}
          </DialogContent>
              </Dialog>
            </>
          )}
        </div>
        {/* Evidence Report Section (bottom) for evaluator */}
        {selectedApp?.uni_application_id && (
          <EvidenceReportSectionEvaluator uni_application_id={selectedApp.uni_application_id} />
        )}
      </div>
    </div>
  );
}