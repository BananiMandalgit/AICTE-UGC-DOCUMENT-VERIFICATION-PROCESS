import { useState, useCallback } from "react";
import { api } from "@/lib/utils";

interface LegalKeywordAnalysis {
  document_id: string;
  document_name: string;
  analysis_type: string;
  timestamp: string;
  keyword_analysis: {
    total_keywords_checked: number;
    matched_count: number;
    missing_count: number;
    match_percentage: number;
    total_score: number;
    matched_keywords: Array<{
      keyword: string;
      category: string;
      score: number;
      found: boolean;
    }>;
    missing_keywords: Array<{
      keyword: string;
      category: string;
      score: number;
      found: boolean;
    }>;
  };
  compliance_status: string;
  summary: string;
  recommendations: string[];
  error?: string;
  message?: string;
}

interface UseLegalKeywordAnalysisResult {
  analysis: LegalKeywordAnalysis | null;
  loading: boolean;
  error: string | null;
  analyzeLegalKeywords: (
    pdfUrl: string,
    documentId: string,
    documentName: string
  ) => Promise<LegalKeywordAnalysis | null>;
  downloadHtmlReport: (
    pdfUrl: string,
    documentId: string,
    documentName: string
  ) => Promise<void>;
}

/**
 * Hook to analyze documents for legal keyword compliance
 */
export const useLegalKeywordAnalysis = (): UseLegalKeywordAnalysisResult => {
  const [analysis, setAnalysis] = useState<LegalKeywordAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeLegalKeywords = useCallback(
    async (
      pdfUrl: string,
      documentId: string,
      documentName: string
    ): Promise<LegalKeywordAnalysis | null> => {
      setLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("pdf_url", pdfUrl);
        formData.append("document_id", documentId);
        formData.append("document_name", documentName);

        const response = await api.post(
          "http://localhost:8000/analyze-legal-keywords",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const result = response.data as LegalKeywordAnalysis;
        setAnalysis(result);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to analyze legal keywords";
        setError(errorMessage);
        console.error("Legal keyword analysis error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const downloadHtmlReport = useCallback(
    async (
      pdfUrl: string,
      documentId: string,
      documentName: string
    ): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("pdf_url", pdfUrl);
        formData.append("document_id", documentId);
        formData.append("document_name", documentName);

        const response = await api.post(
          "http://localhost:8000/analyze-legal-keywords-html",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            responseType: "blob",
          }
        );

        // Create blob and open in new tab
        const blob = new Blob([response.data], { type: "text/html" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to download HTML report";
        setError(errorMessage);
        console.error("Download HTML report error:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    analysis,
    loading,
    error,
    analyzeLegalKeywords,
    downloadHtmlReport,
  };
};
