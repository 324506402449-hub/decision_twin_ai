"""
Resume Analysis API Routes – endpoints for resume upload and analysis.
"""

from fastapi import APIRouter, HTTPException, File, UploadFile, Body
from fastapi.responses import JSONResponse
import aiofiles
import os
from backend.services.resume_analysis_service import analyze_resume_for_dashboard, extract_resume_text

router = APIRouter(prefix="/api/resume-analysis", tags=["resume-analysis"])

# Create temp directory for uploaded files
UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/analyze-dashboard")
async def analyze_resume_for_dashboard_endpoint(file: UploadFile = File(...)):
    """
    Upload and analyze a resume for dashboard integration.
    Returns data in Dashboard-compatible format.
    
    Args:
        file: Resume file (.txt, .pdf, .docx)
    
    Returns:
        Dashboard metrics with career predictions
    """
    
    print(f"[API] Received file upload: {file.filename}")
    
    if not file.filename:
        return JSONResponse(status_code=400, content={"detail": "No file provided"})
    
    # Validate file type
    allowed_extensions = {".txt", ".pdf", ".docx", ".doc"}
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        return JSONResponse(
            status_code=400,
            content={"detail": f"Unsupported file type: {file_ext}. Please upload .txt, .pdf, or .docx files."}
        )
    
    temp_file_path = None
    try:
        # Save uploaded file temporarily
        temp_file_path = os.path.join(UPLOAD_DIR, file.filename)
        print(f"[API] Saving file to: {temp_file_path}")
        async with aiofiles.open(temp_file_path, "wb") as f:
            content = await file.read()
            await f.write(content)
        
        print(f"[API] File saved, extracting text...")
        # Extract text from resume
        resume_text = extract_resume_text(temp_file_path)
        
        print(f"[API] Extracted {len(resume_text)} characters")
        if not resume_text or len(resume_text.strip()) < 50:
            return JSONResponse(
                status_code=400,
                content={"detail": "Resume file is empty or too short. Please provide a complete resume."}
            )
        
        print(f"[API] Starting Gemini analysis...")
        # Analyze using Gemini for Dashboard
        result = await analyze_resume_for_dashboard(resume_text)
        
        print(f"[API] Analysis result status: {result.get('status')}")
        if result["status"] == "error":
            return JSONResponse(
                status_code=500,
                content={"detail": result["message"]}
            )
        
        print(f"[API] Returning successful analysis")
        return JSONResponse(status_code=200, content=result["data"])
    
    except Exception as e:
        error_msg = str(e)
        print(f"[API] ERROR: {error_msg}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"detail": f"Error processing resume: {error_msg}"}
        )
    
    finally:
        # Clean up temp file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
                print(f"[API] Cleaned up temp file")
            except:
                pass


@router.post("/analyze-text-dashboard")
async def analyze_resume_text_dashboard(resume_data: dict = Body(...)):
    """
    Analyze resume from raw text for dashboard.
    
    Args:
        resume_data: Dictionary with 'text' key containing resume content
    
    Returns:
        Dashboard metrics
    """
    
    if not resume_data or "text" not in resume_data:
        return JSONResponse(status_code=400, content={"detail": "Resume text is required"})
    
    text = resume_data.get("text", "").strip()
    
    if len(text) < 50:
        return JSONResponse(
            status_code=400,
            content={"detail": "Resume text is too short. Please provide a complete resume."}
        )
    
    try:
        result = await analyze_resume_for_dashboard(text)
        
        if result["status"] == "error":
            return JSONResponse(
                status_code=500,
                content={"detail": result["message"]}
            )
        
        return JSONResponse(status_code=200, content=result["data"])
    
    except Exception as e:
        print(f"Resume text analysis error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Error analyzing resume: {str(e)}"}
        )
