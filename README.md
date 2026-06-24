# IT Strukturanalyse · Cloud-Readiness Suite

**HiSolutions AG** — Strukturiertes Beratungswerkzeug für BSI IT-Grundschutz Strukturanalysen (Standard 200-2), Cloud-Readiness-Bewertungen und regulatorische Compliance-Checks (NIS2, EU AI Act, DORA, EnEfG).

Das Tool führt Berater:innen vor Ort systematisch durch die Informationsaufnahme, bewertet die Cloud-Readiness aller erfassten Systeme und erstellt druckbare Liefergegenstände — vollständig im Browser, kein Backend, offline-fähig.

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

**Vor der Deinstallation Daten sichern** (JSON-Backup-Button im App-Header):

**Linux / macOS / WSL:**
```bash
./uninstall.sh
```

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File .\uninstall.ps1
```

Das Skript stoppt Docker-Container und -Image, beendet laufende Prozesse und löscht optional den Projektordner. Details: [Deinstallation in der Feature-Dokumentation](docs/FEATURES.md#8-deinstallation).

---

## Funktionsübersicht

| Bereich | Funktion |
|---|---|
| **Datenaufnahme** | Schritt-für-Schritt-Assistent (Wizard) + direkte Kategorie-Formulare |
| **14 BSI-Kategorien** | Vollständiges BSI 200-2 Datenmodell inkl. Betriebssysteme + Schnittstellen |
| **Feldtypen** | Text, Select, Zahl (mit Einheit), Datum, URL, Tabelle (MDS), Conditional showIf |
| **Hardware-Felder** | Hersteller, Modell, S/N, CPU, RAM, HE, Strom, Management-IP — an 7 Kategorien |
| **Wirtschaftlichkeit** | AfA (linear), Buchwert, TCO-Aggregation, Verträge, Kostenstellen |
| **Objekt-Notizen** | Kommentar-Feed mit Timestamp + Autor je Objekt |
| **Globale Suche** | `Ctrl+K` — Volltext über alle 14 Kategorien, Tastaturnavigation |
| **Cloud-Readiness** | Score 0–100, 6R-Verteilung, SEAL-Level S0–S3, FinOps-Szenarien |
| **Compliance** | NIS2-Check (geführte Maßnahmen-Wizards), EU AI Act Inventar & Shadow-AI, Cloud-Souveränität (6 Dimensions-Wizards), Evidence-Katalog, ISMS-/BCM-Rollen, BCM & Cloud-Exit, DORA IKT-Register, EnEfG/CO₂, SAM-Analyse |
| **Governance-Modell** | Gemeinsames Control-/Evidence-/Rollen-Modell — NIS2, Souveränität, AI Act, BCM referenzieren zentrale Nachweise & Rollen ([Doku](docs/GOVERNANCE_MODEL.md)) |
| **Analysen** | Infrastruktur-Landkarte, Schnittstellen-Graph, Schnittstellen-Matrix (n×n) |
| **Berichte** | Executive Summary (Spider-Chart), Reifegradmodell, Vollständigkeits-Cockpit |
| **Versionierung** | Snapshot-Versionierung + Delta-Vergleich |
| **Import** | Excel mit 200+ Spalten-Aliasen (Fuzzy-Mapping) + Fehler-Recovery-Tabelle |
| **Export** | JSON-Backup, HTML-Bericht, Excel (Standard + Workshop), AfA-Übersicht, Schnittstellen-Matrix |
| **Verschlüsselung** | Optionale AES-256/GCM Datenverschlüsselung (PBKDF2, 310k Iterationen) |
| **KI-Assistent** | Optional, BYOK, kein Default-Endpunkt, keine Netzwerkanfragen ohne Konfiguration |

→ Alle Funktionen im Detail: **[docs/FEATURES.md](docs/FEATURES.md)**

---

## BSI-Kategorien (14)

Geschäftsprozesse · Daten · Anwendungen · Server · Clients · Netzkomponenten · Netzverbindungen · Sicherheitskomponenten · ICS-Systeme · IoT-Systeme · Datenträger · Räume · **Betriebssysteme** · **Schnittstellen**

---

## Datenpersistenz & Sicherheit

- **Dual-Layer-Persistenz:** localStorage (Lesecache) + IndexedDB (primärer Speicher, robuster gegen Browser-Bereinigung, kein 5-MB-Limit)
- **Auto-Save** bei jeder Zustandsänderung — kein manueller Speichern-Button; Statusanzeige im Header
- **beforeunload-Warnung** wenn ein Speichervorgang noch läuft
- **IDB-Recovery-Banner** wenn IndexedDB neuere Daten enthält als localStorage
- **Optionale Verschlüsselung** (AES-256/GCM, PBKDF2 310k): Passwort beim Start, Daten im Storage verschlüsselt
- **Alle Daten bleiben lokal** — kein Backend, keine externe Datenübertragung
- Security-Header via nginx (CSP, HSTS, X-Frame-Options, …)

---

## Export-Formate

| Format | Zweck | Re-importierbar |
|---|---|---|
| **JSON-Backup** | Vollständige Sicherung, geräteübergreifend | Ja |
| **HTML-Bericht** | Druckbarer Consultant-Bericht (→ PDF via Browser) | Nein |
| **Excel Export** | Alle 14 Kategorien als separate Tabellenblätter | Ja (mit Mapping) |
| **Workshop-Export** | Erweitertes XLSX: Strukturanalyse + Cloud-Readiness | Ja (mit Mapping) |
| **AfA-Übersicht** | Druckbare Asset-/Abschreibungs-Übersicht | Nein |
| **Schnittstellen-Matrix** | Druckbare n×n-Datenfluss-Matrix | Nein |
| **Compliance-Register** | EU AI Act CSV, DORA-Register CSV | Nein |

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

| Schicht | Technologie |
|---|---|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS (HiSolutions Design-Tokens) |
| **Persistenz** | localStorage + IndexedDB (`idb`-Wrapper) |
| **Verschlüsselung** | Web Crypto API (AES-256/GCM, PBKDF2) |
| **Excel** | SheetJS (xlsx, dynamisch geladen) |
| **Graphen** | Mermaid (lazy, securityLevel strict) |
| **Tests** | Vitest (13 Tests) |
| **Deployment** | Docker (nginx:alpine) oder Node.js (serve) |

---

## Projektstruktur

```
├── install.sh / install.ps1       Automatische Installation
├── uninstall.sh / uninstall.ps1   Deinstallation
├── Dockerfile / docker-compose.yml / nginx.conf
├── docs/
│   ├── FEATURES.md                Vollständige Feature-Dokumentation
│   ├── GOVERNANCE_MODEL.md        Querschnitt: Control-/Evidence-/Rollen-Modell
│   ├── DATENMODELL_ERWEITERUNG.md Konzept + Umsetzungsstatus CMDB-Ausbau
│   ├── EXPERT_REVIEW.md           Code-/Security-Review (2026-06-19)
│   ├── IMPROVEMENT_PLAN.md        Verbesserungsmaßnahmen (alle umgesetzt)
│   ├── CONSULTANT_FEATURE_IDEAS.md Backlog + regulatorische Analyse
│   ├── IMPLEMENTATION_PLAN.md     12-Block-Umsetzungsplan (alle erledigt)
│   └── DATAGERRY_VERGLEICH.md     Feature-Vergleich mit DATAGerry
└── src/
    ├── types.ts                   TypeScript-Interfaces (BaseItem, CloudFields, …)
    ├── categories.ts              Deklarative Kategorie-Definitionen (Felder, Hilfe, Vorschläge)
    ├── cloudReadiness.ts          Heuristisches Scoring (assess / assessAll / SEAL-Level)
    ├── store.ts                   Dual-Layer-Persistenz (localStorage + IDB)
    ├── db.ts                      IndexedDB-Wrapper (idbSave / idbLoad / idbClear)
    ├── crypto.ts                  AES-256/GCM-Verschlüsselung (PBKDF2)
    ├── completeness.ts            Vollständigkeits-Berechnung
    ├── wirtschaftlichkeit.ts      AfA-Berechnung + TCO-Aggregation
    ├── maturity.ts                Reifegradmodell (6 Dimensionen, Spider-Chart)
    ├── snapshotStore.ts           Snapshot-Versionierung + Delta
    ├── compliance/
    │   ├── nis2.ts                NIS2-Einstufungslogik + Gap-Analyse
    │   └── euAiAct.ts             EU AI Act Shadow-AI-Heuristik
    ├── integrations/
    │   └── aiSuggest.ts           Optionaler KI-Assistent (BYOK, kein Default)
    ├── utils/
    │   ├── export.ts              Excel-Export (Standard + Workshop)
    │   ├── exportJSON.ts          JSON-Backup & Re-Import
    │   ├── exportReport.ts        Consultant-Bericht (HTML)
    │   ├── import.ts              Excel-Import + Fehler-Recovery
    │   ├── importAnalyzer.ts      Blatt-Erkennung + 200+ Spalten-Aliase (feldAliase.ts)
    │   └── printHtml.ts           Zentrale sichere Print-Utility (esc() + openPrintWindow())
    └── components/
        ├── Wizard.tsx             Schritt-für-Schritt-Ersterfassung
        ├── CategoryForm.tsx       Formular für einzelne Objekte
        ├── CategoryList.tsx       Übersichtstabelle je Kategorie
        ├── CloudDashboard.tsx     Cloud-Readiness-Auswertung
        ├── GlobalSearch.tsx       Globale Suche (Ctrl+K, Modal)
        ├── ObjektNotizen.tsx      Notizen-Feed je Objekt
        ├── TableField.tsx         Multi-Data-Sections (Tabellenfelder)
        ├── ImportWizard.tsx       Excel/JSON-Import + Fehler-Recovery
        ├── VollstaendigkeitsCockpit.tsx Erfassungsfortschritt
        ├── InfrastrukturLandkarte.tsx   Mermaid-Graph + Schnittstellen-Graph
        ├── SchnittstellenMatrix.tsx     n×n-Datenfluss-Matrix
        ├── ExecutiveSummary.tsx   Executive Summary + Spider-Chart
        ├── NIS2Check.tsx          NIS2-Betroffenheits- und Gap-Analyse
        ├── EuAiActInventar.tsx    EU AI Act Inventar + Shadow-AI
        ├── DORARegister.tsx       DORA IKT-Drittparteien-Register
        ├── NachhaltigkeitsModul.tsx  EnEfG/CO₂-Nachhaltigkeitsbewertung
        ├── ErrorBoundary.tsx      Globale Fehlerbehandlung
        └── ProjectView.tsx        Haupt-Navigation (Tabs + SubTabs)
```

---

*Entwickelt für die Berater:innen der HiSolutions AG — BSI IT-Grundschutz Strukturanalyse, Cloud-Readiness und regulatorische Compliance in der Praxis.*
