@echo off
echo ========================================
echo AICTE Document Verification System
echo Starting All Services
echo ========================================
echo.

echo [1/3] Starting Backend Server (Port 3100)...
start "AICTE Backend" cmd /k "cd aicte-backend && npm run dev"
timeout /t 5 /nobreak >nul

echo [2/3] Starting AI Services (Port 8000)...
start "AICTE AI Services" cmd /k "cd aicte_models && python -m uvicorn app.main:app --reload --port 8000"
timeout /t 5 /nobreak >nul

echo [3/3] Starting Frontend (Port 5173)...
start "AICTE Frontend" cmd /k "cd aicte-frontend && npm run dev"

echo.
echo ========================================
echo All services are starting...
echo ========================================
echo.
echo Backend:      http://localhost:3100
echo AI Services:  http://localhost:8000
echo Frontend:     http://localhost:5173
echo.
echo Press any key to open the application in browser...
pause >nul
start http://localhost:5173
