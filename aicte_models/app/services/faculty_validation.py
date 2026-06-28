"""
Faculty Score Validation Service using Llama model via Groq API
"""

from groq import Groq
from PyPDF2 import PdfReader
from io import BytesIO
import logging
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Groq API Configuration - Get from .env file
GROQ_API_KEY = os.getenv("groq_api_key") or os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in environment variables. Please set it in .env file.")


class FacultyValidationAnalyzer:
    """
    Analyzes faculty credentials and documents using Llama model
    """

    def __init__(self):
        self.client = Groq(api_key=GROQ_API_KEY)
        self.model = "llama-3.1-8b-instant"

    def extract_text_from_pdf(self, pdf_content: bytes) -> str:
        """
        Extract text from PDF content
        """
        try:
            pdf_file = BytesIO(pdf_content)
            pdf_reader = PdfReader(pdf_file)
            text = ""
            for page_num, page in enumerate(pdf_reader.pages):
                page_text = page.extract_text()
                text += f"\n--- Page {page_num + 1} ---\n{page_text}"
            return text
        except Exception as e:
            logger.error(f"Error extracting PDF text: {e}")
            raise ValueError(f"Failed to extract text from PDF: {str(e)}")

    def validate_faculty_credentials(self, pdf_text: str) -> dict:
        """
        Validate faculty credentials using Llama model
        """
        prompt = f"""You are an expert faculty credentials validator. Analyze the following faculty document and provide a detailed validation report.

Document Content:
{pdf_text}

IMPORTANT: You MUST respond with ONLY valid JSON, no other text before or after. Start with {{ and end with }}.

Provide the response in exactly this JSON format:
{{
    "overall_score": 75,
    "validation_status": "VALID",
    "credentials_found": [
        {{
            "type": "PhD",
            "name": "Doctor of Philosophy in Computer Science",
            "institution": "University Name",
            "year": "2020",
            "status": "VERIFIED"
        }}
    ],
    "qualifications": {{
        "highest_degree": "PhD",
        "years_experience": "10 years",
        "specializations": ["Machine Learning", "AI"],
        "certifications": ["AWS Certified"]
    }},
    "validation_checks": {{
        "document_completeness": {{"score": 80, "issues": []}},
        "credential_authenticity": {{"score": 85, "issues": []}},
        "experience_relevance": {{"score": 70, "issues": ["Limited recent publications"]}},
        "publication_record": {{"score": 75, "issues": []}}
    }},
    "issues_found": [
        {{
            "severity": "WARNING",
            "issue": "Sample issue",
            "recommendation": "Sample recommendation"
        }}
    ],
    "strengths": ["Strong academic background", "Relevant experience"],
    "recommendations": [
        {{
            "priority": "HIGH",
            "recommendation": "Update publications",
            "impact": "Would improve profile strength"
        }}
    ],
    "compliance_status": "COMPLIANT",
    "summary": "Overall assessment of the faculty credentials"
}}

Analyze the document and fill in these fields with actual data. Make sure it's valid JSON."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.2,  # Very low temperature for consistent JSON output
                max_tokens=3000,
                top_p=0.9
            )

            response_text = response.choices[0].message.content.strip()
            
            # Try to extract JSON from response
            try:
                # Find JSON in the response (in case there's extra text)
                json_start = response_text.find('{')
                json_end = response_text.rfind('}') + 1
                
                if json_start >= 0 and json_end > json_start:
                    json_str = response_text[json_start:json_end]
                    validation_result = json.loads(json_str)
                else:
                    raise ValueError("No JSON object found in response")
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse JSON response: {e}. Raw response: {response_text[:500]}")
                
                # Provide a fallback structured response
                validation_result = {
                    "overall_score": 65,
                    "validation_status": "NEEDS_REVIEW",
                    "credentials_found": [],
                    "qualifications": {
                        "highest_degree": "Not clearly specified",
                        "years_experience": "Not found",
                        "specializations": [],
                        "certifications": []
                    },
                    "validation_checks": {
                        "document_completeness": {"score": 50, "issues": ["JSON parsing failed - document format unclear"]},
                        "credential_authenticity": {"score": 50, "issues": []},
                        "experience_relevance": {"score": 50, "issues": []},
                        "publication_record": {"score": 50, "issues": []}
                    },
                    "issues_found": [
                        {
                            "severity": "WARNING",
                            "issue": "Response format issue",
                            "recommendation": "Please resubmit the document in a clearer format"
                        }
                    ],
                    "strengths": [],
                    "recommendations": [
                        {
                            "priority": "HIGH",
                            "recommendation": "Provide document in standard CV format",
                            "impact": "Will enable accurate analysis"
                        }
                    ],
                    "compliance_status": "NEEDS_VERIFICATION",
                    "summary": "The document could not be parsed as structured data. Please provide a standard CV or credentials document."
                }

            return validation_result

        except Exception as e:
            logger.error(f"Error in faculty validation: {e}")
            raise ValueError(f"Failed to validate faculty credentials: {str(e)}")

    def analyze_faculty_pdf(self, pdf_content: bytes) -> dict:
        """
        Main method to analyze faculty PDF
        """
        try:
            # Extract text from PDF
            pdf_text = self.extract_text_from_pdf(pdf_content)
            
            if not pdf_text.strip():
                raise ValueError("PDF appears to be empty or contains no readable text")
            
            # Validate using Llama
            validation_result = self.validate_faculty_credentials(pdf_text)
            
            return {
                "success": True,
                "analysis": validation_result,
                "page_count": len(pdf_text.split("--- Page")),
                "text_length": len(pdf_text)
            }

        except Exception as e:
            logger.error(f"Error analyzing faculty PDF: {e}")
            return {
                "success": False,
                "error": str(e),
                "analysis": None
            }


# Singleton instance
_faculty_validator = None

def get_faculty_validator():
    """Get or create FacultyValidationAnalyzer instance"""
    global _faculty_validator
    if _faculty_validator is None:
        _faculty_validator = FacultyValidationAnalyzer()
    return _faculty_validator
