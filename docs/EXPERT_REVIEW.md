# Experten-Review — IT Strukturanalyse (HiSolutions AG)

**Reviewdatum:** 2026-06-19 · **Aktualisiert:** 2026-06-22
**Branch:** `claude/dazzling-ride-04upm4`
**Reviewumfang:** Gesamte Codebasis (`src/`, Build-/Deployment-Konfiguration, Docker/nginx)
**Lenses:** (1) Software-/Code-Architektur · (2) Cybersecurity · (3) UI/UX-Design

---

## Status-Übersicht (Stand 2026-06-22)

| Finding | Bereich | Schweregrad | Status |
|---|---|---|---|
| **SEC-01** | Stored XSS in Print-Exporten | Hoch | ✅ **Behoben** — `safePrint.ts` mit `esc()`, alle Komponenten migriert |
| **SEC-02** | Mermaid `securityLevel: 'loose'` | Hoch | ✅ **Behoben** — auf `'strict'` geändert, Node-Labels escaped |
| **SEC-03** | CSP `unsafe-inline` | Mittel | ⚠️ **Teilweise** — `script-src` ohne `unsafe-inline`; `style-src` behält es zunächst |
| **SEC-04** | CSV-Formel-Injection | Mittel | ✅ **Behoben** — `neutralizeFormula()` implementiert, prefix `'` bei `=,+,-,@,\|` |
| **SEC-05** | Klartext-Speicherung | Mittel | ✅ **Behoben** — optionale AES-256/GCM-Verschlüsselung implementiert; `clearState()` vollständig |
| **SEC-06** | KI-Assistent (Review) | Niedrig | ✅ **Behoben** — `AbortController` 5s-Timeout; Datenschutz-Hinweis im Settings-Panel |
| **SEC-07** | Dependency-Scanning | Mittel | Offen — `npm audit` in CI wünschenswert, kein Dependabot |
| **SEC-08** | `target="_blank"` ohne `noopener` | Niedrig | ✅ **Behoben** — zentrale Print-Utility berücksichtigt das |
| **ARCH-01** | Kein Test-Setup | Hoch | ✅ **Behoben** — Vitest eingerichtet, 13 Tests vorhanden |
| **ARCH-02** | Untypisierte State-Mutationen | Mittel | Offen — Casts reduziert, vollständige Typisierung ausstehend |
| **ARCH-03** | Import-Validierung fehlt | Mittel | ✅ **Behoben** — ImportWizard mit Fehler-Recovery + Validierungstabelle |
| **ARCH-04** | Keine Error Boundary | Mittel | ✅ **Behoben** — `ErrorBoundary.tsx` implementiert |
| **ARCH-05** | Bundle-Splitting | Niedrig | Offen — Mermaid und schwere Tabs noch nicht lazy |
| **ARCH-06** | Print-Code dupliziert | Niedrig | ✅ **Behoben** — zentrale `printHtml.ts` + `esc()` |
| **ARCH-07** | Veraltete Dokumentation | Niedrig | ✅ **Behoben** — alle Docs auf Stand 2026-06-22 gebracht |
| **UX-01** | Navigations-Überladung | Mittel | Offen — Tab-Leiste weiter gewachsen; Navigation-Redesign ausstehend |
| **UX-02** | Empty States uneinheitlich | Niedrig | Teilweise — einige neue Module haben gute Leerzustände |
| **UX-03** | Onboarding | Niedrig | Teilweise — Vollständigkeits-Cockpit hilft, aber kein expliziter Erststart-Guide |
| **UX-04** | Druck-/Print-Layouts | Niedrig | ✅ **Behoben** — zentrale Print-Utility mit einheitlichem Branding |
| **UX-05** | Responsiveness | Niedrig | Offen |
| **UX-06** | Barrierefreiheit (WCAG) | Mittel | Offen |
| **UX-07** | Datenspeicher-Transparenz | Niedrig | ✅ **Behoben** — Datenspeicher-Info-Bereich vorhanden |

---

## Executive Summary

