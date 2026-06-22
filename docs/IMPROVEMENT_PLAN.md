# Verbesserungsplan — IT Strukturanalyse

> **Status: Alle 4 Phasen implementiert und committed (2026-06-19)**

**Bezug:** `docs/EXPERT_REVIEW.md` (Finding-IDs SEC-/ARCH-/UX-)
**Ziel:** Überführung der Review-Befunde in eine priorisierte, nachvollziehbare Roadmap unter strikter Einhaltung der Designprinzipien (kein Backend, kein Login, offline-fähig, druckbar, keine Breaking Changes am JSON-Format ohne Migration).

---

## Empfohlene Reihenfolge & Begründung

1. **Phase 1 (Quick Wins & kritische Security)** zuerst, weil die XSS-/Injection-Befunde (SEC-01, SEC-02, SEC-04) das größte Risiko bei minimaler Designänderung darstellen und teilweise durch eine einzige zentrale Utility behoben werden (ARCH-06 als Enabler).
2. **Phase 2 (Härtung & Qualität)** schafft mit Tests/CI (ARCH-01) ein Sicherheitsnetz, bevor größere Refactorings (Typisierung, Import-Validierung) erfolgen.
3. **Phase 3 (UX/Politur)** baut auf der konsolidierten Print-Utility auf (einheitliche Deliverables) und entschärft die Navigations-Überladung.
4. **Phase 4 (optional/strategisch)** umfasst kostenintensivere, nicht zwingende Maßnahmen (At-Rest-Verschlüsselung, Lazy-Loading, vollständige A11y).

**Kritischer Pfad:** ARCH-06 (zentrale Print-Utility) ist Voraussetzung für die saubere Lösung von SEC-01 und UX-04 → früh umsetzen.

---

## Phase 1 — Quick Wins & kritische Security ✅ DONE

### P1.1 — Zentrale, sichere Print-Utility (ARCH-06, Enabler für SEC-01/UX-04)
- **Dateien (neu):** `src/utils/printHtml.ts` — exportiert `esc(value)` (aus `exportReport.ts` extrahiert) und `openPrintWindow(title, bodyHtml, opts)` mit einheitlichem Print-Stylesheet + HiSolutions-Header/Fußzeile.
- **Akzeptanzkriterien:** Funktion escaped jeden interpolierten Wert; öffnet Fenster, schreibt Shell, ruft `print()`; kein Inline-Skript.
- **Aufwand:** S–M · **Abhängigkeiten:** keine · **Breaking:** nein.

### P1.2 — SEC-01: Alle Druck-Exporte auf sichere Utility migrieren
- **Dateien:** `StakeholderRegister.tsx`, `SecurityGovernanceArchitektur.tsx`, `NIS2Check.tsx`, `TCOModell.tsx`, `MeetingProtokolle.tsx`, `LizenzKostenAnalyse.tsx`, `ZielarchitekturBetrieb.tsx`, `InterviewFragenliste.tsx`, `VollstaendigkeitsCockpit.tsx`, `TOPsUebersicht.tsx`, `InfrastrukturLandkarte.tsx`, `InfrastrukturBericht.tsx`, `ExecutiveSummary.tsx`.
- **Vorgehen:** rohe Interpolationen durch `esc(...)` ersetzen bzw. auf `openPrintWindow()` umstellen.
- **Akzeptanzkriterien:** Eingabe `<img src=x onerror=alert(1)>` in einem beliebigen Feld führt im Druckdokument **nicht** zur Skriptausführung; Ausgabe optisch unverändert/konsistenter.
- **Aufwand:** M · **Abhängigkeiten:** P1.1 · **Breaking:** nein.

