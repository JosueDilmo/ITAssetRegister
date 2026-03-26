param(
    [Parameter(Mandatory = $true)]
    [string]$NssmPath,

    [string]$ServerServiceName = "ITAssetRegister-Server",
    [string]$WebServiceName = "ITAssetRegister-Web",
    [string]$ServerDir = "c:\ITAssetRegister\server",
    [string]$WebDir = "c:\ITAssetRegister\web",
    [string]$PostgresDependencyServiceName = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Assert-Admin {
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator
    )

    if (-not $isAdmin) {
        throw "Run this script in an elevated PowerShell window (Run as Administrator)."
    }
}

function Assert-PathExists([string]$path, [string]$name) {
    if (-not (Test-Path -Path $path)) {
        throw "$name path was not found: $path"
    }
}

function Ensure-ServiceRemoved([string]$serviceName) {
    & $NssmPath remove $serviceName confirm 2>$null | Out-Null
}

function Resolve-PostgresServiceName([string]$configuredName) {
    if (-not [string]::IsNullOrWhiteSpace($configuredName)) {
        return $configuredName
    }

    $matches = Get-Service -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like "postgresql-x64-*" } |
        Sort-Object Name

    if ($null -eq $matches -or $matches.Count -eq 0) {
        return ""
    }

    if ($matches.Count -eq 1) {
        return $matches[0].Name
    }

    throw "Multiple PostgreSQL services found. Re-run with -PostgresDependencyServiceName and pick one: $($matches.Name -join ', ')"
}

function Install-NodeService(
    [string]$serviceName,
    [string]$workingDirectory,
    [string]$logPrefix,
    [string]$dependsOn
) {
    Write-Host "Installing service: $serviceName"

    Ensure-ServiceRemoved -serviceName $serviceName

    $npmCmd = (Get-Command npm.cmd -ErrorAction Stop).Source
    & $NssmPath install $serviceName $npmCmd "run" "start"
    & $NssmPath set $serviceName AppDirectory $workingDirectory
    & $NssmPath set $serviceName Start SERVICE_AUTO_START
    & $NssmPath set $serviceName AppStdout "$workingDirectory\\logs\\$logPrefix-out.log"
    & $NssmPath set $serviceName AppStderr "$workingDirectory\\logs\\$logPrefix-err.log"
    & $NssmPath set $serviceName AppRotateFiles 1
    & $NssmPath set $serviceName AppRotateOnline 1
    & $NssmPath set $serviceName AppRotateSeconds 86400
    & $NssmPath set $serviceName AppRotateBytes 10485760

    if (-not [string]::IsNullOrWhiteSpace($dependsOn)) {
        & $NssmPath set $serviceName DependOnService $dependsOn
    }

    New-Item -ItemType Directory -Path (Join-Path $workingDirectory "logs") -Force | Out-Null
}

Assert-Admin
Assert-PathExists -path $NssmPath -name "NSSM"
Assert-PathExists -path $ServerDir -name "Server directory"
Assert-PathExists -path $WebDir -name "Web directory"

# Build both apps before wiring startup services.
Push-Location $ServerDir
try {
    npm run build
}
finally {
    Pop-Location
}

Push-Location $WebDir
try {
    npm run build
}
finally {
    Pop-Location
}

$resolvedPostgresService = Resolve-PostgresServiceName -configuredName $PostgresDependencyServiceName
$serverDependencies = $resolvedPostgresService
$webDependencies = $ServerServiceName

if ([string]::IsNullOrWhiteSpace($resolvedPostgresService)) {
    Write-Host "No PostgreSQL service dependency configured/found. Server service will start without an explicit DB dependency."
}
else {
    Write-Host "Using PostgreSQL dependency: $resolvedPostgresService"
}

Install-NodeService -serviceName $ServerServiceName -workingDirectory $ServerDir -logPrefix "server" -dependsOn $serverDependencies
Install-NodeService -serviceName $WebServiceName -workingDirectory $WebDir -logPrefix "web" -dependsOn $webDependencies

Write-Host "Starting services..."
Start-Service -Name $ServerServiceName
Start-Service -Name $WebServiceName

Write-Host "Done. Services installed with Automatic startup: $ServerServiceName, $WebServiceName"
