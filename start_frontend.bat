@echo off
title MobileTwin Frontend Server
echo ==============================================================
echo    Starting MobileTwin Vite React-TypeScript Frontend
echo ==============================================================
cd /d "%~dp0frontend"
set PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%
call npm run dev -- --host
pause
