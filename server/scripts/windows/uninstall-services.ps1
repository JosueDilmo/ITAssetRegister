param(
    [Parameter(Mandatory = $true)]
    [string]$NssmPath,

    [string]$ServerServiceName = "ITAssetRegister-Server",
    [string]$WebServiceName = "ITAssetRegister-Web"
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

function Remove-ServiceIfExists([string]$serviceName) {
    Write-Host "Removing service if present: $serviceName"
    & $NssmPath remove $serviceName confirm 2>$null | Out-Null
}

Assert-Admin
Assert-PathExists -path $NssmPath -name "NSSM"

Remove-ServiceIfExists -serviceName $WebServiceName
Remove-ServiceIfExists -serviceName $ServerServiceName

Write-Host "Done. Services removed (if they existed)."
