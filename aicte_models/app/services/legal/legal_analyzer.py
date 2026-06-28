"""
Legal Keyword Analysis Service
Analyzes documents for compliance with legal/regulatory keywords
"""

import re
import logging
from typing import List, Dict, Tuple
from datetime import datetime
import pdfplumber
from pathlib import Path

from .keywords_db import DOCUMENT_RULES

logger = logging.getLogger(__name__)


class LegalKeywordAnalyzer:
    """Analyzes documents for legal keyword compliance"""

    @staticmethod
    def extract_text_from_pdf(pdf_path: str) -> str:
        """Extract text from PDF file"""
        try:
            pdf_path = Path(pdf_path)
            if not pdf_path.exists():
                raise FileNotFoundError(f"PDF file not found: {pdf_path}")

            pages = []
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    text = page.extract_text() or ""
                    text = text.strip()
                    if text:
                        pages.append(text)

            if not pages:
                raise ValueError(f"No extractable text found in PDF: {pdf_path}")

            return "\n".join(pages)
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise

    @staticmethod
    def analyze_keywords(
        text: str, document_id: str, document_name: str = "Document"
    ) -> Dict:
        """
        Analyze document text for legal keywords.

        Args:
            text: Document text to analyze
            document_id: Document type ID (e.g., 'affidavit1', 'new_institute_0')
            document_name: Human-readable document name

        Returns:
            Dictionary with analysis results
        """
        # Get keyword set for this document type
        keywords_list = DOCUMENT_RULES.get(document_id)

        if not keywords_list:
            return LegalKeywordAnalyzer._generate_no_rules_response(
                document_id, document_name
            )

        # Normalize text for matching
        text_lower = text.lower()
        
        logger.info(f"Analyzing document: {document_id}, Text length: {len(text_lower)} characters")
        logger.info(f"Total keywords to check: {len(keywords_list)}")

        # Perform keyword matching
        matched_keywords = []
        missing_keywords = []
        total_score = 0

        for kw_dict in keywords_list:
            keyword = kw_dict.get("keyword", "").lower()
            category = kw_dict.get("category", "Unknown")
            score = kw_dict.get("score", 1)

            # Check if keyword exists in text
            if LegalKeywordAnalyzer._keyword_exists(text_lower, keyword):
                matched_keywords.append(
                    {
                        "keyword": kw_dict.get("keyword", keyword),
                        "category": category,
                        "score": score,
                        "found": True,
                    }
                )
                total_score += score
                logger.debug(f"Matched keyword: {keyword}")
            else:
                missing_keywords.append(
                    {
                        "keyword": kw_dict.get("keyword", keyword),
                        "category": category,
                        "score": score,
                        "found": False,
                    }
                )
                logger.debug(f"Missing keyword: {keyword}")

        # Calculate metrics
        match_percentage = (len(matched_keywords) / len(keywords_list) * 100) if keywords_list else 0
        compliance_status = LegalKeywordAnalyzer._determine_compliance_status(
            match_percentage, len(missing_keywords)
        )

        return {
            "document_id": document_id,
            "document_name": document_name,
            "document_type": document_id,
            "analysis_type": "LEGAL_KEYWORDS",
            "timestamp": datetime.now().isoformat(),
            "total_keywords_checked": len(keywords_list),
            "matched_count": len(matched_keywords),
            "missing_count": len(missing_keywords),
            "match_percentage": round(match_percentage, 2),
            "total_score": total_score,
            "matched_keywords": matched_keywords,
            "missing_keywords": missing_keywords,
            "compliance_status": compliance_status,
            "summary": LegalKeywordAnalyzer._generate_summary(
                match_percentage, len(missing_keywords), compliance_status
            ),
            "recommendations": LegalKeywordAnalyzer._generate_recommendations(
                missing_keywords, compliance_status
            ),
        }

    @staticmethod
    def _keyword_exists(text: str, keyword: str) -> bool:
        """Check if keyword exists in text with flexible matching"""
        import re
        
        # Normalize both text and keyword for comparison
        text_normalized = text.lower().strip()
        keyword_normalized = keyword.lower().strip()
        
        # Direct substring match
        if keyword_normalized in text_normalized:
            return True

        # Word-based flexible matching - check if all words exist
        words = keyword_normalized.split()
        if len(words) > 1:
            # Create a regex pattern that allows flexible matching with word boundaries
            # This matches words even if separated by special characters or whitespace
            pattern = r'\b' + r'\W+'.join(re.escape(word) for word in words) + r'\b'
            if re.search(pattern, text_normalized):
                return True
            
            # Fallback: simple check if all words exist anywhere in text
            for word in words:
                if word not in text_normalized:
                    return False
            return True

        # Single word - check with word boundaries
        if re.search(r'\b' + re.escape(keyword_normalized) + r'\b', text_normalized):
            return True
            
        return keyword_normalized in text_normalized

    @staticmethod
    def _determine_compliance_status(match_percentage: float, missing_count: int) -> str:
        """Determine PASS/WARNING/FAIL status"""
        if match_percentage >= 75 and missing_count <= 3:
            return "PASS"
        elif match_percentage >= 50 and missing_count <= 5:
            return "WARNING"
        else:
            return "FAIL"

    @staticmethod
    def _generate_summary(
        match_percentage: float, missing_count: int, status: str
    ) -> str:
        """Generate summary text"""
        return (
            f"Legal keyword analysis shows {match_percentage:.1f}% compliance. "
            f"Missing {missing_count} required keywords. Status: {status}"
        )

    @staticmethod
    def _generate_recommendations(missing_keywords: List[Dict], status: str) -> List[str]:
        """Generate recommendations based on analysis"""
        recommendations = []

        if status == "FAIL":
            recommendations.append("Document does not meet minimum compliance requirements")
            recommendations.append("Please review and resubmit with required keywords")

        if missing_keywords:
            recommendations.append(f"Add {len(missing_keywords)} missing required elements")
            # Show first 5 missing keywords
            if len(missing_keywords) <= 5:
                missing_list = ", ".join([kw["keyword"] for kw in missing_keywords])
                recommendations.append(f"Missing: {missing_list}")

        if status == "PASS":
            recommendations.append("✅ Document meets all compliance requirements")

        if status == "WARNING":
            recommendations.append("⚠️ Document has acceptable compliance but missing some keywords")

        return recommendations

    @staticmethod
    def _generate_no_rules_response(document_id: str, document_name: str) -> Dict:
        """Generate response when no rules defined for document"""
        return {
            "document_id": document_id,
            "document_name": document_name,
            "analysis_type": "LEGAL_KEYWORDS",
            "timestamp": datetime.now().isoformat(),
            "error": "No keyword rules defined for this document type",
            "message": f"Legal keyword analysis rules are not available for {document_name}",
            "compliance_status": "NOT_APPLICABLE",
            "keyword_analysis": {
                "total_keywords_checked": 0,
                "matched_count": 0,
                "missing_count": 0,
                "match_percentage": 0,
                "total_score": 0,
                "matched_keywords": [],
                "missing_keywords": [],
            },
            "recommendations": [
                "This document type does not have predefined keyword rules",
                "Manual review may be required"
            ],
        }
