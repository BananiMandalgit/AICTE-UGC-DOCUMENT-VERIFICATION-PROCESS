from fastapi import FastAPI, HTTPException, WebSocket, File, UploadFile, Form
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.websockets import WebSocketDisconnect
from groq import Groq
import requests
import json
import logging
import os
from io import BytesIO
from PyPDF2 import PdfReader
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app BEFORE defining any route decorators so @app references are valid
app = FastAPI(
    title="AICTE AI Services API",
    description="AI-powered document verification and analysis services",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace "*" with specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging early
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Groq API key - Get from .env file or environment
groq_api_key = os.getenv("groq_api_key") or os.getenv("GROQ_API_KEY")
if not groq_api_key:
    raise ValueError("GROQ_API_KEY not found in environment variables. Please set it in .env file or as environment variable.")

from app.services.detect.blueprint import calculate_building_area, ImageUrl
from app.utils.pdf_compare_utils import classify_text, check_with_groq, compare_layouts, summarize_layout_issues
from app.utils.query_processor import generate_response
from app.utils.index import Query, PDFComparisonRequest, download_pdf, ImageComparisionRequest
from app.services.detect.object import model, process_image, analyze_image_opencv
from app.services.chat.pdf_comparison import extract_text_from_pdf
from app.services.legal import LegalKeywordAnalyzer, LegalKeywordReportGenerator

from app.services.research_eligibility import ResearchEligibilityAnalyzer
from app.services.faculty_validation import get_faculty_validator

# Research Eligibility Analysis Endpoint
from fastapi import UploadFile, File

@app.post("/analyze-research-eligibility")
async def analyze_research_eligibility(file: UploadFile = File(...)):
    """
    Analyze research eligibility evidence PDF and return rule-based analysis.
    Args:
        file: PDF file (UploadFile)
    Returns:
        JSON with eligibility_score, eligibility_status, components, issues_found, recommendations
    """
    try:
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        pdf_content = await file.read()
        if not pdf_content:
            raise HTTPException(status_code=400, detail="File is empty")
        result = ResearchEligibilityAnalyzer.analyze(pdf_content)
        return JSONResponse(content=result)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in research eligibility analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Error analyzing research eligibility: {str(e)}")

@app.get("/")
def read_root():
    """
    Root endpoint - Health check for AI Services
    """
    return {
        "message": "AICTE AI Services API",
        "status": "running",
        "version": "2.0.0",
        "endpoints": {
            "docs": "/docs",
            "chatbot": "ws://localhost:8000/chatbot",
            "chat_pdf": "ws://localhost:8000/chat-pdf",
            "pdf_comparison": "/chat/comparison",
            "blueprint_validation": "/validate_blueprint",
            "image_detection": "/detect_institute_image",
            "legal_keywords": "/analyze-legal-keywords",
            "faculty_validation": "/validate-faculty-credentials"
        },
        "models": {
            "object_detection": "OpenCV + Contour-based Detection (Lightweight)",
            "text_classification": "TF-IDF + Rule-based Classifier (Lightweight)",
            "embeddings": "SentenceTransformer (all-MiniLM-L6-v2)",
            "llm": "Groq API (llama-3.1-8b-instant)",
            "legal_analysis": "Rule-based Keyword Matching",
            "faculty_validation": "Llama-3.1 (via Groq)"
        },
        "note": "Using lightweight alternatives - No GPU required, CPU-optimized"
    }


'''
@app.websocket("/chatbot")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for chatbot functionality
    """
    await websocket.accept()
    conversation_history = []

    try:
        while True:
            # Receive message from the client
            data = await websocket.receive_text()

            # Process the message
            user_message = {"role": "user", "content": data}
            conversation_history.append(user_message)

            # Generate response
            response = generate_response(user_message["content"], conversation_history)
            assistant_message = {"role": "assistant", "content": response}
            conversation_history.append(assistant_message)

            # Send the response back to the client
            await websocket.send_text(json.dumps(assistant_message))

    except WebSocketDisconnect:
        logging.info("Chatbot WebSocket disconnected")
    except Exception as e:
        logging.error(f"Error in chatbot: {e}")
'''


def extract_text_from_pdf_url(pdf_url):
    """
    Extract text from PDF URL
    """
    try:
        response = requests.get(pdf_url, timeout=30)
        response.raise_for_status()
        pdf_file = BytesIO(response.content)
        pdf_reader = PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        logging.error(f"Error extracting text from PDF: {e}")
        return None


@app.websocket("/chat-pdf")
async def chat_pdf(websocket: WebSocket):
    """
    WebSocket endpoint for PDF chat functionality
    """
    await websocket.accept()
    client = Groq(api_key=groq_api_key)

    try:
        while True:
            # Receive data from the client
            data = await websocket.receive_text()
            body = json.loads(data)
            user_message = body.get("message", "")
            pdf_url = body.get("pdf_url", "")

            # Extract text from the PDF
            pdf_text = extract_text_from_pdf_url(pdf_url)
            if pdf_text is None:
                await websocket.send_text(
                    json.dumps({"error": "Failed to extract text from PDF"})
                )
                continue

            # Construct the prompt
            prompt = f"""
            You are an AI assistant specialized in analyzing PDF documents.
            PDF Content:
            {pdf_text[:1000]}  # Limiting to first 1000 characters for brevity
            User Question: {user_message}
            """

            # Stream the response to the client
            try:
                completion = client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7,
                    max_tokens=1024,
                    top_p=1,
                )
                
                await websocket.send_text(
                    json.dumps({"content": completion.choices[0].message.content})
                )
            except Exception as e:
                logging.error(f"Error in PDF chat: {e}")
                await websocket.send_text(json.dumps({"error": str(e)}))
                
    except WebSocketDisconnect:
        logging.info("PDF chat WebSocket disconnected")
    except Exception as e:
        logging.error(f"Unexpected error in PDF chat: {e}")


