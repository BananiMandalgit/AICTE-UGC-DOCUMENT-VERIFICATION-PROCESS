@echo off
echo ========================================
echo AICTE Lightweight Models Setup
echo ========================================
echo.

echo Step 1: Checking Python installation...
python --version
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)
echo.

echo Step 2: Creating virtual environment...
if exist venv (
    echo Virtual environment already exists. Skipping creation.
) else (
    python -m venv venv
    echo Virtual environment created successfully.
)
echo.

echo Step 3: Activating virtual environment...
call venv\Scripts\activate.bat
echo.

echo Step 4: Upgrading pip...
python -m pip install --upgrade pip
echo.

echo Step 5: Installing dependencies...
echo This may take a few minutes...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo Step 6: Verifying installation...
python -c "import cv2, sklearn, sentence_transformers, fastapi; print('✓ All core dependencies installed successfully!')"
if errorlevel 1 (
    echo ERROR: Some dependencies failed to install correctly
    pause
    exit /b 1
)
echo.

echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo To start the API server, run:
echo   venv\Scripts\activate
echo   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
echo.
echo Then open your browser to:
echo   http://localhost:8000
echo   http://localhost:8000/docs (API documentation)
echo.
pause