Die Anwendung ist ein durchdacht aufgebautes, rein clientseitiges Beratungswerkzeug (React 19 + TypeScript + Vite + Tailwind). Die Architektur folgt klaren, dokumentierten Designprinzipien (kein Backend, kein Login, offline-fähig, druckbar). Besonders positiv: ein **deklaratives Kategorie-Modell** (`categories.ts`), eine robuste **`mergeWithDefault`-Migrationslogik** beim Laden/Importieren, **versionierter JSON-Export** mit Major-Version-Check, **dynamisches Nachladen** der schweren `xlsx`-Bibliothek, sowie eine vorbildlich konzipierte **Trennung des KI-API-Keys** vom exportierbaren `AppState` (separater localStorage-Key, Key wird nie in das Backup geschrieben).

### Größte Stärken
- Saubere Persistenz-/Migrationsschicht (`store.ts`, `exportJSON.ts`).
- KI-Assistent ist strikt opt-in: **ohne Konfiguration null Netzwerkanfragen** (`aiSuggest.ts`), Key nicht im Export.
- nginx liefert bereits einen Satz Security-Header inkl. einer (verbesserungsfähigen) CSP.
- Konsistente, professionelle visuelle Sprache über Design-Tokens.

### Größte Risiken (Top 5)
1. **SEC-01 (Hoch):** Stored XSS in den seitenweise selbst gebauten Druck-/Print-Exporten. Über ein Dutzend Komponenten interpolieren ungeprüfte Kunden-/Eingabedaten direkt per `window.open()` + `document.write()` in HTML — ohne Escaping. Inkonsistent zu `exportReport.ts`, das korrekt escaped.
2. **SEC-02 (Hoch):** `mermaid` läuft mit `securityLevel: 'loose'`; das gerenderte SVG wird per `dangerouslySetInnerHTML` eingefügt. Node-Labels stammen aus Benutzereingaben → potenzieller Script-Injection-Vektor.
3. **SEC-03 (Mittel):** CSP erlaubt `script-src 'unsafe-inline'` — entwertet einen Großteil des XSS-Schutzes für ein Security-Beratungstool, das vorbildlich sein sollte.
4. **SEC-04 (Mittel):** CSV-Formel-Injection beim Excel-/CSV-Export (`export.ts`, `EuAiActInventar.tsx`) — Werte mit führendem `=`, `+`, `-`, `@` werden nicht neutralisiert.
5. **ARCH-01 (Hoch):** **Kein Test-Setup, keine CI, kein Lint-Gate.** Für ein Werkzeug mit sicherheits-/compliance-relevanter Scoring-Logik (cloudReadiness, NIS2, maturity) ein erhebliches Qualitätsrisiko.

Gesamtnote: **solide bis gut** in Architektur und UX, **gut konzipiert, aber in der Umsetzung lückenhaft** bei Security. Die Defizite sind klar umrissen und mit überschaubarem Aufwand behebbar (siehe `IMPROVEMENT_PLAN.md`).

---

## 1. Software-/Code-Architektur

