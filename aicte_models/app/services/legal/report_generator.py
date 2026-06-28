"""
HTML Report Generator for Legal Keyword Analysis
"""

from datetime import datetime
from typing import Dict, List


class LegalKeywordReportGenerator:
    """Generate HTML reports for legal keyword analysis"""

    @staticmethod
    def generate_html_report(analysis_data: Dict) -> str:
        """
        Generate professional HTML report from analysis data

        Args:
            analysis_data: Analysis result dictionary from LegalKeywordAnalyzer

        Returns:
            HTML string ready to render
        """
        doc_id = analysis_data.get("document_id", "unknown")
        doc_name = analysis_data.get("document_name", "Document")
        timestamp = analysis_data.get("timestamp", datetime.now().isoformat())
        status = analysis_data.get("compliance_status", "UNKNOWN")
        keywords_data = analysis_data.get("keyword_analysis", {})
        recommendations = analysis_data.get("recommendations", [])

        # Status styling
        status_color = {
            "PASS": "#10b981",  # Green
            "WARNING": "#f59e0b",  # Orange
            "FAIL": "#ef4444",  # Red
            "NOT_APPLICABLE": "#6b7280",  # Gray
        }
        status_bg = {
            "PASS": "#ecfdf5",
            "WARNING": "#fffbeb",
            "FAIL": "#fef2f2",
            "NOT_APPLICABLE": "#f9fafb",
        }

        color = status_color.get(status, "#0b6e4f")
        bg_color = status_bg.get(status, "#f3f4f6")

        # Build matched keywords HTML
        matched_html = ""
        for kw in keywords_data.get("matched_keywords", []):
            matched_html += f"""
            <div class="keyword-item matched">
                <span class="keyword-name">{kw.get('keyword', 'N/A')}</span>
                <span class="keyword-category">{kw.get('category', 'N/A')}</span>
                <span class="keyword-score">Score: {kw.get('score', 0)}</span>
                <span class="keyword-status">✅ Found</span>
            </div>
            """

        # Build missing keywords HTML
        missing_html = ""
        for kw in keywords_data.get("missing_keywords", []):
            missing_html += f"""
            <div class="keyword-item missing">
                <span class="keyword-name">{kw.get('keyword', 'N/A')}</span>
                <span class="keyword-category">{kw.get('category', 'N/A')}</span>
                <span class="keyword-score">Score: {kw.get('score', 0)}</span>
                <span class="keyword-status">❌ Missing</span>
            </div>
            """

        # Build recommendations HTML
        recommendations_html = ""
        for i, rec in enumerate(recommendations, 1):
            recommendations_html += f'<li class="recommendation-item">{rec}</li>\n'

        html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Legal Keyword Analysis Report - {doc_name}</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background-color: #f9fafb;
            padding: 20px;
        }}
        .container {{
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
            overflow: hidden;
        }}
        .header {{
            background: linear-gradient(135deg, #0b6e4f 0%, #095a40 100%);
            color: white;
            padding: 40px;
            border-bottom: 4px solid #1e40af;
        }}
        .header h1 {{
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: 700;
        }}
        .header-meta {{
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-top: 20px;
            font-size: 14px;
            opacity: 0.95;
        }}
        .meta-item {{
            display: flex;
            flex-direction: column;
        }}
        .meta-label {{
            font-size: 12px;
            opacity: 0.8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        .meta-value {{
            font-weight: 600;
            margin-top: 4px;
        }}
        .status-badge {{
            display: inline-block;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 18px;
            margin-top: 15px;
            background-color: {bg_color};
            color: {color};
            border: 2px solid {color};
        }}
        .content {{
            padding: 40px;
        }}
        .section {{
            margin-bottom: 40px;
        }}
        .section-title {{
            font-size: 22px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 3px solid #e5e7eb;
        }}
        .metrics {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        .metric-card {{
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #0b6e4f;
            text-align: center;
        }}
        .metric-label {{
            font-size: 12px;
            text-transform: uppercase;
            color: #6b7280;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }}
        .metric-value {{
            font-size: 32px;
            font-weight: 700;
            color: #1f2937;
        }}
        .keywords-container {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }}
        .keywords-section {{
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }}
        .keywords-title {{
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }}
        .keyword-item {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            margin-bottom: 10px;
            border-radius: 6px;
            border-left: 4px solid #e5e7eb;
            font-size: 13px;
        }}
        .keyword-item.matched {{
            background: #ecfdf5;
            border-left-color: #10b981;
        }}
        .keyword-item.missing {{
            background: #fef2f2;
            border-left-color: #ef4444;
        }}
        .keyword-name {{
            font-weight: 600;
            flex: 1;
            color: #1f2937;
        }}
        .keyword-category {{
            background: rgba(37, 99, 235, 0.1);
            color: #0b6e4f;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            margin: 0 8px;
            white-space: nowrap;
        }}
        .keyword-score {{
            color: #6b7280;
            margin: 0 8px;
            white-space: nowrap;
        }}
        .keyword-status {{
            font-weight: 700;
            white-space: nowrap;
        }}
        .recommendations {{
            background: linear-gradient(135deg, #fef3c7 0%, #fef9e7 100%);
            border-left: 4px solid #f59e0b;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
        }}
        .recommendations-title {{
            font-weight: 700;
            margin-bottom: 12px;
            color: #b45309;
            display: flex;
            align-items: center;
            gap: 8px;
        }}
        .recommendations ol {{
            margin-left: 20px;
        }}
        .recommendation-item {{
            margin-bottom: 8px;
            color: #78350f;
            line-height: 1.5;
        }}
        .footer {{
            background: #f3f4f6;
            padding: 20px 40px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
        }}
        .no-rules {{
            background: #f0fdf4;
            border: 2px dashed #22c55e;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            color: #166534;
        }}
        @media print {{
            body {{
                background: white;
            }}
            .container {{
                box-shadow: none;
            }}
        }}
        @media (max-width: 768px) {{
            .header {{
                padding: 20px;
            }}
            .content {{
                padding: 20px;
            }}
            .header-meta {{
                grid-template-columns: 1fr;
            }}
            .keywords-container {{
                grid-template-columns: 1fr;
            }}
            .keyword-item {{
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Legal Keyword Analysis Report</h1>
            <div class="status-badge">{status}</div>
            <div class="header-meta">
                <div class="meta-item">
                    <span class="meta-label">Document</span>
                    <span class="meta-value">{doc_name}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Document ID</span>
                    <span class="meta-value">{doc_id}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Generated</span>
                    <span class="meta-value">{datetime.fromisoformat(timestamp).strftime('%Y-%m-%d %H:%M:%S')}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Analysis Type</span>
                    <span class="meta-value">Legal Keywords</span>
                </div>
            </div>
        </div>

        <div class="content">
            <!-- Metrics Section -->
            <div class="section">
                <h2 class="section-title">📊 Analysis Metrics</h2>
                <div class="metrics">
                    <div class="metric-card">
                        <div class="metric-label">Total Keywords</div>
                        <div class="metric-value">{keywords_data.get('total_keywords_checked', 0)}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Matched</div>
                        <div class="metric-value" style="color: #10b981;">{keywords_data.get('matched_count', 0)}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Missing</div>
                        <div class="metric-value" style="color: #ef4444;">{keywords_data.get('missing_count', 0)}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Match %</div>
                        <div class="metric-value" style="color: {color};">{keywords_data.get('match_percentage', 0):.1f}%</div>
                    </div>
                </div>
            </div>

            <!-- Keywords Section -->
            <div class="section">
                <h2 class="section-title">🔍 Keyword Analysis</h2>
                <div class="keywords-container">
                    <div class="keywords-section">
                        <div class="keywords-title">✅ Matched Keywords ({len(keywords_data.get('matched_keywords', []))})</div>
                        {matched_html if matched_html else '<div style="color: #9ca3af; text-align: center; padding: 20px;">No matched keywords</div>'}
                    </div>
                    <div class="keywords-section">
                        <div class="keywords-title">❌ Missing Keywords ({len(keywords_data.get('missing_keywords', []))})</div>
                        {missing_html if missing_html else '<div style="color: #9ca3af; text-align: center; padding: 20px;">No missing keywords</div>'}
                    </div>
                </div>
            </div>

            <!-- Recommendations Section -->
            {'<div class="section"><div class="recommendations"><div class="recommendations-title">💡 Recommendations</div><ol>' + recommendations_html + '</ol></div></div>' if recommendations else ''}

        </div>

        <div class="footer">
            <p>This report was automatically generated by the AICTE Document Verification System.</p>
            <p>For questions or support, please contact the administration.</p>
        </div>
    </div>
</body>
</html>
"""
        return html_content
