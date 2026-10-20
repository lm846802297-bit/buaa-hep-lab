@echo off
setlocal
cd /d "%~dp0"
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8
where python >nul 2>nul
if errorlevel 1 (
  echo Please install Python 3.11 or newer, then run this file again.
  pause
  exit /b 1
)
if not exist ".venv\Scripts\python.exe" (
  python -m venv .venv
  if errorlevel 1 goto failed
)
".venv\Scripts\python.exe" -c "import fastapi, uvicorn, sqlalchemy, jwt, bcrypt, aiohttp, arxiv, PIL, tzdata" >nul 2>nul
if errorlevel 1 (
  python -m pip --python .venv install -r backend/requirements.txt
  if errorlevel 1 goto failed
)
if not exist "frontend\dist\index.html" (
  call npm.cmd --prefix frontend ci --no-audit --no-fund
  if errorlevel 1 goto failed
  call npm.cmd --prefix frontend run build
  if errorlevel 1 goto failed
)
echo Open http://127.0.0.1:8000 in your browser. Keep this window open.
".venv\Scripts\python.exe" serve-local.py
if errorlevel 1 goto failed
exit /b 0
:failed
echo Startup failed. Please read the error above.
pause
exit /b 1
