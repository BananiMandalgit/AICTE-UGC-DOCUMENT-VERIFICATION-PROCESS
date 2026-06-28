import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FileText, Upload, Eye, Download, Loader2, FileDown, AlertCircle } from "lucide-react";
import { v4 as uuid4 } from "uuid";
import { jwtDecode } from "jwt-decode";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useApplicationUpload } from "@/hooks/useApplication";
import { useInstituteStore } from "@/hooks/useInstituteData";
import { useAuthStore } from "@/hooks/useAuthStore";
import { SERVER_URL } from "@/constants/API";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { uploadInstitutePlacementSheet, getInstitutePlacementSummary } from "@/lib/placements";
import type { InstitutePlacementSummary } from "@/types/placements";
import FacultyScoreValidation from "@/components/FacultyScoreValidation";
import { ApplicationSubmissionForm } from "@/components/ApplicationSubmissionForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import applicationTypes from "@/data/applicationTypes.json";
import { buildUgcApplicationTypes } from "@/data/ugcApprovalConfig";
// ...existing code...
import { extractTextFromPdf } from "@/utils/pdfTextExtract";

interface ApplicationType {
  id: string;
  name: string;
  documents: { id: string; name: string; pdfPath: string }[];
}

type GroqAnalysis = any;
type LegalKeywordAnalysis = any;
type WorkspaceDocumentPayload = any;
type SubmitUniversityApplication = any;
type DocumentUpload = any;
type IssueSummary = Record<string, unknown>;

// Publication Credibility Interface (AICTE only)
interface Publication {
  title: string;
  journal: string;
  indexedIn: "Scopus" | "WoS" | "UGC-CARE" | "Other" | "None";
  impactFactor: number;
  quartile: "Q1" | "Q2" | "Q3" | "Q4" | "NA";
  year: number;
  plagiarism: number;
}

const defaultApplicationTypes = applicationTypes as ApplicationType[];

const issueSummaryLabels: Record<string, string> = {
  missing_sections: "Missing sections",
  duplicate_sections: "Duplicate sections",
  misplaced_sections: "Misplaced sections",
  missing_fields: "Missing fields",
  extra_fields: "Extra fields",
};

const normalizeStatus = (status?: string): string => (status || "").toLowerCase();

const getUploadStatusVariant = (status?: string) => {
  const normalized = normalizeStatus(status);
  if (normalized === "ready") return "default" as const;
  if (normalized === "uploaded") return "secondary" as const;
  if (normalized === "processing") return "outline" as const;
  if (normalized === "error") return "destructive" as const;
  return "outline" as const;
};

const getUploadStatusLabel = (status?: string) => {
  const normalized = normalizeStatus(status);
  if (normalized === "ready") return "✓ Ready";
  if (normalized === "processing") return "⏳ Analyzing";
  if (normalized === "uploading") return "⬆️ Uploading";
  if (normalized === "uploaded") return "✓ Uploaded";
  if (normalized === "error") return "✗ Failed";
  return status || "Status unavailable";
};

const statusIs = (status: string | undefined, target: string) => normalizeStatus(status) === target.toLowerCase();

const NirfUploadPanel: React.FC<{ instituteId?: string | null; instituteName?: string }> = ({ instituteName }) => {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-gray-900">NIRF Scoring Upload</CardTitle>
        <CardDescription className="text-gray-600">
          Upload the consolidated CSV/XLSX exported from your institute systems to run the NIRF scoring pipeline. The latest score automatically appears on the dashboard once processed for {instituteName || "your institute"}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          NIRF scoring upload is temporarily unavailable while we finalize the report generator.
        </p>
      </CardContent>
    </Card>
  );
};

