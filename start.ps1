param(
    [switch]$SkipInstall,
    [switch]$Reload
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$venvPath = Join-Path $projectRoot ".venv"
$venvPython = Join-Path $venvPath "Scripts\python.exe"
$venvConfig = Join-Path $venvPath "pyvenv.cfg"

function Get-BasePython {
    $command = Get-Command python -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    $candidates = @(
        "$env:LOCALAPPDATA\Programs\Python\Python314\python.exe",
        "$env:LOCALAPPDATA\Programs\Python\Python313\python.exe",
        "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
        "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe"
    )

    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) {
            return $candidate
        }
    }

    throw "Python 3.11+ was not found. Install Python and rerun this script."
}

if ((Test-Path $venvPython) -and -not (Test-Path $venvConfig)) {
    Write-Host "Existing virtual environment is incomplete. Recreating .venv..." -ForegroundColor Yellow
    Remove-Item -LiteralPath $venvPath -Recurse -Force
}

if (-not (Test-Path $venvPython)) {
    $basePython = Get-BasePython
    Write-Host "Creating virtual environment with $basePython" -ForegroundColor Cyan
    & $basePython -m venv $venvPath
}

if (-not $SkipInstall) {
    Write-Host "Installing runtime dependencies..." -ForegroundColor Cyan
    & $venvPython -m pip install --upgrade pip
    & $venvPython -m pip install fastapi "pydantic>=2.8,<3.0" "uvicorn>=0.30,<1.0" "pdfplumber>=0.11,<1.0" "python-multipart>=0.0.9,<1.0" "pymupdf>=1.27,<2.0" "rapidocr-onnxruntime>=1.2,<2.0"
}

Write-Host "Starting Front of House Calculator-1..." -ForegroundColor Green
Set-Location $projectRoot
if ($Reload) {
    & $venvPython -m uvicorn app.main:app --app-dir src --reload
} else {
    & $venvPython -m uvicorn app.main:app --app-dir src
}
