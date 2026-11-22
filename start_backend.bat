@echo off
title MobileTwin Backend Server
echo ==============================================================
echo    Starting MobileTwin Python Flask-SocketIO Backend Server
echo ==============================================================
cd /d "%~dp0backend"
set PYTHONPATH=%~dp0backend
python app.py
pause
