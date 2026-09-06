<#
Builds and deploys KnowledgeCenter-Web to MRTN-WEB (10.0.0.246).

The IIS site (KnowledgeCenterWeb, bound to *:8081) serves a flattened layout:
contents of dist/ and html/ land directly in the webroot, and css/ stays
as its own subfolder. This does NOT mirror the repo's own folder layout.

Requires a one-time credential file for the MRTN-WEB admin account:
    $cred = Get-Credential -UserName "matt"
    $cred | Export-Clixml -Path "$env:USERPROFILE\.mrtn-web-cred.xml"
And 10.0.0.246 added to this machine's WinRM TrustedHosts:
    Set-Item WSMan:\localhost\Client\TrustedHosts -Value "10.0.0.246" -Force -Concatenate
#>
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$repoRoot     = $PSScriptRoot
$distDir      = Join-Path $repoRoot "dist"
$htmlDir      = Join-Path $repoRoot "html"
$cssDir       = Join-Path $repoRoot "css"
$remoteHost   = "10.0.0.246"
$remoteRoot   = "C:\inetpub\kc-web"
$siteUrl      = "http://${remoteHost}:8081/"
$credPath     = "$env:USERPROFILE\.mrtn-web-cred.xml"

if (-not (Test-Path $credPath)) {
    throw "Missing credential file at $credPath. See script header for setup."
}

Write-Host "==> Building (tsc)..." -ForegroundColor Cyan
Push-Location $repoRoot
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build failed with exit code $LASTEXITCODE" }
} finally {
    Pop-Location
}

$stored = Import-Clixml -Path $credPath
$cred = New-Object System.Management.Automation.PSCredential("$remoteHost\matt", $stored.Password)

Write-Host "==> Connecting to $remoteHost..." -ForegroundColor Cyan
$session = New-PSSession -ComputerName $remoteHost -Credential $cred

try {
    Write-Host "==> Copying dist/* -> webroot (flattened)..." -ForegroundColor Cyan
    Get-ChildItem $distDir | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination $remoteRoot -ToSession $session -Recurse -Force
    }

    Write-Host "==> Copying html/* -> webroot (flattened)..." -ForegroundColor Cyan
    Get-ChildItem $htmlDir | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination $remoteRoot -ToSession $session -Recurse -Force
    }

    Write-Host "==> Copying css/* -> webroot\css..." -ForegroundColor Cyan
    $remoteCssDir = Join-Path $remoteRoot "css"
    Invoke-Command -Session $session -ScriptBlock {
        param($p) if (-not (Test-Path $p)) { New-Item -ItemType Directory -Path $p | Out-Null }
    } -ArgumentList $remoteCssDir
    Get-ChildItem $cssDir | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination $remoteCssDir -ToSession $session -Recurse -Force
    }
}
finally {
    Remove-PSSession $session
}

Write-Host "==> Verifying site responds at $siteUrl..." -ForegroundColor Cyan
try {
    $resp = Invoke-WebRequest -Uri $siteUrl -UseBasicParsing -TimeoutSec 10
    Write-Host "Deploy succeeded - $siteUrl returned HTTP $($resp.StatusCode)" -ForegroundColor Green
} catch {
    Write-Warning "Files copied, but $siteUrl did not respond: $($_.Exception.Message) (note: port 8081 currently has no inbound firewall rule on MRTN-WEB, so this will fail from outside that host until one is added)"
}
