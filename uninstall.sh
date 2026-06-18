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
DOCKER_IMAGE="it-strukturanalyse"
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

# ── sudo-Handling für Docker (identisch zu install.sh) ──────────────────────
DOCKER_SUDO=""
if command -v docker &>/dev/null; then
  if ! docker info &>/dev/null 2>&1; then
    if sudo -En true 2>/dev/null || sudo -E true 2>/dev/null; then
      if sudo -E docker info &>/dev/null 2>&1; then
        DOCKER_SUDO="sudo -E"
      fi
    fi
  fi
fi
DOCKER_BIN="${DOCKER_SUDO} docker"

# ────────────────────────────────────────────────────────────
#  SCHRITT 1 — Datensicherung anbieten
# ────────────────────────────────────────────────────────────
echo -e "${BOLD}Schritt 1 von 4: Datensicherung${RESET}"
echo ""
echo "  Alle aufgenommenen Daten (Geschäftsprozesse, Server, Anwendungen usw.)"
echo "  liegen im Browser-Speicher (localStorage)."
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
echo -e "  ${YELLOW}${BOLD}WICHTIG — dieser Schritt ist entscheidend!${RESET}"
echo ""
echo "  Die App speichert alle Daten im Browser-Speicher (localStorage)."
echo "  Dieser Speicher ist UNABHÄNGIG von Docker, dem Projektordner und"
echo "  dem Betriebssystem — er überlebt jede Neuinstallation komplett."
echo "  Docker löschen + Ordner löschen + neu installieren reicht NICHT."
echo "  Nur das direkte Löschen im Browser entfernt die Daten wirklich."
echo ""

# App-Port ermitteln
APP_PORT=""
if command -v docker &>/dev/null; then
  APP_PORT=$($DOCKER_BIN ps --format '{{.Ports}}' --filter "name=${DOCKER_CONTAINER}" 2>/dev/null \
    | grep -oP '(?:0\.0\.0\.0|127\.0\.0\.1):\K[0-9]+(?=->)' | head -1 || true)
  if [[ -z "$APP_PORT" ]]; then
    for v in "${DOCKER_COMPOSE_VARIANTS[@]}"; do
      APP_PORT=$($DOCKER_BIN ps --format '{{.Ports}}' --filter "name=${v}" 2>/dev/null \
        | grep -oP '(?:0\.0\.0\.0|127\.0\.0\.1):\K[0-9]+(?=->)' | head -1 || true)
      [[ -n "$APP_PORT" ]] && break
    done
  fi
fi
if [[ -z "$APP_PORT" ]] && [[ -f "$SCRIPT_DIR/app.pid" ]]; then
  _pid=$(cat "$SCRIPT_DIR/app.pid" 2>/dev/null || true)
  if [[ -n "$_pid" ]] && kill -0 "$_pid" 2>/dev/null; then
    APP_PORT=$(ss -tlnp 2>/dev/null | awk -v pid="$_pid" '$0 ~ "pid="pid"," {match($4,/:([0-9]+)$/,a); print a[1]; exit}' || true)
  fi
fi
APP_PORT="${APP_PORT:-8080}"
APP_URL="http://localhost:${APP_PORT}"

# Prüfen ob die App noch erreichbar ist
APP_REACHABLE=0
if curl -sf --max-time 3 "${APP_URL}/clear-data.html" >/dev/null 2>&1; then
  APP_REACHABLE=1
fi

if [[ "$APP_REACHABLE" -eq 1 ]]; then
  echo -e "  ${GREEN}✓ App läuft noch — öffne Lösch-Seite automatisch …${RESET}"
  echo ""
  # ?auto=1 → Seite löscht localStorage sofort beim Laden ohne Klick
  CLEAR_URL="${APP_URL}/clear-data.html?auto=1"
  if command -v xdg-open &>/dev/null; then
    xdg-open "$CLEAR_URL" 2>/dev/null &
  elif command -v open &>/dev/null; then
    open "$CLEAR_URL" 2>/dev/null || true
  fi
  echo "  Die Seite löscht alle Browser-Daten automatisch beim Öffnen."
  echo -e "  Falls der Browser nicht aufgeht: ${BOLD}${CLEAR_URL}${RESET}"
  echo ""
  echo "  Warten 4 Sekunden damit der Browser die Seite laden kann …"
  sleep 4
  echo ""
else
  echo -e "  ${YELLOW}⚠ App ist nicht erreichbar (Container läuft nicht?).${RESET}"
  echo "  Bitte löschen Sie die Browser-Daten manuell — eine der folgenden Methoden:"
  echo ""
fi

