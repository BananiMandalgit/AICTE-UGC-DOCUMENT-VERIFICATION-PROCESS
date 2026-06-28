@echo off
echo ========================================
echo Starting AICTE AI Services API
echo ========================================
echo.

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Starting API server on http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.
echo Press CTRL+C to stop the server
echo.

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
