#Requires -Version 5.1
<#
.SYNOPSIS
    HiSolutions AG — IT Strukturanalyse · Windows Deinstallation
.DESCRIPTION
    Stoppt den laufenden Prozess, entfernt Docker-Container und -Image,
    und löscht optional den Projektordner.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'

$ESC = [char]27
$BG_NAVY = "$ESC[48;2;0;27;78m"
$WHITE   = "$ESC[97m"
$BOLD    = "$ESC[1m"
$DIM     = "$ESC[2m"
$CYAN    = "$ESC[36m"
$GREEN   = "$ESC[32m"
$YELLOW  = "$ESC[33m"
$RESET   = "$ESC[0m"

function Write-Navy { param($msg) Write-Host "${BG_NAVY}${WHITE}${BOLD}$msg${RESET}" }
function Write-Ok   { param($msg) Write-Host "  ${GREEN}✔${RESET} $msg" }
function Write-Warn { param($msg) Write-Host "  ${YELLOW}⚠${RESET} $msg" }
function Write-Dim  { param($msg) Write-Host "  ${DIM}$msg${RESET}" }

$DOCKER_CONTAINER = "it-strukturanalyse"
$DOCKER_IMAGE     = "it-strukturanalyse"
$SCRIPT_DIR       = Split-Path -Parent $MyInvocation.MyCommand.Path
$PID_FILE         = Join-Path $SCRIPT_DIR "app.pid"

Clear-Host

# ============================================================
#  Banner
# ============================================================
Write-Navy "  ╔══════════════════════════════════════════════════════════════╗"
Write-Navy "  ║                                                              ║"
Write-Navy "  ║   ██╗  ██╗██╗                                               ║"
Write-Navy "  ║   ██║  ██║██║  Solutions AG                                 ║"
Write-Navy "  ║   ███████║██║  ──────────────────────────────────────────   ║"
Write-Navy "  ║   ██╔══██║██║  IT Strukturanalyse  ·  Deinstallation        ║"
Write-Navy "  ║   ██║  ██║██║  Cloud-Readiness · Projektmanagement          ║"
Write-Navy "  ║   ╚═╝  ╚═╝╚═╝  BSI IT-Grundschutz 200-2  ·  © 2026         ║"
Write-Navy "  ║                                                              ║"
Write-Navy "  ╚══════════════════════════════════════════════════════════════╝"
Write-Host ""
Write-Host "  ${YELLOW}${BOLD}⚠  Dieses Script entfernt die IT Strukturanalyse-Applikation vollständig.${RESET}"
Write-Host ""

# ────────────────────────────────────────────────────────────
#  SCHRITT 1 — Datensicherung anbieten
# ────────────────────────────────────────────────────────────
Write-Host "${BOLD}Schritt 1 von 4: Datensicherung${RESET}"
Write-Host ""
Write-Host "  Alle aufgenommenen Daten (Geschäftsprozesse, Server, Anwendungen usw.)"
Write-Host "  liegen im Browser-Speicher (localStorage)."
Write-Host ""
Write-Host "  ${CYAN}Empfehlung: Öffnen Sie die App jetzt im Browser und nutzen Sie${RESET}"
Write-Host "  ${CYAN}die Exportfunktionen im Header:${RESET}"
Write-Host ""
Write-Host "    • ${BOLD}JSON-Backup${RESET}    → Vollständige Datensicherung (re-importierbar)"
Write-Host "    • ${BOLD}Bericht (HTML)${RESET}  → Consultant-Bericht zum Ausdrucken / Archivieren"
Write-Host "    • ${BOLD}Excel Export${RESET}    → Tabellenkalkulation für weitere Bearbeitung"
Write-Host ""

$answer = Read-Host "  Haben Sie Ihre Daten gesichert (oder gibt es keine zu sichernden Daten)? [j/N]"
if ($answer -notmatch '^[jJyY]$') {
    Write-Host ""
    Write-Warn "Deinstallation abgebrochen. Bitte sichern Sie zuerst Ihre Daten."
    Write-Host ""
    exit 0
}
Write-Host ""

