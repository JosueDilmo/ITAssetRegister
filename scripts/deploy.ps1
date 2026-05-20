<#
.SYNOPSIS
    Rebuilds and restarts both IT Asset Register services on the production server.
.DESCRIPTION
    Stops the running NSSM services, rebuilds server and web, runs DB migrations,
    regenerates the Orval API client, then restarts services. Run as Administrator.
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

# ── 2. Server: build + migrate ───────────────────────────────────────────────
Push-Location $serverDir
try {
    Write-Host "==> server: build"
    npm run build
    Write-Host "==> server: migrate"
    npx drizzle-kit migrate
} finally { Pop-Location }

# ── 3. Temporarily start server so orval can fetch the OpenAPI spec ──────────
Write-Host "==> Starting server temporarily for OpenAPI spec fetch..."
$serverProc = Start-Process -FilePath "node" `
    -ArgumentList "$serverDir\dist\src\server.js" `
    -WorkingDirectory $serverDir `
    -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 5

try {
    # ── 4. Web: orval + build ─────────────────────────────────────────────────
    Push-Location $webDir
    try {
        Write-Host "==> web: generate API client (orval)"
        $env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
        npx orval
        Write-Host "==> web: build"
        npm run build
    } finally { Pop-Location }
} finally {
    Write-Host "==> Stopping temporary server..."
    Stop-Process -Id $serverProc.Id -Force -ErrorAction SilentlyContinue
}

# ── 5. Restart services ──────────────────────────────────────────────────────
Write-Host "==> Starting services..."
Start-Service -Name $ServerService
Start-Sleep -Seconds 3
Start-Service -Name $WebService

Write-Host ""
Write-Host "Redeployment complete."
