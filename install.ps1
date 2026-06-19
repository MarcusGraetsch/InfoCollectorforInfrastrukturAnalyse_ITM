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
$BG_NAVY = "$ESC[48;2;0;27;78m"
$WHITE   = "$ESC[97m"
$BOLD    = "$ESC[1m"
$DIM     = "$ESC[2m"
$CYAN    = "$ESC[36m"
$GREEN   = "$ESC[32m"
$YELLOW  = "$ESC[33m"
$RED     = "$ESC[31m"
$RESET   = "$ESC[0m"

function Write-Navy  { param($msg) Write-Host "${BG_NAVY}${WHITE}${BOLD}$msg${RESET}" }
function Write-Step  { param($msg) Write-Host "`n${CYAN}${BOLD}▶ ${WHITE}$msg${RESET}" }
function Write-Ok    { param($msg) Write-Host "  ${GREEN}✔${RESET} $msg" }
function Write-Warn  { param($msg) Write-Host "  ${YELLOW}⚠${RESET} $msg" }
function Write-Fail  { param($msg) Write-Host "  ${RED}✖${RESET} $msg"; exit 1 }
function Write-Dim   { param($msg) Write-Host "  ${DIM}$msg${RESET}" }
function Write-Sep   { Write-Host "  ${DIM}────────────────────────────────────────────────────────────${RESET}" }

Clear-Host

# ============================================================
#  Banner
# ============================================================
Write-Navy "  ╔══════════════════════════════════════════════════════════════╗"
Write-Navy "  ║                                                              ║"
Write-Navy "  ║   ██╗  ██╗██╗                                               ║"
Write-Navy "  ║   ██║  ██║██║  Solutions AG                                 ║"
Write-Navy "  ║   ███████║██║  ──────────────────────────────────────────   ║"
Write-Navy "  ║   ██╔══██║██║  IT Strukturanalyse &                         ║"
Write-Navy "  ║   ██║  ██║██║  Cloud-Readiness · Projektmanagement          ║"
Write-Navy "  ║   ╚═╝  ╚═╝╚═╝  BSI IT-Grundschutz 200-2  ·  © 2026         ║"
Write-Navy "  ║                                                              ║"
Write-Navy "  ╚══════════════════════════════════════════════════════════════╝"
Write-Host ""

# ============================================================
#  Deployment-Modus
# ============================================================
Write-Host "${BOLD}${WHITE}Wie soll die Applikation bereitgestellt werden?${RESET}"
Write-Host ""
Write-Host "  ${CYAN}[1]${RESET} Docker (empfohlen — isoliert, produktionsbereit)"
Write-Host "  ${CYAN}[2]${RESET} Node.js direkt (Entwicklungsmodus, kein Docker nötig)"
Write-Host ""
$DeployMode = Read-Host "  Auswahl [1/2]"
if ([string]::IsNullOrWhiteSpace($DeployMode)) { $DeployMode = "1" }
Write-Host ""

# ============================================================
#  Port-Konfiguration
# ============================================================
Write-Step "Netzwerk-Konfiguration"
Write-Host ""
Write-Host "  ${WHITE}Auf welchem Port soll die Applikation laufen?${RESET}"
Write-Host "  ${DIM}Standard: 8080 (leer lassen für Standard)${RESET}"
$AppPort = Read-Host "  Port"
if ([string]::IsNullOrWhiteSpace($AppPort)) { $AppPort = "8080" }

Write-Host ""
Write-Host "  ${WHITE}Soll die App nur lokal oder über das Netzwerk erreichbar sein?${RESET}"
Write-Host "  ${CYAN}[1]${RESET} Nur lokal (127.0.0.1) — sicherer"
Write-Host "  ${CYAN}[2]${RESET} Im lokalen Netzwerk erreichbar (0.0.0.0)"
$BindMode = Read-Host "  Auswahl [1/2]"