@app.post("/validate_blueprint")
async def calculate_room_area_from_url(data: ImageUrl):
    """
    Endpoint to calculate the room's outer area from a blueprint image URL.
    """
    try:
        dimensions = calculate_building_area(data.url)
        return JSONResponse(dimensions)
    except Exception as e:
        logging.error(f"Error in blueprint validation: {e}")
        raise HTTPException(status_code=400, detail=f"Error: {e}")


@app.post("/chat/comparison")
async def compare_pdfs(request: PDFComparisonRequest):
    """
    Compare two PDF documents (template vs filled)
    """
    try:
        template_path = await download_pdf(request.template_url)
        filled_path = await download_pdf(request.filled_url)
        
        (
            layouts_similar,
            placeholder_values,
            layout_issues,
            metrics,
        ) = compare_layouts(
            template_path, filled_path
        )
        
        placeholder_values = check_with_groq(placeholder_values)
        issue_summary = summarize_layout_issues(layout_issues)
        
        result = {
            "layouts_similar": layouts_similar,
            "placeholder_values": placeholder_values,
            "layout_issues": layout_issues,
            "issue_summary": issue_summary,
            "format_match_percentage": metrics.get("format_match_percentage"),
            "layout_match_score": metrics.get("layout_match_score"),
            "keyword_phrase_match": metrics.get("keyword_phrase_match"),
        }

        return result
    except Exception as e:
        logging.error(f"Error processing PDFs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/detect_institute_image")
