@echo off
title MobileTwin Test Runner
echo ==============================================================
echo    Executing MobileTwin Verification Test Suite
echo ==============================================================
cd /d "%~dp0backend"
set PYTHONPATH=%~dp0backend
python -m unittest discover -s tests -v
pause