# ────────────────────────────────────────────────────────────
#  SCHRITT 2 — Browser-Daten (localStorage) löschen
# ────────────────────────────────────────────────────────────
Write-Host "${BOLD}Schritt 2 von 4: Browser-Daten (localStorage) löschen${RESET}"
Write-Host ""
Write-Host "  ${YELLOW}${BOLD}WICHTIG — dieser Schritt ist entscheidend!${RESET}"
Write-Host ""
Write-Host "  Die App speichert alle Daten im Browser-Speicher (localStorage)."
Write-Host "  Dieser Speicher überlebt jede Neuinstallation vollständig."
Write-Host "  Docker löschen + Ordner löschen + neu installieren reicht NICHT."
Write-Host ""

# App-Port aus laufendem Container ermitteln
$AppPort = ""
$dockerCmd = Get-Command "docker" -ErrorAction SilentlyContinue
if ($dockerCmd) {
    $portLine = docker ps --filter "name=$DOCKER_CONTAINER" --format "{{.Ports}}" 2>$null
    if ($portLine -match '(?:0\.0\.0\.0|127\.0\.0\.1):(\d+)->') {
        $AppPort = $Matches[1]
    }
}
if (-not $AppPort -and (Test-Path $PID_FILE)) {
    $AppPort = "8080"
}
if (-not $AppPort) { $AppPort = "8080" }
$AppUrl = "http://localhost:${AppPort}"

# Prüfen ob App erreichbar
$AppReachable = $false
try {
    $resp = Invoke-WebRequest -Uri "$AppUrl/clear-data.html" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    if ($resp.StatusCode -eq 200) { $AppReachable = $true }
} catch {}

if ($AppReachable) {
    Write-Ok "App läuft noch — öffne Lösch-Seite automatisch …"
    Write-Host ""
    $ClearUrl = "$AppUrl/clear-data.html?auto=1"
    Start-Process $ClearUrl
    Write-Host "  Die Seite löscht alle Browser-Daten automatisch beim Öffnen."
    Write-Host "  Falls der Browser nicht aufgeht: ${BOLD}$ClearUrl${RESET}"
    Write-Host ""
    Write-Host "  Warten 4 Sekunden damit der Browser die Seite laden kann …"
    Start-Sleep -Seconds 4
    Write-Host ""
} else {
    Write-Warn "App ist nicht erreichbar (Container läuft nicht?)."
    Write-Host "  Bitte löschen Sie die Browser-Daten manuell:"
    Write-Host ""
}

Write-Host "  ${CYAN}Manuelle Methoden (falls automatische Löschung nicht geklappt hat):${RESET}"
Write-Host ""
Write-Host "  ${BOLD}Methode A — Browser-Konsole:${RESET}"
Write-Host "    1. Browser öffnen, beliebige Seite aufrufen"
Write-Host "    2. ${BOLD}F12${RESET} drücken → Tab ${BOLD}'Konsole'${RESET} / ${BOLD}'Console'${RESET}"
Write-Host "    3. Diesen Befehl eingeben und Enter drücken:"
Write-Host ""
Write-Host "       ${BOLD}Object.keys(localStorage).filter(k=>k.startsWith('it-strukturanalyse')||k==='consultant-name').forEach(k=>localStorage.removeItem(k))${RESET}"
Write-Host ""
Write-Host "  ${BOLD}Methode B — Browser-DevTools (visuell):${RESET}"
Write-Host "    Chrome/Edge: F12 → Application → Storage → Local Storage"
Write-Host "                 → http://localhost:${AppPort} → Rechtsklick → Clear"
Write-Host "    Firefox:     F12 → Speicher → Lokaler Speicher"
Write-Host "                 → http://localhost:${AppPort} → Alle löschen"
Write-Host ""

$answerClear = Read-Host "  Browser-Daten wurden gelöscht (oder App war nie genutzt)? [j/N]"
if ($answerClear -notmatch '^[jJyY]$') {
    Write-Host ""
    Write-Warn "Browser-Daten wurden NICHT gelöscht."
    Write-Dim "Bei der nächsten Installation startet die App mit leerem Zustand."
    Write-Host ""
}
Write-Host ""

