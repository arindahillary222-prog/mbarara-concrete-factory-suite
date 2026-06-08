$ErrorActionPreference = "Stop"

$BackendDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkspaceRoot = Resolve-Path (Join-Path $BackendDir "..\..\..")
$RootPattern = [regex]::Escape($WorkspaceRoot.Path)

$targets = Get-CimInstance Win32_Process | Where-Object {
  ($_.Name -in @("python.exe", "postgres.exe")) -and
  ($_.CommandLine -match $RootPattern) -and
  ($_.CommandLine -match "app.main:app|postgresql-portable")
}

foreach ($target in $targets) {
  Stop-Process -Id $target.ProcessId -Force -ErrorAction SilentlyContinue
}

Write-Host "Stopped Mbarara local backend stack processes."

