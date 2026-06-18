#!/usr/bin/env bash
set -euo pipefail

# ============================================================
#  HiSolutions AG — IT Strukturanalyse · Uninstall Script
#  Linux / macOS / WSL
# ============================================================

BOLD="\033[1m"
DIM="\033[2m"
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
CYAN="\033[36m"
WHITE="\033[97m"
RESET="\033[0m"
BG_NAVY="\033[48;2;0;27;78m"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/app.pid"

# Container- und Image-Namen — müssen mit install.sh übereinstimmen
DOCKER_CONTAINER="it-strukturanalyse"
DOCKER_IMAGE="hisolutions/it-strukturanalyse"
# docker-compose benennt ggf. so:
DOCKER_COMPOSE_VARIANTS=("it-strukturanalyse-1" "it-strukturanalyse_1" "strukturanalyse" "strukturanalyse-1" "strukturanalyse_1")

clear

echo ""
echo -e "${BG_NAVY}${WHITE}${BOLD}"
echo "  ╔══════════════════════════════════════════════════════════════╗"
echo "  ║                                                              ║"
echo "  ║   ██╗  ██╗██╗                                               ║"
echo "  ║   ██║  ██║██║  Solutions AG                                 ║"
echo "  ║   ███████║██║  ──────────────────────────────────────────   ║"
echo "  ║   ██╔══██║██║  IT Strukturanalyse  ·  Deinstallation        ║"
echo "  ║   ██║  ██║██║  Cloud-Readiness Suite                        ║"
echo "  ║   ╚═╝  ╚═╝╚═╝  BSI IT-Grundschutz 200-2  ·  © 2026         ║"
echo "  ║                                                              ║"
echo "  ╚══════════════════════════════════════════════════════════════╝"
echo -e "${RESET}"
echo ""
echo -e "${YELLOW}${BOLD}⚠  Dieses Script entfernt die IT Strukturanalyse-Applikation vollständig.${RESET}"
echo ""

# ────────────────────────────────────────────────────────────
#  SCHRITT 1 — Datensicherung anbieten
# ────────────────────────────────────────────────────────────
echo -e "${BOLD}Schritt 1 von 4: Datensicherung${RESET}"
echo ""
echo "  Alle aufgenommenen Daten (Geschäftsprozesse, Server, Anwendungen usw.)"
echo "  liegen im Browser-Speicher (localStorage) und werden beim Entfernen"
echo "  der App NICHT automatisch gesichert."
echo ""
echo -e "${CYAN}  Empfehlung: Öffnen Sie die App jetzt in Ihrem Browser und nutzen Sie${RESET}"
echo -e "${CYAN}  die Exportfunktionen im Header:${RESET}"
echo ""
echo "    • ${BOLD}JSON-Backup${RESET}   → Vollständige Datensicherung (re-importierbar)"
echo "    • ${BOLD}Bericht (HTML)${RESET} → Consultant-Bericht zum Ausdrucken / Archivieren"
echo "    • ${BOLD}Excel Export${RESET}   → Tabellenkalkulation für weitere Bearbeitung"
echo ""

read -r -p "  Haben Sie Ihre Daten gesichert (oder gibt es keine zu sichernden Daten)? [j/N] " answer
if [[ ! "$answer" =~ ^[jJyY]$ ]]; then
  echo ""
  echo -e "  ${YELLOW}Deinstallation abgebrochen. Bitte sichern Sie zuerst Ihre Daten.${RESET}"
  echo ""
  exit 0
fi

echo ""

# ────────────────────────────────────────────────────────────
#  SCHRITT 2 — Browser-Daten (localStorage) löschen
# ────────────────────────────────────────────────────────────
echo -e "${BOLD}Schritt 2 von 4: Browser-Daten (localStorage) löschen${RESET}"
echo ""
echo "  WICHTIG: Die App speichert alle Daten im Browser-Speicher"
echo "  (localStorage). Dieser Speicher ist unabhängig vom Programmordner"
echo "  und bleibt nach einer Neuinstallation erhalten!"
echo ""

