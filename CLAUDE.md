# CLAUDE.md — IT Strukturanalyse · Entwicklungskontext

Dieses Dokument beschreibt Architektur, aktuelle Entwicklungsrichtung und geplante Features für Claude Code Sessions.

---

## Projektstatus & Technischer Stack

- **React 18 + TypeScript + Vite**, Styling via **Tailwind CSS** (Design-Token: `hi-navy`, `hi-accent`, `hi-teal`, `hi-slate`, `hi-gray`)
- **Kein Backend, kein Server-State** — alle Daten leben im Browser-`localStorage` (Store: `src/store.ts`)
- Deployment: Docker (nginx) oder `npx serve`, Port konfigurierbar (Standard 8080)
- Branch-Konvention: Feature-Branches von `claude/dazzling-ride-04upm4`, Commits immer mit Co-Author-Tag

---

## Kernarchitektur

```
src/
  types.ts          — Alle TypeScript-Interfaces (BaseItem, CloudFields, AppState, …)
  categories.ts     — Deklarative Kategorie-Definitionen (Felder, Labels, Suggestions)
  cloudReadiness.ts — Heuristisches Scoring-Modell (assess / assessAll / summarize)
  store.ts          — localStorage-Persistenz (loadState / saveState / updateState)
  App.tsx           — Haupt-Controller: Routing zwischen Modi, globale State-Mutationen
  components/
    Wizard.tsx            — Geführte Ersterfassung (Schritt für Schritt)
    CloudDashboard.tsx    — Cloud-Readiness-Auswertung (KPIs, 6R-Verteilung, Tabelle)
    CloudReadinessWizard.tsx — Nacherfassung fehlender Cloud-Felder (modal, iterativ)
    CategoryForm.tsx      — Formular für einzelne Kategorie-Einträge
    CategoryList.tsx      — Übersichtstabelle je Kategorie
    ImportWizard.tsx      — Excel/JSON-Import mit Mapping-Dialog
    EmailTemplate.tsx     — Generierung von Erstanfrage-E-Mails
    HelpPanel.tsx         — Kontexthilfe (BSI-Hintergründe)
```

**Kategorien mit Cloud-Readiness-Bewertung:** `anwendungen`, `server`, `clients`, `icsSysteme`, `iotSysteme`

**Weitere Kategorien (Datenmodell-Erweiterung):** `betriebssysteme` (OS als IT-Component), `schnittstellen` (App-zu-App-Kommunikation) — s. Abschnitt „Datenmodell-Erweiterung".

**Scoring-Logik:** Heuristisch (0–100), Schwellen: ≥70 = Hoch, 45–69 = Mittel, <45 = Niedrig. `Unklar`-Werte bei Migrationskomplexität / Lebenszyklus / Internetfähigkeit sind bewusst neutral (kein Punktabzug) — sie markieren offene Fragen.

---

## Datenmodell-Erweiterung (CMDB/EAM-Ausbau, umgesetzt)

Konzept + Status: `docs/DATENMODELL_ERWEITERUNG.md` (Abschnitt 9 = Umsetzungsstatus).

