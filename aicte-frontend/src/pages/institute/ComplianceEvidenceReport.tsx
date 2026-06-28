import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { SERVER_URL } from "@/constants/API";

const ComplianceEvidenceReport = () => {
  const { uni_doc_id } = useParams();
  const navigate = useNavigate();
  const [evidence, setEvidence] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    console.log("[EvidenceReport] Starting fetch for uni_doc_id:", uni_doc_id);
    console.log("[EvidenceReport] SERVER_URL:", SERVER_URL);
    const authStoreRaw = localStorage.getItem("auth-store");
    let tokenPresent = false;
    try {
      const authStore = authStoreRaw ? JSON.parse(authStoreRaw) : null;
      tokenPresent = Boolean(authStore?.state?.token);
    } catch (parseError) {
      tokenPresent = false;
    }
    console.log("[EvidenceReport] Token present:", tokenPresent);
    
    const fetchEvidence = async () => {
      try {
        if (!uni_doc_id) {
          console.error("[EvidenceReport] uni_doc_id is undefined or empty");
          setErrorMessage("Invalid evidence link - no document ID provided.");
          setLoading(false);
          return;
        }

        console.log("[EvidenceReport] Making API call to:", `/api/institute/evidence/${uni_doc_id}`);
        
        const response = await api.get(
          `/api/institute/evidence/${uni_doc_id}`
        );
        
        console.log("[EvidenceReport] Response status:", response.status);
        console.log("[EvidenceReport] Full response data:", response.data);
        
        if (response.data.success && response.data.data) {
          setEvidence(response.data.data);
          console.log("[EvidenceReport] Evidence set successfully");
        } else {
          console.error("[EvidenceReport] Response missing data:", response.data);
          setErrorMessage(response.data.message || "No evidence data returned from server.");
        }
      } catch (error: any) {
        console.error("[EvidenceReport] Error fetching evidence:", error);
        console.error("[EvidenceReport] Error response:", error.response);
        console.error("[EvidenceReport] Error status:", error.response?.status);
        console.error("[EvidenceReport] Error data:", error.response?.data);
        
        if (error.response) {
          const status = error.response.status;
          const message = error.response.data?.message || error.response.statusText;
          
          if (status === 404) {
            setErrorMessage(`Document not found (ID: ${uni_doc_id}). The document may not exist or has been deleted.`);
          } else if (status === 401) {
            setErrorMessage("Unauthorized - Please login again to view this evidence report.");
          } else if (status === 500) {
            setErrorMessage(`Server error: ${message}. Please try again later.`);
          } else {
            setErrorMessage(`Failed to fetch evidence report: ${message} (Status: ${status})`);
          }
        } else if (error.request) {
          console.error("[EvidenceReport] No response received from server");
          setErrorMessage("Network error - Unable to reach the server. Please check your connection.");
        } else {
          setErrorMessage(`Error: ${error.message || "Unknown error occurred"}`);
        }
      } finally {
        setLoading(false);
        console.log("[EvidenceReport] Fetch completed");
      }
    };

    fetchEvidence();
  }, [uni_doc_id]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading evidence report for document: {uni_doc_id}...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="p-6 space-y-4">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error Loading Evidence Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{errorMessage}</p>
            <p className="text-sm text-gray-600 mb-2">Document ID: {uni_doc_id || "undefined"}</p>
            <Button variant="outline" onClick={() => navigate("/institute/applications")}> 
              Back to Applications
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!evidence) {
    return (
      <div className="p-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>No Evidence Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">No evidence data available for this document.</p>
            <p className="text-sm text-gray-500 mb-2">Document ID: {uni_doc_id}</p>
            <Button variant="outline" onClick={() => navigate("/institute/applications")}> 
              Back to Applications
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const templateMetrics = evidence?.extractedTexts || {};
  const errors = Array.isArray(evidence?.errors) ? evidence.errors : [];
  const legalAnalysis = evidence?.legalAnalysisJson || {};
  const facultyAnalysis = evidence?.facultyAnalysisJson || {};
  const researchEligibility = evidence?.researchEligibilityJson || {};

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Template Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Format Match Percentage: {templateMetrics.format_match_percentage ?? "N/A"}%</p>
          <p>Layout Match Score: {templateMetrics.layout_match_score ?? "N/A"}</p>
          {templateMetrics.keyword_phrase_match && (
            <p>
              Keyword Match Percentage: {templateMetrics.keyword_phrase_match?.match_percentage ?? "N/A"}%
            </p>
          )}
        </CardContent>
      </Card>

      <Separator className="my-4" />

      <Card>
        <CardHeader>
          <CardTitle>Layout Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Issue Summary: {errors.length}</p>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Page Number</TableCell>
                <TableCell>Bounding Rect</TableCell>
                <TableCell>Comment</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {errors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3}>No layout issues found.</TableCell>
                </TableRow>
              ) : (
                errors.map((error: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{error.pageNumber ?? "N/A"}</TableCell>
                    <TableCell>
                      {error.boundingRect
                        ? `x1: ${error.boundingRect.x1}, y1: ${error.boundingRect.y1}, x2: ${error.boundingRect.x2}, y2: ${error.boundingRect.y2}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>{error.comment ?? "N/A"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Separator className="my-4" />

      <Card>
        <CardHeader>
          <CardTitle>Legal Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Match Percentage: {legalAnalysis.match_percentage ?? "N/A"}%</p>
          <p>Compliance Status: {legalAnalysis.compliance_status ?? "N/A"}</p>
          <p>Missing Keywords:</p>
          <ul>
            {Array.isArray(legalAnalysis.missing_keywords) && legalAnalysis.missing_keywords.length > 0 ? (
              legalAnalysis.missing_keywords.map((keyword: string, index: number) => (
                <li key={index}>{keyword}</li>
              ))
            ) : (
              <li>None</li>
            )}
          </ul>
        </CardContent>
      </Card>

      <Separator className="my-4" />

      <Card>
        <CardHeader>
          <CardTitle>Faculty Eligibility Evidence</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Overall Score: {facultyAnalysis.overall_score ?? "N/A"}</p>
          <p>Validation Status: {facultyAnalysis.validation_status ?? "N/A"}</p>
          <p>Issues Found:</p>
          <ul>
            {Array.isArray(facultyAnalysis.issues_found) && facultyAnalysis.issues_found.length > 0 ? (
              facultyAnalysis.issues_found.map((issue: string, index: number) => (
                <li key={index}>{issue}</li>
              ))
            ) : (
              <li>None</li>
            )}
          </ul>
          <p>Recommendations:</p>
          <ul>
            {Array.isArray(facultyAnalysis.recommendations) && facultyAnalysis.recommendations.length > 0 ? (
              facultyAnalysis.recommendations.map((recommendation: string, index: number) => (
                <li key={index}>{recommendation}</li>
              ))
            ) : (
              <li>None</li>
            )}
          </ul>
        </CardContent>
      </Card>

      <Separator className="my-4" />

      <Card>
        <CardHeader>
          <CardTitle>Research Eligibility Evidence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-semibold">Eligibility Status:</p>
              <Badge
                variant={researchEligibility.eligibility_status === "ELIGIBLE" ? "default" : researchEligibility.eligibility_status === "NEEDS_REVIEW" ? "secondary" : "destructive"}
              >
                {researchEligibility.eligibility_status ?? "N/A"}
              </Badge>
            </div>

            <div>
              <p className="font-semibold">Document Type:</p>
              <p>{researchEligibility.document_type ?? "N/A"}</p>
            </div>

            <div>
              <p className="font-semibold">Missing Evidence:</p>
              <ul className="list-disc list-inside">
                {Array.isArray(researchEligibility.missing_evidence) && researchEligibility.missing_evidence.length > 0 ? (
                  researchEligibility.missing_evidence.map((item: string, index: number) => (
                    <li key={index} className="text-red-600">{item}</li>
                  ))
                ) : (
                  <li className="text-green-600">No missing evidence</li>
                )}
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-2">Verification Checks:</p>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Check Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.isArray(researchEligibility.checks) && researchEligibility.checks.length > 0 ? (
                    researchEligibility.checks.map((check: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{check.name ?? "N/A"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={check.status === "PASS" ? "default" : check.status === "NEEDS_REVIEW" ? "secondary" : "destructive"}
                          >
                            {check.status ?? "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>{check.remarks ?? "N/A"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3}>No checks performed</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {researchEligibility.timestamp && (
              <div>
                <p className="text-sm text-gray-500">
                  Last Updated: {new Date(researchEligibility.timestamp).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceEvidenceReport;