if ($BindMode -eq "2") {
    $BindHost = "0.0.0.0"
    $LocalIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
        $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*'
    } | Select-Object -First 1).IPAddress
    if (-not $LocalIP) { $LocalIP = "localhost" }
    Write-Warn "App wird im Netzwerk unter http://${LocalIP}:${AppPort} erreichbar sein."
    Write-Warn "Stellen Sie sicher, dass Firewall-Regeln entsprechend konfiguriert sind!"
} else {
    $BindHost = "127.0.0.1"
    $LocalIP  = "127.0.0.1"
}
Write-Host ""

# ============================================================
#  Hilfsfunktion: Node.js + npm auf dem Host sicherstellen
# ============================================================
function Ensure-Node {
    $nodeCmd = Get-Command "node" -ErrorAction SilentlyContinue
    if (-not $nodeCmd) {
        Write-Warn "Node.js nicht gefunden. Automatische Installation..."
        $winget = Get-Command "winget" -ErrorAction SilentlyContinue
        if ($winget) {
            Write-Host "  ${DIM}Installiere Node.js 20 via winget …${RESET}"
            winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements -h
        } else {
            $nodeInstaller = "$env:TEMP\node-installer.msi"
            Write-Host "  Lade Node.js herunter..."
            Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi" -OutFile $nodeInstaller -UseBasicParsing
            Start-Process msiexec.exe -Wait -ArgumentList "/i `"$nodeInstaller`" /quiet /norestart"
            Remove-Item $nodeInstaller -Force -ErrorAction SilentlyContinue
        }
        # PATH neu einlesen
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" +
                    [System.Environment]::GetEnvironmentVariable("PATH","User")
        if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
            Write-Fail "Node.js-Installation fehlgeschlagen. Bitte manuell installieren: https://nodejs.org/"
        }
    }
    Write-Ok "Node.js: $(node --version)  npm: $(npm --version)"
}

function Build-App {
    # Corporate-Proxy: SSL-Prüfung deaktivieren
    npm config set strict-ssl false
    Write-Ok "npm SSL-Prüfung deaktiviert (Corporate Proxy)"

    Write-Host ""
    Write-Host "  ${CYAN}${BOLD}▷${RESET} ${WHITE}npm install${RESET} ${DIM}(kann 1–3 Minuten dauern)${RESET}"
    Write-Sep
    $env:NODE_ENV = "development"
    npm install --no-audit --no-fund 2>&1 | ForEach-Object { Write-Dim $_ }
    Write-Sep

    # Fallback: TypeScript explizit installieren
    if (-not (Test-Path "node_modules\.bin\tsc.cmd")) {
        Write-Warn "TypeScript fehlt noch — installiere direkt als Fallback …"
        Write-Sep
        npm install --no-audit --no-fund typescript vite `@vitejs/plugin-react --save-dev 2>&1 | ForEach-Object { Write-Dim $_ }
        Write-Sep
    }
    if (-not (Test-Path "node_modules\.bin\tsc.cmd")) {
        Write-Fail "TypeScript konnte nicht installiert werden."
    }
    $pkgCount = (Get-ChildItem node_modules -Directory -ErrorAction SilentlyContinue | Measure-Object).Count
    Write-Ok "$pkgCount Pakete installiert"

    Write-Host ""
    Write-Host "  ${CYAN}${BOLD}▷${RESET} ${WHITE}npm run build${RESET} ${DIM}(TypeScript + Vite …)${RESET}"
    Write-Sep
    npm run build 2>&1 | ForEach-Object { Write-Dim $_ }
    Write-Sep

    if (-not (Test-Path "dist")) {
        Write-Fail "dist/-Verzeichnis nicht gefunden — Build fehlgeschlagen."
    }
    $distSize = [math]::Round((Get-ChildItem dist -Recurse -File | Measure-Object Length -Sum).Sum / 1MB, 1)
    Write-Ok "Build fertig → dist/ ($($distSize) MB)"
}

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
        Write-Host "  ${CYAN}https://www.docker.com/products/docker-desktop/${RESET}"
        Write-Host ""
        $openBrowser = Read-Host "  Browser öffnen? [j/N]"
        if ($openBrowser -match '^[jJyY]$') {
            Start-Process "https://www.docker.com/products/docker-desktop/"
        }
        Write-Fail "Docker Desktop wird benötigt. Bitte installieren und erneut ausführen."
    }
    Write-Ok "Docker gefunden: $(docker --version | Select-String -Pattern '[\d.]+')"

    # App auf dem Host bauen
    Write-Step "App auf dem Host bauen (npm läuft außerhalb Docker)"
    Ensure-Node
    Build-App

    # Bestehenden Container entfernen
    docker rm -f it-strukturanalyse 2>$null | Out-Null

    Write-Host ""
    Write-Host "  ${CYAN}${BOLD}▷${RESET} ${WHITE}Docker-Image bauen${RESET} ${DIM}(nginx:alpine + dist/ — dauert ~30s)${RESET}"
    Write-Sep
    docker build -t it-strukturanalyse . 2>&1 | ForEach-Object { Write-Dim $_ }
    Write-Sep
    Write-Ok "Docker-Image gebaut"

    Write-Host ""
    Write-Host "  ${CYAN}${BOLD}▷${RESET} ${WHITE}Container starten …${RESET}"
    docker run -d -p "${AppPort}:80" --name it-strukturanalyse --restart unless-stopped it-strukturanalyse | Out-Null

    Start-Sleep -Seconds 2
    $running = docker ps --filter "name=it-strukturanalyse" --filter "status=running" --format "{{.Names}}" 2>$null
    if (-not $running) {
        Write-Fail "Container läuft nicht. Logs: docker logs it-strukturanalyse"
    }
    Write-Ok "Container gestartet: it-strukturanalyse"

