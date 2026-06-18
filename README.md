# IT Strukturanalyse · Cloud-Readiness Suite

**HiSolutions AG** — Werkzeug zur strukturierten Datenaufnahme für BSI IT-Grundschutz Strukturanalysen (Standard 200-2) und zur Vorbereitung von Cloud-Readiness-Workshops.

Die Applikation führt Berater:innen vor Ort systematisch durch die Informationsaufnahme, erklärt bei Bedarf den BSI-Hintergrund jeder Frage und erstellt automatisch eine Cloud-Readiness-Bewertung als Grundlage für die Cloud-Strategie.

→ **[Vollständige Feature-Dokumentation](docs/FEATURES.md)**

---

## Schnellstart

### Option 1 — Automatische Installation (empfohlen)

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

Das Skript fragt interaktiv ab: Deployment-Modus (Docker oder Node.js), Port (Standard: 8080) und Erreichbarkeit (localhost oder Netzwerk). Anschließend öffnet sich der Browser automatisch.

### Option 2 — Docker direkt

```bash
docker compose up -d
# → http://localhost:8080
```

### Option 3 — Manuell mit Node.js

```bash
npm install && npm run build
npx serve -s dist -l 8080
# → http://localhost:8080
```

---

## Deinstallation

**Vor der Deinstallation Daten sichern** (siehe [Datensicherung](#datensicherung)):

**Linux / macOS / WSL:**
```bash
./uninstall.sh
```

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File .\uninstall.ps1
```

Das Skript stoppt Docker-Container und -Image, beendet laufende Prozesse und löscht optional den Projektordner. Details: [Deinstallation in der Feature-Dokumentation](docs/FEATURES.md#12-deinstallation).

---

## Datensicherung

Alle Daten liegen im **Browser-localStorage** — es gibt kein Backend. Vor der Deinstallation oder einem Gerätewechsel stehen drei Exportformate zur Verfügung (Buttons im Header der App):

| Button | Format | Verwendung |
|---|---|---|
| **JSON-Backup** (indigo) | `.json` | Vollständige Sicherung, re-importierbar in jede Neuinstallation |
| **Bericht (HTML)** (violett) | `.html` | Druckbarer Consultant-Bericht (→ PDF via Browser-Druck) |
| **Excel Export** (grün) | `.xlsx` | Alle Kategorien als Tabellenblätter für weitere Bearbeitung |
| **Workshop-Export** (türkis) | `.xlsx` | Erweitertes Paket: Strukturanalyse + Cloud-Readiness-Auswertung |

**JSON-Backup re-importieren:** Button „Import" → `.json`-Datei auswählen. Die App erkennt das Format automatisch und stellt den vollständigen Zustand wieder her.

---

## Funktionsübersicht

| Funktion | Beschreibung |
|---|---|
| **Schritt-für-Schritt-Assistent** | Geführter Ablauf: Cloud-Strategie → Unterlagen → 12 BSI-Kategorien → Zusammenfassung |
| **Feldvorschläge (Combobox)** | Vorgefertigte Fachbegriffe je Kategorie (Plattformen, Protokolle u. v. m.) — freie Eingabe immer möglich |
| **BSI-Kontexthilfe** | „Warum frage ich das?" + Interview-Leitfragen je Kategorie |
| **Wen kann ich fragen?** | Ansprechpartner-Tipps je Kategorie für den Kundenkontakt |
| **E-Mail-Vorlage** | Professionelle Anfrage-Mail für Kundendokumente (1-Klick-Kopieren) |
| **Smart-Import (Excel)** | KI-gestützte Blatt-Erkennung mit manuellem Mapping-Dialog |
| **Cloud-Readiness-Bewertung** | Automatischer Score (0–100) und 6R-Empfehlung je Objekt |
| **Cloud-Dashboard** | KPIs, 6R-Verteilung, Bewertungstabelle, Souveränitäts-Hinweise |
| **JSON-Backup & Re-Import** | Vollständige Datensicherung, geräteübergreifend portierbar |
| **Consultant-Bericht (HTML)** | Druckbarer Bericht mit Branding, Tabellen und Cloud-Scoring |
| **Workshop-Export (XLSX)** | Komplettpaket für den Cloud-Readiness-Workshop |

→ Alle Funktionen im Detail: **[docs/FEATURES.md](docs/FEATURES.md)**

---

## BSI-Kategorien

Geschäftsprozesse · Daten · Anwendungen · Datenträger · Server · Netzkomponenten · Netzverbindungen · Clients · ICS-Systeme · IoT-Systeme · Räume · Gebäude

---

## Datensicherheit

- **Alle Daten bleiben lokal** im Browser (`localStorage`) — kein Backend, keine externe Datenübertragung
- Optional **nur-localhost-Betrieb** (kein Netzwerk-Exposure)
- Produktions-Webserver mit Security-Headern (nginx, siehe `nginx.conf`)
- Geeignet für den Betrieb in einer isolierten VM

---

## Betrieb & Wartung

**Docker:**
```bash
docker compose up -d     # starten
docker compose down      # stoppen
docker compose logs -f   # Logs
```

**Node.js (via install.sh gestartet):**
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
├── install.sh / install.ps1     Automatische Installation (Linux/Win)
├── uninstall.sh / uninstall.ps1 Deinstallation (Linux/Win)
├── Dockerfile                   Container-Build (node → nginx)
├── docker-compose.yml           Container-Orchestrierung
├── nginx.conf                   Webserver + Security-Header
├── docs/
│   └── FEATURES.md              Vollständige Feature-Dokumentation
└── src/
    ├── components/              UI-Komponenten (Wizard, Dashboard, Forms …)
    ├── categories.ts            BSI-Kategorien, Felder, Hilfetexte, Vorschläge
    ├── cloudReadiness.ts        Bewertungs-Engine (Score + 6R)
    ├── store.ts                 localStorage-Persistenz
    ├── types.ts                 TypeScript-Datenmodell
    └── utils/
        ├── export.ts            Excel-Export (Standard + Workshop)
        ├── exportJSON.ts        JSON-Backup & Re-Import
        ├── exportReport.ts      Consultant-Bericht (HTML)
        ├── import.ts            Excel-Import mit Mapping
        └── importAnalyzer.ts   Smart-Blatt-Erkennung
```

---

*Entwickelt für die Berater:innen der HiSolutions AG — BSI IT-Grundschutz Strukturanalyse & Cloud-Readiness in der Praxis.*