async def detect_objects(image_request: ImageComparisionRequest):
    """
    Detect objects/infrastructure in institute images using lightweight OpenCV-based detection.
    
    This endpoint uses:
    - Contour-based object detection
    - Edge detection (Canny)
    - Shape analysis for classification
    - OpenCV image analysis
    
    No GPU required - fully CPU-optimized.
    """
    try:
        # Download image from URL
        logging.info(f"Processing image from: {image_request.url}")
        response = requests.get(image_request.url, timeout=10)
        response.raise_for_status()
        img = process_image(response.content)

        if img is None:
            raise HTTPException(status_code=400, detail="Failed to process image")

        # Use OpenCV-based analysis
        opencv_analysis = analyze_image_opencv(img)

        # Run lightweight detection
        results = model(img)

        # Process results
        detections = []
        for result in results:
            boxes = result.boxes
            for box in boxes:
                # box is already a dictionary from our detection model
                detection = {
                    "bbox": box.get('bbox', [0, 0, 0, 0]) if isinstance(box, dict) else [0, 0, 0, 0],
                    "confidence": box.get('confidence', 0.0) if isinstance(box, dict) else 0.0,
                    "class": box.get('class', 0) if isinstance(box, dict) else 0,
                    "class_name": box.get('class_name', 'unknown') if isinstance(box, dict) else 'unknown',
                    "area": box.get('area', 0) if isinstance(box, dict) else 0,
                    "aspect_ratio": box.get('aspect_ratio', 0.0) if isinstance(box, dict) else 0.0
                }
                detections.append(detection)

        return {
            "status": "success",
            "message": "Using lightweight OpenCV-based detection",
            "detections": detections,
            "opencv_analysis": opencv_analysis,
            "model_info": {
                "model_type": "opencv_contour_detection",
                "num_detections": len(detections),
                "note": "Lightweight CPU-optimized detection - No GPU required",
                "features": [
                    "Contour-based object detection",
                    "Edge detection (Canny)",
                    "Shape classification",
                    "Real-time processing"
                ]
            },
        }

    except requests.RequestException as e:
        logging.error(f"Error downloading image: {e}")
        raise HTTPException(
            status_code=400, detail=f"Error downloading image: {str(e)}"
        )
    except Exception as e:
        logging.error(f"Error in detect_institute_image: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


@app.post("/analyze-legal-keywords")
async def analyze_legal_keywords(
    pdf_url: str = Form(...),
    document_id: str = Form(...),
    document_name: str = Form(default="Document")
):
    """
    Analyze document for legal keyword compliance.
    
    Args:
        pdf_url: URL or local path to PDF file
        document_id: Document type ID (e.g., 'affidavit1', 'new_institute_0')
        document_name: Human-readable document name
    
    Returns:
        JSON analysis result
    """
    try:
        logging.info(f"Analyzing legal keywords for document: {document_id}")
        
        # Download PDF from URL
        pdf_path = await download_pdf(pdf_url)
        
        # Extract text from PDF
        pdf_text = LegalKeywordAnalyzer.extract_text_from_pdf(pdf_path)
        
        # Analyze keywords
        analysis_result = LegalKeywordAnalyzer.analyze_keywords(
            text=pdf_text,
            document_id=document_id,
            document_name=document_name
        )
        
        return JSONResponse(content=analysis_result)
        
    except FileNotFoundError as e:
        logging.error(f"PDF not found: {e}")
        raise HTTPException(status_code=404, detail=f"PDF file not found: {str(e)}")
    except ValueError as e:
        logging.error(f"PDF extraction error: {e}")
        raise HTTPException(status_code=400, detail=f"Error extracting PDF: {str(e)}")
    except Exception as e:
        logging.error(f"Error in legal keyword analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Error analyzing keywords: {str(e)}")


@app.post("/analyze-legal-keywords-html", response_class=HTMLResponse)
async def analyze_legal_keywords_html(
    pdf_url: str = Form(...),
    document_id: str = Form(...),
    document_name: str = Form(default="Document")
):
    """
    Analyze document for legal keywords and return HTML report.
    
    Args:
        pdf_url: URL or local path to PDF file
        document_id: Document type ID (e.g., 'affidavit1', 'new_institute_0')
        document_name: Human-readable document name
    
    Returns:
        HTML report as string (browser will open in new tab)
    """
    try:
        logging.info(f"Generating HTML report for: {document_id}")
        
        # Download PDF from URL
        pdf_path = await download_pdf(pdf_url)
        
        # Extract text from PDF
        pdf_text = LegalKeywordAnalyzer.extract_text_from_pdf(pdf_path)
        
        # Analyze keywords
        analysis_result = LegalKeywordAnalyzer.analyze_keywords(
            text=pdf_text,
            document_id=document_id,
            document_name=document_name
        )
        
        # Generate HTML report
        html_report = LegalKeywordReportGenerator.generate_html_report(analysis_result)
        
        return html_report
        
    except FileNotFoundError as e:
        logging.error(f"PDF not found: {e}")
        raise HTTPException(status_code=404, detail=f"PDF file not found: {str(e)}")
    except ValueError as e:
        logging.error(f"PDF extraction error: {e}")
        raise HTTPException(status_code=400, detail=f"Error extracting PDF: {str(e)}")
    except Exception as e:
        logging.error(f"Error generating HTML report: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")


@app.post("/validate-faculty-credentials")
async def validate_faculty_credentials(file: UploadFile = File(...)):
    """
    Validate faculty credentials from uploaded PDF using Llama model analysis.
    
    Args:
        file: PDF file containing faculty information
    
    Returns:
        JSON with validation report including credentials, scores, and recommendations
    """
    try:
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Read file content
        pdf_content = await file.read()
        
        if not pdf_content:
            raise HTTPException(status_code=400, detail="File is empty")
        
        # Get faculty validator
        validator = get_faculty_validator()
        
        # Analyze PDF
        result = validator.analyze_faculty_pdf(pdf_content)
        
        if not result.get('success'):
            raise HTTPException(status_code=400, detail=result.get('error', 'Analysis failed'))
        
        return JSONResponse({
            "success": True,
            "data": result['analysis'],
            "metadata": {
                "page_count": result.get('page_count'),
                "text_length": result.get('text_length'),
                "file_name": file.filename
            }
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error validating faculty credentials: {e}")
        raise HTTPException(status_code=500, detail=f"Error validating faculty credentials: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