### P1.3 — SEC-02: Mermaid härten
- **Dateien:** `src/components/InfrastrukturLandkarte.tsx:161, 186-189`.
- **Vorgehen:** `securityLevel: 'strict'`; Node-Labels vor Einbau in Mermaid-Code escapen (Sonderzeichen entfernen/quoten); Druckpfad über P1.1.
- **Akzeptanzkriterien:** Systemname mit `"`/`<`/Backtick rendert sicher (kein Code, kein Renderbruch); Diagramm weiterhin lesbar.
- **Aufwand:** S · **Abhängigkeiten:** P1.1 (für Druck) · **Breaking:** nein.

### P1.4 — SEC-04: CSV-/Excel-Formel-Injection neutralisieren
- **Dateien (neu):** Helper `neutralizeFormula()` in `src/utils/export.ts`; Anwendung in `export.ts` (alle `aoa_to_sheet`-Werte) und `EuAiActInventar.tsx:49`.
- **Vorgehen:** Werten mit führendem `= + - @ Tab CR` ein `'` voranstellen, vor dem Schreiben.
- **Akzeptanzkriterien:** Export eines Feldes `=1+1` ergibt in Excel den Text `=1+1`, keine Formel.
- **Aufwand:** S · **Abhängigkeiten:** keine · **Breaking:** nein (reine Ausgabeänderung).

### P1.5 — SEC-03: CSP/Header härten
- **Dateien:** `nginx.conf:8-12`.
- **Vorgehen:** `script-src 'self'` (ohne `unsafe-inline`); `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'self'` ergänzen; `X-XSS-Protection` entfernen; `style-src` zunächst belassen.
- **Akzeptanzkriterien:** Production-Build lädt und funktioniert ohne CSP-Konsolenfehler; Header per `curl -I` verifiziert.
- **Aufwand:** S · **Abhängigkeiten:** Build testen (Vite erzeugt referenzierte Module, keine Inline-Skripte) · **Risiko:** falls doch Inline-Skript nötig → Hash/Nonce · **Breaking:** nein.

### P1.6 — SEC-05 (Teil): `clearState()` vollständig machen
- **Dateien:** `src/store.ts:207-215` (IndexedDB-Store `it-strukturanalyse-files` leeren + `clearAIConfig()` aufrufen), Import aus `fileStore.ts`/`aiSuggest.ts`.
- **Akzeptanzkriterien:** Nach „Alle Daten löschen" sind localStorage-App-Keys, der AI-Config-Key **und** alle IndexedDB-Anhänge entfernt.
- **Aufwand:** S · **Abhängigkeiten:** keine · **Breaking:** nein.

### P1.7 — SEC-06 (Teil): AI-Fetch-Timeout
- **Dateien:** `src/integrations/aiSuggest.ts:83-92`; Datenschutz-Hinweis in `AIAssistantSettings.tsx`.
- **Vorgehen:** `AbortController` + 5s Timeout; Hinweistext, welche Daten den Endpoint erreichen.
- **Akzeptanzkriterien:** Hängender Endpoint bricht nach 5s ab (UI nicht blockiert); Key bleibt aus Export ausgeschlossen.
- **Aufwand:** S · **Breaking:** nein.

---

## Phase 2 — Härtung & Qualität ✅ DONE

### P2.1 — ARCH-01: Test-Setup + Minimal-CI
- **Dateien (neu):** `vitest.config.ts`, `src/**/*.test.ts`, `.github/workflows/ci.yml`; `package.json` (Scripts/Dev-Deps).
- **Erste Tests:** `mergeWithDefault`, `assess/assessAll/summarize` (`cloudReadiness.ts`), `importFromJSON` (inkl. Fehler-/Versionspfade), `parseCsvToRows`, `generateKuerzel`, sowie Regressionstests für `neutralizeFormula` und `esc` (P1.1/P1.4).
- **CI:** `tsc -b` + `eslint .` + `vitest run` + `npm audit --audit-level=high` bei Push/PR.
- **Akzeptanzkriterien:** CI grün; Scoring-Kernfunktionen abgedeckt; Lint ohne Fehler.
- **Aufwand:** L · **Abhängigkeiten:** idealerweise nach P1 (Tests sichern neue Utilities ab) · **Breaking:** nein.