echo -e "  ${CYAN}Falls die automatische Löschung nicht geklappt hat — Manuelle Methoden:${RESET}"
echo ""
echo -e "  ${BOLD}Methode A — Browser-Konsole (schnellste Methode):${RESET}"
echo -e "    1. Browser öffnen, beliebige Seite aufrufen"
echo -e "    2. ${BOLD}F12${RESET} drücken → Tab ${BOLD}„Konsole"${RESET} / ${BOLD}„Console"${RESET}"
echo -e "    3. Diesen Befehl eingeben und Enter drücken:"
echo ""
echo -e "       ${BOLD}Object.keys(localStorage).filter(k=>k.startsWith('it-strukturanalyse')||k==='consultant-name').forEach(k=>localStorage.removeItem(k))${RESET}"
echo ""
echo -e "  ${BOLD}Methode B — Browser-DevTools (visuell):${RESET}"
echo "    Chrome/Edge: F12 → Application → Storage → Local Storage"
echo "                 → http://localhost:${APP_PORT} → Rechtsklick → Clear"
echo "    Firefox:     F12 → Speicher → Lokaler Speicher"
echo "                 → http://localhost:${APP_PORT} → Alle löschen"
echo ""

read -r -p "  Browser-Daten wurden gelöscht (oder App war nie genutzt)? [j/N] " answer_clear
if [[ ! "$answer_clear" =~ ^[jJyY]$ ]]; then
  echo ""
  echo -e "  ${YELLOW}⚠ Browser-Daten wurden NICHT gelöscht.${RESET}"
  echo -e "  ${DIM}Bei der nächsten Installation startet die App mit leerem Zustand (Storage-Key-Rotation).${RESET}"
  echo -e "  ${DIM}Ältere Datenfragmente bleiben im Browser gespeichert — harmlos, aber nicht sauber.${RESET}"
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
  PID=$(cat "$PID_FILE" 2>/dev/null || true)
  if [[ -n "$PID" ]] && kill -0 "$PID" 2>/dev/null; then
    echo -e "  ${DIM}Stoppe Node.js-Prozess (PID $PID) …${RESET}"
    kill "$PID" 2>/dev/null || true
    sleep 1
    echo -e "  ${GREEN}✓ Node.js-Prozess gestoppt${RESET}"
  fi
  rm -f "$PID_FILE"
fi

# Docker
if command -v docker &>/dev/null; then
  _docker_found=0

  ALL_NAMES=("$DOCKER_CONTAINER" "${DOCKER_COMPOSE_VARIANTS[@]}")

  for CNAME in "${ALL_NAMES[@]}"; do
    # Laufende Container stoppen
    RUNNING_IDS=$($DOCKER_BIN ps -q --filter "name=${CNAME}" 2>/dev/null || true)
    if [[ -n "$RUNNING_IDS" ]]; then
      _docker_found=1
      echo -e "  ${DIM}Stoppe Container '${CNAME}' …${RESET}"
      $DOCKER_BIN stop $RUNNING_IDS >/dev/null 2>&1 \
        && echo -e "  ${GREEN}✓ Container gestoppt${RESET}" \
        || echo -e "  ${YELLOW}⚠ Stoppen fehlgeschlagen${RESET}"
    fi
    # Alle Container (auch gestoppte) entfernen
    ALL_IDS=$($DOCKER_BIN ps -aq --filter "name=${CNAME}" 2>/dev/null || true)
    if [[ -n "$ALL_IDS" ]]; then
      _docker_found=1
      echo -e "  ${DIM}Entferne Container '${CNAME}' …${RESET}"
      $DOCKER_BIN rm -f $ALL_IDS >/dev/null 2>&1 \
        && echo -e "  ${GREEN}✓ Container entfernt${RESET}" \
        || echo -e "  ${YELLOW}⚠ Entfernen fehlgeschlagen${RESET}"
    fi
  done

  # Images entfernen
  for IMG in "$DOCKER_IMAGE" "hisolutions/it-strukturanalyse" "hisolutions-strukturanalyse"; do
    if $DOCKER_BIN image inspect "$IMG" >/dev/null 2>&1; then
      _docker_found=1
      echo -e "  ${DIM}Entferne Docker-Image '${IMG}' …${RESET}"
      $DOCKER_BIN rmi -f "$IMG" >/dev/null 2>&1 \
        && echo -e "  ${GREEN}✓ Image entfernt${RESET}" \
        || echo -e "  ${YELLOW}⚠ Image konnte nicht entfernt werden${RESET}"
    fi
  done

  # Verwaiste Build-Layer bereinigen
  DANGLING=$($DOCKER_BIN images -q --filter "dangling=true" 2>/dev/null || true)
  if [[ -n "$DANGLING" ]]; then
    echo -e "  ${DIM}Bereinige verwaiste Build-Layer …${RESET}"
    $DOCKER_BIN image prune -f >/dev/null 2>&1 \
      && echo -e "  ${GREEN}✓ Dangling images entfernt${RESET}" || true
  fi

  if [[ "$_docker_found" -eq 0 ]]; then
    echo -e "  ${DIM}(Keine Docker-Container oder Images gefunden)${RESET}"
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
echo -e "  Projektpfad: ${BOLD}$SCRIPT_DIR${RESET}"
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
