"""
Research Eligibility Analyzer Service
Rule-based analysis for research eligibility evidence documents
"""

import re
from typing import Dict, Any
from PyPDF2 import PdfReader
from io import BytesIO

class ResearchEligibilityAnalyzer:
    WEIGHTS = {
        "approval_validity": 25,
        "faculty_appointment": 20,
        "phd_recognition": 15,
        "student_enrollment": 15,
        "plagiarism_check": 15,
        "document_completeness": 10,
    }

    KEYWORDS = {
        "approval_validity": [r"AICTE approval", r"UGC approval", r"approval number", r"valid till", r"validity"],
        "faculty_appointment": [r"appointment letter", r"faculty appointment", r"joining letter"],
        "phd_recognition": [r"PhD supervisor", r"guide recognition", r"recognized guide"],
        "student_enrollment": [r"bonafide", r"enrollment", r"student list", r"admission"],
        "plagiarism_check": [r"plagiarism", r"similarity report", r"similarity %", r"turnitin"],
        "document_completeness": [r"complete", r"all pages present", r"document verified"],
    }

    @staticmethod
    def extract_text_from_pdf(pdf_content: bytes) -> str:
        pdf = PdfReader(BytesIO(pdf_content))
        text = "\n".join(page.extract_text() or "" for page in pdf.pages)
        return text

    @classmethod
    def analyze(cls, pdf_content: bytes, application_status: str = None) -> Dict[str, Any]:
        """
        Analyze research eligibility evidence.
        
        CRITICAL GUARD: This service must ONLY run for APPROVED applications.
        Prevents execution during AICTE/UGC approval workflows.
        """
        # HARD GUARD: Block execution unless application is APPROVED
        if application_status != "APPROVED":
            return {
                "eligibility_score": 0.0,
                "eligibility_status": "BLOCKED",
                "error": "Research eligibility can only be assessed for APPROVED applications",
                "components": {},
                "issues_found": ["Application must have APPROVED status before research eligibility check"],
                "recommendations": ["Complete the AICTE/UGC approval process first"]
            }
        
        text = cls.extract_text_from_pdf(pdf_content).lower()
        components = {}
        total_score = 0
        issues = []
        recommendations = []
        for comp, keywords in cls.KEYWORDS.items():
            found = any(re.search(kw, text) for kw in keywords)
            score = cls.WEIGHTS[comp] if found else 0
            components[comp] = {"found": found, "score": score}
            if not found:
                issues.append(f"Missing or insufficient evidence for: {comp.replace('_', ' ').title()}")
                recommendations.append(f"Provide clear proof for {comp.replace('_', ' ').title()}.")
            total_score += score
        eligibility_status = "PASS" if total_score >= 70 else ("REVIEW" if total_score >= 50 else "FAIL")
        return {
            "eligibility_score": round(total_score, 2),
            "eligibility_status": eligibility_status,
            "components": components,
            "issues_found": issues,
            "recommendations": recommendations
        }