const PlacementUploadPanel: React.FC<{ instituteId: string; instituteName: string }> = ({ instituteId, instituteName }) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summary, setSummary] = useState<InstitutePlacementSummary | null>(null);
  const resolvedName = instituteName || "this institute";

  const refreshSummary = useCallback(async () => {
    if (!instituteId) {
      setSummary(null);
      return;
    }

    setLoadingSummary(true);
    try {
      const result = await getInstitutePlacementSummary(instituteId);
      setSummary(result ?? null);
    } catch (error) {
      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : "Could not load placement summary.",
      });
    } finally {
      setLoadingSummary(false);
    }
  }, [instituteId, toast]);

  useEffect(() => {
    refreshSummary();
  }, [refreshSummary]);

  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file || !instituteId) {
      toast({
        variant: "destructive",
        description: "Please select a file and ensure institute context is available."
      });
      return;
    }

    setUploading(true);
    try {
      const response = await uploadInstitutePlacementSheet(file, instituteId);
      
      toast({
        title: "Success",
        description: response.data?.collegesUpdated 
          ? `${response.data.collegesUpdated} college(s) scored successfully` 
          : "Placement data uploaded and analyzed"
      });
      
      // Clear the file input
      setFile(null);
      
      // Refresh the summary to show updated scores
      await refreshSummary();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload placement data"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-gray-800">Placement Intelligence Upload</CardTitle>
        <CardDescription className="text-gray-600">
          Attach your multi-year placement workbook so evaluators can view automated compliance insights for {resolvedName}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary ? (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs uppercase text-gray-500">AI Score</p>
              <p className="text-3xl font-semibold text-[#0b6e4f]">{summary.aiScore.toFixed(1)}</p>
              <p className="text-sm text-gray-600">
                {summary.performanceRating} · {summary.riskLevel} risk
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs uppercase text-gray-500">Latest Placement %</p>
              <p className="text-3xl font-semibold text-blue-600">{summary.placementPercent.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">AY {summary.lastAcademicYear}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs uppercase text-gray-500">Avg Salary</p>
              <p className="text-3xl font-semibold text-orange-600">₹{summary.avgSalaryLpa.toFixed(1)} L</p>
              <p className="text-sm text-gray-600">Records tracked: {summary.historyLength}</p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600">
            {loadingSummary ? "Loading placement summary..." : "Upload your first placement workbook to unlock insights."}
          </div>
        )}
        <div>
          <input
            type="file"
            accept=".pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="mt-2 block w-full rounded-md border border-gray-300 p-2"
          />
          <p className="mt-2 text-xs text-gray-500">
            Upload a PDF containing placement data. AI will extract and analyze the document to generate compliance report.
          </p>
          {!instituteId && (
            <p className="mt-1 text-xs text-amber-600">Institute context missing—please reopen this workspace from the dashboard.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleUpload}
            disabled={!file || !instituteId || uploading}
            className="bg-[#0b6e4f] text-white hover:bg-[#095a40]"
          >
            {uploading ? "Processing..." : "Upload & Score"}
          </Button>
          <a
            href="http://localhost:3100/documents/placement_sample.xlsx"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-blue-600"
          >
            Download template
          </a>
          <Button type="button" variant="ghost" size="sm" onClick={refreshSummary} disabled={loadingSummary}>
            Refresh summary
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

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
  const [openResearchDialog, setOpenResearchDialog] = useState(false);
  const [openResearchChecklist, setOpenResearchChecklist] = useState(false);

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

      for (const key in contentMatchPassed) {
        const label = key;
        // ...existing logic for setting up inputBreakdowns[key]...
        try {
          // ...existing logic for PDF/content match...
        } catch (error: unknown) {
          checks.push({ name: `${label} Content Match`, status: "NEEDS MANUAL REVIEW" });
          inputBreakdowns[key].status = "NEEDS MANUAL REVIEW";
          inputBreakdowns[key].message = "Text extraction failed.";
        }
      }

      // Plagiarism Report Validation (robust)
      const handlePlagiarismValidation = async () => {
        if (!plagiarismFile) {
          plagiarismBreakdown.status = "FAIL";
          plagiarismBreakdown.detail = "FILE_NOT_UPLOADED";
          plagiarismBreakdown.message = "File not uploaded.";
        } else {
          plagiarismBreakdown.fileDetected = true;
          if (!isPdfFile(plagiarismFile)) {
            plagiarismBreakdown.status = "NEEDS MANUAL REVIEW";
            plagiarismBreakdown.detail = "NOT_A_PDF";
            plagiarismBreakdown.message = "Uploaded file is not a PDF.";
          } else {
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
      };
      await handlePlagiarismValidation();
      
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

      // --- PART 2: SCORING LOGIC ---
      if (score > 100) score = 100;
      let eligibilityStatus = "FAIL";
      if (score >= 70) eligibilityStatus = "PASS";
      else if (score >= 50) eligibilityStatus = "CONDITIONAL";

      // --- PART 3: BUILD researchEligibilityJson ---
      const researchEligibilityJson = {
        eligibility_score: score,
        eligibility_status: eligibilityStatus,
        checks,
        evidence_summary: evidence,
        input_breakdowns: inputBreakdowns,
        plagiarism_breakdown: plagiarismBreakdown,
        generated_at: new Date().toISOString()
      };

      // --- PART 4: SAVE TO DATABASE ---
      // POST to backend to update UniversityDocuments.researchEligibilityJson
      if (instituteId) {
        await fetch(`/api/institute/research-eligibility/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ instituteId, researchEligibilityJson })
        });
      }

      // --- PART 5: DISPLAY IN MODAL ---
      setResearchData(researchEligibilityJson);
    } catch (e: any) {
      setResearchError(e.message || "Failed to compute analysis");
      setResearchData(null);
    } finally {
      setOpenResearchReport(true);
      setResearchLoading(false);
    }
  };

  return (
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
            <Input id="approvalLetter" type="file" accept=".pdf" onChange={(e) => handleFileChange("approvalLetter", e.target.files?.[0] || null)} className="cursor-pointer" />
          </div>

          {/* Approval Number */}
          <div className="space-y-2">
            <Label htmlFor="approvalNumber" className="text-sm font-medium">Approval Number</Label>
            <Input id="approvalNumber" type="text" placeholder="e.g., AICTE/2025/123456" value={formData.approvalNumber} onChange={(e) => handleTextChange("approvalNumber", e.target.value)} />
          </div>

          {/* Validity Start Date */}
          <div className="space-y-2">
            <Label htmlFor="validityStartDate" className="text-sm font-medium">Validity Start Date</Label>
            <Input id="validityStartDate" type="date" value={formData.validityStartDate} onChange={(e) => handleTextChange("validityStartDate", e.target.value)} />
          </div>

          {/* Validity End Date */}
          <div className="space-y-2">
            <Label htmlFor="validityEndDate" className="text-sm font-medium">Validity End Date</Label>
            <Input id="validityEndDate" type="date" value={formData.validityEndDate} onChange={(e) => handleTextChange("validityEndDate", e.target.value)} />
          </div>

          {/* Faculty Appointment Letters */}
          <div className="space-y-2">
            <Label htmlFor="appointmentLetters" className="text-sm font-medium">Faculty Appointment Letters (PDF)</Label>
            <Input id="appointmentLetters" type="file" accept=".pdf" onChange={(e) => handleFileChange("appointmentLetters", e.target.files?.[0] || null)} className="cursor-pointer" />
          </div>

          {/* PhD Supervisor Recognition Proof */}
          <div className="space-y-2">
            <Label htmlFor="phdSupervisorProof" className="text-sm font-medium">PhD Supervisor Recognition Proof (PDF)</Label>
            <Input id="phdSupervisorProof" type="file" accept=".pdf" onChange={(e) => handleFileChange("phdSupervisorProof", e.target.files?.[0] || null)} className="cursor-pointer" />
          </div>

          {/* Student Bonafide/Enrollment Proof */}
          <div className="space-y-2">
            <Label htmlFor="studentBonafide" className="text-sm font-medium">Student Bonafide/Enrollment Proof (PDF)</Label>
            <Input id="studentBonafide" type="file" accept=".pdf" onChange={(e) => handleFileChange("studentBonafide", e.target.files?.[0] || null)} className="cursor-pointer" />
          </div>

          {/* Plagiarism Report */}
          <div className="space-y-2">
            <Label htmlFor="plagiarismReport" className="text-sm font-medium">Plagiarism Report (PDF)</Label>
            <Input id="plagiarismReport" type="file" accept=".pdf" onChange={(e) => handleFileChange("plagiarismReport", e.target.files?.[0] || null)} className="cursor-pointer" />
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={handleRunAndViewReport} className="bg-[#2c3e50] text-white hover:bg-[#34495e]">
            View Research Eligibility Report
          </Button>
        </div>

        <Dialog open={openResearchReport} onOpenChange={setOpenResearchReport}>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Research Eligibility Evidence Report</DialogTitle>
            </DialogHeader>
            {researchData ? (
              <div className="space-y-6">
                {/* Evidence Summary Section (added as per request) */}
                <Card>
                  <CardContent className="p-4">
                    <div className="font-semibold mb-2">Evidence Summary</div>
                    <div className="mb-1"><span className="font-bold">Approval Number:</span> {researchData.evidence_summary?.approval_number || '(none)'}</div>
                    <div className="mb-1"><span className="font-bold">Validity Period:</span> {researchData.evidence_summary?.validity_start_date ? `${researchData.evidence_summary.validity_start_date}  ${researchData.evidence_summary.validity_end_date}` : '(none)'}</div>
                    <div className="mb-1"><span className="font-bold">Documents Submitted:</span> {researchData.evidence_summary?.documents_submitted && researchData.evidence_summary.documents_submitted.length > 0 ? researchData.evidence_summary.documents_submitted.join(', ') : '(none)'}</div>
                    <div className="mb-1"><span className="font-bold">Documents Missing:</span> {researchData.evidence_summary?.documents_missing && researchData.evidence_summary.documents_missing.length > 0 ? researchData.evidence_summary.documents_missing.join(', ') : '(none)'}</div>
                    <div className="mb-1"><span className="font-bold">Documents Invalid (Non-PDF):</span> {researchData.evidence_summary?.documents_invalid && researchData.evidence_summary.documents_invalid.length > 0 ? researchData.evidence_summary.documents_invalid.join(', ') : '(none)'}</div>
                    <div className="mb-1"><span className="font-bold">Documents Mismatched (Content):</span> {researchData.evidence_summary?.documents_mismatched && researchData.evidence_summary.documents_mismatched.length > 0 ? researchData.evidence_summary.documents_mismatched.join(', ') : '(none)'}</div>
                    <div className="mb-1"><span className="font-bold">Generated at:</span> {researchData.generated_at ? new Date(researchData.generated_at).toLocaleString() : '(none)'}</div>
                  </CardContent>
                </Card>
                {/* Download button moved to bottom-left */}
                <div className="hidden"></div>
                {/* Section 1: Score + Status Badge */}
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
                {/* Section 2: Table of Checks */}
                <Card>
                  <CardContent className="p-4">
                    <div className="font-semibold mb-2">Validation Checklist</div>
                    <table className="w-full text-sm border">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left px-2 py-1 font-medium">Check</th>
                          <th className="text-left px-2 py-1 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {researchData.checks.map((c, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-2 py-1">{c.name}</td>
                            <td className="px-2 py-1">
                              <span className={
                                c.status === "PASSED" || c.status === "PASS"
                                  ? "text-green-700 font-semibold"
                                  : ["WARNING", "CONDITIONAL", "UNREADABLE", "INCOMPLETE REPORT", "NEEDS MANUAL REVIEW"].includes(c.status)
                                  ? "text-yellow-700 font-semibold"
                                  : "text-red-700 font-semibold"
                              }>
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
                {/* Section 3: Evidence Summary removed as per UI-only cleanup */}
                {/* Section 4: Input Breakdowns */}
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
{/* Removed invalid <html> tag from JSX */}
{/* Removed invalid <head> tag from JSX */}
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
{/* Removed invalid <body> tag from JSX */}
  <h1>Research Eligibility Evidence Report</h1>
  <p><strong>Score:</strong> ${researchData.eligibility_score}</p>
  <p><strong>Status:</strong> ${researchData.eligibility_status}</p>

  <h2>Validation Checklist</h2>
  <table>
    <thead><tr><th>Check</th><th>Status</th></tr></thead>
    <tbody>
      ${researchData.checks.map((c) => `<tr><td>${c.name}</td><td>${c.status}</td></tr>`).join('')}
    </tbody>
  </table>

  <h2>Evidence Summary</h2>
  <p><strong>Approval Number:</strong> ${researchData.evidence_summary.approval_number || '(none)'}</p>
  <p><strong>Validity Period:</strong> ${researchData.evidence_summary.validity_period || '(none)'}</p>
  <p><strong>Documents Submitted:</strong> ${researchData.evidence_summary.documents_submitted.join(', ') || '(none)'}</p>
  <p><strong>Documents Missing:</strong> ${researchData.evidence_summary.documents_missing.join(', ') || '(none)'}</p>
  <p><strong>Documents Invalid:</strong> ${researchData.evidence_summary.documents_invalid?.join(', ') || '(none)'}</p>
  <p><strong>Documents Mismatched:</strong> ${researchData.evidence_summary.documents_mismatched?.join(', ') || '(none)'}</p>

  <h2>Input Breakdowns</h2>
  ${Object.values(researchData.input_breakdowns || {}).map((b) => `
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
                    Download Report
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-700">No analysis available yet</div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

// Publication Credibility Panel Component (AICTE only)
interface PublicationCredibilityPanelProps {
  instituteId: string;
  instituteName: string;
}

const PublicationCredibilityPanel: React.FC<PublicationCredibilityPanelProps> = ({ instituteId, instituteName }) => {
  const { toast } = useToast();
  const [publications, setPublications] = useState<Publication[]>([]);
  const [credibilityScore, setCredibilityScore] = useState<number>(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPublication, setNewPublication] = useState<Publication>({
    title: "",
    journal: "",
    indexedIn: "None",
    impactFactor: 0,
    quartile: "NA",
    year: new Date().getFullYear(),
    plagiarism: 0,
  });

  // Auto-calculate credibility score whenever publications change
  useEffect(() => {
    if (publications.length === 0) {
      setCredibilityScore(0);
      return;
    }

    const scores = publications.map(pub => {
      let score = 0;

      // Indexing (0-40 points)
      if (pub.indexedIn === "Scopus" || pub.indexedIn === "WoS") score += 40;
      else if (pub.indexedIn === "UGC-CARE") score += 30;
      else if (pub.indexedIn === "Other") score += 15;

      // Impact Factor (0-20 points)
      if (pub.impactFactor > 5) score += 20;
      else if (pub.impactFactor >= 3) score += 15;
      else if (pub.impactFactor >= 1) score += 10;
      else if (pub.impactFactor > 0) score += 5;

      // Quartile (0-15 points)
      if (pub.quartile === "Q1") score += 15;
      else if (pub.quartile === "Q2") score += 10;
      else if (pub.quartile === "Q3") score += 5;
      else if (pub.quartile === "Q4") score += 2;

      // Plagiarism (0-15 points)
      if (pub.plagiarism <= 10) score += 15;
      else if (pub.plagiarism <= 20) score += 10;
      else if (pub.plagiarism <= 30) score += 5;

      // Recency (0-10 points)
      const age = new Date().getFullYear() - pub.year;
      if (age <= 2) score += 10;
      else if (age <= 5) score += 5;
      else score += 2;

      return score;
    });

    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    setCredibilityScore(avg);
  }, [publications]);

  const addPublication = () => {
    setPublications(prev => [
      ...prev,
      {
        title: "",
        journal: "",
        indexedIn: "None",
        impactFactor: 0,
        quartile: "NA",
        year: new Date().getFullYear(),
        plagiarism: 0
      }
    ]);
  };

  const updatePublication = (
    index: number,
    field: keyof Publication,
    value: any
  ) => {
    const updated = [...publications];
    updated[index] = { ...updated[index], [field]: value };
    setPublications(updated);
  };

  const calculateCredibility = () => {
    if (!publications.length) return;

    const scores = publications.map(pub => {
      let score = 0;

      if (pub.indexedIn === "Scopus" || pub.indexedIn === "WoS") score += 40;
      else if (pub.indexedIn === "UGC-CARE") score += 30;
      else if (pub.indexedIn === "Other") score += 15;

      if (pub.impactFactor > 5) score += 20;
      else if (pub.impactFactor >= 3) score += 15;
      else if (pub.impactFactor >= 1) score += 10;
      else if (pub.impactFactor > 0) score += 5;

      if (pub.quartile === "Q1") score += 15;
      else if (pub.quartile === "Q2") score += 10;
      else if (pub.quartile === "Q3") score += 5;
      else if (pub.quartile === "Q4") score += 2;

      if (pub.plagiarism <= 10) score += 15;
      else if (pub.plagiarism <= 20) score += 10;
      else if (pub.plagiarism <= 30) score += 5;

      const age = new Date().getFullYear() - pub.year;
      if (age <= 2) score += 10;
      else if (age <= 5) score += 5;
      else score += 2;

      return score;
    });

    const avg = Math.round(
      scores.reduce((a, b) => a + b, 0) / scores.length
    );

    setCredibilityScore(avg);
  };

  const calculateCredibilityScore = (pubs: Publication[]): number => {
    if (pubs.length === 0) return 0;
    
    let totalScore = 0;
    pubs.forEach((pub) => {
      let score = 0;
      
      // Indexing score (0-30 points)
      switch (pub.indexedIn) {
        case "Scopus": score += 25; break;
        case "WoS": score += 30; break;
        case "UGC-CARE": score += 20; break;
        case "Other": score += 10; break;
        case "None": score += 0; break;
      }
      
      // Quartile score (0-30 points)
      switch (pub.quartile) {
        case "Q1": score += 30; break;
        case "Q2": score += 20; break;
        case "Q3": score += 10; break;
        case "Q4": score += 5; break;
      }
      
      // Impact factor score (0-20 points)
      if (pub.impactFactor >= 5) score += 20;
      else if (pub.impactFactor >= 3) score += 15;
      else if (pub.impactFactor >= 1) score += 10;
      else if (pub.impactFactor > 0) score += 5;
      
      // Plagiarism penalty (0-20 points deduction)
      if (pub.plagiarism <= 5) score += 20;
      else if (pub.plagiarism <= 10) score += 15;
      else if (pub.plagiarism <= 15) score += 10;
      else if (pub.plagiarism <= 20) score += 5;
      else score -= 10; // Penalty for high plagiarism
      
      totalScore += score;
    });
    
    return Math.round((totalScore / pubs.length) * 100) / 100;
  };

  const handleAddPublication = () => {
    if (!newPublication.title || !newPublication.journal) {
      toast({
        title: "Validation Error",
        description: "Title and Journal are required fields.",
        variant: "destructive",
      });
      return;
    }
    
    setPublications([...publications, newPublication]);
    setNewPublication({
      title: "",
      journal: "",
      indexedIn: "None",
      impactFactor: 0,
      quartile: "NA",
      year: new Date().getFullYear(),
      plagiarism: 0,
    });
    setShowAddForm(false);
    
    toast({
      title: "Publication Added",
      description: "Publication added successfully to the credibility analysis.",
    });
  };

  const handleDeletePublication = (index: number) => {
    const updated = publications.filter((_, i) => i !== index);
    setPublications(updated);
    toast({
      title: "Publication Removed",
      description: "Publication removed from the credibility analysis.",
    });
  };

  const credibilityStatus = credibilityScore >= 70 ? "Excellent" : credibilityScore >= 50 ? "Good" : credibilityScore >= 30 ? "Average" : "Needs Improvement";

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#0b6e4f]" />
          Publication Credibility (Faculty & Students)
        </CardTitle>
        <CardDescription>
          Add publications for {instituteName} to analyze research credibility based on indexing, impact factor, and plagiarism metrics.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Credibility Score Display */}
        {publications.length > 0 && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 font-medium">Overall Credibility Score</div>
                <div className="text-3xl font-bold text-blue-800">{credibilityScore.toFixed(2)}</div>
              </div>
              <Badge className={`text-base px-4 py-2 ${
                credibilityStatus === "Excellent" ? "bg-green-100 text-green-800 border-green-300" :
                credibilityStatus === "Good" ? "bg-blue-100 text-blue-800 border-blue-300" :
                credibilityStatus === "Average" ? "bg-yellow-100 text-yellow-800 border-yellow-300" :
                "bg-red-100 text-red-800 border-red-300"
              }`}>
                {credibilityStatus}
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* Add Publication Button */}
        {!showAddForm && (
          <Button 
            onClick={() => setShowAddForm(true)} 
            className="w-full bg-[#2c3e50] text-white hover:bg-[#34495e]"
          >
            <FileText className="mr-2 h-4 w-4" />
            Add Publication
          </Button>
        )}

        {/* Add Publication Form */}
        {showAddForm && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg">Add New Publication</CardTitle>
              <CardDescription>Fill in the publication details below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pub-title">Publication Title *</Label>
                  <Input
                    id="pub-title"
                    placeholder="Enter publication title"
                    value={newPublication.title}
                    onChange={(e) => setNewPublication({ ...newPublication, title: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pub-journal">Journal Name *</Label>
                  <Input
                    id="pub-journal"
                    placeholder="Enter journal name"
                    value={newPublication.journal}
                    onChange={(e) => setNewPublication({ ...newPublication, journal: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pub-indexed">Indexed In</Label>
                  <Select 
                    value={newPublication.indexedIn} 
                    onValueChange={(value: "Scopus" | "WoS" | "UGC-CARE" | "Other" | "None") => 
                      setNewPublication({ ...newPublication, indexedIn: value })
                    }
                  >
                    <SelectTrigger id="pub-indexed">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Scopus">Scopus</SelectItem>
                      <SelectItem value="WoS">Web of Science</SelectItem>
                      <SelectItem value="UGC-CARE">UGC-CARE</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                      <SelectItem value="None">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pub-quartile">Quartile</Label>
                  <Select 
                    value={newPublication.quartile} 
                    onValueChange={(value: "Q1" | "Q2" | "Q3" | "Q4" | "NA") => 
                      setNewPublication({ ...newPublication, quartile: value })
                    }
                  >
                    <SelectTrigger id="pub-quartile">
                      <SelectValue placeholder="Select quartile" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Q1">Q1</SelectItem>
                      <SelectItem value="Q2">Q2</SelectItem>
                      <SelectItem value="Q3">Q3</SelectItem>
                      <SelectItem value="Q4">Q4</SelectItem>
                      <SelectItem value="NA">Not Applicable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pub-impact">Impact Factor</Label>
                  <Input
                    id="pub-impact"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newPublication.impactFactor}
                    onChange={(e) => setNewPublication({ ...newPublication, impactFactor: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pub-year">Publication Year</Label>
                  <Input
                    id="pub-year"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={newPublication.year}
                    onChange={(e) => setNewPublication({ ...newPublication, year: parseInt(e.target.value) || new Date().getFullYear() })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pub-plagiarism">Plagiarism % (0-100)</Label>
                  <Input
                    id="pub-plagiarism"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={newPublication.plagiarism}
                    onChange={(e) => setNewPublication({ ...newPublication, plagiarism: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddPublication} className="bg-green-600 hover:bg-green-700 text-white">
                  Save Publication
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Publications Table */}
        {publications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Added Publications ({publications.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Journal</TableHead>
                    <TableHead>Indexed</TableHead>
                    <TableHead>Quartile</TableHead>
                    <TableHead>Impact</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Plagiarism</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {publications.map((pub, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium max-w-xs truncate">{pub.title}</TableCell>
                      <TableCell>{pub.journal}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          pub.indexedIn === "Scopus" || pub.indexedIn === "WoS" ? "bg-green-50" : ""
                        }>
                          {pub.indexedIn}
                        </Badge>
                      </TableCell>
                      <TableCell>{pub.quartile === "NA" ? "N/A" : pub.quartile}</TableCell>
                      <TableCell>{pub.impactFactor.toFixed(2)}</TableCell>
                      <TableCell>{pub.year}</TableCell>
                      <TableCell>
                        <Badge className={
                          pub.plagiarism <= 10 ? "bg-green-100 text-green-800" :
                          pub.plagiarism <= 20 ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }>
                          {pub.plagiarism}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeletePublication(index)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {publications.length === 0 && !showAddForm && (
          <div className="text-center py-8 text-gray-500">
            No publications added yet. Click "Add Publication" to get started.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ApplicationWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { instituteId: storeInstituteId } = useInstituteStore();
  const { token } = useAuthStore();
  const initialState =
    (location.state as { applicationId?: string; selectedTypeId?: string; instituteId?: string; instituteName?: string; universityName?: string } | undefined) ||
    {};
  const [applicationOptions, setApplicationOptions] = useState<ApplicationType[]>(defaultApplicationTypes);
  const [selectedTypeId, setSelectedTypeId] = useState(
    initialState.selectedTypeId || defaultApplicationTypes[0]?.id || ""
  );
  const tokenInstituteId = useMemo(() => {
    if (!token) return null;
    try {
      const decoded: any = jwtDecode(token);
      return decoded?.sub || decoded?.institute_id || null;
    } catch (error) {
      return null;
    }
  }, [token]);
  const effectiveInstituteId = initialState.instituteId || storeInstituteId || tokenInstituteId;
  const instituteLabel = initialState.instituteName || initialState.universityName || "your institute";
  const [uploads, setUploads] = useState<Record<string, any>>({});
  const [analysisDialog, setAnalysisDialog] = useState<any | null>(null);
  const [legalAnalysisDialog, setLegalAnalysisDialog] = useState<any | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const { mutateAsync: uploadApplication, isPending } = useApplicationUpload();
  const { mutateAsync: uploadDocument } = useFileUpload();
  const { toast } = useToast();
  const [submissionKey, setSubmissionKey] = useState(0);
  const [submissionResult, setSubmissionResult] = useState<{
    applicationId: string;
    documents: number;
  } | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  // Research Eligibility: Track if ANY application is APPROVED
  const [hasApprovedApplication, setHasApprovedApplication] = useState<boolean>(false);
  const [loadingAppStatus, setLoadingAppStatus] = useState(false);
  // DEBUG: Show key state values for troubleshooting blank page
  const debugInfo = {
    selectedTypeId,
    effectiveInstituteId,
    instituteLabel,
    uploads,
    submissionResult,
    submissionError,
    token,
    storeInstituteId,
    initialState,
    applicationTypesLoaded: Array.isArray(applicationOptions) && applicationOptions.length > 0,
  };

  // Fetch application status to determine if research eligibility should be available
  useEffect(() => {
    const fetchApprovalStatus = async () => {
      if (!effectiveInstituteId || !token) return;
      
      setLoadingAppStatus(true);
      try {
        const response = await fetch(`${SERVER_URL}/api/institute/data/applications`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          const applications = result?.data || [];
          
          // Check if ANY application has APPROVED status
          const hasApproved = applications.some(
            (app: any) => app.status === "APPROVED"
          );
          
          setHasApprovedApplication(hasApproved);
        }
      } catch (error) {
        console.error("Failed to fetch application approval status:", error);
      } finally {
        setLoadingAppStatus(false);
      }
    };
    
    fetchApprovalStatus();
  }, [effectiveInstituteId, token]);
  const templateLookup = useMemo(() => {
    const mapping: Record<string, string> = {};
    applicationOptions.forEach((type) => {
      type.documents.forEach((doc) => {
        mapping[doc.id] = doc.pdfPath;
      });
    });
    return mapping;
  }, [applicationOptions]);

  const getTemplateUrl = useCallback(
    (docId: string) => templateLookup[docId],
    [templateLookup]
  );

  const selectedType = useMemo(() => {
    return (
      applicationOptions.find((type) => type.id === selectedTypeId) ||
      applicationOptions[0]
    );
  }, [selectedTypeId, applicationOptions]);

  // Determine role based on application type (AICTE or UGC)
  const role = useMemo(() => {
    return selectedTypeId.startsWith('ugc_') ? "UGC" : "AICTE";
  }, [selectedTypeId]);

  useEffect(() => {
    const loginSource = localStorage.getItem("loginSource");
    if (loginSource === "ugc") {
      const ugcTypes = buildUgcApplicationTypes();
      setApplicationOptions(ugcTypes);
      setSelectedTypeId((prev) => {
        if (ugcTypes.some((type) => type.id === prev) && prev) {
          return prev;
        }
        return ugcTypes[0]?.id || "";
      });
    } else {
      setApplicationOptions(defaultApplicationTypes);
      setSelectedTypeId((prev) => {
        if (defaultApplicationTypes.some((type) => type.id === prev) && prev) {
          return prev;
        }
        return defaultApplicationTypes[0]?.id || "";
      });
    }
  }, []);

  const registerInput = (docId: string, element: HTMLInputElement | null) => {
    fileInputs.current[docId] = element;
  };

  const triggerUpload = (docId: string) => {
    fileInputs.current[docId]?.click();
  };

  const requestGroqComparison = async (
    templateUrl: string,
    filledUrl: string
  ): Promise<GroqAnalysis> => {
    const payloadBody = {
      template_url: encodeURI(templateUrl),
      filled_url: encodeURI(filledUrl),
    };
    const response = await fetch(`${SERVER_URL}/api/institute/data/analysis/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadBody),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload?.message || payload?.detail || "AI Model analysis failed");
    }
    return payload as GroqAnalysis;
  };

  const requestLegalKeywordsAnalysis = async (
    pdfUrl: string,
    docId: string,
    docName: string
  ): Promise<LegalKeywordAnalysis> => {
    const response = await fetch(`${SERVER_URL}/api/institute/data/analysis/legal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pdf_url: pdfUrl,
        document_id: docId,
        document_name: docName,
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload?.message || payload?.detail || "Legal keywords analysis failed");
    }

    return payload as LegalKeywordAnalysis;
  };

  const handleFileChange = async (
    docId: string,
    doc: ApplicationType["documents"][number],
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log(`[ApplicationWorkspace] Uploading file for docId: ${docId}, fileName: ${file.name}`);

    setUploads((prev) => ({
      ...prev,
      [docId]: { fileName: file.name, status: "uploading" },
    }));

    let uploadedUrl: string | undefined;

    try {
      const { downloadUrl } = await uploadDocument(file);
      uploadedUrl = downloadUrl;
      console.log(`[ApplicationWorkspace] File uploaded successfully. downloadUrl: ${downloadUrl}`);
      
      setUploads((prev) => ({
        ...prev,
        [docId]: {
          ...prev[docId],
          fileName: file.name,
          status: "uploaded",
          downloadUrl,
          analysis: uploadedUrl ? prev[docId]?.analysis : undefined,
        },
      }));

      console.log(`[ApplicationWorkspace] Updated uploads state for docId: ${docId}`);

      // Auto-trigger AI analysis after successful upload
      const templateUrl = getTemplateUrl(docId);
      if (templateUrl && downloadUrl) {
        setUploads((prev) => ({
          ...prev,
          [docId]: {
            ...prev[docId],
            status: "processing",
          },
        }));

        try {
          const analysis = await requestGroqComparison(templateUrl, downloadUrl);
          setUploads((prev) => ({
            ...prev,
            [docId]: {
              ...prev[docId],
              status: "ready",
              analysis,
            },
          }));
        } catch (analysisError) {
          console.error("Auto-analysis failed:", analysisError);
          // Keep "uploaded" status if analysis fails - user can retry manually
          setUploads((prev) => ({
            ...prev,
            [docId]: {
              ...prev[docId],
              status: "uploaded",
            },
          }));
        }
      }
    } catch (error) {
      setUploads((prev) => ({
        ...prev,
        [docId]: {
          ...prev[docId],
          fileName: file.name,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        },
      }));
    }

    if (fileInputs.current[docId]) {
      fileInputs.current[docId]!.value = "";
    }
  };

  const viewUploaded = (docId: string, docName: string) => {
    const upload = uploads[docId];
    if (!upload?.downloadUrl) return;

    setAnalysisDialog({
      docName,
      pdfUrl: upload.downloadUrl,
      templateUrl: getTemplateUrl(docId) || templateLookup[docId],
      status: upload.status,
      analysis: upload.analysis,
      error: upload.error,
      type: "groq",
    });
  };

  const viewLegalAnalysis = async (docId: string, docName: string) => {
    const upload = uploads[docId];
    if (!upload?.downloadUrl) return;

    setLegalAnalysisDialog({
      docName,
      docId,
      pdfUrl: upload.downloadUrl,
      status: "processing",
    });

    try {
      const analysis = await requestLegalKeywordsAnalysis(
        upload.downloadUrl,
        docId,
        docName
      );
      setLegalAnalysisDialog((prev) =>
        prev
          ? {
              ...prev,
              analysis,
              status: "ready",
            }
          : null
      );
      setUploads((prev) => ({
        ...prev,
        [docId]: {
          ...prev[docId],
          legalAnalysis: analysis,
        },
      }));
    } catch (error) {
      setLegalAnalysisDialog((prev) =>
        prev
          ? {
              ...prev,
              error: error instanceof Error ? error.message : "Analysis failed",
              status: "error",
            }
          : null
      );
    }
  };

  const closeLegalAnalysisDialog = () => {
    setLegalAnalysisDialog(null);
  };

  const closeAnalysisDialog = () => {
    setAnalysisDialog(null);
  };

  const downloadReport = () => {
    if (!analysisDialog?.analysis) return;

    const reportData = {
      documentName: analysisDialog.docName,
      generatedAt: new Date().toLocaleString(),
      status: analysisDialog.status,
      analysis: {
        formatMatch: analysisDialog.analysis.format_match_percentage,
        layoutMatch: analysisDialog.analysis.layout_match_score,
        keywordMatch: analysisDialog.analysis.keyword_phrase_match?.match_percentage,
        layoutSimilar: analysisDialog.analysis.layouts_similar,
        keywordPhraseMatching: analysisDialog.analysis.keyword_phrase_match,
        issueSummary: analysisDialog.analysis.issue_summary,
      },
    };

    const keywordSection = reportData.analysis.keywordPhraseMatching
      ? (() => {
          const matched = reportData.analysis.keywordPhraseMatching.matched.length > 0
            ? reportData.analysis.keywordPhraseMatching.matched
                .map((p) => `<div class="list-item">• ${p}</div>`)
                .join('')
            : '<div class="list-item">No matches detected</div>';

          const missing = reportData.analysis.keywordPhraseMatching.missing.length > 0
            ? reportData.analysis.keywordPhraseMatching.missing
                .map((p) => `<div class="list-item">• ${p}</div>`)
                .join('')
            : '<div class="list-item">All phrases present</div>';

          return `
  <div class="section">
    <h2>Keyword Phrase Matching</h2>
    <p>Phrases checked: ${reportData.analysis.keywordPhraseMatching.phrases_checked.length}</p>
    <div style="display: flex; gap: 30px; margin-top: 15px;">
      <div>
        <h3 class="matched">Matched Phrases</h3>
        ${matched}
      </div>
      <div>
        <h3 class="missing">Missing Phrases</h3>
        ${missing}
      </div>
    </div>
  </div>`;
        })()
      : '';

    let structuralSection = '';
    if (reportData.analysis.issueSummary) {
      const checksHtml = Object.entries(reportData.analysis.issueSummary).map(([key, value]) => {
        const label = issueSummaryLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        const message = value > 0 ? `${value} issue${value > 1 ? 's' : ''} detected` : 'No issues detected';
        return `
      <div class="check-item">
        <strong>${label}</strong>
        <p>${message}</p>
      </div>`;
      }).join('');

      structuralSection = `
  <div class="section">
    <h2>Structural Checks</h2>
    <div class="structural-checks">
      ${checksHtml}
    </div>
  </div>`;
    }

    const reportHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Document Analysis Report - ${analysisDialog.docName}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
      .header { border-bottom: 2px solid #007bff; padding-bottom: 15px; margin-bottom: 20px; }
      .header h1 { margin: 0; color: #007bff; }
      .header p { margin: 5px 0; color: #666; }
      .section { margin-bottom: 25px; }
      .section h2 { color: #007bff; border-left: 4px solid #007bff; padding-left: 10px; }
      .metrics { display: flex; gap: 20px; flex-wrap: wrap; margin: 15px 0; }
      .metric-card { 
        border: 1px solid #ddd; 
        padding: 15px; 
        border-radius: 5px; 
        flex: 1; 
        min-width: 200px;
        background: #f9f9f9;
      }
      .metric-label { color: #666; font-size: 12px; margin-bottom: 5px; }
      .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
      .matched { color: #28a745; }
      .missing { color: #dc3545; }
      .list-item { margin: 8px 0; padding-left: 20px; }
      .structural-checks { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
      .check-item { border: 1px solid #ddd; padding: 10px; border-radius: 5px; }
      .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #999; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Document Analysis Report</h1>
      <p><strong>Document:</strong> ${analysisDialog.docName}</p>
      <p><strong>Generated:</strong> ${reportData.generatedAt}</p>
      <p><strong>Status:</strong> ${analysisDialog.status}</p>
    </div>

    <div class="section">
      <h2>Match Metrics</h2>
      <div class="metrics">
        <div class="metric-card">
          <div class="metric-label">Format Match</div>
          <div class="metric-value">${reportData.analysis.formatMatch || 'N/A'}${reportData.analysis.formatMatch ? '%' : ''}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Layout Match</div>
          <div class="metric-value">${reportData.analysis.layoutMatch || 'N/A'}${reportData.analysis.layoutMatch ? '%' : ''}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Keyword Match</div>
          <div class="metric-value">${reportData.analysis.keywordMatch || 'N/A'}${reportData.analysis.keywordMatch ? '%' : ''}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Layout Comparison</h2>
      <p>${reportData.analysis.layoutSimilar ? 'Template and uploaded layout appear consistent.' : 'Layout differences detected against the template.'}</p>
    </div>

    ${keywordSection}
    ${structuralSection}

    <div class="footer">
      <p>This report was automatically generated by the AICTE Document Verification System.</p>
      <p>Generated on: ${new Date().toLocaleString()}</p>
    </div>
  </body>
</html>`;

    const blob = new Blob([reportHtml], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report-${analysisDialog.docName}-${new Date().getTime()}.html`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleApplicationSubmit = async (formData: { name: string; description: string }) => {
    console.log("[ApplicationWorkspace] Submitting application with instituteId:", effectiveInstituteId);
    console.log("[ApplicationWorkspace] Current uploads state:", uploads);
    console.log("[ApplicationWorkspace] Form data:", formData);
    
    if (!effectiveInstituteId) {
      toast({
        variant: "destructive",
        description: "Institute information is missing. Reload the dashboard and try again.",
      });
      return;
    }

    const documentsPayload: WorkspaceDocumentPayload[] = Object.entries(uploads)
      .filter(([, upload]) => upload?.downloadUrl)
      .map(([docId, upload]) => ({
        doc_id: docId,
        uni_doc_uri: upload.downloadUrl as string,
        status: upload.status,
      }));

    console.log("[ApplicationWorkspace] Documents payload:", documentsPayload);
    console.log("[ApplicationWorkspace] Number of documents:", documentsPayload.length);

    if (!documentsPayload.length) {
      console.warn("[ApplicationWorkspace] No documents to submit!");
      toast({
        variant: "destructive",
        description: "Please upload at least one document before submitting your application.",
      });
      return;
    }

    const applicationPayload: SubmitUniversityApplication = {
      uni_application_id: initialState.applicationId || `Application-${uuid4()}`,
      application_name: formData.name,
      application_description: formData.description,
      application_id: selectedTypeId,
    };

    setSubmissionResult(null);
    setSubmissionError(null);

    try {
      console.log("[ApplicationWorkspace] Sending to backend:", {
        application: applicationPayload,
        institute_id: effectiveInstituteId,
        documents: documentsPayload,
      });
      
      const response = await uploadApplication({
        application: applicationPayload,
        institute_id: effectiveInstituteId,
        documents: documentsPayload,
      });
      
      console.log("[ApplicationWorkspace] Backend response:", response);
      
      const newApplicationId =
        response?.id ||
        response?.application?.uni_application_id ||
        applicationPayload.uni_application_id;

      setSubmissionResult({
        applicationId: newApplicationId,
        documents: documentsPayload.length,
      });
      setSubmissionError(null);
      setUploads({});
      setAnalysisDialog(null);
      setSubmissionKey((prev) => prev + 1);

      // ✅ UX IMPROVEMENT: Show success message and redirect to applications page
      toast({
        title: "Application Submitted! ✅",
        description: `Application ${newApplicationId} has been submitted successfully. Status updated to SUBMITTED.`,
      });

      // Redirect to applications page after 2 seconds
      setTimeout(() => {
        navigate("/institute/applications");
      }, 2000);

    } catch (error) {
      console.error("Failed to submit application", error);
      setSubmissionResult(null);
      setSubmissionError("Failed to submit application. Please try again.");
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Document Workspace</h1>
              <p className="text-gray-600">
                Manage and upload every document required for your {selectedType?.name}
                {selectedType ? " application" : ""}.
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/institute/dashboard")}>
              Back to Dashboard
            </Button>
          </div>

        {/* Hide NIRF, Placement, Research Eligibility, and Faculty Score sections for UGC applications */}
        {!selectedTypeId.startsWith('ugc_') && (
          <div className="space-y-6">
            <NirfUploadPanel instituteId={effectiveInstituteId} instituteName={instituteLabel} />
            <PlacementUploadPanel instituteId={effectiveInstituteId} instituteName={instituteLabel} />
            
            {/* Research Eligibility: Only visible after approval */}
            {hasApprovedApplication ? (
              <ResearchEligibilityPanel 
                instituteId={effectiveInstituteId} 
                instituteName={instituteLabel}
                isApproved={hasApprovedApplication}
              />
            ) : (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <AlertCircle className="h-5 w-5" />
                    Research Eligibility Validation
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    Research eligibility validation is only available after your application receives APPROVED status. 
                    Please complete the AICTE/UGC approval process first.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
            
            <FacultyScoreValidation />
          </div>
        )}

        {/* Publication Credibility Panel - AICTE only */}
        {role === "AICTE" && (
          <div className="mt-6">
            <PublicationCredibilityPanel 
              instituteId={effectiveInstituteId} 
              instituteName={instituteLabel}
            />
          </div>
        )}

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Select Application Type</CardTitle>
            <CardDescription>
              Choose the application category to see its required documents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select application type" />
              </SelectTrigger>
              <SelectContent>
                {applicationOptions.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Display documents for selected application type */}
            {selectedTypeId && applicationOptions.find((type) => type.id === selectedTypeId) && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Required Documents</h3>
                <div className="rounded-lg border border-gray-200 divide-y divide-gray-200">
                  {applicationOptions
                    .find((type) => type.id === selectedTypeId)
                    ?.documents.map((doc) => {
                      const upload = uploads[doc.id];
                      const hasUpload = !!upload?.downloadUrl;
                      const uploadStatus = upload?.status;
                      
                      return (
                        <div
                          key={doc.id}
                          className="p-4 hover:bg-gray-50"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <FileText className="w-5 h-5 text-[#0b6e4f] flex-shrink-0" />
                                <span className="text-gray-700 font-medium">{doc.name}</span>
                                {hasUpload && (
                                  <Badge variant={getUploadStatusVariant(uploadStatus)}>
                                    {getUploadStatusLabel(uploadStatus)}
                                  </Badge>
                                )}
                              </div>
                              {upload?.fileName && (
                                <p className="text-sm text-gray-500 ml-8">
                                  Uploaded: {upload.fileName}
                                </p>
                              )}
                              {upload?.error && (
                                <p className="text-sm text-red-500 ml-8">
                                  Error: {upload.error}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              {/* Hidden file input */}
                              <input
                                type="file"
                                ref={(el) => registerInput(doc.id, el)}
                                accept=".pdf"
                                style={{ display: "none" }}
                                onChange={(e) => handleFileChange(doc.id, doc, e)}
                              />
                              
                              {/* View Format Button */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-[#0b6e4f] border-[#0b6e4f] hover:bg-green-50"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View Format
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[80vh]">
                                  <DialogHeader>
                                    <DialogTitle className="text-2xl text-gray-800">
                                      {doc.name}
                                    </DialogTitle>
                                    <DialogDescription className="text-gray-600">
                                      Please review the document format
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="mt-4">
                                    <iframe
                                      title={`${doc.name} format preview`}
                                      src={encodeURI(doc.pdfPath)}
                                      className="w-full h-[70vh] border rounded"
                                    />
                                  </div>
                                </DialogContent>
                              </Dialog>
                              
                              {/* Upload Button */}
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-[#0b6e4f] hover:bg-[#085a3e] text-white"
                                onClick={() => triggerUpload(doc.id)}
                                disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
                              >
                                <Upload className="w-4 h-4 mr-1" />
                                {hasUpload ? "Re-upload" : "Upload"}
                              </Button>
                              
                              {/* AI Model Analysis Button */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-[#3498db] border-[#3498db] hover:bg-[#3498db] hover:text-white"
                                onClick={() => viewUploaded(doc.id, doc.name)}
                                disabled={!hasUpload || uploadStatus === "uploading"}
                                title={hasUpload ? "View AI Model Analysis" : "Upload document first"}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                AI Analysis
                              </Button>
                              
                              {/* Legal Keywords Button */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-[#9b59b6] border-[#9b59b6] hover:bg-[#9b59b6] hover:text-white"
                                onClick={() => viewLegalAnalysis(doc.id, doc.name)}
                                disabled={!hasUpload || uploadStatus === "uploading"}
                                title={hasUpload ? "View Legal Keywords Analysis" : "Upload document first"}
                              >
                                <AlertCircle className="w-4 h-4 mr-1" />
                                Legal Keywords
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Submit Application Details</CardTitle>
            <CardDescription>
              Provide the application name and description before uploading documents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApplicationSubmissionForm
              key={submissionKey}
              onSubmit={handleApplicationSubmit}
              loading={isPending}
            />
            {!effectiveInstituteId && (
              <p className="text-sm text-red-500 mt-3">
                Institute information is missing. Please return to the dashboard and reload your
                institute profile before submitting.
              </p>
            )}
            {submissionResult && (
              <Alert className="mt-4">
                <AlertTitle>Application submitted</AlertTitle>
                <AlertDescription>
                  Saved as {submissionResult.applicationId} with {submissionResult.documents} document
                  {submissionResult.documents === 1 ? "" : "s"}. Evaluators can now review it.
                </AlertDescription>
              </Alert>
            )}
            {submissionError && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Submission failed</AlertTitle>
                <AlertDescription>{submissionError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!analysisDialog} onOpenChange={(open) => !open && closeAnalysisDialog()}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{analysisDialog?.docName || "Document analysis"}</DialogTitle>
              <DialogDescription>
                Groq validation results for your uploaded document.
              </DialogDescription>
            </DialogHeader>
            {analysisDialog ? (
              <div className="space-y-4 text-sm max-h-[60vh] overflow-y-auto">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={getUploadStatusVariant(analysisDialog.status)}>
                    {getUploadStatusLabel(analysisDialog.status)}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={downloadReport}
                    disabled={!statusIs(analysisDialog.status, "ready")}
                  >
                    <FileDown className="w-4 h-4" /> Download Report
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={analysisDialog.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" /> Open PDF
                    </a>
                  </Button>
                  {analysisDialog.templateUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={encodeURI(analysisDialog.templateUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" /> View Format
                      </a>
                    </Button>
                  )}
                </div>
                {statusIs(analysisDialog.status, "processing") && (
                  <p className="text-gray-600">
                    Groq is still analyzing this upload. Check back in a moment.
                  </p>
                )}
                {statusIs(analysisDialog.status, "uploaded") && (
                  <p className="text-gray-600">
                    This document is uploaded, but AI Model Analysis has not been run yet. Use the
                    "AI Model Analysis" button in the Required Documents list to generate results.
                  </p>
                )}
                {statusIs(analysisDialog.status, "error") && (
                  <p className="text-red-500">
                    {analysisDialog.error || "Unable to process this document."}
                  </p>
                )}
                {statusIs(analysisDialog.status, "ready") && analysisDialog.analysis && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="border rounded-md p-3">
                        <p className="text-sm text-gray-500">Format match</p>
                        <p className="text-lg font-semibold text-gray-800">
                          {analysisDialog.analysis.format_match_percentage !== undefined
                            ? `${analysisDialog.analysis.format_match_percentage}%`
                            : "N/A"}
                        </p>
                      </div>
                      <div className="border rounded-md p-3">
                        <p className="text-sm text-gray-500">Layout match</p>
                        <p className="text-lg font-semibold text-gray-800">
                          {analysisDialog.analysis.layout_match_score !== undefined
                            ? `${analysisDialog.analysis.layout_match_score}%`
                            : "N/A"}
                        </p>
                      </div>
                      <div className="border rounded-md p-3">
                        <p className="text-sm text-gray-500">Keyword match</p>
                        <p className="text-lg font-semibold text-gray-800">
                          {analysisDialog.analysis.keyword_phrase_match?.match_percentage !== undefined
                            ? `${analysisDialog.analysis.keyword_phrase_match.match_percentage}%`
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Layout comparison</p>
                      <p className="text-gray-600">
                        {analysisDialog.analysis.layouts_similar
                          ? "Template and uploaded layout look consistent."
                          : "Layout differences detected against the template."}
                      </p>
                    </div>
                    {analysisDialog.analysis.keyword_phrase_match && (
                      <div>
                        <p className="font-semibold text-gray-800">Keyword phrase matching</p>
                        <div className="bg-gray-50 border rounded-md p-3 space-y-2">
                          <p className="text-sm text-gray-600">
                            Checked phrases: {analysisDialog.analysis.keyword_phrase_match.phrases_checked.length}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <p className="text-sm font-medium text-green-700">Matched</p>
                              <ul className="mt-1 list-disc list-inside text-sm text-gray-700 space-y-1">
                                {analysisDialog.analysis.keyword_phrase_match.matched.length ? (
                                  analysisDialog.analysis.keyword_phrase_match.matched.map((phrase, idx) => (
                                    <li key={`matched-${idx}-${phrase}`}>{phrase}</li>
                                  ))
                                ) : (
                                  <li>No matches detected</li>
                                )}
                              </ul>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-red-700">Missing</p>
                              <ul className="mt-1 list-disc list-inside text-sm text-gray-700 space-y-1">
                                {analysisDialog.analysis.keyword_phrase_match.missing.length ? (
                                  analysisDialog.analysis.keyword_phrase_match.missing.map((phrase, idx) => (
                                    <li key={`missing-${idx}-${phrase}`}>{phrase}</li>
                                  ))
                                ) : (
                                  <li>All phrases present</li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {analysisDialog.analysis.issue_summary && (
                      <div>
                        <p className="font-semibold text-gray-800">Structural checks</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                          {Object.entries(issueSummaryLabels).map(([key, label]) => {
                            const count =
                              analysisDialog.analysis?.issue_summary?.[
                                key as keyof IssueSummary
                              ] || 0;
                            return (
                              <div key={key} className="border rounded-md p-3">
                                <p className="font-medium text-gray-700">{label}</p>
                                <p className="text-gray-600">
                                  {count > 0
                                    ? `${count} issue${count > 1 ? "s" : ""} detected`
                                    : "No issues detected"}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        <Dialog open={!!legalAnalysisDialog} onOpenChange={(open) => !open && closeLegalAnalysisDialog()}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{legalAnalysisDialog?.docName || "Legal Keywords Analysis"}</DialogTitle>
              <DialogDescription>
                Legal compliance and keyword matching results for your uploaded document.
              </DialogDescription>
            </DialogHeader>
            {legalAnalysisDialog ? (
              <div className="space-y-4 text-sm max-h-[60vh] overflow-y-auto">
                {legalAnalysisDialog.status === "processing" && (
                  <p className="text-gray-600 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing document for legal keywords compliance...
                  </p>
                )}
                {legalAnalysisDialog.status === "error" && (
                  <p className="text-red-500">{legalAnalysisDialog.error || "Analysis failed"}</p>
                )}
                {legalAnalysisDialog.status === "ready" && legalAnalysisDialog.analysis && (
                  <>
                    <div className="space-y-4">
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
                            <li key={`matched-${idx}`} className="text-green-700">
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
                            <li key={`missing-${idx}`} className="text-red-700">
                              <span className="font-medium">{item.keyword}</span>
                              <span className="text-gray-600 text-sm ml-2">({item.category})</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-600">No missing keywords</p>
                      )}
                    </div>

                    {legalAnalysisDialog.analysis?.recommendations?.length > 0 ? (
                      <>
                        <p className="font-semibold text-gray-800 mb-2">Recommendations</p>
                        <ul className="list-disc list-inside space-y-1">
                          {legalAnalysisDialog.analysis.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-gray-700">
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                  </div>
                <div className="border-t pt-4 mt-4 flex gap-2">
                  <Button
                    onClick={() => {
                      const analysis = legalAnalysisDialog.analysis;
                      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
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
                    <FileDown className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                </div>
              </>
                )}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </div>
    </>
  );
};

export default ApplicationWorkspace;
