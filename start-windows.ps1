param([switch]$Rebuild)
$ErrorActionPreference = 'Stop'
$env:PYTHONUTF8 = '1'
$env:PYTHONIOENCODING = 'utf-8'
Set-Location -LiteralPath $PSScriptRoot
function Check-Result { if ($LASTEXITCODE -ne 0) { throw 'The previous step failed. See the message above.' } }
if (-not (Get-Command python -ErrorAction SilentlyContinue)) { throw 'Install Python 3.11 or newer first.' }
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw 'Install Node.js 20 or newer first.' }
if (-not (Test-Path -LiteralPath '.venv/Scripts/python.exe')) {
    python -m venv .venv
    Check-Result
}
& '.venv/Scripts/python.exe' -c 'import fastapi, uvicorn, sqlalchemy, jwt, bcrypt, aiohttp, arxiv, PIL, tzdata'
if ($LASTEXITCODE -ne 0) {
    python -m pip --python .venv install -r backend/requirements.txt
    Check-Result
}
if ($Rebuild -or -not (Test-Path -LiteralPath 'frontend/dist/index.html')) {
    if (-not (Test-Path -LiteralPath 'frontend/node_modules/vite')) {
        npm.cmd --prefix frontend ci --no-audit --no-fund
        Check-Result
    }
    npm.cmd --prefix frontend run build
    Check-Result
}
& '.venv/Scripts/python.exe' serve-local.py
Check-Result
