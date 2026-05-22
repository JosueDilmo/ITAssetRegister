<#
.SYNOPSIS
    Rebuilds and restarts both IT Asset Register services on the production server.
.DESCRIPTION
    Stops the running NSSM services, installs deps, rebuilds server and web, runs DB migrations,
    then restarts services. api.ts must be copied manually before running. Run as Administrator.
.PARAMETER BaseDir
    Root deployment folder. Default: C:\ITAssetRegister
.PARAMETER ServerService
    NSSM service name for the backend. Default: ITAssetRegister-Server
.PARAMETER WebService
    NSSM service name for the frontend. Default: ITAssetRegister-Web
.EXAMPLE
    .\deploy.ps1
    .\deploy.ps1 -BaseDir "D:\Apps\ITAssetRegister"
#>
param(
    [string]$BaseDir       = "C:\ITAssetRegister",
    [string]$ServerService = "ITAssetRegister-Server",
    [string]$WebService    = "ITAssetRegister-Web"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$serverDir = "$BaseDir\server"
$webDir    = "$BaseDir\web"

# ── 0. Guard ─────────────────────────────────────────────────────────────────
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)
if (-not $isAdmin) {
    throw "Run this script in an elevated PowerShell window (Run as Administrator)."
}

# ── 1. Stop services ─────────────────────────────────────────────────────────
Write-Host "==> Stopping services..."
Stop-Service -Name $WebService    -Force -ErrorAction SilentlyContinue
Stop-Service -Name $ServerService -Force -ErrorAction SilentlyContinue

# ── 2. Server: install, build + migrate ─────────────────────────────────────
Push-Location $serverDir
try {
    Write-Host "==> server: install"
    npm install
    Write-Host "==> server: build"
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Server build failed. Aborting." }
    Write-Host "==> server: migrate"
    npx drizzle-kit migrate
} finally { Pop-Location }

# ── 3. Web: build ────────────────────────────────────────────────────────────
Push-Location $webDir
try {
    Write-Host "==> web: build"
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Web build failed. Aborting." }
} finally { Pop-Location }

# ── 4. Restart services ──────────────────────────────────────────────────────
Write-Host "==> Starting services..."
Start-Service -Name $ServerService
Start-Sleep -Seconds 3
Start-Service -Name $WebService

Write-Host ""
Write-Host "Redeployment complete."
