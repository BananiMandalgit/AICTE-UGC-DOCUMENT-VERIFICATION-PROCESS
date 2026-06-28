import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Credential {
  type: string;
  name: string;
  institution: string;
  year: string;
  status: "VERIFIED" | "UNVERIFIED" | "INCOMPLETE";
}

interface ValidationCheck {
  score: number;
  issues: string[];
}

interface Issue {
  severity: "CRITICAL" | "WARNING" | "INFO";
  issue: string;
  recommendation: string;
}

interface Recommendation {
  priority: "HIGH" | "MEDIUM" | "LOW";
  recommendation: string;
  impact: string;
}

interface FacultyAnalysis {
  overall_score: number;
  validation_status: "VALID" | "INVALID" | "NEEDS_REVIEW";
  credentials_found: Credential[];
  qualifications: {
    highest_degree: string;
    years_experience: string;
    specializations: string[];
    certifications: string[];
  };
  validation_checks: {
    document_completeness: ValidationCheck;
    credential_authenticity: ValidationCheck;
    experience_relevance: ValidationCheck;
    publication_record: ValidationCheck;
  };
  issues_found: Issue[];
  strengths: string[];
  recommendations: Recommendation[];
  compliance_status: string;
  summary: string;
}

interface FacultyScoreReportProps {
  analysis: FacultyAnalysis | null;
  isLoading?: boolean;
}