- **Neue FieldTypes:** `number` (mit `unit`/`min`/`step`-Suffix), `date` (native), `url` (mit „öffnen"-Link) — zusätzlich zu `text`/`textarea`/`select`/`multiref`. Werte bleiben **immer Strings** (Export-Format unverändert).
- **Conditional Fields (`showIf`):** `FieldDef.showIf = { field, equals[] }` blendet Felder typabhängig ein/aus (z.B. DB-Felder nur bei „Datenbank"). Helper `isFieldVisible()`; versteckte Felder behalten ihren Wert und zählen nicht als „fehlend".
- **Collapsible Sektionen:** `FieldDef.section` gruppiert Felder in einklappbare Blöcke (z.B. „Technische Details"). Form-Gruppen: `group: 'basis' | 'cloud' | 'hardware' | 'wirtschaft'`.
- **Mixins:** `HardwareFields` (Hersteller/Modell/Seriennr/Inventarnr/Management-IP/Strom/HE/CPU/RAM/Disk…) und `WirtschaftlichkeitFields` (Anschaffung/AfA/Betriebs-/Wartungskosten/Verträge/Support-Ende/Kostenstelle) — via `extends` + `HARDWARE_FIELDS`/`WIRTSCHAFTLICHKEIT_FIELDS`-Schleife (Muster wie `CLOUD_FIELDS`).
- **Neue Kategorien:**
  - `betriebssysteme` (Prefix `OS`): wiederverwendbare IT-Component, multiref von Server/Client → „Server → OS → Apps".
  - `schnittstellen` (Prefix `SS`): typisierte App-zu-App-Kommunikation (Protokoll, Port, Richtung, Verschlüsselung, Auth, Firewall …); quell/ziel als `multiref → anwendungen`.
- **Schnittstellen-Visualisierung:** Modus „Schnittstellen-Graph" in `InfrastrukturLandkarte` (Kantenfarbe nach Verschlüsselung) + druckbare n×n-Matrix `SchnittstellenMatrix.tsx` (Subtab in ProjectView).
- **AfA / TCO-Aggregation:** `src/wirtschaftlichkeit.ts` — `berechneBuchwert()` (lineare AfA, Restwert/Restlaufzeit) und `summiereObjektkosten()`. TCO-Modul bietet „Aus Objektdaten übernehmen" (non-destruktiv) + druckbare Asset-/AfA-Übersicht. Single Source of Truth für Ist-Kosten.
- **Migration:** alle neuen Felder optional; neue Top-Level-Arrays in `createDefaultState` + `arrayKeys` (store.ts) — alte Backups laden unverändert.

---

## Cloud-Souveränität & Compliance (umgesetzt 2026-06-23)

Konzept: `docs/SOUVERAENITAET_FEATURES_KONZEPT.md` (Features A–D umgesetzt).

- **`src/compliance/souveraenitaet.ts`** — (A) `assessSouveraenitaet()` liefert eine
  mehrdimensionale Scorecard (6 Dimensions-Scores, deterministisch aus vorhandenen
  Daten) + (B) `pruefeSouveraenitaet()` als Souveränitäts-Washing-Regel-Engine
  (Verdikt fail/warn/pass/unklar). Erweitert `SouveraenitaetsBewertung.tsx`
  (Scorecard + Spider-Chart + Washing-Tabelle über der bestehenden SEAL-Tabelle).
- **`src/compliance/nachweise.ts`** — (C) statischer `NACHWEIS_KATALOG`
  (Anforderung→Nachweis). Komponente `NachweisKatalog.tsx`, Status persistiert in
  neuem optionalem `AppState.nachweisStatus` (Record, nicht Array; in
  `createDefaultState` + `mergeWithDefault`, NICHT in `arrayKeys`). Update via
  `onUpdateNachweise` in App.tsx (Muster wie `onUpdateNIS2`).
- **`src/compliance/quellen.ts`** — (D) statisches `QUELLEN_REGISTER` (5 Ebenen,
  offline, ISO nur Metadaten) + `ZEITSTRAHL`. Komponente `QuellenBibliothek.tsx`.
- **Neue Subtabs** in ProjectView-Gruppe „Compliance & Regulatorik":
  `nachweise` und `quellen` (Reihenfolge: nis2, euaiact, souveraenitaet,
  nachweise, quellen, nachhaltigkeit, dora).

---

## Entwicklungsrichtung: Von der Datenaufnahme zum Beratungs-Workflow-Tool

Das Tool begann als **strukturierte Datenaufnahme** für BSI-Strukturanalysen. Die natürliche nächste Ebene ist ein **leichtgewichtiges Projektmanagement** für Cloud-Strategie, -Transformation und Audits — ohne externe Tools, direkt im Beratungskontext nutzbar.

Die Leitidee: **Aus „Unklar"-Einträgen werden automatisch Aufgaben**, aus Aufgaben werden Termine, aus Terminen werden Berichte. Das Tool begleitet den gesamten Beratungszyklus.

---

## Feature-Ideen (priorisiert)

### Kurzfristig (nächste Sessions)

**ToDo-/Offene-Punkte-Liste**
- Alle Felder mit Wert `Unklar` automatisch als offene Punkte aggregieren
- Ansicht: gefilterte Liste „Was muss noch geklärt werden?" mit Zuweisung (Person, Termin)
- Export als E-Mail oder Tagesordnungspunkt

**Interview-/Workshop-Vorbereitung**
- Aus den offenen Punkten automatisch eine strukturierte Fragenliste generieren
- Gruppiert nach Kategorie und Thema (Schutzbedarf, Lizenz, Lebenszyklus, …)
- Als PDF oder druckbares HTML exportierbar

**Fortschritts-Cockpit**
- Wie viele Einträge sind vollständig erfasst? Wie viele haben noch `Unklar`-Felder?
- Ampel-Status je Kategorie (Grün = vollständig, Gelb = teilweise, Rot = unbearbeitet)
- Sichtbar direkt im Dashboard, nicht nur im Cloud-Wizard

### Mittelfristig

**Maßnahmen-/Aufgabenverwaltung**
- Je Eintrag: strukturierte Aufgabenliste mit Status (Offen / In Arbeit / Erledigt)
- Fälligkeitsdatum, Verantwortlicher (Freitext)
- Gesamtansicht aller Aufgaben über alle Kategorien hinweg (Kanban-ähnlich oder Liste)
- Export als Excel-Aufgabenliste oder CSV für Projektplan-Import

**Sitzungsprotokoll / Arbeitssitzungen**
- Wizard-Modus speziell für Re-Bewertungs-Sitzungen: zeigt nur Einträge mit Status `Unklar`
- Notizfeld für Sitzungsprotokoll-Einträge pro Objekt
- Abschlussseite: „In dieser Sitzung wurden X Einträge von Unklar auf bewertet gesetzt"

**Risikobewertung (BSI-Grundschutz-Schutzbedarf)**
- Erweiterung des Schutzbedarfs-Felds um Vertraulichkeit / Integrität / Verfügbarkeit (CIA-Triade)
- Einfache Risikoampel basierend auf Schutzbedarf × Bereitstellung
- Grundlage für BSI-200-2-Risikoübersicht

**Vergleichs-/Delta-Ansicht**
- JSON-Snapshots mit Datum-Stempel als Versionen speichern
- Delta-Ansicht: Was hat sich zwischen zwei Aufnahmen geändert? (neu / geändert / entfernt)
- Nützlich für Audit-Follow-ups oder Folge-Projekte

### Längerfristig

**Audit-Vorbereitungs-Modus**
- Prüfkatalog-Ansicht: Welche Informationen sind für ISO 27001 / BSI-Grundschutz / TISAX nötig?
- Ampel-Mapping: Welche Pflichtfelder fehlen noch für den nächsten Audit?
- Exportformat für Auditoren (strukturiertes PDF/Excel)

**Rollenkonzept / Mehrbenutzer (Client-seitig)**
- Lokale Profile (kein Server nötig): Berater vs. Kunde
- Kunde kann bestimmte Felder selbst ausfüllen (z.B. Schutzbedarf, Verantwortliche)
- Berater sieht vollständigen Bearbeitungsstand

**KI-gestützte Vorschläge** *(experimentell)*
- Basierend auf Kategorie + Name automatisch Schutzbedarf / Bereitstellung vorschlagen
- Z.B. „ERP-System" → Hoch, On-Premises (virtualisiert), Lizenz unklar
- Als auswählbaren Startvorschlag, nicht als Pflichtauswahl

---

## Designprinzipien (nicht brechen)

- **Kein Backend** bis explizit anders entschieden — localStorage bleibt die einzige Persistenz
- **Kein Login** — das Tool ist für Beratungssituationen ohne IT-Infrastruktur beim Kunden gedacht
- **Offline-fähig** — nach Installation kein Internet nötig
- **Druckbarkeit** — alle Exporte müssen ohne Browser-Extras funktionieren
- **Keine Breaking Changes** am bestehenden JSON-Export-Format ohne Migrations-Logik

---

## Datenpersistenz

Dual-Layer-Ansatz (seit 2026-06):

- **localStorage** — synchroner Lesecache für schnellen initialen Load (`loadState()` bleibt synchron)
- **IndexedDB** (`it-sa-db`, ObjectStore `state`, Key `main`) — primärer persistenter Speicher; wird bei jeder Zustandsänderung asynchron beschrieben
- **Warum IndexedDB?** localStorage kann von Browsern als „Site Data" bei Cookie-Bereinigung gelöscht werden; IndexedDB ist robuster gegenüber automatischer Browser-Bereinigung und hat kein 5 MB-Limit
- **`src/db.ts`** — kapselt die gesamte IndexedDB-Interaktion (`idbSave`, `idbLoad`, `idbClear`)
- **`loadStateFromIDB()`** in `store.ts` — wird beim App-Start aufgerufen; wenn IndexedDB neuere Daten hat als localStorage (`lastUpdated`-Vergleich), wird der IDB-Stand verwendet (Recovery-Banner im UI)
- **Visueller Speicherstatus** — Spinner „Speichern…" / „✓ Gespeichert" / „⚠ Speicherfehler" im AppHeader
- **beforeunload-Warnung** — Browser warnt wenn ein Speichervorgang noch läuft

---

## Bekannte technische Schulden

- `updateState` in `App.tsx` ist zentral aber untypisiert (`Record<string, unknown>[]`) — langfristig durch typisierte Updater ersetzen
- Cloud-Readiness-Score ignoriert aktuell `Unklar`-Werte (neutral) — könnte explizit als "ToDo-Marker" im Score sichtbar werden
- `dist/` ist in `.gitignore` — `clear-data.html` muss beim Docker-Build aus `public/` kommen (✓ bereits so)
- Excel-Import-Mapping ist fragil bei unbekannten Spaltenköpfen — robustere Fuzzy-Matching-Logik wäre sinnvoll
