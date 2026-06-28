"""
Init file for legal keyword analysis service
"""

from .legal_analyzer import LegalKeywordAnalyzer
from .report_generator import LegalKeywordReportGenerator
from .keywords_db import DOCUMENT_RULES

__all__ = [
    "LegalKeywordAnalyzer",
    "LegalKeywordReportGenerator",
    "DOCUMENT_RULES",
]
