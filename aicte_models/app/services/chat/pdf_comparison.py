from fastapi import APIRouter, HTTPException
import logging
from app.utils.pdf_compare_utils import check_with_groq, compare_layouts, summarize_layout_issues
from app.utils.index import PDFComparisonRequest, download_pdf
from PyPDF2 import PdfReader

router = APIRouter()
logging.basicConfig(level=logging.INFO)


def extract_text_from_pdf(path: str) -> str:
    """Return the concatenated text of all pages in the given PDF."""
    try:
        reader = PdfReader(path)
        page_text = []
        for page in reader.pages:
            page_text.append(page.extract_text() or "")
        return "\n".join(page_text)
    except Exception as exc:
        logging.error(f"Failed to read PDF text from {path}: {exc}")
        raise


@router.post("/")
async def compare_pdfs(request: PDFComparisonRequest):
    try:
        template_path = await download_pdf(request.template_url)
        filled_path = await download_pdf(request.filled_url)

        layouts_similar, placeholder_values, layout_issues = compare_layouts(template_path, filled_path)
        placeholder_values = check_with_groq(placeholder_values)
        issue_summary = summarize_layout_issues(layout_issues)

        result = {
            "layouts_similar": layouts_similar,
            "placeholder_values": placeholder_values,
            "layout_issues": layout_issues,
            "issue_summary": issue_summary,
        }

        return result
    except Exception as e:
        logging.error(f"Error processing PDFs: {e}")
        raise HTTPException(status_code=500, detail=str(e))