# ────────────────────────────────────────────────────────────
#  SCHRITT 3 — App stoppen & Docker-Ressourcen entfernen
# ────────────────────────────────────────────────────────────
Write-Host "${BOLD}Schritt 3 von 4: App stoppen & Docker-Ressourcen entfernen${RESET}"
Write-Host ""

# Node.js serve-Prozess
if (Test-Path $PID_FILE) {
    $savedPid = [int]((Get-Content $PID_FILE -Raw).Trim())
    $proc = Get-Process -Id $savedPid -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Dim "Stoppe Node.js-Prozess (PID $savedPid) …"
        Stop-Process -Id $savedPid -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
        Write-Ok "Node.js-Prozess gestoppt"
    }
    Remove-Item $PID_FILE -Force -ErrorAction SilentlyContinue
}

# Docker
if ($dockerCmd) {
    $dockerFound = $false

    # Container stoppen + entfernen
    foreach ($cname in @($DOCKER_CONTAINER)) {
        $runningIds = docker ps -q --filter "name=$cname" 2>$null
        if ($runningIds) {
            $dockerFound = $true
            Write-Dim "Stoppe Container '$cname' …"
            docker stop $cname 2>$null | Out-Null
            Write-Ok "Container gestoppt"
        }
        $allIds = docker ps -aq --filter "name=$cname" 2>$null
        if ($allIds) {
            $dockerFound = $true
            Write-Dim "Entferne Container '$cname' …"
            docker rm -f $cname 2>$null | Out-Null
            Write-Ok "Container entfernt"
        }
    }

    # Image entfernen
    foreach ($img in @($DOCKER_IMAGE, "hisolutions-strukturanalyse")) {
        $exists = docker image inspect $img 2>$null
        if ($LASTEXITCODE -eq 0) {
            $dockerFound = $true
            Write-Dim "Entferne Docker-Image '$img' …"
            docker rmi -f $img 2>$null | Out-Null
            Write-Ok "Image entfernt"
        }
    }

    # Dangling images
    $dangling = docker images -q --filter "dangling=true" 2>$null
    if ($dangling) {
        Write-Dim "Bereinige verwaiste Build-Layer …"
        docker image prune -f 2>$null | Out-Null
        Write-Ok "Dangling images entfernt"
    }

    if (-not $dockerFound) {
        Write-Dim "(Keine Docker-Container oder Images gefunden)"
    }
} else {
    Write-Dim "Docker nicht gefunden — überspringe Docker-Schritt."
}

Write-Host ""

# ────────────────────────────────────────────────────────────
#  SCHRITT 4 — Projektordner entfernen
# ────────────────────────────────────────────────────────────
Write-Host "${BOLD}Schritt 4 von 4: Projektordner entfernen${RESET}"
Write-Host ""
Write-Host "  Projektpfad: ${BOLD}$SCRIPT_DIR${RESET}"
Write-Host ""

$answer2 = Read-Host "  Projektordner vollständig löschen? [j/N]"
if ($answer2 -match '^[jJyY]$') {
    $parent = Split-Path -Parent $SCRIPT_DIR
    Set-Location $parent
    Remove-Item -Recurse -Force $SCRIPT_DIR -ErrorAction SilentlyContinue
    Write-Ok "Projektordner gelöscht"
} else {
    Write-Dim "Projektordner bleibt erhalten."
}

Write-Host ""
Write-Navy "  ╔══════════════════════════════════════════════════════════════╗"
Write-Navy "  ║                                                              ║"
Write-Navy "  ║   Deinstallation abgeschlossen.                             ║"
Write-Navy "  ║   Vielen Dank für die Nutzung der IT Strukturanalyse.       ║"
Write-Navy "  ║                                                              ║"
Write-Navy "  ║   HiSolutions AG  ·  www.hisolutions.com                    ║"
Write-Navy "  ║                                                              ║"
Write-Navy "  ╚══════════════════════════════════════════════════════════════╝"
Write-Host ""
