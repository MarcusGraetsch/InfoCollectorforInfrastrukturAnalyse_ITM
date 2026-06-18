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
BG_RED="\033[41m"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_IMAGE="hisolutions-strukturanalyse"
DOCKER_CONTAINER="strukturanalyse"
PID_FILE="$SCRIPT_DIR/app.pid"

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
echo -e "${YELLOW}${BOLD}⚠  Dieses Script entfernt die IT Strukturanalyse-Applikation.${RESET}"
echo ""

# ────────────────────────────────────────────────────────────
#  SCHRITT 1 — Datensicherung anbieten
# ────────────────────────────────────────────────────────────
echo -e "${BOLD}Schritt 1 von 3: Datensicherung${RESET}"
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

read -r -p "  Haben Sie Ihre Daten gesichert? [j/N] " answer
if [[ ! "$answer" =~ ^[jJyY]$ ]]; then
  echo ""
  echo -e "  ${YELLOW}Deinstallation abgebrochen. Bitte sichern Sie zuerst Ihre Daten.${RESET}"
  echo ""
  exit 0
fi

echo ""

# ────────────────────────────────────────────────────────────
#  SCHRITT 2 — App stoppen & Docker-Ressourcen entfernen
# ────────────────────────────────────────────────────────────
echo -e "${BOLD}Schritt 2 von 3: App stoppen & Docker-Ressourcen entfernen${RESET}"
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
  # Container stoppen
  if docker ps -q --filter "name=$DOCKER_CONTAINER" | grep -q .; then
    echo -e "  ${DIM}Stoppe Docker-Container '$DOCKER_CONTAINER' …${RESET}"
    docker stop "$DOCKER_CONTAINER" >/dev/null
    echo -e "  ${GREEN}✓ Container gestoppt${RESET}"
  fi
  # Container entfernen
  if docker ps -aq --filter "name=$DOCKER_CONTAINER" | grep -q .; then
    echo -e "  ${DIM}Entferne Docker-Container '$DOCKER_CONTAINER' …${RESET}"
    docker rm "$DOCKER_CONTAINER" >/dev/null
    echo -e "  ${GREEN}✓ Container entfernt${RESET}"
  fi
  # Image entfernen
  if docker image inspect "$DOCKER_IMAGE" &>/dev/null; then
    echo -e "  ${DIM}Entferne Docker-Image '$DOCKER_IMAGE' …${RESET}"
    docker rmi "$DOCKER_IMAGE" >/dev/null
    echo -e "  ${GREEN}✓ Image entfernt${RESET}"
  fi
  if ! docker ps -q --filter "name=$DOCKER_CONTAINER" | grep -q . && \
     ! docker image inspect "$DOCKER_IMAGE" &>/dev/null; then
    echo -e "  ${DIM}(Keine Docker-Ressourcen gefunden — bereits entfernt oder nie installiert)${RESET}"
  fi
else
  echo -e "  ${DIM}Docker nicht gefunden — überspringe Docker-Schritt.${RESET}"
fi

echo ""

# ────────────────────────────────────────────────────────────
#  SCHRITT 3 — Projektordner entfernen
# ────────────────────────────────────────────────────────────
echo -e "${BOLD}Schritt 3 von 3: Projektordner entfernen${RESET}"
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