### P2.2 — ARCH-03: Import-Validierung (Laufzeit-Schema)
- **Dateien:** `src/utils/exportJSON.ts`, ggf. neues `src/utils/schema.ts` (Zod), `src/store.ts`.
- **Vorgehen:** `BackupFile`/Kern-`AppState` validieren; in Exporte einfließende Felder beim Import nach `string` coercen.
- **Akzeptanzkriterien:** Manipuliertes Backup mit falschen Typen wird abgewiesen oder sicher coerced; bestehende valide Backups importieren unverändert.
- **Aufwand:** M · **Abhängigkeiten:** P2.1 (Tests) · **Breaking:** nein (defensiv, mit Migration kompatibel).

### P2.3 — ARCH-04: Error Boundary
- **Dateien:** neu `src/components/ErrorBoundary.tsx`; Einbindung in `src/main.tsx`/`App.tsx`.
- **Akzeptanzkriterien:** Provozierter Render-Fehler zeigt Fallback-UI mit „Backup exportieren / neu laden" statt White Screen.
- **Aufwand:** S · **Breaking:** nein.

### P2.4 — ARCH-02: Typisierter State-Updater
- **Dateien:** `src/App.tsx`, `src/utils/import.ts`, `src/utils/export.ts`, `src/store.ts`.
- **Vorgehen:** generischer `updateCategory<K extends CategoryKey>`-Updater; schrittweise `as unknown as`-Casts reduzieren.
- **Akzeptanzkriterien:** Reduktion der Casts messbar; `tsc` weiterhin grün; Verhalten unverändert (durch P2.1-Tests gesichert).
- **Aufwand:** M · **Abhängigkeiten:** P2.1 · **Breaking:** nein.

### P2.5 — SEC-07: Dependency-Scanning + SheetJS-Pfad
- **Dateien:** CI (`npm audit`), Dependabot-Config; Prüfung Bezugsquelle/Version `xlsx`.
- **Akzeptanzkriterien:** Automatisierte Audits aktiv; Entscheidung zu SheetJS dokumentiert.
- **Aufwand:** S · **Abhängigkeiten:** P2.1 · **Breaking:** ggf. bei Major-Upgrade von xlsx (dann Import-/Export-Tests aus P2.1 als Schutz).

---

## Phase 3 — UX/Politur ✅ DONE

### P3.1 — UX-04: Einheitliche Print-Deliverables (Branding)
- **Dateien:** `src/utils/printHtml.ts` (aus P1.1 erweitern).
- **Akzeptanzkriterien:** Alle Druckausgaben teilen Typo, Header (HiSolutions, Kunde, Stand) und Fußzeile.
- **Aufwand:** S–M · **Abhängigkeiten:** P1.1/P1.2 · **Breaking:** nein.

### P3.2 — UX-01 + UX-05: Navigation entlasten
- **Dateien:** `src/components/ProjectView.tsx`.
- **Vorgehen:** Sidebar mit kollabierbaren Gruppen oder zweistufige Navigation; responsives Verhalten; aktive/datenführende Module hervorheben.
- **Akzeptanzkriterien:** Auf 1280px-Breite kein Tab-Umbruch/Scroll; Module per max. 2 Klicks erreichbar.
- **Aufwand:** M · **Breaking:** nein.

### P3.3 — UX-02 + UX-03: Empty States & Onboarding
- **Dateien:** neu `src/components/EmptyState.tsx`; Einsatz in Listen-/Compliance-Tabs; dismissable Erststart-Hinweis.
- **Akzeptanzkriterien:** Jeder leere Tab zeigt Erklärung + primäre Aktion; Erststart zeigt empfohlene Reihenfolge.
- **Aufwand:** S–M · **Breaking:** nein.

