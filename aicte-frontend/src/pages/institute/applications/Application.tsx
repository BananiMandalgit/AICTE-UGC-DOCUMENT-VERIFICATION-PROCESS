"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDocumentGet } from "@/hooks/useApplication";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Eye, AlertCircle, Loader2, Download, FileText } from "lucide-react";
import { UniversityApplication } from "../../../schemas/applicationSchema";
import { SERVER_URL } from "@/constants/API";
import { api } from "@/lib/utils";
import { extractTextFromPdf } from "@/utils/pdfTextExtract";

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

// --- Evidence Report Types ---
type EvidenceReportResponse = {
  success: boolean;
  applicationInfo?: {
    uni_application_id: string;
    application_id: string;
    application_name: string;
    application_desc: string;
    createdOn: string;
    status: string;
    universityId: string;
    university?: {
      id: string;
      universityName: string;
      state: string;
      district: string;
    };
  };
  facultyScoreValidation?: any[];
  researchEligibilityEvidence?: any[];
  publicationCredibilityEvidence?: any[];
  placementIntelligence?: any;
  nirfScoring?: any;
  error?: string;
};

function EvidenceReportSectionInstitutionApp({ uni_application_id }: { uni_application_id: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<EvidenceReportResponse | null>(null);

  useEffect(() => {
    if (!uni_application_id) return;
    setLoading(true);
    setError(null);
    setReport(null);
    api
      .get(`/api/evaluator/evidence-report/${uni_application_id}`)
      .then((res) => {
        const normalizedReport: EvidenceReportResponse = {
          success: Boolean(res.data?.success ?? true),
          applicationInfo: res.data?.applicationInfo,
          facultyScoreValidation: res.data?.facultyScoreValidation ?? [],
          researchEligibilityEvidence: res.data?.researchEligibilityEvidence ?? [],
          publicationCredibilityEvidence: res.data?.publicationCredibilityEvidence ?? [],
          placementIntelligence: res.data?.placementIntelligence ?? null,
          nirfScoring: res.data?.nirfScoring ?? null,
        };
        setReport(normalizedReport);
      })
      .catch((err) => {
        setError(err?.message || "Failed to load evidence report");
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
          <div className="space-y-6">
            <Card className="border border-slate-200 bg-slate-50/60">
              <CardHeader>
                <CardTitle className="text-lg">Application Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><span className="font-semibold">Application ID:</span> {report.applicationInfo?.uni_application_id || "—"}</div>
                <div><span className="font-semibold">Name:</span> {report.applicationInfo?.application_name || "—"}</div>
                <div><span className="font-semibold">Status:</span> {report.applicationInfo?.status || "—"}</div>
                <div><span className="font-semibold">University:</span> {report.applicationInfo?.university?.universityName || "—"}</div>
                <div><span className="font-semibold">Location:</span> {report.applicationInfo?.university?.district || "—"}, {report.applicationInfo?.university?.state || "—"}</div>
              </CardContent>
            </Card>

            <Accordion type="multiple" className="w-full">
              <AccordionItem value="faculty">
                <AccordionTrigger>Faculty Score Validation</AccordionTrigger>
                <AccordionContent>
                  {Array.isArray(report.facultyScoreValidation) && report.facultyScoreValidation.length > 0 ? (
                    <div className="space-y-3">
                      {report.facultyScoreValidation.map((item: any, idx: number) => (
                        <Card key={idx} className="bg-gray-50">
                          <CardContent className="pt-6 space-y-2 text-sm">
                            <div><span className="font-semibold">Overall Score:</span> {typeof (item?.overall_score ?? item?.overallScore) === "number" ? Number(item.overall_score ?? item.overallScore).toFixed(2) : "—"}</div>
                            <div><span className="font-semibold">Validation Status:</span> {item?.validation_status || item?.validationStatus || "—"}</div>
                            <div><span className="font-semibold">Issues:</span> {Array.isArray(item?.issues) && item.issues.length > 0 ? item.issues.join(", ") : "None"}</div>
                            <div><span className="font-semibold">Recommendations:</span> {Array.isArray(item?.recommendations) && item.recommendations.length > 0 ? item.recommendations.join(", ") : "None"}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">No faculty validation data available.</div>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="research">
                <AccordionTrigger>Research Eligibility Evidence</AccordionTrigger>
                <AccordionContent>
                  {Array.isArray(report.researchEligibilityEvidence) && report.researchEligibilityEvidence.length > 0 ? (
                    <div className="space-y-4">
                      {report.researchEligibilityEvidence.map((evidence: any, idx: number) => (
                        <div key={idx} className="border rounded p-4 mb-4 bg-gray-50">
                          <div className="flex items-center gap-4 mb-2">
                            <span className="text-2xl font-bold text-blue-800">{evidence.eligibility_score ?? evidence.eligibilityScore ?? "—"}</span>
                            <Badge className={
                              (evidence.eligibility_status ?? evidence.eligibilityStatus) === "PASS"
                                ? "bg-green-100 text-green-800 border-green-300"
                                : (evidence.eligibility_status ?? evidence.eligibilityStatus) === "REVIEW"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                : "bg-red-100 text-red-800 border-red-300"
                            }>
                              {evidence.eligibility_status ?? evidence.eligibilityStatus ?? "—"}
                            </Badge>
                          </div>
                          <Accordion type="single" collapsible>
                            <AccordionItem value={`components-${idx}`}>
                              <AccordionTrigger>Show Components Breakdown</AccordionTrigger>
                              <AccordionContent>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Component</TableHead>
                                      <TableHead>Found</TableHead>
                                      <TableHead>Score</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {evidence.components && Object.entries(evidence.components).map(([key, val]: any) => (
                                      <TableRow key={key}>
                                        <TableCell className="capitalize">{key.replace(/_/g, ' ')}</TableCell>
                                        <TableCell>{val.found ? 'Yes' : 'No'}</TableCell>
                                        <TableCell>{val.score}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                          {Array.isArray(evidence.issues_found) && evidence.issues_found.length > 0 && (
                            <div className="mt-2">
                              <div className="font-semibold mb-1">Issues Found</div>
                              <ul className="list-disc ml-6">
                                {evidence.issues_found.map((issue: string, idx2: number) => (
                                  <li key={idx2}>{issue}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {Array.isArray(evidence.recommendations) && evidence.recommendations.length > 0 && (
                            <div className="mt-2">
                              <div className="font-semibold mb-1">Recommendations</div>
                              <ul className="list-disc ml-6">
                                {evidence.recommendations.map((rec: string, idx2: number) => (
                                  <li key={idx2}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">No research eligibility evidence available.</div>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="publication">
                <AccordionTrigger>Publication Credibility Evidence</AccordionTrigger>
                <AccordionContent>
                  {Array.isArray(report.publicationCredibilityEvidence) && report.publicationCredibilityEvidence.length > 0 ? (
                    <div className="space-y-3">
                      {report.publicationCredibilityEvidence.map((item: any, idx: number) => (
                        <Card key={idx} className="bg-gray-50">
                          <CardContent className="pt-6 space-y-2 text-sm">
                            <pre className="whitespace-pre-wrap break-words text-xs text-slate-700">{JSON.stringify(item, null, 2)}</pre>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">No publication credibility evidence available.</div>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="placement">
                <AccordionTrigger>Placement Intelligence</AccordionTrigger>
                <AccordionContent>
                  {report.placementIntelligence ? (
                    <div className="space-y-3 text-sm">
                      <div className="flex flex-wrap gap-6 items-center">
                        <div>
                          <span className="text-gray-500 text-xs">Placement Score</span>
                          <div className="text-2xl font-bold">{typeof report.placementIntelligence.placementScore === "number" ? report.placementIntelligence.placementScore.toFixed(2) : "—"}</div>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">Readiness Index</span>
                          <div className="text-2xl font-bold">{typeof report.placementIntelligence.readinessIndex === "number" ? report.placementIntelligence.readinessIndex.toFixed(0) : "—"}</div>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">Risk Level</span>
                          <Badge>{report.placementIntelligence.riskLevel || "—"}</Badge>
                        </div>
                      </div>
                      {report.placementIntelligence.performanceRating && (
                        <div><span className="font-semibold">Performance Rating:</span> {report.placementIntelligence.performanceRating}</div>
                      )}
                      {report.placementIntelligence.remarks && (
                        <div><span className="font-semibold">Remarks:</span> {report.placementIntelligence.remarks}</div>
                      )}
                      {report.placementIntelligence.breakdown && (
                        <div>
                          <span className="font-semibold">Breakdown:</span>
                          <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-white p-3 text-xs border">{JSON.stringify(report.placementIntelligence.breakdown, null, 2)}</pre>
                        </div>
                      )}
                      {Array.isArray(report.placementIntelligence.suggested_actions) && report.placementIntelligence.suggested_actions.length > 0 ? (
                        <div>
                          <span className="font-semibold">Suggested Actions:</span>
                          <ul className="list-disc ml-6 mt-1">
                            {report.placementIntelligence.suggested_actions.slice(0, 3).map((action: string, idx: number) => (
                              <li key={idx}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="text-gray-500 text-sm">No suggested actions available.</div>
                      )}
                    </div>
                  ) : <div className="text-gray-500 text-sm">No placement intelligence available.</div>}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="nirf">
                <AccordionTrigger>NIRF Scoring</AccordionTrigger>
                <AccordionContent>
                  {report.nirfScoring ? (
                    <div className="space-y-3 text-sm">
                      <div className="flex flex-wrap gap-6 items-center">
                        <div>
                          <span className="text-gray-500 text-xs">Final Score</span>
                          <div className="text-2xl font-bold">{typeof report.nirfScoring.finalScore === "number" ? report.nirfScoring.finalScore.toFixed(2) : "—"}</div>
                        </div>
                        {report.nirfScoring.academicYear && (
                          <div>
                            <span className="text-gray-500 text-xs">Academic Year</span>
                            <div>{report.nirfScoring.academicYear}</div>
                          </div>
                        )}
                        {report.nirfScoring.createdAt && (
                          <div>
                            <span className="text-gray-500 text-xs">Timestamp</span>
                            <div>{new Date(report.nirfScoring.createdAt).toLocaleString()}</div>
                          </div>
                        )}
                      </div>
                      {Array.isArray(report.nirfScoring.components) && report.nirfScoring.components.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Component</TableHead>
                              <TableHead>Label</TableHead>
                              <TableHead>Score</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {report.nirfScoring.components.map((comp: any) => (
                              <TableRow key={comp.id || comp.key}>
                                <TableCell>{comp.key}</TableCell>
                                <TableCell>{comp.label}</TableCell>
                                <TableCell>{typeof comp.score === "number" ? comp.score.toFixed(2) : "—"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-gray-500 text-sm">No component breakdown available.</div>
                      )}
                    </div>
                  ) : <div className="text-gray-500 text-sm">No NIRF scoring available.</div>}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Research Eligibility Panel Component with 8 fields
interface ResearchEligibilityPanelProps {
  instituteId: string;
  instituteName: string;
  isApproved?: boolean;
}

const ResearchEligibilityPanel: React.FC<ResearchEligibilityPanelProps> = ({ instituteId, instituteName, isApproved = false }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    approvalLetter: null as File | null,
    approvalNumber: "",
    validityStartDate: "",
    validityEndDate: "",
    appointmentLetters: null as File | null,
    phdSupervisorProof: null as File | null,
    studentBonafide: null as File | null,
    plagiarismReport: null as File | null,
  });
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchError, setResearchError] = useState<string | null>(null);
  const [researchData, setResearchData] = useState<any>(null);
  const [openResearchReport, setOpenResearchReport] = useState(false);

  const handleFileChange = (field: string, file: File | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: file,
    }));
  };

  const handleTextChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRunAndViewReport = async () => {
    try {
      setResearchLoading(true);
      setResearchError(null);

      const approvalFile = formData.approvalLetter;
      const appointmentFile = formData.appointmentLetters;
      const phdFile = formData.phdSupervisorProof;
      const studentFile = formData.studentBonafide;
      const plagiarismFile = formData.plagiarismReport;

      let score = 0;
      const checks: Array<{ name: string; status: string }> = [];
      const evidence = {
        approval_number: formData.approvalNumber,
        validity_start_date: formData.validityStartDate,
        validity_end_date: formData.validityEndDate,
        documents_submitted: [] as string[],
        documents_missing: [] as string[],
        documents_invalid: [] as string[],
        documents_mismatched: [] as string[],
      };

      const plagiarismBreakdown = {
        fileDetected: false,
        isPdf: false,
        textExtracted: false,
        contentMatched: false,
        similarityFound: false,
        similarityPercent: null as number | null,
        status: "NEEDS MANUAL REVIEW",
        detail: "",
        message: ""
      };

      // Helper functions
      const isPdfFile = (file?: File | null) => {
        if (!file) return false;
        if (file.type === "application/pdf") return true;
        return file.name?.toLowerCase().endsWith(".pdf");
      };

      const normalize = (value: string) =>
        value
          .toLowerCase()
          .replace(/[^a-z0-9%]+/g, " ")
          .trim();

      const containsAny = (text: string, keywords: string[]) =>
        keywords.some((kw) => text.includes(kw));

      const matchesDoc = (key: string, text: string, fileName: string) => {
        const t = normalize(text);
        const f = normalize(fileName);

        switch (key) {
          case "approvalLetter": {
            const hasApproval = containsAny(t, ["approval", "approval letter", "permission", "affiliation"]);
            const hasAuthority = containsAny(t, ["aicte", "ugc"]);
            const fileHint = containsAny(f, ["approval", "aicte", "ugc"]);
            return (hasApproval && hasAuthority) || (fileHint && hasAuthority);
          }
          case "appointmentLetters": {
            const hasAppointment = containsAny(t, ["appointment", "offer", "joining"]);
            const hasFaculty = containsAny(t, ["faculty", "designation", "department"]);
            const fileHint = containsAny(f, ["appointment", "offer", "joining", "faculty"]);
            return (hasAppointment && hasFaculty) || (fileHint && hasFaculty);
          }
          case "studentBonafide": {
            const hasBonafide = containsAny(t, ["bonafide", "bonafide certificate", "enrollment", "admission"]);
            const hasStudent = containsAny(t, ["student", "roll", "registration"]);
            const fileHint = containsAny(f, ["bonafide", "enrollment", "admission", "student"]);
            return (hasBonafide && hasStudent) || (fileHint && hasStudent);
          }
          case "phdSupervisorProof": {
            const hasPhd = containsAny(t, ["phd", "doctoral", "research"]);
            const hasSupervisor = containsAny(t, ["supervisor", "guide", "advisor", "recognition"]);
            const fileHint = containsAny(f, ["phd", "supervisor", "guide", "recognition"]);
            return (hasPhd && hasSupervisor) || (fileHint && hasSupervisor);
          }
          case "plagiarismReport": {
            const hasPlag = containsAny(t, ["plagiarism", "similarity", "match"]);
            const hasPercent = /\d+(\.\d+)?\s*%/.test(t);
            const fileHint = containsAny(f, ["plagiarism", "similarity", "turnitin"]);
            return (hasPlag && hasPercent) || (fileHint && hasPlag);
          }
          default:
            return false;
        }
      };

      const contentMatchPassed: Record<string, boolean> = {
        approvalLetter: false,
        appointmentLetters: false,
        studentBonafide: false,
        phdSupervisorProof: false,
        plagiarismReport: false,
      };

      const inputBreakdowns: Record<string, {
        label: string;
        fileDetected: boolean;
        isPdf: boolean;
        textExtracted: boolean;
        contentMatched: boolean;
        status: string;
        message?: string;
      }> = {};

      // Process each document
      const processDoc = async (key: string, file: File | null, label: string) => {
        inputBreakdowns[key] = {
          label,
          fileDetected: false,
          isPdf: false,
          textExtracted: false,
          contentMatched: false,
          status: "FAIL",
          message: ""
        };

        if (!file) {
          evidence.documents_missing.push(label);
          inputBreakdowns[key].status = "FAIL";
          inputBreakdowns[key].message = "File not uploaded.";
          checks.push({ name: `${label} Upload`, status: "FAILED" });
          return;
        }

        inputBreakdowns[key].fileDetected = true;
        evidence.documents_submitted.push(label);

        if (!isPdfFile(file)) {
          evidence.documents_invalid.push(label);
          inputBreakdowns[key].status = "NEEDS MANUAL REVIEW";
          inputBreakdowns[key].message = "Not a PDF file.";
          checks.push({ name: `${label} Format`, status: "FAILED" });
          return;
        }

        inputBreakdowns[key].isPdf = true;

        try {
          const text = await extractTextFromPdf(file);
          if (text.length < 50) {
            inputBreakdowns[key].status = "UNREADABLE";
            inputBreakdowns[key].message = "Text too short; needs manual review.";
            checks.push({ name: `${label} Content Match`, status: "NEEDS MANUAL REVIEW" });
          } else {
            inputBreakdowns[key].textExtracted = true;
            const matches = matchesDoc(key, text, file.name);
            if (matches) {
              inputBreakdowns[key].contentMatched = true;
              contentMatchPassed[key] = true;
              inputBreakdowns[key].status = "PASSED";
              inputBreakdowns[key].message = "Content matched successfully.";
              checks.push({ name: `${label} Content Match`, status: "PASSED" });
            } else {
              evidence.documents_mismatched.push(label);
              inputBreakdowns[key].status = "FAILED";
              inputBreakdowns[key].message = "Content did not match expected keywords.";
              checks.push({ name: `${label} Content Match`, status: "FAILED" });
            }
          }
        } catch (error: unknown) {
          checks.push({ name: `${label} Content Match`, status: "NEEDS MANUAL REVIEW" });
          inputBreakdowns[key].status = "NEEDS MANUAL REVIEW";
          inputBreakdowns[key].message = "Text extraction failed.";
        }
      };

      // Process all documents
      await processDoc("approvalLetter", approvalFile, "AICTE/UGC Approval Letter");
      await processDoc("appointmentLetters", appointmentFile, "Faculty Appointment Letters");
      await processDoc("phdSupervisorProof", phdFile, "PhD Supervisor Recognition Proof");
      await processDoc("studentBonafide", studentFile, "Student Bonafide/Enrollment Proof");

      // Plagiarism Report Validation (robust)
      if (!plagiarismFile) {
        plagiarismBreakdown.status = "FAIL";
        plagiarismBreakdown.detail = "FILE_NOT_UPLOADED";
        plagiarismBreakdown.message = "File not uploaded.";
        evidence.documents_missing.push("Plagiarism Report");
      } else {
        plagiarismBreakdown.fileDetected = true;
        evidence.documents_submitted.push("Plagiarism Report");
        if (!isPdfFile(plagiarismFile)) {
          plagiarismBreakdown.status = "NEEDS MANUAL REVIEW";
          plagiarismBreakdown.detail = "NOT_A_PDF";
          plagiarismBreakdown.message = "Uploaded file is not a PDF.";
          evidence.documents_invalid.push("Plagiarism Report");
        } else {
          plagiarismBreakdown.isPdf = true;
          try {
            const text = await extractTextFromPdf(plagiarismFile);
            if (text.length < 50) {
              plagiarismBreakdown.status = "UNREADABLE";
              plagiarismBreakdown.detail = "TEXT_TOO_SHORT";
              plagiarismBreakdown.message = "Text extraction too short; needs manual review.";
            } else {
              plagiarismBreakdown.textExtracted = true;
              const match = text.match(/(similarity|plagiarism|match).*?(\d+(\.\d+)?)\s*%/i);
              if (!match) {
                plagiarismBreakdown.status = "INCOMPLETE REPORT";
                plagiarismBreakdown.detail = "PERCENT_NOT_FOUND";
                plagiarismBreakdown.message = "Similarity percentage not found; needs manual review.";
              } else {
                plagiarismBreakdown.similarityFound = true;
                const percent = parseFloat(match[2]);
                plagiarismBreakdown.similarityPercent = percent;
                if (percent <= 15) {
                  plagiarismBreakdown.status = "PASS";
                  plagiarismBreakdown.detail = "SIMILARITY_OK";
                  plagiarismBreakdown.message = `Similarity ${percent}% (PASS)`;
                } else if (percent <= 25) {
                  plagiarismBreakdown.status = "WARNING";
                  plagiarismBreakdown.detail = "SIMILARITY_WARNING";
                  plagiarismBreakdown.message = `Similarity ${percent}% (WARNING)`;
                } else {
                  plagiarismBreakdown.status = "FAIL";
                  plagiarismBreakdown.detail = "SIMILARITY_HIGH";
                  plagiarismBreakdown.message = `Similarity ${percent}% (FAIL)`;
                }
              }
            }
          } catch (error) {
            plagiarismBreakdown.status = "NEEDS MANUAL REVIEW";
            plagiarismBreakdown.detail = "EXTRACTION_ERROR";
            plagiarismBreakdown.message = "Error extracting text; needs manual review.";
          }
        }
      }

      const requiredPdfsPresent = !!(approvalFile && appointmentFile);
      const allPdfTypesValid = (!approvalFile || isPdfFile(approvalFile)) && (!appointmentFile || isPdfFile(appointmentFile));
      const plagiarismUploaded = !!plagiarismFile;
      const facultyAppointmentUploaded = !!appointmentFile;

      checks.push({ name: "Required PDFs Present", status: requiredPdfsPresent ? "PASSED" : "FAILED" });
      checks.push({ name: "PDF Type Valid", status: allPdfTypesValid ? "PASSED" : "FAILED" });
      checks.push({
        name: "Plagiarism Report Uploaded",
        status: plagiarismUploaded && plagiarismBreakdown.status === "PASS" ? "PASSED" : "FAILED",
      });
      checks.push({
        name: "Faculty Appointment Letters",
        status: facultyAppointmentUploaded ? "PASSED" : "FAILED",
      });
      
      if (facultyAppointmentUploaded && contentMatchPassed.appointmentLetters) score += 15;

      // Lock plagiarism score strictly to similarity PASS
      contentMatchPassed.plagiarismReport = plagiarismBreakdown.status === "PASS";

      // Content-match weighted scoring
      if (contentMatchPassed.approvalLetter) score += 25;
      if (contentMatchPassed.studentBonafide) score += 10;
      if (contentMatchPassed.phdSupervisorProof) score += 10;
      if (contentMatchPassed.plagiarismReport) score += 10;

      if (score > 100) score = 100;
      let eligibilityStatus = "FAIL";
      if (score >= 70) eligibilityStatus = "PASS";
      else if (score >= 50) eligibilityStatus = "CONDITIONAL";

      const researchEligibilityJson = {
        eligibility_score: score,
        eligibility_status: eligibilityStatus,
        checks,
        evidence_summary: evidence,
        input_breakdowns: inputBreakdowns,
        plagiarism_breakdown: plagiarismBreakdown,
        generated_at: new Date().toISOString()
      };

      // Save to database (optional - can be implemented later)
      if (instituteId) {
        try {
          await fetch(`${SERVER_URL}/api/institute/research-eligibility/save`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ instituteId, researchEligibilityJson })
          });
        } catch (err) {
          console.error("Failed to save research eligibility:", err);
        }
      }

      setResearchData(researchEligibilityJson);
      toast({
        title: "Analysis Complete",
        description: `Research eligibility score: ${score}`,
      });
    } catch (e: any) {
      setResearchError(e.message || "Failed to compute analysis");
      setResearchData(null);
      toast({
        title: "Analysis Failed",
        description: e.message || "Failed to compute analysis",
        variant: "destructive",
      });
    } finally {
      setOpenResearchReport(true);
      setResearchLoading(false);
    }
  };

  return (
    <>
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#0b6e4f]" />
            Research Eligibility Evidence Upload
          </CardTitle>
          <CardDescription>
            Upload research eligibility documents for {instituteName || "your institute"}. All evidence will be analyzed for compliance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Approval Letter */}
            <div className="space-y-2">
              <Label htmlFor="approvalLetter" className="text-sm font-medium">AICTE/UGC Approval Letter (PDF)</Label>
              <Input 
                id="approvalLetter" 
                type="file" 
                accept=".pdf" 
                onChange={(e) => handleFileChange("approvalLetter", e.target.files?.[0] || null)} 
                className="cursor-pointer" 
              />
            </div>

            {/* Approval Number */}
            <div className="space-y-2">
              <Label htmlFor="approvalNumber" className="text-sm font-medium">Approval Number</Label>
              <Input 
                id="approvalNumber" 
                type="text" 
                placeholder="e.g., AICTE/2025/123456" 
                value={formData.approvalNumber} 
                onChange={(e) => handleTextChange("approvalNumber", e.target.value)} 
              />
            </div>

            {/* Validity Start Date */}
            <div className="space-y-2">
              <Label htmlFor="validityStartDate" className="text-sm font-medium">Validity Start Date</Label>
              <Input 
                id="validityStartDate" 
                type="date" 
                value={formData.validityStartDate} 
                onChange={(e) => handleTextChange("validityStartDate", e.target.value)} 
              />
            </div>

            {/* Validity End Date */}
            <div className="space-y-2">
              <Label htmlFor="validityEndDate" className="text-sm font-medium">Validity End Date</Label>
              <Input 
                id="validityEndDate" 
                type="date" 
                value={formData.validityEndDate} 
                onChange={(e) => handleTextChange("validityEndDate", e.target.value)} 
              />
            </div>

            {/* Faculty Appointment Letters */}
            <div className="space-y-2">
              <Label htmlFor="appointmentLetters" className="text-sm font-medium">Faculty Appointment Letters (PDF)</Label>
              <Input 
                id="appointmentLetters" 
                type="file" 
                accept=".pdf" 
                onChange={(e) => handleFileChange("appointmentLetters", e.target.files?.[0] || null)} 
                className="cursor-pointer" 
              />
            </div>

            {/* PhD Supervisor Recognition Proof */}
            <div className="space-y-2">
              <Label htmlFor="phdSupervisorProof" className="text-sm font-medium">PhD Supervisor Recognition Proof (PDF)</Label>
              <Input 
                id="phdSupervisorProof" 
                type="file" 
                accept=".pdf" 
                onChange={(e) => handleFileChange("phdSupervisorProof", e.target.files?.[0] || null)} 
                className="cursor-pointer" 
              />
            </div>

            {/* Student Bonafide/Enrollment Proof */}
            <div className="space-y-2">
              <Label htmlFor="studentBonafide" className="text-sm font-medium">Student Bonafide/Enrollment Proof (PDF)</Label>
              <Input 
                id="studentBonafide" 
                type="file" 
                accept=".pdf" 
                onChange={(e) => handleFileChange("studentBonafide", e.target.files?.[0] || null)} 
                className="cursor-pointer" 
              />
            </div>

            {/* Plagiarism Report */}
            <div className="space-y-2">
              <Label htmlFor="plagiarismReport" className="text-sm font-medium">Plagiarism Report (PDF)</Label>
              <Input 
                id="plagiarismReport" 
                type="file" 
                accept=".pdf" 
                onChange={(e) => handleFileChange("plagiarismReport", e.target.files?.[0] || null)} 
                className="cursor-pointer" 
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button 
              onClick={handleRunAndViewReport} 
              className="bg-[#2c3e50] text-white hover:bg-[#34495e]"
              disabled={researchLoading}
            >
              {researchLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "View Research Eligibility Report"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Research Eligibility Report Dialog */}
      <Dialog open={openResearchReport} onOpenChange={setOpenResearchReport}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Research Eligibility Evidence Report</DialogTitle>
          </DialogHeader>
          {researchData ? (
            <div className="space-y-6">
              {/* Evidence Summary Section */}
              <Card>
                <CardContent className="p-4">
                  <div className="font-semibold mb-2">Evidence Summary</div>
                  <div className="mb-1"><span className="font-bold">Approval Number:</span> {researchData.evidence_summary?.approval_number || '(none)'}</div>
                  <div className="mb-1"><span className="font-bold">Validity Period:</span> {researchData.evidence_summary?.validity_start_date ? `${researchData.evidence_summary.validity_start_date} — ${researchData.evidence_summary.validity_end_date}` : '(none)'}</div>
                  <div className="mb-1"><span className="font-bold">Documents Submitted:</span> {researchData.evidence_summary?.documents_submitted && researchData.evidence_summary.documents_submitted.length > 0 ? researchData.evidence_summary.documents_submitted.join(', ') : '(none)'}</div>
                  <div className="mb-1"><span className="font-bold">Documents Missing:</span> {researchData.evidence_summary?.documents_missing && researchData.evidence_summary.documents_missing.length > 0 ? researchData.evidence_summary.documents_missing.join(', ') : '(none)'}</div>
                  <div className="mb-1"><span className="font-bold">Documents Invalid (Non-PDF):</span> {researchData.evidence_summary?.documents_invalid && researchData.evidence_summary.documents_invalid.length > 0 ? researchData.evidence_summary.documents_invalid.join(', ') : '(none)'}</div>
                  <div className="mb-1"><span className="font-bold">Documents Mismatched (Content):</span> {researchData.evidence_summary?.documents_mismatched && researchData.evidence_summary.documents_mismatched.length > 0 ? researchData.evidence_summary.documents_mismatched.join(', ') : '(none)'}</div>
                  <div className="mb-1"><span className="font-bold">Generated at:</span> {researchData.generated_at ? new Date(researchData.generated_at).toLocaleString() : '(none)'}</div>
                </CardContent>
              </Card>
              
              {/* Score + Status Badge */}
              <Card>
                <CardContent className="p-4 flex items-center gap-6">
                  <div>
                    <div className="text-sm text-gray-500">Eligibility Score</div>
                    <div className="text-3xl font-bold">{researchData.eligibility_score}</div>
                  </div>
                  <div>
                    <Badge className={`border ${
                      researchData.eligibility_status === "PASS"
                        ? "bg-green-100 text-green-800 border-green-300"
                        : researchData.eligibility_status === "CONDITIONAL"
                        ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                        : "bg-red-100 text-red-800 border-red-300"
                    }`}>
                      {researchData.eligibility_status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              {/* Validation Checklist */}
              <Card>
                <CardContent className="p-4">
                  <div className="font-semibold mb-2">Validation Checklist</div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Check</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {researchData.checks.map((c: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell>{c.name}</TableCell>
                          <TableCell>
                            <span className={
                              c.status === "PASSED" || c.status === "PASS"
                                ? "text-green-700 font-semibold"
                                : ["WARNING", "CONDITIONAL", "UNREADABLE", "INCOMPLETE REPORT", "NEEDS MANUAL REVIEW"].includes(c.status)
                                ? "text-yellow-700 font-semibold"
                                : "text-red-700 font-semibold"
                            }>
                              {c.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              
              {/* Input Breakdowns */}
              {researchData.input_breakdowns && (
                <Card className="border border-gray-100">
                  <CardContent className="p-4">
                    <div className="font-semibold mb-2 text-gray-800">Input Breakdowns</div>
                    <div className="grid gap-3 md:grid-cols-3">
                      {Object.values(researchData.input_breakdowns).map((b: any, idx: number) => (
                        <details key={idx} className="rounded border border-gray-200 bg-white border-l-4 border-blue-100">
                          <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-gray-800 flex items-center justify-between hover:bg-gray-50">
                            <span>{b.label}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${b.status === "PASSED" ? "bg-emerald-50 text-emerald-700" : b.status === "FAILED" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>
                              {b.status}
                            </span>
                          </summary>
                          <div className="px-4 py-2 text-sm text-gray-700">
                            <ul className="list-disc pl-5 space-y-1">
                              <li>File detected: {b.fileDetected ? "Yes" : "No"}</li>
                              <li>PDF valid: {b.isPdf ? "Yes" : "No"}</li>
                              <li>Text extracted: {b.textExtracted ? "Yes" : "No"}</li>
                              <li>Content matched: {b.contentMatched ? "Yes" : "No"}</li>
                              <li>Status: {b.status}</li>
                              <li>Message: {b.message}</li>
                            </ul>
                          </div>
                        </details>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-start">
                <Button
                  variant="outline"
                  onClick={() => {
                    const reportHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Research Eligibility Evidence Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
    h1 { color: #1f2937; }
    h2 { margin-top: 24px; color: #111827; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #e5e7eb; padding: 6px; text-align: left; }
  </style>
</head>
<body>
  <h1>Research Eligibility Evidence Report</h1>
  <p><strong>Score:</strong> ${researchData.eligibility_score}</p>
  <p><strong>Status:</strong> ${researchData.eligibility_status}</p>

  <h2>Validation Checklist</h2>
  <table>
    <thead><tr><th>Check</th><th>Status</th></tr></thead>
    <tbody>
      ${researchData.checks.map((c: any) => `<tr><td>${c.name}</td><td>${c.status}</td></tr>`).join('')}
    </tbody>
  </table>

  <h2>Evidence Summary</h2>
  <p><strong>Approval Number:</strong> ${researchData.evidence_summary.approval_number || '(none)'}</p>
  <p><strong>Validity Period:</strong> ${researchData.evidence_summary.validity_start_date ? `${researchData.evidence_summary.validity_start_date} — ${researchData.evidence_summary.validity_end_date}` : '(none)'}</p>
  <p><strong>Documents Submitted:</strong> ${researchData.evidence_summary.documents_submitted.join(', ') || '(none)'}</p>
  <p><strong>Documents Missing:</strong> ${researchData.evidence_summary.documents_missing.join(', ') || '(none)'}</p>
  <p><strong>Documents Invalid:</strong> ${researchData.evidence_summary.documents_invalid?.join(', ') || '(none)'}</p>
  <p><strong>Documents Mismatched:</strong> ${researchData.evidence_summary.documents_mismatched?.join(', ') || '(none)'}</p>

  <h2>Input Breakdowns</h2>
  ${Object.values(researchData.input_breakdowns || {}).map((b: any) => `
    <div>
      <h3>${b.label}</h3>
      <ul>
        <li>File detected: ${b.fileDetected ? 'Yes' : 'No'}</li>
        <li>PDF valid: ${b.isPdf ? 'Yes' : 'No'}</li>
        <li>Text extracted: ${b.textExtracted ? 'Yes' : 'No'}</li>
        <li>Content matched: ${b.contentMatched ? 'Yes' : 'No'}</li>
        <li>Status: ${b.status}</li>
        <li>Message: ${b.message}</li>
      </ul>
    </div>
  `).join('')}

  <p><strong>Generated at:</strong> ${new Date(researchData.generated_at).toLocaleString()}</p>
</body>
</html>`;

                    const blob = new Blob([reportHtml], { type: "text/html" });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `Research-Eligibility-Report-${Date.now()}.html`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-700">No analysis available yet</div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default function ApplicationDashboard() {
  // ✅ FIX: Declare all state FIRST before using them
  const { id } = useParams();
  const [applicationId] = useState<string | undefined>(id);
  const { mutateAsync: getDocument, isPending } = useDocumentGet();
  const [documentData, setDocumentData] = useState<UniversityApplication>();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showEvidenceReport, setShowEvidenceReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Research Eligibility Report Modal State
  const [showResearchReport, setShowResearchReport] = useState(false);
  const [researchReportData, setResearchReportData] = useState<any>(null);
  const [researchReportLoading, setResearchReportLoading] = useState(false);
  const [researchReportError, setResearchReportError] = useState<string | null>(null);

  // Research Eligibility Upload State
  const [researchUploadStatus, setResearchUploadStatus] = useState<string>("");
  const [researchUploadLoading, setResearchUploadLoading] = useState<boolean>(false);
  const [researchUploadError, setResearchUploadError] = useState<string | null>(null);

  // ✅ NOW we can use documentData - Find the latest research eligibility doc (if any)
  const latestResearchDoc = documentData?.UniversityDocuments?.filter(
    (doc: any) => doc.researchEligibilityJson
  )?.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  const handleOpenResearchReport = async () => {
    if (!latestResearchDoc) return;
    setShowResearchReport(true);
    setResearchReportLoading(true);
    setResearchReportError(null);
    try {
      // If you have a backend route, fetch fresh; else use local
      // const res = await fetch(`${SERVER_URL}/api/institute/research-evidence/${latestResearchDoc.uni_doc_id}`);
      // const data = await res.json();
      // setResearchReportData(data?.researchEligibilityJson || latestResearchDoc.researchEligibilityJson);
      setResearchReportData(latestResearchDoc.researchEligibilityJson);
    } catch (err: any) {
      setResearchReportError(err.message || "Failed to load report");
    } finally {
      setResearchReportLoading(false);
    }
  };

  // Handler for research eligibility PDF upload
  const handleResearchEligibilityUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResearchUploadLoading(true);
    setResearchUploadError(null);
    setResearchUploadStatus("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("doc_id", "research_eligibility");
      formData.append("uni_application_id", applicationId || "");
      // You may need to adjust the API endpoint and payload as per your backend
      const response = await fetch(`${SERVER_URL}/api/institute/data/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.message || "Upload failed");
      }
      setResearchUploadStatus("SUBMITTED");
      setSuccessMessage("Research eligibility document uploaded successfully.");
    } catch (err: any) {
      setResearchUploadError(err.message || "Upload failed");
      setResearchUploadStatus("FAILED");
    } finally {
      setResearchUploadLoading(false);
    }
  };

  useEffect(() => {
    const getDocumentAsync = async () => {
      if (applicationId == undefined) return;
      const data = await getDocument(applicationId as string);
      setDocumentData(data.data);
    };
    getDocumentAsync();
  }, [applicationId, getDocument]);

  if (isPending || !documentData) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#fff]">
      <div className="container mx-auto p-6 space-y-8">
        <DashboardHeader
          applicationName={documentData.application.application_name}
          applicationType={documentData.application_name}
        />
        <div className="grid gap-8 md:grid-cols-2">
          {/* Research Eligibility Evidence Upload Section - Full 8-field Panel */}
          <ResearchEligibilityPanel 
            instituteId={documentData.application.application_id || ""}
            instituteName={documentData.application.application_name || "Institute"}
            isApproved={true}
          />
          <DashboardSummary documentData={documentData} />
          <DocumentStatusOverview documents={documentData} />
        </div>
        <DocumentList documents={documentData} />
        {/* Evidence Report Button and Section at the end of the page */}
        <div className="flex justify-end mt-8">
          <Button
            variant="default"
            className="bg-[#2c3e50] text-white hover:bg-[#34495e]"
            onClick={() => setShowEvidenceReport(true)}
          >
            View Evidence Report
          </Button>
        </div>
        <Dialog open={showEvidenceReport} onOpenChange={setShowEvidenceReport}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Evidence Report</DialogTitle>
              <DialogDescription>
                AI-powered analysis summary for this application, grouped by evidence category.
              </DialogDescription>
            </DialogHeader>
            {documentData?.uni_application_id && (
              <EvidenceReportSectionInstitutionApp uni_application_id={documentData.uni_application_id} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="h-10 w-3/4 bg-gray-200 rounded animate-pulse" />
      <div className="grid gap-8 md:grid-cols-2">
        <div className="h-40 bg-gray-200 rounded animate-pulse" />
        <div className="h-40 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="h-96 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}

function DashboardHeader({
  applicationName,
  applicationType,
}: {
  applicationName: string;
  applicationType: string;
}) {
  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-semibold text-[#2c3e50]">
        {applicationName}
      </h1>
      <p className="text-[#7f8c8d] text-sm">{applicationType}</p>
      <Separator className="my-4" />
    </div>
  );
}

function DashboardSummary({
  documentData,
}: {
  documentData: UniversityApplication;
}) {
  const totalDocuments = documentData.application.documents.length;
  const submittedDocuments = documentData.UniversityDocuments.length;
  const uploadedDocuments = documentData.UniversityDocuments.filter(
    (doc) => doc.status !== "NOT_SUBMITTED"
  ).length;
  const rejectedDocuments = documentData.UniversityDocuments.filter(
    (doc) => doc.status == "REJECTED"
  ).length;
  const approvedDocuments = documentData.UniversityDocuments.filter(
    (doc: any) => {
      const evaluatorInfo = doc.evaluatorDecision;
      return evaluatorInfo && evaluatorInfo.status === "APPROVED";
    }
  ).length;

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-[#2c3e50] text-xl">
          Application Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-[#7f8c8d]">
            Total Documents
          </span>
          <span className="text-2xl font-bold text-[#3498db]">
            {totalDocuments}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-[#7f8c8d]">
            Submitted Document
          </span>
          <span className="text-2xl font-bold text-[#3498db]">
            {`${submittedDocuments} (${rejectedDocuments}R)`}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-[#7f8c8d]">
            Documents Uploaded
          </span>
          <span className="text-2xl font-bold text-[#2ecc71]">
            {`${uploadedDocuments}/${totalDocuments}`}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-[#7f8c8d]">
            Approved Documents
          </span>
          <span className="text-2xl font-bold text-[#2ecc71]">
            {approvedDocuments}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-[#7f8c8d]">Completion</span>
          <span className="text-2xl font-bold text-[#e74c3c]">
            {Math.round((approvedDocuments / totalDocuments) * 100)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentStatusOverview({
  documents,
}: {
  documents: UniversityApplication;
}) {
  const statusCounts = documents.UniversityDocuments.reduce(
    (acc: any, doc: any) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1;
      return acc;
    },
    {}
  );

  const data = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ["#3498db", "#2ecc71", "#f39c12", "#e74c3c"];

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-[#2c3e50] text-xl">
          Document Status Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          {data.length == 0 ? (
            <div className="flex h-full justify-center">
              <div className="self-center">Not Submitted Any Documents</div>
            </div>
          ) : (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function DocumentList({ documents }: { documents: UniversityApplication }) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { id: application_id } = useParams();
  const { toast } = useToast();
  const [groqAnalysisDialog, setGroqAnalysisDialog] = useState<{
    docName: string;
    analysis: GroqAnalysis;
  } | null>(null);
  const [legalAnalysisDialog, setLegalAnalysisDialog] = useState<{
    docName: string;
    analysis: LegalKeywordAnalysis;
  } | null>(null);

  console.log("documentlist", documents);
  console.log("UniversityDocuments:", documents.UniversityDocuments);
  if (documents.UniversityDocuments && documents.UniversityDocuments.length > 0) {
    console.log("First doc evaluatorDecision:", documents.UniversityDocuments[0]);
  }
  const applicationDocuments = documents.application?.documents ?? [];
  const sortedAndFilteredDocuments = applicationDocuments
    .filter((doc) =>
      (doc.documentR?.doc_name || "")
        .toLowerCase()
        .includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortColumn) return 0;
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  console.log("sorted", sortedAndFilteredDocuments);
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const fetchGroqAnalysis = async (pdfUrl: string, templateUrl: string, docName: string) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/institute/data/analysis/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_url: encodeURI(templateUrl),
          filled_url: encodeURI(pdfUrl),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || data?.detail || "Failed to fetch analysis");
      
      setGroqAnalysisDialog({
        docName,
        analysis: data as GroqAnalysis,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        description: `Failed to fetch AI Model analysis: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
    }
  };

  const fetchLegalKeywordsAnalysis = async (pdfUrl: string, docId: string, docName: string) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/institute/data/analysis/legal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdf_url: pdfUrl,
          document_id: docId,
          document_name: docName,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || data?.detail || "Failed to fetch analysis");
      
      setLegalAnalysisDialog({
        docName,
        analysis: data as LegalKeywordAnalysis,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        description: `Failed to fetch Legal Keywords analysis: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
    }
  };

  const navigate = useNavigate();

  return (
    <div className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Filter documents..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              onClick={() => handleSort("uni_doc_name")}
              className="cursor-pointer text-[#2c3e50]"
            >
              Document Name
            </TableHead>
            <TableHead
              onClick={() => handleSort("status")}
              className="cursor-pointer text-[#2c3e50]"
            >
              Status
            </TableHead>
            <TableHead className="text-[#2c3e50]">Evaluator Decision</TableHead>
            <TableHead className="text-[#2c3e50]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAndFilteredDocuments.map((doc) => {
            const currentUniDoc = documents.UniversityDocuments.filter(
              (uniDoc) => uniDoc.doc_id == doc.doc_id
            ).sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
            );
            console.log("currentUniDoc", currentUniDoc);
            console.log("Document name:", doc.documentR?.doc_name);
            console.log("Full doc object:", doc);
            if (currentUniDoc.length > 0) {
              console.log("Document evaluator decision:", (currentUniDoc[0] as any).evaluatorDecision);
            }
            
            const status =
              currentUniDoc.length > 0
                ? currentUniDoc[0].status
                : "NOT_SUBMITTED";
            const docName = doc.documentR?.doc_name || "Untitled Document";
            const docFormatUri = doc.documentR?.format_uri;
            const canUpload = status === "NOT_SUBMITTED" || status === "FAILED" as string;
            const evidenceId = currentUniDoc[0]?.uni_doc_id;
            
            // Clean document name - remove error messages and file extensions that shouldn't be there
            const cleanDocName = docName
              .replace(/\s*\(error\)\s*/gi, '')
              .replace(/\s*\berror\b\s*/gi, '')
              .replace(/\.pdf$/i, '')
              .replace(/Failed to fetch/gi, '')
              .trim() || "Untitled Document";
            
            console.log("Clean doc name:", cleanDocName);
            
            const getStatusColor = (status: string) => {
              switch(status) {
                case "VERIFIED": return "bg-green-100 text-green-800 border-green-300";
                case "PENDING": return "bg-yellow-100 text-yellow-800 border-yellow-300";
                case "FAILED": return "bg-red-100 text-red-800 border-red-300";
                case "NOT_SUBMITTED": return "bg-gray-100 text-gray-800 border-gray-300";
                default: return "bg-gray-100 text-gray-800 border-gray-300";
              }
            };

            // Get evaluator decision text
            const getEvaluatorDecisionDisplay = () => {
              const uniDoc = currentUniDoc[0];
              if (!uniDoc) return <span className="text-gray-500 text-sm">⏳ Pending Review</span>;
              
              const evaluatorInfo = (uniDoc as any).evaluatorDecision;
              console.log("Evaluator Info:", evaluatorInfo);
              
              if (!evaluatorInfo) {
                return <span className="text-gray-500 text-sm">⏳ Pending Review</span>;
              }

              const evaluatorEmail = evaluatorInfo.evaluator_email || 'Unknown';
              // Extract name from email (before the @ symbol)
              const evaluatorName = evaluatorEmail.split('@')[0] || 'Unknown';
              const decisionStatus = evaluatorInfo.status;
              const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

              console.log("Decision Status:", decisionStatus, "Evaluator Name:", evaluatorName);

              if (decisionStatus === "APPROVED") {
                return (
                  <div className="text-sm">
                    <span className="text-green-600 font-semibold">✅ Approved</span>
                    <div className="text-xs text-gray-600">by {evaluatorName}</div>
                    <div className="text-xs text-gray-500">{today}</div>
                  </div>
                );
              } else if (decisionStatus === "REJECTED") {
                return (
                  <div className="text-sm">
                    <span className="text-red-600 font-semibold">❌ Rejected</span>
                    <div className="text-xs text-gray-600">by {evaluatorName}</div>
                    <div className="text-xs text-gray-500">{today}</div>
                  </div>
                );
              }
              
              return <span className="text-gray-500 text-sm">⏳ Pending Review</span>;
            };
            
            return (
              <TableRow key={doc.documentR?.doc_id || doc.doc_id}>
                <TableCell className="font-medium text-[#34495e]">
                  <div className="space-y-1">
                    <div>{cleanDocName}</div>
                    {status === "FAILED" && (
                      <div className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Verification failed - please re-upload with correct format
                      </div>
                    )}
                    {status !== "NOT_SUBMITTED" && status !== "FAILED" && currentUniDoc.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Uploaded: {new Date(currentUniDoc[0].timestamp).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(status)}>{status.replace(/_/g, ' ')}</Badge>
                </TableCell>
                <TableCell className="min-w-[150px]">
                  {getEvaluatorDecisionDisplay()}
                </TableCell>
                <TableCell className="min-w-[300px]">
                  <div className="flex space-x-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const pdfUrl = currentUniDoc[0]?.uni_doc_uri || '';
                          const templateUrl = docFormatUri || '';
                          if (pdfUrl && templateUrl) {
                            fetchGroqAnalysis(pdfUrl, templateUrl, docName);
                          }
                        }}
                        className="text-[#3498db] border-[#3498db] hover:bg-[#3498db] hover:text-white"
                        disabled={!currentUniDoc[0] || currentUniDoc[0]?.status === 'NOT_SUBMITTED'}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        AI Model Analysis
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const pdfUrl = currentUniDoc[0]?.uni_doc_uri || '';
                          const docId = doc.doc_id || '';
                          if (pdfUrl) {
                            fetchLegalKeywordsAnalysis(pdfUrl, docId, docName);
                          }
                        }}
                        className="text-[#9b59b6] border-[#9b59b6] hover:bg-[#9b59b6] hover:text-white"
                        disabled={!currentUniDoc[0] || currentUniDoc[0]?.status === 'NOT_SUBMITTED'}
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Legal Keywords
                      </Button>
                      {/* Removed per-document View Evidence Report button */}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>


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
                        Phrases Checked: {groqAnalysisDialog.analysis.keyword_phrase_match.phrases_checked.length}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm font-medium text-green-700">Matched</p>
                          <ul className="mt-1 list-disc list-inside text-sm text-gray-700 space-y-1">
                            {groqAnalysisDialog.analysis.keyword_phrase_match.matched.length > 0 ? (
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
                            {groqAnalysisDialog.analysis.keyword_phrase_match.missing.length > 0 ? (
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

      <Dialog open={!!legalAnalysisDialog} onOpenChange={(open) => !open && setLegalAnalysisDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Legal Keywords Analysis - {legalAnalysisDialog?.docName}</DialogTitle>
            <DialogDescription>
              Legal compliance and keyword matching results.
            </DialogDescription>
          </DialogHeader>
          {legalAnalysisDialog?.analysis && (
            <>
              <div className="space-y-4 text-sm max-h-[60vh] overflow-y-auto">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      legalAnalysisDialog.analysis.compliance_status === "PASS"
                        ? "secondary"
                        : legalAnalysisDialog.analysis.compliance_status === "WARNING"
                        ? "outline"
                        : "destructive"
                    }
                    className={
                      legalAnalysisDialog.analysis.compliance_status === "PASS"
                        ? "bg-green-100 text-green-800"
                        : legalAnalysisDialog.analysis.compliance_status === "WARNING"
                        ? "bg-yellow-100 text-yellow-800"
                        : ""
                    }
                  >
                    {legalAnalysisDialog.analysis.compliance_status}
                  </Badge>
                  <span className="font-semibold">
                    Compliance Status: {legalAnalysisDialog.analysis.compliance_status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="border rounded-md p-3">
                    <p className="text-sm text-gray-500">Match Percentage</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {legalAnalysisDialog.analysis.match_percentage}%
                    </p>
                  </div>
                  <div className="border rounded-md p-3">
                    <p className="text-sm text-gray-500">Document Type</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {legalAnalysisDialog.analysis.document_type}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-gray-800 mb-2">Matched Keywords ({legalAnalysisDialog.analysis.matched_keywords.length})</p>
                  {legalAnalysisDialog.analysis.matched_keywords.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {legalAnalysisDialog.analysis.matched_keywords.map((item, idx) => (
                        <li key={`legal-matched-${idx}`} className="text-green-700">
                          <span className="font-medium">{item.keyword}</span>
                          <span className="text-gray-600 text-sm ml-2">({item.category})</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600">No keywords matched</p>
                  )}
                </div>

                <div>
                  <p className="font-semibold text-gray-800 mb-2">Missing Keywords ({legalAnalysisDialog.analysis.missing_keywords.length})</p>
                  {legalAnalysisDialog.analysis.missing_keywords.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {legalAnalysisDialog.analysis.missing_keywords.map((item, idx) => (
                        <li key={`legal-missing-${idx}`} className="text-red-700">
                          <span className="font-medium">{item.keyword}</span>
                          <span className="text-gray-600 text-sm ml-2">({item.category})</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600">No missing keywords</p>
                  )}
                </div>

                {legalAnalysisDialog.analysis.recommendations.length > 0 && (
                  <div>
                    <p className="font-semibold text-gray-800 mb-2">Recommendations</p>
                    <ul className="list-disc list-inside space-y-1">
                      {legalAnalysisDialog.analysis.recommendations.map((rec, idx) => (
                        <li key={`legal-rec-${idx}`} className="text-gray-700">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
