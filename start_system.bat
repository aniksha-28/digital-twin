@echo off
title MobileTwin Digital Twin Platform Launcher
echo ==============================================================
echo    MobileTwin - Digital Twin Monitoring Platform Launcher
echo ==============================================================
echo.
echo Initializing database if not already present...
cd /d "%~dp0backend"
set PYTHONPATH=%~dp0backend
python -c "import os, init_db; not os.path.exists('data/mobiletwin.db') and init_db.initialize_database()"

echo Launching Backend Server in new terminal...
start "MobileTwin Backend (Port 5000)" cmd /k "%~dp0start_backend.bat"

echo Waiting 3 seconds for backend initialization...
timeout /t 3 /nobreak >nul

echo Launching Frontend Development Server in new terminal...
start "MobileTwin Frontend (Port 5173)" cmd /k "%~dp0start_frontend.bat"

echo.
echo ==============================================================
echo    System successfully launched!
echo    Frontend UI: http://localhost:5173
echo    Backend API: http://localhost:5000/api/healthcheck
echo ==============================================================
timeout /t 5