### P3.4 — UX-06: Barrierefreiheit
- **Dateien:** `ProjectView.tsx` (ARIA-Tabs-Pattern), Icon-only-Buttons (`aria-label`), Score/Status textuell.
- **Akzeptanzkriterien:** Tastaturnavigation in Tabs (Pfeiltasten), Screenreader nennt Tab-Status; Kontrast WCAG AA.
- **Aufwand:** M · **Abhängigkeiten:** sinnvoll nach P3.2 · **Breaking:** nein.

### P3.5 — UX-07: Datenspeicher-Transparenz
- **Dateien:** kleine Info-/Settings-Sektion; verknüpft mit P1.6.
- **Akzeptanzkriterien:** Nutzer sieht, welche Speicher genutzt werden und kann alles restlos löschen.
- **Aufwand:** S · **Abhängigkeiten:** P1.6 · **Breaking:** nein.

---

## Phase 4 — Optional / Strategisch ✅ DONE

### P4.1 — ARCH-05: Lazy-Loading schwerer Tabs
- **Dateien:** `ProjectView.tsx` (`React.lazy`+`Suspense` für Landkarte/Mermaid, Berichte); Bundle-Analyse.
- **Akzeptanzkriterien:** Initial-Bundle messbar kleiner; Tabs laden bei Bedarf.
- **Aufwand:** S–M · **Breaking:** nein.

### P4.2 — SEC-05 (voll): Optionale At-Rest-Verschlüsselung
- **Dateien:** `store.ts`/`fileStore.ts` (WebCrypto AES-GCM, PBKDF2 aus Nutzer-Passphrase), Opt-in-UI.
- **Vorgehen:** **Migrationspflichtig** — verschlüsseltes Format ist eine Formatänderung; Klartext-Bestände müssen transparent migriert/entschlüsselbar bleiben.
- **Akzeptanzkriterien:** Opt-in; ohne Passphrase keine Klartextdaten im Storage; bestehende Daten migrieren ohne Verlust; JSON-Export-Format bleibt kompatibel.
- **Aufwand:** L · **Abhängigkeiten:** P2.1/P2.2 · **Breaking:** ja (Storage-Format; **Migration erforderlich**).

### P4.3 — SEC-06 (voll) / ARCH-06-Folge: CSP `connect-src` für KI
- **Dateien:** `nginx.conf`.
- **Vorgehen:** Entscheidung Härtung vs. Flexibilität; ggf. konfigurierbarer Host.
- **Aufwand:** S · **Breaking:** funktional (KI nur zu erlaubten Hosts).

### P4.4 — ARCH-07: Doku-Abgleich
- **Dateien:** `CLAUDE.md`, `README.md`.
- **Akzeptanzkriterien:** React 19, IndexedDB-Nutzung, aktuelle Komponentenliste korrekt dokumentiert.
- **Aufwand:** S · **Breaking:** nein.

---

## Breaking-Changes-Übersicht (Migration erforderlich)
| Item | Art | Migration |
|------|-----|-----------|
| P4.2 At-Rest-Verschlüsselung | Storage-Format | Pflicht: Klartext → verschlüsselt, transparent, ohne Datenverlust; JSON-Export bleibt kompatibel |
| P2.5 SheetJS-Major-Upgrade (falls) | Abhängigkeit | Import-/Export-Regressionstests (P2.1) als Absicherung |

Alle übrigen Maßnahmen (P1.x, P2.1–P2.4, P3.x, P4.1/P4.3/P4.4) sind **nicht breaking** und verändern das JSON-Export-Format nicht.

---

## Zusammenfassung der Priorisierung
- **Sofort:** P1.1 → P1.2 (XSS), P1.3, P1.4, P1.6 — höchstes Risiko, geringer Aufwand.
- **Kurzfristig:** P1.5, P1.7, P2.1 (Sicherheitsnetz), P2.3.
- **Mittelfristig:** P2.2, P2.4, P2.5, P3.1–P3.3.
- **Später/optional:** P3.4, P3.5, P4.x.
