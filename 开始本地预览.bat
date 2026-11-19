@echo off
title CoMeBench - local preview
cd /d "%~dp0"
echo ============================================
echo   CoMeBench  local preview
echo ============================================
echo.
echo Starting http://127.0.0.1:5500 ...
echo.
start "CoMeBench local server" /min cmd /c "python -m http.server 5500"
timeout /t 2 >nul
start "" "http://127.0.0.1:5500/"
echo.
echo The server runs in the minimized window. Close it to stop.
echo To edit content, use the CMS or edit content.json directly.
timeout /t 4 >nul