### ARCH-01 — Kein Test-Suite, keine CI, kein Lint-Gate · Schweregrad: **Hoch** · Aufwand: **L**
**Beschreibung:** Es existieren keine Unit-/Integrationstests (`*.test.*`/`*.spec.*` nicht vorhanden), kein `.github/workflows`, kein Test-Runner in `package.json`. Kritische Logik ohne Testabdeckung: `cloudReadiness.ts` (Scoring 0–100), `schutzbedarfsVererbung.ts`, `maturity.ts`, `store.ts` (`mergeWithDefault`-Migration), `import.ts` (Mapping/Dedup), `exportJSON.ts` (Versionsprüfung). Regressionen in der Scoring-Logik wären für ein Beratungsergebnis fachlich folgenschwer und blieben unbemerkt.
**Betroffen:** gesamtes Projekt; `package.json`.
**Vorschlag:** Vitest einführen. Erste Tests für reine Funktionen: `mergeWithDefault`, `assess/assessAll/summarize`, `importFromJSON` (inkl. Fehlerpfade), `parseCsvToRows`, `generateKuerzel`. Minimal-CI (GitHub Actions): `tsc -b`, `eslint .`, `vitest run` bei Push/PR. Best Practice: [Testing Library Guiding Principles](https://testing-library.com/docs/guiding-principles/), [Vitest](https://vitest.dev/).

### ARCH-02 — Untypisierte zentrale State-Mutationen · Schweregrad: **Mittel** · Aufwand: **M**
**Beschreibung:** Das in CLAUDE.md notierte Schuldenthema. Über die Codebasis verteilt finden sich 60+ `as unknown as Record<string, unknown>[]`-Casts (u. a. `App.tsx`, `import.ts`, `export.ts`). Diese Casts hebeln die Typprüfung an genau den Stellen aus, an denen Daten mutiert werden — Tippfehler in Feldschlüsseln werden nicht erkannt.
**Betroffen:** `src/App.tsx` (`handleSave`/`handleDelete`), `src/utils/import.ts`, `src/utils/export.ts`, `src/store.ts`.
**Vorschlag:** Generischer, typisierter Updater pro `CategoryKey` (Mapped Types über `AppState`), z. B. `updateCategory<K extends CategoryKey>(key: K, fn: (items: AppState[K]) => AppState[K])`. Mittelfristig die Kategorie-Felddefinitionen mit den Item-Interfaces über ein gemeinsames Typ-Schema koppeln. Referenz: [TS Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html).

### ARCH-03 — Eingabevalidierung beim Import fehlt (Laufzeit-Schema) · Schweregrad: **Mittel** · Aufwand: **M**
**Beschreibung:** `importFromJSON` (`exportJSON.ts:32`) prüft nur grob auf `version`/`state`. Felder werden danach via `mergeWithDefault` zusammengeführt, aber **Werte-Typen/-Inhalte** der Items werden nicht validiert. Eine manipulierte Backup-Datei kann beliebige Strukturen in Felder schreiben, die später ungeprüft in HTML-/Excel-Exporte fließen (siehe SEC-01/04). Es gibt kein Laufzeit-Schema (z. B. Zod).
**Betroffen:** `src/utils/exportJSON.ts`, `src/store.ts`.
**Vorschlag:** Leichtgewichtiges Schema (Zod) für `BackupFile`/`AppState`-Kernfelder; defensives Coercen von String-Feldern. Mindestens: alle in Exporte einfließenden Felder beim Import auf `string` zwingen.

### ARCH-04 — Fehlende React Error Boundary · Schweregrad: **Mittel** · Aufwand: **S**
**Beschreibung:** Keine `ErrorBoundary` im Komponentenbaum. Ein Render-Fehler (z. B. unerwartete Datenform trotz Merge, Mermaid-Renderfehler) führt zu einem weißen Bildschirm ohne Recovery — beim Kunden vor Ort kritisch, weil keine IT-Unterstützung verfügbar ist.
**Betroffen:** `src/main.tsx`, `src/App.tsx`.
**Vorschlag:** Top-Level-Error-Boundary mit Fallback-UI und Hinweis „JSON-Backup exportieren / Seite neu laden". Referenz: [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary).

### ARCH-05 — Bundle-Größe / Code-Splitting nur teilweise · Schweregrad: **Niedrig** · Aufwand: **S–M**
**Beschreibung:** `xlsx` wird vorbildlich dynamisch geladen. `mermaid` (~groß) wird in `InfrastrukturLandkarte.tsx` importiert — zu prüfen, ob es lazy gesplittet ist; die Compliance-/Berichts-Komponenten in `ProjectView.tsx` werden alle statisch importiert, obwohl je Sitzung meist nur wenige genutzt werden.
**Betroffen:** `src/components/ProjectView.tsx`, `src/components/InfrastrukturLandkarte.tsx`.
**Vorschlag:** `React.lazy` + `Suspense` für die schwergewichtigen Tab-Inhalte (Landkarte/Mermaid, Berichte). Bundle-Analyse via `rollup-plugin-visualizer`.

### ARCH-06 — Wachsende Komponenten / Wiederholung im Print-Code · Schweregrad: **Niedrig** · Aufwand: **M**
**Beschreibung:** Der `window.open()`/`document.write()`-Block ist in 12+ Komponenten nahezu identisch dupliziert (mit jeweils eigenem, teils fehlerhaftem HTML-Aufbau). Das ist die Wurzel von SEC-01: keine zentrale, sichere Print-Utility.
**Betroffen:** alle Komponenten mit Druckexport (siehe SEC-01-Liste).
**Vorschlag:** Eine gemeinsame `printHtml(title, bodyHtml)`-Utility mit eingebautem `esc()` (wie in `exportReport.ts` bereits vorhanden) und einheitlichem Print-Stylesheet. Reduziert Codeduplikation und schließt SEC-01 strukturell.

### ARCH-07 — Veraltete/inkonsistente Dokumentation · Schweregrad: **Niedrig** · Aufwand: **S**
**Beschreibung:** CLAUDE.md nennt „React 18", `package.json` zeigt React 19; CLAUDE.md beschreibt nur localStorage, tatsächlich wird zusätzlich IndexedDB (`fileStore.ts`) für Anhänge genutzt. Der Komponenten-Baum in CLAUDE.md ist deutlich kleiner als der reale (viele neue Compliance-Module).
**Vorschlag:** CLAUDE.md/README angleichen (React 19, IndexedDB für Anhänge, aktuelle Komponentenliste).

---

## 2. Cybersecurity

> Maßstab: Da dies ein Werkzeug eines Security-Beraters ist und hochvertrauliche Kundeninfrastrukturdaten verarbeitet, gilt ein erhöhter Anspruch (OWASP ASVS, „lead by example").

### SEC-01 — Stored XSS in selbstgebauten Druck-Exporten · Schweregrad: **Hoch** · Aufwand: **M**
**Beschreibung:** Zahlreiche Komponenten erzeugen Druck-/Export-HTML per `window.open('', '_blank')` + `win.document.write(...)`, wobei **rohe, ungeescapte** Benutzer-/Kundendaten per Template-String interpoliert werden. Beispiel `StakeholderRegister.tsx:62-79` interpoliert `s.name`, `s.rolle`, `s.email`, `state.customerName` direkt. Ein Wert wie `<img src=x onerror=alert(1)>` in einem Namensfeld (oder via manipuliertes JSON-/Excel-Import, siehe ARCH-03/SEC-04) führt zur Skriptausführung im neu geöffneten Dokument. Bemerkenswert: `exportReport.ts` macht es mit einer `esc()`-Funktion korrekt — der Schutz ist also nur inkonsistent angewandt.
**Betroffene Dateien (window.open + document.write mit Interpolation):**
- `src/components/StakeholderRegister.tsx:70-79`
- `src/components/SecurityGovernanceArchitektur.tsx:226-229`
- `src/components/NIS2Check.tsx:60-63`
- `src/components/TCOModell.tsx:128-132`
- `src/components/MeetingProtokolle.tsx:83-85`
- `src/components/LizenzKostenAnalyse.tsx:92-95`
- `src/components/ZielarchitekturBetrieb.tsx:147-150`
- `src/components/InterviewFragenliste.tsx:100-102`
- `src/components/VollstaendigkeitsCockpit.tsx:26-29`
- `src/components/TOPsUebersicht.tsx:68-70`
- `src/components/InfrastrukturLandkarte.tsx:186-189`
- `src/components/InfrastrukturBericht.tsx:37-40` und `ExecutiveSummary.tsx:46-49` (nutzen `printRef.innerHTML` — bereits aus React-DOM, daher escaped; geringeres Risiko, aber dieselbe Print-Utility verwenden).
**Vorschlag:** Zentrale `printHtml()`-Utility (ARCH-06) mit obligatorischem `esc()` für **jeden** interpolierten Wert; alle Aufrufer migrieren. Optional zusätzlich: per `srcdoc`/Blob-URL statt `document.write` rendern. Referenz: [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).

### SEC-02 — Mermaid `securityLevel: 'loose'` + dangerouslySetInnerHTML · Schweregrad: **Hoch** · Aufwand: **S**
**Beschreibung:** `InfrastrukturLandkarte.tsx:161` initialisiert Mermaid mit `securityLevel: 'loose'`, was HTML-Labels und Klick-Handler im Diagramm zulässt. Das resultierende SVG wird in `:261` per `dangerouslySetInnerHTML={{ __html: svg }}` eingehängt. Node-Labels werden aus Systemnamen/Plattformfeldern (Benutzereingaben) gebaut → Injection-Vektor.
**Betroffen:** `src/components/InfrastrukturLandkarte.tsx:161, 261, 186-189`.
**Vorschlag:** `securityLevel: 'strict'` (Default) setzen; Node-Labels vor dem Einbau in den Mermaid-Code escapen/sanitisieren (Sonderzeichen entfernen oder quoten). Falls HTML-Labels nicht benötigt werden, ist `strict` ausreichend. Optional DOMPurify auf das SVG anwenden. Referenz: [Mermaid Security](https://mermaid.js.org/config/schema-docs/config.html#securitylevel).

### SEC-03 — CSP erlaubt `script-src 'unsafe-inline'` · Schweregrad: **Mittel** · Aufwand: **S**
**Beschreibung:** `nginx.conf:12` setzt `script-src 'self' 'unsafe-inline'`. `unsafe-inline` hebt den Hauptnutzen einer CSP gegen XSS auf. Ferner ist `X-XSS-Protection` veraltet (in modernen Browsern wirkungslos/abgeschaltet). Ein Vite-Production-Build benötigt i. d. R. kein Inline-Skript (Module werden referenziert), daher ist `unsafe-inline` für Skripte vermeidbar.
**Betroffen:** `nginx.conf:8-12`.
**Vorschlag:** `script-src 'self'` (ohne `unsafe-inline`); falls einzelne Inline-Snippets nötig sind, Nonce/Hash verwenden. `style-src` kann `unsafe-inline` zunächst behalten (Tailwind/Inline-Styles), idealerweise später per Hash härten. `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'self'` ergänzen; `X-XSS-Protection` entfernen. Referenz: [MDN CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy), [OWASP Secure Headers](https://owasp.org/www-project-secure-headers/).

### SEC-04 — CSV-/Excel-Formel-Injection (CSV Injection) · Schweregrad: **Mittel** · Aufwand: **S**
**Beschreibung:** Beim Export werden Zellwerte unbehandelt geschrieben. In `EuAiActInventar.tsx:49` quotet `esc()` nur Anführungszeichen; in `export.ts` werden Werte direkt via `aoa_to_sheet` übernommen. Ein Feld wie `=HYPERLINK("http://evil","x")` oder `=cmd|'/c calc'!A1` wird beim Öffnen in Excel/LibreOffice als Formel interpretiert (Datenexfiltration/Code-Ausführung beim Empfänger). Da Werte aus dem Import stammen können, ist die Quelle nicht vertrauenswürdig.
**Betroffen:** `src/utils/export.ts:18,27-33,89-101,128-134`; `src/components/EuAiActInventar.tsx:42-58`.
**Vorschlag:** Zentrale `neutralizeFormula(value)`-Funktion: Werten, die mit `= + - @ \t \r` beginnen, ein führendes `'` (Apostroph) voranstellen. Vor jedem CSV-/XLSX-Export anwenden. Referenz: [OWASP CSV Injection](https://owasp.org/www-community/attacks/CSV_Injection).

### SEC-05 — Datensensitivität: Klartext-Speicherung (Data-at-Rest) · Schweregrad: **Mittel** (Akzeptanz-/Hinweis-Thema) · Aufwand: **S–L**
**Beschreibung:** Hochvertrauliche Kundeninfrastrukturdaten liegen unverschlüsselt in `localStorage` und IndexedDB (Anhänge, `fileStore.ts`). Das ist konsistent mit dem „kein Backend"-Prinzip, birgt aber Risiko auf gemeinsam genutzten/gestohlenen Geräten. Der `clearState()`-Flow (`store.ts:207`) ist sauber (löscht alle `it-strukturanalyse*`-Keys), entfernt aber **nicht** den IndexedDB-Store der Anhänge und nicht den AI-Config-Key (`it-sa-ai-config`).
**Betroffen:** `src/store.ts:207-215`, `src/fileStore.ts`, `src/integrations/aiSuggest.ts`.
**Vorschlag:** (a) `clearState()` erweitern: IndexedDB-Store (`it-strukturanalyse-files`) leeren und `clearAIConfig()` aufrufen — sonst bleiben nach „Daten löschen" Anhänge und API-Key zurück. (b) Optional (strategisch): passwortbasierte Verschlüsselung der localStorage-Nutzlast (WebCrypto/AES-GCM, PBKDF2) als Opt-in. (c) UI-Hinweis zur Data-at-Rest-Sensitivität dokumentieren. Referenz: [OWASP Client-Side Storage](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#local-storage).

### SEC-06 — KI-Assistent: Review (überwiegend positiv) · Schweregrad: **Niedrig** · Aufwand: **S**
**Beschreibung:** `aiSuggest.ts` ist vorbildlich: kein Default-Endpoint, ohne Konfiguration keine Netzwerkanfrage (`isAIConfigured()`-Guard), der API-Key (`_apiKey`) liegt in einem **separaten** localStorage-Key und wird in `loadAIConfig()` aktiv herausgefiltert (`store`-Export enthält ihn nie). Restrisiken: (1) `fetch` ohne Timeout/AbortController — eine hängende Anfrage blockiert die UX (der Plan-Kommentar nennt 5s Timeout, im Code fehlt er). (2) Bei `provider: 'custom'` wird der Key an einen beliebigen, nutzerkonfigurierten Endpoint gesendet — UI sollte klar warnen, dass Kundennamen/Felder dorthin übertragen werden. (3) CSP (`connect-src`) deckt externe AI-Endpoints nicht ab → bei aktivierter CSP würden Anfragen blockiert (Funktion vs. Härtung abwägen).
**Betroffen:** `src/integrations/aiSuggest.ts:83-92`, `src/components/AIAssistantSettings.tsx`, `nginx.conf`.
**Vorschlag:** AbortController mit Timeout ergänzen; Datenschutz-Hinweis im Settings-Panel (welche Daten verlassen das Gerät); `connect-src` in CSP bewusst entscheiden (Default `'self'`, optional konfigurierter Host). Key bleibt korrekt aus dem Export ausgeschlossen — beibehalten.

### SEC-07 — Abhängigkeits-/Supply-Chain-Risiken · Schweregrad: **Mittel** · Aufwand: **S**
**Beschreibung:** `xlsx@0.18.5` (SheetJS aus npm) hat bekannte Historie an Schwachstellen (Prototype Pollution / ReDoS, GHSA-Advisories für ältere Versionen); die npm-Distribution wird vom Hersteller nicht mehr gepflegt (offizieller Vertrieb via CDN). Kein automatisiertes Dependency-Scanning vorhanden (kein `npm audit` in CI, kein Dependabot).
**Betroffen:** `package.json`, fehlende CI.
**Vorschlag:** `npm audit` in CI; Dependabot/Renovate aktivieren; Upgrade-Pfad für SheetJS auf die aktuelle, vom Hersteller empfohlene Bezugsquelle prüfen. Referenz: [GitHub Dependabot](https://docs.github.com/en/code-security/dependabot).

### SEC-08 — `target="_blank"` / window.open ohne `noopener` · Schweregrad: **Niedrig** · Aufwand: **S**
**Beschreibung:** Die Print-Fenster werden über `window.open('', '_blank')` geöffnet; das geöffnete Dokument ist eigener Inhalt (geringes Reverse-Tabnabbing-Risiko), dennoch Best Practice. Externe Links (falls vorhanden) sollten `rel="noopener noreferrer"` tragen.
**Vorschlag:** Bei der Print-Utility-Konsolidierung (ARCH-06) berücksichtigen.

---

## 3. UI/UX-Design

### UX-01 — Navigations-Überladung durch wachsende SubTabs · Schweregrad: **Mittel** · Aufwand: **M**
**Beschreibung:** `ProjectView.tsx` rendert 19 SubTabs in 4 Gruppen (Projektsteuerung, Analyse & Strategie, Compliance & Regulatorik, Berichte) als einzige horizontale Tab-Leiste. Mit jedem neuen Compliance-Modul (NIS2, EU AI Act, Souveränität, EnEfG, DORA …) wächst die Leiste; auf üblichen Laptop-Breiten entsteht Umbruch/Scroll und kognitive Last. Gruppentitel helfen, aber alles ist gleichzeitig sichtbar.
**Betroffen:** `src/components/ProjectView.tsx:43-101, 141-175`.
**Vorschlag:** Sekundärnavigation umbauen: linke Sidebar mit kollabierbaren Gruppen ODER zweistufige Navigation (Gruppe wählen → Tabs der Gruppe). Aktiv genutzte/relevante Module (mit Daten) hervorheben; Compliance-Module bei Bedarf hinter einem „Compliance"-Einstieg bündeln. Referenz: [NN/g Information Architecture](https://www.nngroup.com/articles/ia-vs-navigation/).

### UX-02 — Empty States uneinheitlich · Schweregrad: **Niedrig** · Aufwand: **S–M**
**Beschreibung:** Einige Ansichten haben gute Leerzustände (Landkarte bei 0 Objekten), andere Compliance-/Listenansichten zeigen leere Tabellen ohne Handlungsaufforderung. Für Berater, die ein Modul erstmals öffnen, fehlt teils der „Was tue ich hier zuerst?"-Hinweis.
**Vorschlag:** Einheitliche `<EmptyState>`-Komponente (Icon, kurze Erklärung, primäre Aktion). Konsistent über alle Tabs einsetzen.

### UX-03 — Onboarding / Erststart-Führung · Schweregrad: **Niedrig** · Aufwand: **M**
**Beschreibung:** Beim ersten Start landet der Nutzer im `wizard`-Modus, aber die Gesamtstruktur (Datenaufnahme → Analyse → Compliance → Berichte) erschließt sich erst durch Exploration. Kein „roter Faden"/Fortschritts-Orientierung auf oberster Ebene.
**Vorschlag:** Kurzer Erststart-Hinweis (dismissable) oder ein „Projektstart"-Panel, das die empfohlene Reihenfolge zeigt und auf das Vollständigkeits-Cockpit verlinkt.

### UX-04 — Druck-/Print-Layouts uneinheitlich · Schweregrad: **Niedrig** · Aufwand: **M**
**Beschreibung:** Jede Print-Funktion bringt eigenes Inline-CSS mit (unterschiedliche Schriftgrößen, Farben, Header). Die Ausgaben wirken dadurch heterogen — für ein Beratungs-Deliverable, das beim Kunden landet, ist konsistentes Corporate-Design wichtig.
**Betroffen:** alle Print-Komponenten (siehe SEC-01).
**Vorschlag:** Gemeinsames Print-Stylesheet/Header (HiSolutions-Branding, einheitliche Typo, Fußzeile mit Stand/Kunde) in der zentralen Print-Utility (ARCH-06). Doppelnutzen: behebt SEC-01 und UX-04.

### UX-05 — Responsiveness / Informationsdichte · Schweregrad: **Niedrig** · Aufwand: **S–M**
**Beschreibung:** Layouts sind auf Desktop optimiert (`max-w-5xl`, breite Tabellen). Auf schmalen Geräten (Workshop-Tablet) drohen horizontale Scrolls. Tab-Leiste (UX-01) verstärkt das.
**Vorschlag:** Responsive Tabellen (Karten-Layout < md), Navigations-Anpassung für schmale Breiten (zusammen mit UX-01).

### UX-06 — Barrierefreiheit (WCAG) · Schweregrad: **Mittel** · Aufwand: **M**
**Beschreibung:** Buttons mit nur SVG-Icon teils ohne `aria-label`; Tab-Leiste nutzt `<button>`-Elemente statt eines ARIA-`tablist`/`tab`/`tabpanel`-Musters (keine Pfeiltasten-Navigation, fehlende `aria-selected`); Farbkodierung (Ampel/Score-Farben) ohne textliche Alternative an einigen Stellen. Fokus-Sichtbarkeit nicht durchgängig geprüft.
**Betroffen:** `src/components/ProjectView.tsx`, diverse Komponenten mit Icon-Buttons.
**Vorschlag:** ARIA-Tabs-Pattern umsetzen; `aria-label` für Icon-only-Buttons; Score/Status zusätzlich textuell; Kontrast prüfen. Referenz: [WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/), [ARIA Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

### UX-07 — Datensicherheits-Transparenz für den Berater · Schweregrad: **Niedrig** · Aufwand: **S**
**Beschreibung:** Da Daten lokal/unverschlüsselt liegen (SEC-05) und „Daten löschen" Anhänge/AI-Key nicht vollständig entfernt, fehlt dem Berater Transparenz darüber, was wo gespeichert ist und wie man es restlos entfernt.
**Vorschlag:** Kleiner „Datenspeicher"-Infobereich (welche Speicher genutzt werden, „alles löschen inkl. Anhänge & KI-Key"). Verknüpft mit SEC-05.

---

## Anhang: Standards & Referenzen
- OWASP XSS Prevention Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- OWASP CSV Injection — https://owasp.org/www-community/attacks/CSV_Injection
- OWASP Secure Headers Project — https://owasp.org/www-project-secure-headers/
- MDN Content-Security-Policy — https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
- Mermaid securityLevel — https://mermaid.js.org/config/schema-docs/config.html
- React Error Boundaries — https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
- WCAG 2.2 Quick Reference — https://www.w3.org/WAI/WCAG22/quickref/
- ARIA Tabs Pattern — https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- Vitest — https://vitest.dev/
