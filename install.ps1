#Requires -Version 5.1
<#
.SYNOPSIS
    HiSolutions AG — IT Strukturanalyse · Windows Installer
.DESCRIPTION
    Installiert und startet die IT Strukturanalyse Web-Applikation
    auf Windows (Docker Desktop oder Node.js direkt).
#>

# ============================================================
#  Farben & Hilfsfunktionen
# ============================================================
$ESC = [char]27
function Write-Navy  { param($msg) Write-Host "$ESC[48;2;0;27;78m$ESC[97m$msg$ESC[0m" }
function Write-Step  { param($msg) Write-Host "`n$ESC[1m$ESC[36m▶ $ESC[97m$msg$ESC[0m" }
function Write-Ok    { param($msg) Write-Host "  $ESC[32m✔$ESC[0m $msg" }
function Write-Warn  { param($msg) Write-Host "  $ESC[33m⚠$ESC[0m $msg" }
function Write-Fail  { param($msg) Write-Host "  $ESC[31m✖$ESC[0m $msg"; exit 1 }
function Write-Dim   { param($msg) Write-Host "  $ESC[2m$msg$ESC[0m" }

function Show-Progress {
    param([string]$Activity, [int]$Duration = 2)
    $steps = 20
    Write-Host -NoNewline "  $ESC[2m$Activity$ESC[0m "
    for ($i = 0; $i -lt $steps; $i++) {
        Write-Host -NoNewline "$ESC[36m·$ESC[0m"
        Start-Sleep -Milliseconds ($Duration * 1000 / $steps)
    }
    Write-Host " $ESC[32m✔$ESC[0m"
}

Clear-Host

# ============================================================
#  Banner
# ============================================================
Write-Navy "  ╔══════════════════════════════════════════════════════════════╗"
Write-Navy "  ║                                                              ║"
Write-Navy "  ║   ██╗  ██╗██╗    ███████╗ ██████╗ ██╗     ██╗   ██╗       ║"
Write-Navy "  ║   ██║  ██║██║    ██╔════╝██╔═══██╗██║     ██║   ██║       ║"
Write-Navy "  ║   ███████║██║    ███████╗██║   ██║██║     ██║   ██║       ║"
Write-Navy "  ║   ██╔══██║██║    ╚════██║██║   ██║██║     ██║   ██║       ║"
Write-Navy "  ║   ██║  ██║██║    ███████║╚██████╔╝███████╗╚██████╔╝       ║"
Write-Navy "  ║   ╚═╝  ╚═╝╚═╝    ╚══════╝ ╚═════╝ ╚══════╝ ╚═════╝       ║"
Write-Navy "  ║                                                              ║"
Write-Navy "  ║          IT Strukturanalyse · Cloud-Readiness Suite          ║"
Write-Navy "  ║                     HiSolutions AG © 2024                    ║"
Write-Navy "  ║                                                              ║"
Write-Navy "  ╚══════════════════════════════════════════════════════════════╝"
Write-Host ""

# ============================================================
#  Deployment-Modus
# ============================================================
Write-Host "$ESC[1m$ESC[97mWie soll die Applikation bereitgestellt werden?$ESC[0m"
Write-Host ""
Write-Host "  $ESC[36m[1]$ESC[0m Docker (empfohlen — isoliert, produktionsbereit)"
Write-Host "  $ESC[36m[2]$ESC[0m Node.js direkt (kein Docker nötig)"
Write-Host ""
$DeployMode = Read-Host "  Auswahl [1/2]"
if ([string]::IsNullOrWhiteSpace($DeployMode)) { $DeployMode = "1" }
Write-Host ""

# ============================================================
#  Port-Konfiguration
# ============================================================
Write-Step "Netzwerk-Konfiguration"
Write-Host ""
Write-Host "  $ESC[97mPort (Standard: 8080)$ESC[0m"
$AppPort = Read-Host "  Port"
if ([string]::IsNullOrWhiteSpace($AppPort)) { $AppPort = "8080" }

Write-Host ""
Write-Host "  $ESC[97mErreichbarkeit:$ESC[0m"
Write-Host "  $ESC[36m[1]$ESC[0m Nur lokal (127.0.0.1) — sicherer"
Write-Host "  $ESC[36m[2]$ESC[0m Im lokalen Netzwerk (0.0.0.0)"
$BindMode = Read-Host "  Auswahl [1/2]"

if ($BindMode -eq "2") {
    $BindHost = "0.0.0.0"
    $LocalIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
        $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*'
    } | Select-Object -First 1).IPAddress
    if (-not $LocalIP) { $LocalIP = "localhost" }
    Write-Warn "App wird im Netzwerk unter http://${LocalIP}:${AppPort} erreichbar sein."
} else {
    $BindHost = "127.0.0.1"
    $LocalIP = "127.0.0.1"
}
Write-Host ""

