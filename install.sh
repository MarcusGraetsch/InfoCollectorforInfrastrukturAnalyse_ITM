#!/usr/bin/env bash
set -euo pipefail

# ============================================================
#  HiSolutions AG — IT Strukturanalyse · Install Script
#  Linux / macOS / WSL
# ============================================================

# --- Colors & Styles ---
BOLD="\033[1m"
DIM="\033[2m"
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[34m"
CYAN="\033[36m"
MAGENTA="\033[35m"
WHITE="\033[97m"
RESET="\033[0m"
BG_NAVY="\033[48;2;0;27;78m"

clear

# --- Banner ---
echo ""
echo -e "${BG_NAVY}${WHITE}${BOLD}"
echo "  ╔══════════════════════════════════════════════════════════════╗"
echo "  ║                                                              ║"
echo "  ║   ██╗  ██╗██╗                                               ║"
echo "  ║   ██║  ██║██║  Solutions AG                                 ║"
echo "  ║   ███████║██║  ──────────────────────────────────────────   ║"
echo "  ║   ██╔══██║██║  IT Strukturanalyse &                         ║"
echo "  ║   ██║  ██║██║  Cloud-Readiness · Projektmanagement          ║"
echo "  ║   ╚═╝  ╚═╝╚═╝  BSI IT-Grundschutz 200-2  ·  © 2026         ║"
echo "  ║                                                              ║"
echo "  ╚══════════════════════════════════════════════════════════════╝"
echo -e "${RESET}"
echo ""

step() {
  echo -e "${CYAN}${BOLD}▶ ${WHITE}$1${RESET}"
}

ok() {
  echo -e "  ${GREEN}✔${RESET} $1"
}

warn() {
  echo -e "  ${YELLOW}⚠${RESET} $1"
}

fail() {
  echo -e "  ${RED}✖${RESET} $1"
  exit 1
}

progress() {
  local msg="$1"
  local dur="${2:-2}"
  echo -ne "  ${DIM}${msg}${RESET}"
  for i in $(seq 1 20); do
    echo -ne "${CYAN}·${RESET}"
    sleep "$(echo "scale=3; $dur/20" | bc -l 2>/dev/null || echo 0.1)"
  done
  echo -e " ${GREEN}✔${RESET}"
}

# Führt einen Befehl aus und zeigt dabei einen Spinner + Live-Statuszeile.
# Verwendung: run_with_spinner "Beschreibung" cmd arg1 arg2 ...
# Gibt Exit-Code des Befehls zurück.
run_with_spinner() {
  local label="$1"; shift
  local log; log=$(mktemp)
  local spinner="⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
  local i=0

  # Befehl im Hintergrund starten, stdout+stderr in Logfile
  "$@" >"$log" 2>&1 &
  local pid=$!

  echo -ne "  ${CYAN}${spinner:0:1}${RESET} ${label}"
  while kill -0 "$pid" 2>/dev/null; do
    local ch="${spinner:$((i % ${#spinner})):1}"
    # Letzte Zeile aus Log als Statushinweis anzeigen
    local hint; hint=$(tail -1 "$log" 2>/dev/null | sed 's/^[[:space:]]*//' | cut -c1-55)
    # Zeile überschreiben
    printf "\r  ${CYAN}%s${RESET} ${label}${DIM}%-57s${RESET}" "$ch" "${hint:+ — $hint}"
    sleep 0.12
    i=$((i+1))
  done

  wait "$pid"
  local exit_code=$?

  if [ $exit_code -eq 0 ]; then
    printf "\r  ${GREEN}✔${RESET} ${label}%-60s\n" ""
  else
    printf "\r  ${RED}✖${RESET} ${label}%-60s\n" ""
    echo -e "  ${DIM}--- Letzte Ausgabe: ---${RESET}"
    tail -20 "$log" | while IFS= read -r line; do
      echo -e "  ${DIM}${line}${RESET}"
    done
  fi

  rm -f "$log"
  return $exit_code
}

# ---- OS Detection ----
OS="$(uname -s)"
ARCH="$(uname -m)"
step "Erkenne System: ${BOLD}$OS ($ARCH)${RESET}"
ok "Betriebssystem erkannt"
echo ""

# ---- Deployment Mode Selection ----
echo -e "${BOLD}${WHITE}Wie soll die Applikation bereitgestellt werden?${RESET}"
echo ""
echo -e "  ${CYAN}[1]${RESET} Docker (empfohlen — isoliert, produktionsbereit)"
echo -e "  ${CYAN}[2]${RESET} Node.js direkt (Entwicklungsmodus, kein Docker nötig)"
echo ""
read -rp "$(echo -e "  ${BOLD}Auswahl [1/2]:${RESET} ")" DEPLOY_MODE
DEPLOY_MODE="${DEPLOY_MODE:-1}"
echo ""

# ---- Port Configuration ----
step "Netzwerk-Konfiguration"
echo ""
echo -e "  ${WHITE}Auf welchem Port soll die Applikation laufen?${RESET}"
echo -e "  ${DIM}Standard: 8080 (leer lassen für Standard)${RESET}"
read -rp "  Port: " APP_PORT
APP_PORT="${APP_PORT:-8080}"
echo ""

echo -e "  ${WHITE}Soll die App nur lokal (localhost) oder über das Netzwerk erreichbar sein?${RESET}"
echo -e "  ${CYAN}[1]${RESET} Nur lokal (127.0.0.1) — sicherer"
echo -e "  ${CYAN}[2]${RESET} Im lokalen Netzwerk erreichbar (0.0.0.0)"
read -rp "  Auswahl [1/2]: " BIND_MODE
BIND_MODE="${BIND_MODE:-1}"

if [ "$BIND_MODE" = "2" ]; then
  BIND_HOST="0.0.0.0"
  # Try to detect local IP
  if command -v ip &>/dev/null; then
    LOCAL_IP=$(ip route get 1 2>/dev/null | awk '{print $7;exit}' || echo "unbekannt")
  elif command -v ifconfig &>/dev/null; then
    LOCAL_IP=$(ifconfig | grep 'inet ' | grep -v 127.0.0.1 | awk '{print $2}' | head -1 || echo "unbekannt")
  else
    LOCAL_IP="<Ihre-IP>"
  fi
  warn "App wird im Netzwerk unter http://${LOCAL_IP}:${APP_PORT} erreichbar sein."
  warn "Stellen Sie sicher, dass Firewall-Regeln entsprechend konfiguriert sind!"
else
  BIND_HOST="127.0.0.1"
  LOCAL_IP="127.0.0.1"
fi
echo ""

export APP_PORT
export BIND_HOST

# ---- Docker Deployment ----
if [ "$DEPLOY_MODE" = "1" ]; then
  step "Docker-Deployment"

  if ! command -v docker &>/dev/null; then
    warn "Docker nicht gefunden. Installation wird gestartet..."
    echo ""
    if [ "$OS" = "Linux" ]; then
      if command -v apt-get &>/dev/null; then
        sudo apt-get update -qq
        sudo apt-get install -y -qq docker.io docker-compose-v2 || sudo apt-get install -y -qq docker.io docker-compose
      elif command -v dnf &>/dev/null; then
        sudo dnf install -y -q docker docker-compose
        sudo systemctl enable --now docker
      elif command -v yum &>/dev/null; then
        sudo yum install -y -q docker docker-compose
        sudo systemctl enable --now docker
      else
        fail "Automatische Docker-Installation nicht möglich. Bitte manuell installieren: https://docs.docker.com/get-docker/"
      fi
      sudo systemctl start docker 2>/dev/null || true
      sudo usermod -aG docker "$USER" 2>/dev/null || true
    elif [ "$OS" = "Darwin" ]; then
      fail "Bitte Docker Desktop für macOS installieren: https://docs.docker.com/desktop/mac/"
    fi
    ok "Docker installiert"
  else
    ok "Docker gefunden: $(docker --version 2>/dev/null | cut -d' ' -f3 | tr -d ',')"
  fi

  # Determine whether we can talk to the Docker daemon without sudo.
  # Use 'sudo -E' to preserve PATH so docker compose plugin is found.
  DOCKER_SUDO=""
  if ! docker info &>/dev/null; then
    if sudo -En true 2>/dev/null || sudo -E true; then
      if sudo -E docker info &>/dev/null; then
        DOCKER_SUDO="sudo -E"
        warn "Docker-Daemon nur mit sudo erreichbar – nutze 'sudo -E' (behält PATH)."
      fi
    fi
  fi
  if [ -z "$DOCKER_SUDO" ] && ! docker info &>/dev/null; then
    fail "Docker-Daemon nicht erreichbar. Versuchen Sie: sudo systemctl start docker"
  fi

  DOCKER_BIN="${DOCKER_SUDO} docker"

  # Build the app on the host first (avoids npm network issues inside Docker)
  step "App auf dem Host bauen (npm läuft außerhalb Docker)"

  if ! command -v node &>/dev/null; then
    warn "Node.js nicht gefunden. Installation wird gestartet..."
    if [ "$OS" = "Linux" ]; then
      curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - 2>/dev/null
      sudo apt-get install -y nodejs 2>/dev/null || sudo dnf install -y nodejs 2>/dev/null || fail "Node.js-Installation fehlgeschlagen."
    elif [ "$OS" = "Darwin" ]; then
      command -v brew &>/dev/null && brew install node@20 || fail "Bitte Node.js manuell installieren: https://nodejs.org/"
    fi
  fi
  ok "Node.js: $(node --version)  npm: $(npm --version)"

  # Corporate-Proxy-Umgebungen nutzen SSL-Inspektion mit selbst-signierten Zertifikaten.
  # npm strict-ssl deaktivieren damit der Registry-Zugriff funktioniert.
  npm config set strict-ssl false
  ok "npm SSL-Prüfung deaktiviert (Corporate Proxy)"

  # npm braucht ein echtes TTY – kein Hintergrundprozess/Redirect, sonst crasht es.
  echo ""
  echo -e "  ${CYAN}${BOLD}▷${RESET} ${WHITE}npm install${RESET} ${DIM}(kann 1–3 Minuten dauern)${RESET}"
  echo -e "  ${DIM}────────────────────────────────────────────────────────────${RESET}"
  NODE_ENV=development npm install --no-audit --no-fund || true
  echo -e "  ${DIM}────────────────────────────────────────────────────────────${RESET}"

  # npm hat einen bekannten Bug ('Exit handler never called!') — prüfen ob tsc da ist:
  if [ ! -f node_modules/.bin/tsc ]; then
    warn "TypeScript fehlt noch — installiere direkt als Fallback …"
    echo -e "  ${DIM}────────────────────────────────────────────────────────────${RESET}"
    NODE_ENV=development npm install --no-audit --no-fund typescript vite @vitejs/plugin-react --save-dev || true
    echo -e "  ${DIM}────────────────────────────────────────────────────────────${RESET}"
  fi
  if [ ! -f node_modules/.bin/tsc ]; then
    fail "TypeScript konnte nicht installiert werden."
  fi
  ok "$(ls node_modules | wc -l | tr -d ' ') Pakete installiert"

  echo ""
  echo -e "  ${CYAN}${BOLD}▷${RESET} ${WHITE}npm run build${RESET} ${DIM}(TypeScript + Vite …)${RESET}"
  echo -e "  ${DIM}────────────────────────────────────────────────────────────${RESET}"
  NODE_ENV=development npm run build
  echo -e "  ${DIM}────────────────────────────────────────────────────────────${RESET}"
  if [ ! -d dist ]; then
    fail "dist/-Verzeichnis nicht gefunden — Build fehlgeschlagen."
  fi
  ok "Build fertig → dist/ ($(du -sh dist 2>/dev/null | cut -f1))"

  # Bestehenden Container entfernen falls vorhanden
  $DOCKER_BIN rm -f it-strukturanalyse 2>/dev/null || true

  echo ""
  echo -e "  ${CYAN}${BOLD}▷${RESET} ${WHITE}Docker-Image bauen${RESET} ${DIM}(nginx:alpine + dist/ — dauert ~30s)${RESET}"
  echo -e "  ${DIM}────────────────────────────────────────────────────────────${RESET}"
  $DOCKER_BIN build -t it-strukturanalyse .
  echo -e "  ${DIM}────────────────────────────────────────────────────────────${RESET}"
  ok "Docker-Image gebaut"

  echo ""
  echo -e "  ${CYAN}${BOLD}▷${RESET} ${WHITE}Container starten …${RESET}"
  $DOCKER_BIN run -d -p "${APP_PORT}:80" --name it-strukturanalyse --restart unless-stopped it-strukturanalyse

  # Verify the container is actually running
  sleep 2
  if ! $DOCKER_BIN ps --filter "name=it-strukturanalyse" --filter "status=running" --format '{{.Names}}' | grep -q .; then
    fail "Container läuft nicht. Logs: $DOCKER_BIN logs it-strukturanalyse"
  fi
  ok "Container gestartet: it-strukturanalyse"

# ---- Node.js Direct Deployment ----
else
  step "Node.js Deployment"

  if ! command -v node &>/dev/null; then
    warn "Node.js nicht gefunden. Installation wird gestartet..."
    if [ "$OS" = "Linux" ]; then
      curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - 2>/dev/null
      sudo apt-get install -y nodejs 2>/dev/null || sudo dnf install -y nodejs 2>/dev/null || fail "Node.js-Installation fehlgeschlagen."
    elif [ "$OS" = "Darwin" ]; then
      if command -v brew &>/dev/null; then
        brew install node@20
      else
        fail "Bitte Node.js manuell installieren: https://nodejs.org/"
      fi
    fi
  fi

  NODE_VER=$(node --version)
  ok "Node.js gefunden: $NODE_VER"
  ok "npm: $(npm --version)"

  npm config set strict-ssl false
  ok "npm SSL-Prüfung deaktiviert (Corporate Proxy)"

  echo ""
  echo -e "  ${CYAN}${BOLD}▷${RESET} ${WHITE}npm install${RESET} ${DIM}(kann 1–3 Minuten dauern)${RESET}"
  echo -e "  ${DIM}────────────────────────────────────────────────────────────${RESET}"
  NODE_ENV=development npm install --no-audit --no-fund || true
  echo -e "  ${DIM}────────────────────────────────────────────────────────────${RESET}"

  if [ ! -f node_modules/.bin/tsc ]; then
    warn "TypeScript fehlt — installiere direkt als Fallback …"
    NODE_ENV=development npm install --no-audit --no-fund typescript vite @vitejs/plugin-react --save-dev || true
  fi
  [ -f node_modules/.bin/tsc ] || fail "TypeScript konnte nicht installiert werden."
  ok "$(ls node_modules | wc -l | tr -d ' ') Pakete installiert"

  echo ""
  echo -e "  ${CYAN}${BOLD}▷${RESET} ${WHITE}npm run build${RESET} ${DIM}(TypeScript + Vite …)${RESET}"
  echo -e "  ${DIM}────────────────────────────────────────────────────────────${RESET}"
  NODE_ENV=development npm run build
  echo -e "  ${DIM}────────────────────────────────────────────────────────────${RESET}"
  if [ ! -d dist ]; then
    fail "dist/-Verzeichnis nicht gefunden — Build fehlgeschlagen."
  fi
  ok "Build fertig → dist/ ($(du -sh dist 2>/dev/null | cut -f1))"

  # Install serve if needed
  if ! command -v serve &>/dev/null && ! npx --yes serve --version &>/dev/null 2>&1; then
    progress "Installiere statischen Webserver (serve)" 1
    npm install -g serve --silent
  fi

  # Create startup script
  cat > start.sh << EOF
#!/bin/bash
echo "Starting IT Strukturanalyse..."
npx serve -s dist -l tcp://${BIND_HOST}:${APP_PORT}
EOF
  chmod +x start.sh

  progress "Starte Webserver auf Port $APP_PORT" 1
  nohup npx serve -s dist -l "tcp://${BIND_HOST}:${APP_PORT}" > app.log 2>&1 &
  APP_PID=$!
  echo $APP_PID > app.pid
  sleep 2

  if kill -0 "$APP_PID" 2>/dev/null; then
    ok "Webserver gestartet (PID: $APP_PID)"
  else
    fail "Webserver konnte nicht gestartet werden. Prüfen Sie app.log"
  fi
fi

# ---- Health Check ----
echo ""
step "Gesundheitsprüfung"
sleep 2
MAX_TRIES=10
for i in $(seq 1 $MAX_TRIES); do
  if curl -sf "http://127.0.0.1:${APP_PORT}" -o /dev/null 2>/dev/null; then
    ok "Applikation erreichbar!"
    break
  fi
  if [ $i -eq $MAX_TRIES ]; then
    warn "Applikation noch nicht erreichbar. Ggf. noch einen Moment warten."
  else
    sleep 2
  fi
done

# ---- Browser Open ----
echo ""
step "Öffne Browser"
APP_URL="http://${LOCAL_IP}:${APP_PORT}"
if command -v xdg-open &>/dev/null; then
  xdg-open "$APP_URL" &>/dev/null &
elif command -v open &>/dev/null; then
  open "$APP_URL"
else
  warn "Browser konnte nicht automatisch geöffnet werden."
fi

# ---- Summary ----
echo ""
echo -e "${BG_NAVY}${WHITE}${BOLD}"
echo "  ╔══════════════════════════════════════════════════════════════╗"
echo "  ║                                                              ║"
echo -e "  ║   ${GREEN}✔  Installation erfolgreich abgeschlossen!${WHITE}              ║"
echo "  ║                                                              ║"
echo -e "  ║   ${CYAN}URL:${WHITE}  http://${LOCAL_IP}:${APP_PORT}$(printf '%*s' $((42-${#LOCAL_IP}-${#APP_PORT})) '')║"
echo "  ║                                                              ║"
echo "  ║   Daten werden lokal im Browser gespeichert (localStorage)  ║"
echo "  ║   Keine Daten verlassen die VM / diesen Rechner             ║"
echo "  ║                                                              ║"
if [ "$DEPLOY_MODE" = "1" ]; then
echo "  ║   Stoppen:   sudo docker stop it-strukturanalyse             ║"
echo "  ║   Starten:   sudo docker start it-strukturanalyse           ║"
echo "  ║   Logs:      sudo docker logs it-strukturanalyse            ║"
else
echo "  ║   Stoppen:   kill \$(cat app.pid)                            ║"
echo "  ║   Starten:   ./start.sh                                     ║"
fi
echo "  ║                                                              ║"
echo "  ╚══════════════════════════════════════════════════════════════╝"
echo -e "${RESET}"
echo ""
