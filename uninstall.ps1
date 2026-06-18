#Requires -Version 5.1
<#
.SYNOPSIS
    HiSolutions AG – IT Strukturanalyse · Deinstallation (Windows PowerShell)
.DESCRIPTION
    Stoppt den laufenden Prozess, entfernt Docker-Container und -Image,
    und löscht optional den Projektordner.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$DOCKER_IMAGE     = 'hisolutions-strukturanalyse'
$DOCKER_CONTAINER = 'strukturanalyse'
$SCRIPT_DIR       = Split-Path -Parent $MyInvocation.MyCommand.Path
$PID_FILE         = Join-Path $SCRIPT_DIR 'app.pid'

Clear-Host

Write-Host ""
Write-Host "  +--------------------------------------------------------------+" -ForegroundColor DarkBlue
Write-Host "  |                                                              |" -ForegroundColor DarkBlue
Write-Host "  |  HiSolutions AG  *  IT Strukturanalyse  *  DEINSTALLATION   |" -ForegroundColor DarkBlue
Write-Host "  |                                                              |" -ForegroundColor DarkBlue
Write-Host "  +--------------------------------------------------------------+" -ForegroundColor DarkBlue
Write-Host ""
Write-Host "  WARNUNG: Dieses Script entfernt die IT Strukturanalyse-Applikation." -ForegroundColor Yellow
Write-Host ""

# ────────────────────────────────────────────────────────────
#  SCHRITT 1 — Datensicherung anbieten
# ────────────────────────────────────────────────────────────
Write-Host "Schritt 1 von 3: Datensicherung" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Alle aufgenommenen Daten liegen im Browser-Speicher (localStorage)"
Write-Host "  und werden beim Entfernen der App NICHT automatisch gesichert."
Write-Host ""
Write-Host "  Empfehlung: Oeffnen Sie die App jetzt im Browser und nutzen Sie" -ForegroundColor Cyan
Write-Host "  die Exportfunktionen im Header:" -ForegroundColor Cyan
Write-Host ""
Write-Host "    * JSON-Backup    -> Vollstaendige Datensicherung (re-importierbar)"
Write-Host "    * Bericht (HTML) -> Consultant-Bericht zum Ausdrucken / Archivieren"
Write-Host "    * Excel Export   -> Tabellenkalkulation fuer weitere Bearbeitung"
Write-Host ""

$answer = Read-Host "  Haben Sie Ihre Daten gesichert? [j/N]"
if ($answer -notmatch '^[jJyY]$') {
    Write-Host ""
    Write-Host "  Deinstallation abgebrochen. Bitte sichern Sie zuerst Ihre Daten." -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

Write-Host ""

# ────────────────────────────────────────────────────────────
#  SCHRITT 2 — App stoppen & Docker-Ressourcen entfernen
# ────────────────────────────────────────────────────────────
Write-Host "Schritt 2 von 3: App stoppen & Docker-Ressourcen entfernen" -ForegroundColor Cyan
Write-Host ""

# Node.js / serve-Prozess
if (Test-Path $PID_FILE) {
    $pid = [int](Get-Content $PID_FILE -Raw).Trim()
    $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "  Stoppe Prozess (PID $pid) ..." -ForegroundColor Gray
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
        Write-Host "  Prozess gestoppt." -ForegroundColor Green
    }
    Remove-Item $PID_FILE -Force
}

# Docker
$dockerAvailable = $null -ne (Get-Command docker -ErrorAction SilentlyContinue)
if ($dockerAvailable) {
    # Container stoppen
    $running = docker ps -q --filter "name=$DOCKER_CONTAINER" 2>$null
    if ($running) {
        Write-Host "  Stoppe Docker-Container '$DOCKER_CONTAINER' ..." -ForegroundColor Gray
        docker stop $DOCKER_CONTAINER | Out-Null
        Write-Host "  Container gestoppt." -ForegroundColor Green
    }
    # Container entfernen
    $exists = docker ps -aq --filter "name=$DOCKER_CONTAINER" 2>$null
    if ($exists) {
        Write-Host "  Entferne Docker-Container '$DOCKER_CONTAINER' ..." -ForegroundColor Gray
        docker rm $DOCKER_CONTAINER | Out-Null
        Write-Host "  Container entfernt." -ForegroundColor Green
    }
    # Image entfernen
    $imageExists = docker image inspect $DOCKER_IMAGE 2>$null
    if ($LASTEXITCODE -eq 0 -and $imageExists) {
        Write-Host "  Entferne Docker-Image '$DOCKER_IMAGE' ..." -ForegroundColor Gray
        docker rmi $DOCKER_IMAGE | Out-Null
        Write-Host "  Image entfernt." -ForegroundColor Green
    }
} else {
    Write-Host "  Docker nicht gefunden – ueberspringe Docker-Schritt." -ForegroundColor Gray
}

Write-Host ""

# ────────────────────────────────────────────────────────────
#  SCHRITT 3 — Projektordner entfernen
# ────────────────────────────────────────────────────────────
Write-Host "Schritt 3 von 3: Projektordner entfernen" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Projektpfad: $SCRIPT_DIR"
Write-Host ""

$answer2 = Read-Host "  Projektordner vollstaendig loeschen? [j/N]"
if ($answer2 -match '^[jJyY]$') {
    $parent = Split-Path -Parent $SCRIPT_DIR
    Set-Location $parent
    Remove-Item -Recurse -Force $SCRIPT_DIR
    Write-Host "  Projektordner geloescht." -ForegroundColor Green
} else {
    Write-Host "  Projektordner bleibt erhalten." -ForegroundColor Gray
}

Write-Host ""
Write-Host "  +--------------------------------------------------------------+" -ForegroundColor DarkBlue
Write-Host "  |                                                              |" -ForegroundColor DarkBlue
Write-Host "  |  Deinstallation abgeschlossen.                               |" -ForegroundColor DarkBlue
Write-Host "  |  Vielen Dank fuer die Nutzung der IT Strukturanalyse.        |" -ForegroundColor DarkBlue
Write-Host "  |                                                              |" -ForegroundColor DarkBlue
Write-Host "  |  HiSolutions AG  *  www.hisolutions.com                      |" -ForegroundColor DarkBlue
Write-Host "  +--------------------------------------------------------------+" -ForegroundColor DarkBlue
Write-Host ""