# ============================================================
#  Docker Deployment
# ============================================================
if ($DeployMode -eq "1") {
    Write-Step "Docker-Deployment"

    $dockerCmd = Get-Command "docker" -ErrorAction SilentlyContinue
    if (-not $dockerCmd) {
        Write-Warn "Docker nicht gefunden."
        Write-Host ""
        Write-Host "  Bitte Docker Desktop installieren:"
        Write-Host "  $ESC[36mhttps://www.docker.com/products/docker-desktop/$ESC[0m"
        Write-Host ""
        $openBrowser = Read-Host "  Browser öffnen? [j/N]"
        if ($openBrowser -eq "j" -or $openBrowser -eq "J") {
            Start-Process "https://www.docker.com/products/docker-desktop/"
        }
        Write-Fail "Docker Desktop wird benötigt. Bitte installieren und erneut ausführen."
    }

    Write-Ok "Docker gefunden: $(docker --version)"

    $composeAvailable = $false
    try {
        docker compose version 2>&1 | Out-Null
        $composeAvailable = $true
        $ComposeCmd = "docker compose"
    } catch {}

    if (-not $composeAvailable) {
        try {
            docker-compose --version 2>&1 | Out-Null
            $ComposeCmd = "docker-compose"
            $composeAvailable = $true
        } catch {}
    }

    if (-not $composeAvailable) {
        Write-Fail "docker compose / docker-compose nicht gefunden. Bitte Docker Desktop aktualisieren."
    }

    Show-Progress "Baue Docker-Image (kann einige Minuten dauern)" 3
    $env:APP_PORT = $AppPort
    Invoke-Expression "$ComposeCmd build" 2>&1 | ForEach-Object { Write-Dim $_ }

    Show-Progress "Starte Container" 1
    $env:APP_PORT = $AppPort
    Invoke-Expression "$ComposeCmd up -d"

    Write-Ok "Container gestartet: it-strukturanalyse"

# ============================================================
#  Node.js Direct Deployment
# ============================================================
} else {
    Write-Step "Node.js Deployment"

    $nodeCmd = Get-Command "node" -ErrorAction SilentlyContinue
    if (-not $nodeCmd) {
        Write-Warn "Node.js nicht gefunden. Automatische Installation..."

        # Try winget first
        $winget = Get-Command "winget" -ErrorAction SilentlyContinue
        if ($winget) {
            Show-Progress "Installiere Node.js 20 via winget" 5
            winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements -h
        } else {
            # Download installer
            $nodeInstaller = "$env:TEMP\node-installer.msi"
            Write-Host "  Lade Node.js herunter..."
            $nodeUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
            Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller -UseBasicParsing
            Show-Progress "Installiere Node.js" 10
            Start-Process msiexec.exe -Wait -ArgumentList "/i `"$nodeInstaller`" /quiet /norestart"
            Remove-Item $nodeInstaller -Force -ErrorAction SilentlyContinue
        }

        # Refresh PATH
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
        $nodeCmd = Get-Command "node" -ErrorAction SilentlyContinue
        if (-not $nodeCmd) {
            Write-Fail "Node.js-Installation fehlgeschlagen. Bitte manuell installieren: https://nodejs.org/"
        }
    }

    Write-Ok "Node.js: $(node --version)"
    Write-Ok "npm: $(npm --version)"

    Show-Progress "Installiere Abhängigkeiten" 4
    npm ci --silent 2>&1 | Select-Object -Last 3 | ForEach-Object { Write-Dim $_ }

    Show-Progress "Baue Produktions-Bundle" 5
    npm run build 2>&1 | Select-Object -Last 3 | ForEach-Object { Write-Dim $_ }
    Write-Ok "Build erfolgreich: dist/"

    # Create start script
    $StartScript = @"
@echo off
echo Starting IT Strukturanalyse...
npx serve -s dist -l $AppPort
"@
    Set-Content -Path "start.bat" -Value $StartScript -Encoding UTF8

    Show-Progress "Starte Webserver auf Port $AppPort" 1
    $proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx serve -s dist -l $AppPort" -WindowStyle Hidden -PassThru
    $proc.Id | Set-Content "app.pid"
    Start-Sleep -Seconds 2

    if (-not $proc.HasExited) {
        Write-Ok "Webserver gestartet (PID: $($proc.Id))"
    } else {
        Write-Fail "Webserver konnte nicht gestartet werden."
    }
}

# ============================================================
#  Health Check
# ============================================================
Write-Host ""
Write-Step "Gesundheitsprüfung"
Start-Sleep -Seconds 2

$AppUrl = "http://127.0.0.1:${AppPort}"
$healthy = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri $AppUrl -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($resp.StatusCode -eq 200) {
            Write-Ok "Applikation erreichbar!"
            $healthy = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 2
}
if (-not $healthy) {
    Write-Warn "Applikation noch nicht erreichbar. Ggf. noch einen Moment warten."
}

# ============================================================
#  Browser öffnen
# ============================================================
Write-Step "Öffne Browser"
$PublicUrl = "http://${LocalIP}:${AppPort}"
Start-Process $PublicUrl

# ============================================================
#  Zusammenfassung
# ============================================================
Write-Host ""
Write-Navy "  ╔══════════════════════════════════════════════════════════════╗"
Write-Navy "  ║                                                              ║"
Write-Navy "  ║   ✔  Installation erfolgreich abgeschlossen!                ║"
Write-Navy "  ║                                                              ║"
Write-Navy ("  ║   URL:  http://${LocalIP}:${AppPort}" + (" " * (49 - $LocalIP.Length - $AppPort.Length)) + "║")
Write-Navy "  ║                                                              ║"
Write-Navy "  ║   Daten werden lokal im Browser gespeichert (localStorage)  ║"
Write-Navy "  ║   Keine Daten verlassen diese VM / diesen Rechner           ║"
Write-Navy "  ║                                                              ║"
if ($DeployMode -eq "1") {
Write-Navy "  ║   Stoppen:  docker compose down                              ║"
Write-Navy "  ║   Starten:  docker compose up -d                            ║"
} else {
Write-Navy "  ║   Stoppen:  taskkill /PID (Get-Content app.pid) /F          ║"
Write-Navy "  ║   Starten:  start.bat                                       ║"
}
Write-Navy "  ║                                                              ║"
Write-Navy "  ╚══════════════════════════════════════════════════════════════╝"
Write-Host ""