# App-Port ermitteln
APP_PORT=""
if [[ -f "$SCRIPT_DIR/app.pid" ]]; then
  _pid=$(cat "$SCRIPT_DIR/app.pid" 2>/dev/null || true)
  if [[ -n "$_pid" ]] && kill -0 "$_pid" 2>/dev/null; then
    APP_PORT=$(ss -tlnp 2>/dev/null | awk -v pid="$_pid" '$0 ~ "pid="pid"," {match($4,/:([0-9]+)$/,a); print a[1]; exit}' || true)
  fi
fi
if [[ -z "$APP_PORT" ]] && command -v docker &>/dev/null; then
  APP_PORT=$(docker ps --format '{{.Ports}}' --filter "name=${DOCKER_CONTAINER}" 2>/dev/null \
    | grep -oP '0\.0\.0\.0:\K[0-9]+(?=->)' | head -1 || true)
  if [[ -z "$APP_PORT" ]]; then
    for v in "${DOCKER_COMPOSE_VARIANTS[@]}"; do
      APP_PORT=$(docker ps --format '{{.Ports}}' --filter "name=${v}" 2>/dev/null \
        | grep -oP '0\.0\.0\.0:\K[0-9]+(?=->)' | head -1 || true)
      [[ -n "$APP_PORT" ]] && break
    done
  fi
fi
APP_PORT="${APP_PORT:-8080}"
APP_URL="http://localhost:${APP_PORT}"

echo -e "  ${CYAN}Bitte führen Sie jetzt EINEN dieser Schritte durch:${RESET}"
echo ""
echo -e "  ${BOLD}Option A — Roten Button in der App (empfohlen):${RESET}"
echo "    1. Öffnen Sie die App: ${BOLD}${APP_URL}${RESET}"
echo "    2. Klicken Sie oben rechts auf den roten Button ${BOLD}»Daten löschen«${RESET}"
echo "    3. Bestätigen Sie den Dialog — fertig."
echo ""
echo -e "  ${BOLD}Option B — Browser-Einstellungen (falls App nicht mehr startet):${RESET}"
echo "    Chrome/Edge: F12 → Application → Storage → localStorage"
echo "                 → Rechtsklick auf localhost:${APP_PORT} → Clear"
echo "    Firefox:     F12 → Speicher → Lokaler Speicher"
echo "                 → Rechtsklick auf localhost:${APP_PORT} → Alles löschen"
echo ""
echo -e "  ${BOLD}Option C — App-URL direkt im Browser öffnen und Daten löschen:${RESET}"
echo "    ${BOLD}${APP_URL}/clear-data.html${RESET}"
echo ""

# Browser versuchen zu öffnen
if command -v xdg-open &>/dev/null; then
  xdg-open "$APP_URL" 2>/dev/null || true
elif command -v open &>/dev/null; then
  open "$APP_URL" 2>/dev/null || true
fi

read -r -p "  Browser-Daten wurden gelöscht? [j/N] " answer_clear
if [[ ! "$answer_clear" =~ ^[jJyY]$ ]]; then
  echo ""
  echo -e "  ${YELLOW}⚠ Browser-Daten wurden NICHT gelöscht.${RESET}"
  echo -e "  ${DIM}Bei einer Neuinstallation werden die alten Daten wieder sichtbar sein.${RESET}"
  echo -e "  ${DIM}Holen Sie den Schritt nach: App öffnen → roter Button »Daten löschen«.${RESET}"
  echo ""
fi

echo ""

# ────────────────────────────────────────────────────────────
#  SCHRITT 3 — App stoppen & Docker-Ressourcen entfernen
# ────────────────────────────────────────────────────────────
echo -e "${BOLD}Schritt 3 von 4: App stoppen & Docker-Ressourcen entfernen${RESET}"
echo ""

# Node.js serve-Prozess (non-Docker-Start)
if [[ -f "$PID_FILE" ]]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    echo -e "  ${DIM}Stoppe Node.js-Prozess (PID $PID) …${RESET}"
    kill "$PID" 2>/dev/null || true
    sleep 1
    echo -e "  ${GREEN}✓ Prozess gestoppt${RESET}"
  fi
  rm -f "$PID_FILE"
