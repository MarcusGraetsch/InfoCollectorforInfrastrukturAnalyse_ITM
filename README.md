# IT Strukturanalyse · Cloud-Readiness Suite

**HiSolutions AG** — Werkzeug zur strukturierten Datenaufnahme für BSI IT-Grundschutz Strukturanalysen (Standard 200-2) und zur Vorbereitung von Cloud-Readiness-Workshops.

Die Applikation führt Berater:innen vor Ort systematisch durch die Informationsaufnahme, erklärt bei Bedarf den BSI-Hintergrund jeder Frage und erstellt automatisch eine Cloud-Readiness-Bewertung als Grundlage für die Cloud-Strategie.

---

## Schnellstart

### Option 1 — Automatische Installation (empfohlen)

Klonen, Skript starten, fertig. Das Skript installiert alle Pakete, baut die App und öffnet sie im Browser.

**Linux / macOS / WSL:**
```bash
git clone <repo-url>
cd InfoCollectorforInfrastrukturAnalyse_ITM
./install.sh
```

**Windows (PowerShell):**
```powershell
git clone <repo-url>
cd InfoCollectorforInfrastrukturAnalyse_ITM
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

Das Skript fragt interaktiv ab:
- **Deployment-Modus**: Docker (isoliert, produktionsbereit) oder Node.js direkt
- **Port** (Standard: 8080)
- **Erreichbarkeit**: nur localhost (sicher) oder im lokalen Netzwerk

Anschließend läuft ein Health-Check und der Browser öffnet sich automatisch.

### Option 2 — Docker direkt

```bash
docker compose up -d
# → http://localhost:8080
```

### Option 3 — Manuell mit Node.js

```bash
npm install
npm run build
npx serve -s dist -l 8080
# → http://localhost:8080
```

---

## Datensicherheit

- **Alle Daten bleiben lokal** im Browser (`localStorage`) — es gibt kein Backend und keine externe Datenübertragung.
- Optional **nur-localhost-Betrieb** (kein Netzwerk-Exposure).
- Produktions-Webserver mit Security-Headern (nginx, siehe `nginx.conf`).
- Geeignet für den Betrieb in einer kontrollierten, isolierten VM.

---

## Funktionen

| Funktion | Beschreibung |
|---|---|
| **Schritt-für-Schritt-Assistent** | Geführter Ablauf: Cloud-Strategie-Rahmen → gelieferte Unterlagen → 12 BSI-Kategorien → Zusammenfassung |
| **Phase A — Unterlagen** | Erfassung/Import bereits vom Kunden gelieferter Dokumente (Excel & weitere) |
| **Phase B — Interview** | Datenaufnahme je Kategorie mit BSI-Leitfaden ("Warum frage ich das?") und konkreten Interview-Fragen |
| **Cloud-Readiness-Bewertung** | Automatischer Score (0–100) und 6R-Empfehlung je Objekt |
| **Cloud-Dashboard** | KPIs, 6R-Verteilung, Bewertungstabelle, Souveränitäts-Hinweise |
| **Workshop-Export** | XLSX-Paket: Strukturanalyse + Cloud-Strategie + Readiness-Auswertung + Unterlagen |
| **Excel Import / Export** | Bestehende Kundendaten importieren, Strukturanalyse exportieren |

---

## BSI-Kategorien (Strukturanalyse)

Geschäftsprozesse · Daten · Anwendungen · Datenträger · Server · Netzkomponenten · Netzverbindungen · Clients · ICS-Systeme · IoT-Systeme · Räume · Gebäude

---

## Cloud-Readiness — Bewertungslogik

Cloud-relevante Objekte (Anwendungen, Server, Clients, ICS-/IoT-Systeme) werden heuristisch bewertet:

| Level | Score | Bedeutung |
|---|---|---|
| **Hoch** | ≥ 70 | Cloud-fähig, direkte Migration empfohlen |
| **Mittel** | 45–69 | Bedingt geeignet, Modernisierung sinnvoll |
| **Niedrig** | < 45 | Erheblicher Aufwand — Retain/Retire prüfen |

Die **6R-Empfehlung** (Rehost, Replatform, Repurchase, Refactor, Retire, Retain) wird automatisch je Objekt abgeleitet. Bei hohem Schutzbedarf oder geforderter Datensouveränität (C5-Testat, Gaia-X, DE-Standort) wird zusätzlich der Bedarf an **souveräner Cloud** markiert.

> Hinweis: Die Empfehlungen sind heuristische Vorschläge zur Workshop-Vorbereitung und ersetzen keine detaillierte Migrationsanalyse.

---

## Betrieb & Wartung

**Docker:**
```bash
docker compose up -d     # starten
docker compose down      # stoppen
docker compose logs -f   # Logs
```

**Node.js (manuell gestartet via install.sh):**
```bash
./start.sh               # starten (Linux/macOS)
start.bat                # starten (Windows)
kill $(cat app.pid)      # stoppen (Linux/macOS)
```

---

## Technologie-Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS (HiSolutions Corporate Design)
- **Excel**: SheetJS (xlsx)
- **Persistenz**: localStorage (offline-fähig, kein Backend)
- **Deployment**: Docker (nginx:alpine) oder Node.js (serve)

---

## Projektstruktur

```
├── install.sh / install.ps1   Automatische Installation (Linux/Win)
├── Dockerfile                 Multi-stage Build (node → nginx)
├── docker-compose.yml         Container-Orchestrierung
├── nginx.conf                 Webserver-Konfiguration + Security-Header
└── src/
    ├── components/            UI-Komponenten (Wizard, Dashboard, Forms …)
    ├── categories.ts          BSI-Kategorien, Felder, Hilfetexte
    ├── cloudReadiness.ts      Bewertungs-Engine (Score + 6R)
    ├── store.ts               localStorage-Persistenz
    ├── types.ts               TypeScript-Datenmodell
    └── utils/                 Excel Import/Export
```

---

*Entwickelt für die Berater:innen der HiSolutions AG — BSI IT-Grundschutz Strukturanalyse & Cloud-Readiness in der Praxis.*