export const FacultyScoreReport: React.FC<FacultyScoreReportProps> = ({
  analysis,
  isLoading = false,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "VALID":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "INVALID":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "NEEDS_REVIEW":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-rose-600";
  };

  const downloadReport = () => {
    if (!analysis) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Faculty Score Validation Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: #f8fafc;
            padding: 40px 20px;
            color: #1e293b;
            line-height: 1.6;
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
          }
          .header h1 { font-size: 2.5em; margin-bottom: 10px; }
          .header p { opacity: 0.9; font-size: 1.1em; }
          .content { padding: 40px; }
          .score-section {
            background: #f0f9ff;
            border: 2px solid #0ea5e9;
            border-radius: 8px;
            padding: 30px;
            margin-bottom: 30px;
            text-align: center;
          }
          .score-display {
            font-size: 3.5em;
            font-weight: bold;
            color: #0ea5e9;
            margin: 10px 0;
          }
          .status-badge {
            display: inline-block;
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: 600;
            margin-top: 15px;
          }
          .status-badge.valid { background: #dcfce7; color: #166534; }
          .status-badge.invalid { background: #fee2e2; color: #991b1b; }
          .status-badge.review { background: #fef08a; color: #854d0e; }
          .section { margin-bottom: 40px; }
          .section h2 {
            font-size: 1.5em;
            color: #1e293b;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e2e8f0;
          }
          .credentials-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
          }
          .credential-card {
            background: #f8f9fa;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
          }
          .credential-card h4 {
            color: #667eea;
            margin-bottom: 10px;
          }
          .credential-detail {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 0.95em;
          }
          .credential-detail strong { color: #475569; }
          .status-valid { color: #16a34a; font-weight: 600; }
          .status-unverified { color: #f59e0b; font-weight: 600; }
          .status-incomplete { color: #ef4444; font-weight: 600; }
          .validation-checks {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
          }
          .check-card {
            background: #f1f5f9;
            border-radius: 8px;
            padding: 20px;
          }
          .check-card h4 { color: #475569; margin-bottom: 15px; }
          .score-bar {
            width: 100%;
            height: 8px;
            background: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 10px;
          }
          .score-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            width: var(--score);
          }
          .score-text {
            font-size: 1.2em;
            font-weight: bold;
            color: #667eea;
          }
          .issues-list { list-style: none; margin-bottom: 20px; }
          .issue-item {
            background: #fff5f5;
            border-left: 4px solid #ef4444;
            padding: 15px;
            margin-bottom: 12px;
            border-radius: 4px;
          }
          .issue-item.warning {
            background: #fffbeb;
            border-left-color: #f59e0b;
          }
          .issue-item.info {
            background: #f0f9ff;
            border-left-color: #0ea5e9;
          }
          .issue-severity {
            display: inline-block;
            font-size: 0.8em;
            font-weight: 600;
            padding: 3px 8px;
            border-radius: 3px;
            margin-right: 10px;
          }
          .issue-severity.critical { background: #fee2e2; color: #991b1b; }
          .issue-severity.warning { background: #fef3c7; color: #92400e; }
          .issue-severity.info { background: #dbeafe; color: #1e40af; }
          .strengths-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
          }
          .strength-badge {
            background: #dcfce7;
            border: 1px solid #86efac;
            color: #166534;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
            font-weight: 500;
          }
          .recommendations-list {
            list-style: none;
            margin-bottom: 20px;
          }
          .recommendation-item {
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            padding: 15px;
            margin-bottom: 12px;
            border-radius: 6px;
          }
          .recommendation-priority {
            display: inline-block;
            font-size: 0.75em;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 3px;
            margin-right: 10px;
          }
          .recommendation-priority.high { background: #fee2e2; color: #991b1b; }
          .recommendation-priority.medium { background: #fef3c7; color: #92400e; }
          .recommendation-priority.low { background: #dbeafe; color: #1e40af; }
          .summary-box {
            background: #f0fdf4;
            border: 2px solid #86efac;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
          }
          .summary-box h3 { color: #166534; margin-bottom: 10px; }
          .footer {
            background: #f1f5f9;
            padding: 20px;
            text-align: center;
            color: #64748b;
            font-size: 0.9em;
            border-top: 1px solid #e2e8f0;
          }
          .specialization-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 10px;
          }
          .spec-tag {
            background: #dbeafe;
            color: #1e40af;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.9em;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Faculty Score Validation Report</h1>
            <p>Comprehensive Credentials Analysis powered by Llama AI</p>
          </div>
          
          <div class="content">
            <div class="score-section">
              <div style="color: #64748b; font-size: 1.1em;">Overall Validation Score</div>
              <div class="score-display">${analysis.overall_score}/100</div>
              <div class="status-badge ${analysis.validation_status.toLowerCase() === 'valid' ? 'valid' : analysis.validation_status.toLowerCase() === 'invalid' ? 'invalid' : 'review'}">
                ${analysis.validation_status}
              </div>
              <div style="color: #64748b; margin-top: 15px; font-style: italic;">
                Compliance: <strong>${analysis.compliance_status}</strong>
              </div>
            </div>

            ${analysis.summary ? `
              <div class="summary-box">
                <h3>📋 Summary</h3>
                <p>${analysis.summary}</p>
              </div>
            ` : ''}

            ${analysis.credentials_found && analysis.credentials_found.length > 0 ? `
              <div class="section">
                <h2>🎓 Credentials Found (${analysis.credentials_found.length})</h2>
                <div class="credentials-grid">
                  ${analysis.credentials_found.map((cred, idx) => `
                    <div class="credential-card">
                      <h4>${cred.type}</h4>
                      <div class="credential-detail">
                        <strong>Name:</strong>
                        <span>${cred.name}</span>
                      </div>
                      <div class="credential-detail">
                        <strong>Institution:</strong>
                        <span>${cred.institution}</span>
                      </div>
                      <div class="credential-detail">
                        <strong>Year:</strong>
                        <span>${cred.year}</span>
                      </div>
                      <div class="credential-detail">
                        <strong>Status:</strong>
                        <span class="status-${cred.status.toLowerCase()}">${cred.status}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${analysis.qualifications ? `
              <div class="section">
                <h2>📚 Qualifications Summary</h2>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                  <div style="margin-bottom: 15px;">
                    <strong style="color: #475569;">Highest Degree:</strong>
                    <div style="color: #667eea; font-size: 1.1em; margin-top: 5px;">${analysis.qualifications.highest_degree}</div>
                  </div>
                  <div style="margin-bottom: 15px;">
                    <strong style="color: #475569;">Years of Experience:</strong>
                    <div style="color: #667eea; font-size: 1.1em; margin-top: 5px;">${analysis.qualifications.years_experience}</div>
                  </div>
                  ${analysis.qualifications.specializations && analysis.qualifications.specializations.length > 0 ? `
                    <div style="margin-bottom: 15px;">
                      <strong style="color: #475569;">Specializations:</strong>
                      <div class="specialization-list">
                        ${analysis.qualifications.specializations.map(spec => `<span class="spec-tag">${spec}</span>`).join('')}
                      </div>
                    </div>
                  ` : ''}
                  ${analysis.qualifications.certifications && analysis.qualifications.certifications.length > 0 ? `
                    <div>
                      <strong style="color: #475569;">Certifications:</strong>
                      <div class="specialization-list">
                        ${analysis.qualifications.certifications.map(cert => `<span class="spec-tag">${cert}</span>`).join('')}
                      </div>
                    </div>
                  ` : ''}
                </div>
              </div>
            ` : ''}

            ${analysis.validation_checks ? `
              <div class="section">
                <h2>✅ Validation Checks</h2>
                <div class="validation-checks">
                  ${Object.entries(analysis.validation_checks).map(([key, check]) => `
                    <div class="check-card">
                      <h4>${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                      <div class="score-bar">
                        <div class="score-fill" style="--score: ${check.score}%"></div>
                      </div>
                      <div class="score-text">${check.score}/100</div>
                      ${check.issues && check.issues.length > 0 ? `
                        <ul style="list-style: none; margin-top: 10px; font-size: 0.9em;">
                          ${check.issues.map(issue => `<li style="color: #666;">• ${issue}</li>`).join('')}
                        </ul>
                      ` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${analysis.strengths && analysis.strengths.length > 0 ? `
              <div class="section">
                <h2>💪 Identified Strengths</h2>
                <div class="strengths-grid">
                  ${analysis.strengths.map(strength => `
                    <div class="strength-badge">✓ ${strength}</div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${analysis.issues_found && analysis.issues_found.length > 0 ? `
              <div class="section">
                <h2>⚠️ Issues Found (${analysis.issues_found.length})</h2>
                <ul class="issues-list">
                  ${analysis.issues_found.map(issue => `
                    <li class="issue-item ${issue.severity.toLowerCase()}">
                      <span class="issue-severity ${issue.severity.toLowerCase()}">${issue.severity}</span>
                      <strong>${issue.issue}</strong>
                      <div style="margin-top: 8px; color: #555;">
                        <em>💡 Recommendation:</em> ${issue.recommendation}
                      </div>
                    </li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}

            ${analysis.recommendations && analysis.recommendations.length > 0 ? `
              <div class="section">
                <h2>🎯 Recommendations</h2>
                <ul class="recommendations-list">
                  ${analysis.recommendations.map(rec => `
                    <li class="recommendation-item">
                      <span class="recommendation-priority ${rec.priority.toLowerCase()}">${rec.priority}</span>
                      <strong>${rec.recommendation}</strong>
                      <div style="margin-top: 8px; color: #555;">
                        Impact: ${rec.impact}
                      </div>
                    </li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
          </div>

          <div class="footer">
            <p>Generated: ${new Date().toLocaleString()}</p>
            <p>Faculty Score Validation System - Powered by Llama AI</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Faculty-Validation-Report-${new Date().getTime()}.html`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 text-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center bg-slate-50">
        <p className="text-slate-500">No validation report available yet.</p>
        <p className="text-sm text-slate-400 mt-2">Upload a faculty credentials PDF to see the analysis report.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Score Section */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-8">
        <div className="text-center">
          <p className="text-slate-600 text-sm font-medium mb-2">VALIDATION SCORE</p>
          <div className={`text-5xl font-bold mb-4 ${getScoreColor(analysis.overall_score)}`}>
            {analysis.overall_score}
            <span className="text-2xl">/100</span>
          </div>
          <div className="flex justify-center gap-3 flex-wrap">
            <Badge className={`${getStatusColor(analysis.validation_status)} border`}>
              {analysis.validation_status}
            </Badge>
            <Badge variant="outline" className="bg-slate-50">
              Compliance: {analysis.compliance_status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Summary */}
      {analysis.summary && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">Summary</AlertTitle>
          <AlertDescription className="text-blue-800">{analysis.summary}</AlertDescription>
        </Alert>
      )}

      {/* Credentials Found */}
      {analysis.credentials_found && analysis.credentials_found.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            🎓 Credentials Found ({analysis.credentials_found.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {analysis.credentials_found.map((cred, idx) => (
              <Card key={idx} className="border-slate-200">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Type</p>
                      <p className="text-slate-900 font-semibold">{cred.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Name</p>
                      <p className="text-slate-700">{cred.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Institution</p>
                      <p className="text-slate-700">{cred.institution}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Year</p>
                      <p className="text-slate-700">{cred.year}</p>
                    </div>
                    <div>
                      <Badge
                        className={
                          cred.status === "VERIFIED"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : cred.status === "UNVERIFIED"
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : "bg-rose-100 text-rose-800 border-rose-200"
                        }
                      >
                        {cred.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Validation Checks */}
      {analysis.validation_checks && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            ✅ Validation Checks
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(analysis.validation_checks).map(([key, check]) => (
              <Card key={key} className="border-slate-200">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 mb-2">
                        {key
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </p>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                          style={{ width: `${check.score}%` }}
                        ></div>
                      </div>
                      <p className={`text-2xl font-bold mt-2 ${getScoreColor(check.score)}`}>
                        {check.score}%
                      </p>
                    </div>
                    {check.issues && check.issues.length > 0 && (
                      <div className="bg-amber-50 rounded p-3 border border-amber-200">
                        <p className="text-xs font-semibold text-amber-900 mb-2">Issues:</p>
                        <ul className="text-xs text-amber-800 space-y-1">
                          {check.issues.map((issue, idx) => (
                            <li key={idx}>• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {analysis.strengths && analysis.strengths.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            💪 Strengths ({analysis.strengths.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {analysis.strengths.map((strength, idx) => (
              <Badge key={idx} className="bg-emerald-100 text-emerald-800 border-emerald-200 border">
                ✓ {strength}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Issues */}
      {analysis.issues_found && analysis.issues_found.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            ⚠️ Issues Found ({analysis.issues_found.length})
          </h3>
          <div className="space-y-3">
            {analysis.issues_found.map((issue, idx) => (
              <Alert
                key={idx}
                className={
                  issue.severity === "CRITICAL"
                    ? "border-rose-200 bg-rose-50"
                    : issue.severity === "WARNING"
                    ? "border-amber-200 bg-amber-50"
                    : "border-blue-200 bg-blue-50"
                }
              >
                <AlertTriangle
                  className={`h-4 w-4 ${
                    issue.severity === "CRITICAL"
                      ? "text-rose-600"
                      : issue.severity === "WARNING"
                      ? "text-amber-600"
                      : "text-blue-600"
                  }`}
                />
                <div>
                  <AlertTitle
                    className={
                      issue.severity === "CRITICAL"
                        ? "text-rose-900"
                        : issue.severity === "WARNING"
                        ? "text-amber-900"
                        : "text-blue-900"
                    }
                  >
                    {issue.severity}: {issue.issue}
                  </AlertTitle>
                  <AlertDescription
                    className={
                      issue.severity === "CRITICAL"
                        ? "text-rose-800"
                        : issue.severity === "WARNING"
                        ? "text-amber-800"
                        : "text-blue-800"
                    }
                  >
                    <strong>Recommendation:</strong> {issue.recommendation}
                  </AlertDescription>
                </div>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            🎯 Recommendations ({analysis.recommendations.length})
          </h3>
          <div className="space-y-3">
            {analysis.recommendations.map((rec, idx) => (
              <Card
                key={idx}
                className={
                  rec.priority === "HIGH"
                    ? "border-rose-200 bg-rose-50"
                    : rec.priority === "MEDIUM"
                    ? "border-amber-200 bg-amber-50"
                    : "border-blue-200 bg-blue-50"
                }
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Badge
                      className={
                        rec.priority === "HIGH"
                          ? "bg-rose-100 text-rose-800 border-rose-200"
                          : rec.priority === "MEDIUM"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-blue-100 text-blue-800 border-blue-200"
                      }
                    >
                      {rec.priority}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{rec.recommendation}</p>
                      <p className="text-sm text-slate-600 mt-2">
                        <strong>Impact:</strong> {rec.impact}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Download Button */}
      <div className="flex justify-end pt-4 border-t border-slate-200">
        <Button
          onClick={downloadReport}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Full Report
        </Button>
      </div>
    </div>
  );
};

export default FacultyScoreReport;
