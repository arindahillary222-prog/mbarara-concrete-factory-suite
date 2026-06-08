$ErrorActionPreference = "Stop"

$BackendDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkspaceRoot = Resolve-Path (Join-Path $BackendDir "..\..\..")
$PgBin = Join-Path $WorkspaceRoot "work\postgresql-portable\pgsql\bin"
$PgData = Join-Path $WorkspaceRoot "work\postgresql-data"
$ApiPython = Join-Path $BackendDir ".venv\Scripts\python.exe"
$ApiOut = Join-Path $BackendDir "api-server.out.log"
$ApiErr = Join-Path $BackendDir "api-server.err.log"
$PgOut = Join-Path $PgData "postgres-direct.out.log"
$PgErr = Join-Path $PgData "postgres-direct.err.log"

function Test-PortListening {
  param([int]$Port)
  try {
    $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop | Select-Object -First 1
    return $null -ne $connection
  } catch {
    return $false
  }
}

if (-not (Test-PortListening -Port 5432)) {
  Start-Process `
    -FilePath (Join-Path $PgBin "postgres.exe") `
    -ArgumentList @("-D", $PgData, "-p", "5432", "-h", "127.0.0.1") `
    -WindowStyle Hidden `
    -RedirectStandardOutput $PgOut `
    -RedirectStandardError $PgErr

  Start-Sleep -Seconds 6
}

& (Join-Path $PgBin "pg_isready.exe") -h 127.0.0.1 -p 5432 -U mbarara | Out-Host

if (-not (Test-PortListening -Port 8000)) {
  Remove-Item -LiteralPath $ApiOut, $ApiErr -ErrorAction SilentlyContinue
  Start-Process `
    -FilePath $ApiPython `
    -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000") `
    -WorkingDirectory $BackendDir `
    -WindowStyle Hidden `
    -RedirectStandardOutput $ApiOut `
    -RedirectStandardError $ApiErr

  Start-Sleep -Seconds 5
}

$healthClient = [System.Net.WebClient]::new()
$healthBody = $healthClient.DownloadString("http://127.0.0.1:8000/health")
Write-Host "Health: $healthBody"

Write-Host ""
Write-Host "Mbarara backend stack is running."
Write-Host "API:  http://127.0.0.1:8000"
Write-Host "Docs: http://127.0.0.1:8000/docs"
