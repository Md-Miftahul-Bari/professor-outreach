@echo off
rem Double-click launcher for Windows.
cd /d "%~dp0"
echo Starting Professor Outreach on http://127.0.0.1:8765
start "" /b cmd /c "timeout /t 2 >nul & start http://127.0.0.1:8765"
python app.py
if errorlevel 1 (
  echo.
  echo Failed to start. Is Python installed and on PATH? Try: py app.py
  pause
)