# ============================================================
#  Node.js Direct Deployment
# ============================================================
} else {
    Write-Step "Node.js Deployment"
    Ensure-Node
    Build-App

    # Start-Skript anlegen
    $StartScript = "@echo off`r`necho Starting IT Strukturanalyse...`r`nnpx serve -s dist -l tcp://${BindHost}:${AppPort}`r`n"
    Set-Content -Path "start.bat" -Value $StartScript -Encoding UTF8

    Write-Host ""
    Write-Host "  ${CYAN}${BOLD}▷${RESET} ${WHITE}Starte Webserver auf Port $AppPort …${RESET}"
    $proc = Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c npx serve -s dist -l tcp://${BindHost}:${AppPort}" `
        -WindowStyle Hidden -PassThru
    $proc.Id | Set-Content "app.pid"
    Start-Sleep -Seconds 2

    if (-not $proc.HasExited) {
        Write-Ok "Webserver gestartet (PID: $($proc.Id))"
    } else {
        Write-Fail "Webserver konnte nicht gestartet werden."
    }
}

# ============================================================
#  Gesundheitsprüfung
# ============================================================
Write-Host ""
Write-Step "Gesundheitsprüfung"
Start-Sleep -Seconds 2

$AppUrl  = "http://127.0.0.1:${AppPort}"
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
$pad = " " * [math]::Max(0, (42 - $LocalIP.Length - $AppPort.ToString().Length))
Write-Host ""
Write-Navy "  ╔══════════════════════════════════════════════════════════════╗"
Write-Navy "  ║                                                              ║"
Write-Navy "  ║   ✔  Installation erfolgreich abgeschlossen!                ║"
Write-Navy "  ║                                                              ║"
Write-Navy "  ║   URL:  http://${LocalIP}:${AppPort}${pad}║"
Write-Navy "  ║                                                              ║"
Write-Navy "  ║   Daten werden lokal im Browser gespeichert (localStorage)  ║"
Write-Navy "  ║   Keine Daten verlassen diese VM / diesen Rechner           ║"
Write-Navy "  ║                                                              ║"
if ($DeployMode -eq "1") {
Write-Navy "  ║   Stoppen:   docker stop it-strukturanalyse                 ║"
Write-Navy "  ║   Starten:   docker start it-strukturanalyse               ║"
Write-Navy "  ║   Logs:      docker logs it-strukturanalyse                ║"
} else {
Write-Navy "  ║   Stoppen:   taskkill /PID (Get-Content app.pid) /F        ║"
Write-Navy "  ║   Starten:   start.bat                                     ║"
}
Write-Navy "  ║                                                              ║"
Write-Navy "  ╚══════════════════════════════════════════════════════════════╝"
Write-Host ""