fi

# Docker
if command -v docker &>/dev/null; then
  _docker_found=0

  # Alle zu prüfenden Namen
  ALL_NAMES=("$DOCKER_CONTAINER" "${DOCKER_COMPOSE_VARIANTS[@]}")

  for CNAME in "${ALL_NAMES[@]}"; do
    # Laufende Container
    RUNNING_ID=$(docker ps -q --filter "name=^/${CNAME}$" 2>/dev/null || true)
    if [[ -n "$RUNNING_ID" ]]; then
      _docker_found=1
      echo -e "  ${DIM}Stoppe Docker-Container '$CNAME' (ID: $RUNNING_ID) …${RESET}"
      docker stop "$RUNNING_ID" >/dev/null 2>&1 && echo -e "  ${GREEN}✓ Container gestoppt${RESET}" || \
        echo -e "  ${YELLOW}⚠ Container konnte nicht gestoppt werden${RESET}"
    fi
    # Alle Container (auch gestoppte)
    ALL_ID=$(docker ps -aq --filter "name=^/${CNAME}$" 2>/dev/null || true)
    if [[ -n "$ALL_ID" ]]; then
      _docker_found=1
      echo -e "  ${DIM}Entferne Docker-Container '$CNAME' …${RESET}"
      docker rm "$ALL_ID" >/dev/null 2>&1 && echo -e "  ${GREEN}✓ Container entfernt${RESET}" || \
        echo -e "  ${YELLOW}⚠ Container konnte nicht entfernt werden${RESET}"
    fi
  done

  # Images entfernen (beide möglichen Namen)
  for IMG in "$DOCKER_IMAGE" "hisolutions-strukturanalyse" "it-strukturanalyse"; do
    if docker image inspect "$IMG" >/dev/null 2>&1; then
      _docker_found=1
      echo -e "  ${DIM}Entferne Docker-Image '$IMG' …${RESET}"
      docker rmi "$IMG" >/dev/null 2>&1 && echo -e "  ${GREEN}✓ Image entfernt${RESET}" || \
        echo -e "  ${YELLOW}⚠ Image konnte nicht entfernt werden (evtl. noch in Verwendung)${RESET}"
    fi
  done

  if [[ "$_docker_found" -eq 0 ]]; then
    echo -e "  ${DIM}(Keine Docker-Ressourcen gefunden — bereits entfernt oder nie installiert)${RESET}"
  fi
else
  echo -e "  ${DIM}Docker nicht gefunden — überspringe Docker-Schritt.${RESET}"
fi

echo ""

# ────────────────────────────────────────────────────────────
#  SCHRITT 4 — Projektordner entfernen
# ────────────────────────────────────────────────────────────
echo -e "${BOLD}Schritt 4 von 4: Projektordner entfernen${RESET}"
echo ""
echo "  Projektpfad: ${BOLD}$SCRIPT_DIR${RESET}"
echo ""

read -r -p "  Projektordner vollständig löschen? [j/N] " answer2
if [[ "$answer2" =~ ^[jJyY]$ ]]; then
  PARENT="$(dirname "$SCRIPT_DIR")"
  cd "$PARENT" || true
  rm -rf "$SCRIPT_DIR"
  echo -e "  ${GREEN}✓ Projektordner gelöscht${RESET}"
else
  echo -e "  ${DIM}Projektordner bleibt erhalten.${RESET}"
fi

echo ""
echo -e "${BG_NAVY}${WHITE}${BOLD}"
echo "  ╔══════════════════════════════════════════════════════════════╗"
echo "  ║                                                              ║"
echo "  ║   Deinstallation abgeschlossen.                             ║"
echo "  ║   Vielen Dank für die Nutzung der IT Strukturanalyse.       ║"
echo "  ║                                                              ║"
echo "  ║   HiSolutions AG  ·  www.hisolutions.com                    ║"
echo "  ║                                                              ║"
echo "  ╚══════════════════════════════════════════════════════════════╝"
echo -e "${RESET}"
echo ""
