# Wie wir ein BSI-Strukturanalyse-Tool mit Claude Code entwickelt haben — und warum

*Interne Notiz für Kollegen · Marcus Graetsch · Juni 2026*
*Zum Pasten in OneNote — alle Abschnitte können einzeln übernommen werden.*

---

## TL;DR

Wir haben ein vollständiges, produktionsreifes Web-Tool für BSI-IT-Grundschutz-Strukturanalysen und Cloud-Readiness-Bewertungen mit Claude Code entwickelt — als Solo-Berater, ohne dediziertes Entwicklerteam, in einem iterativen KI-gestützten Prozess über mehrere Monate. Das Tool läuft heute im Einsatz bei Kundenprojekten, kein Backend, kein Login, vollständig offline-fähig. Zuletzt haben wir ein Souveränitäts-Assessment nach dem EU Cloud Sovereignty Framework v1.2.1 integriert — inklusive Change-of-Control-Stresstest. Dieser Bericht erklärt das Wie, Warum und Was.

---

## 1. Ausgangslage: Was wir brauchten und warum es kein Tool gab

### Das Problem

BSI-IT-Grundschutz-Strukturanalysen sind in der IT-Beratung Pflichtprogramm. Jede NIS2-Beratung, jede Cloud-Strategie, jede KRITIS-Vorbereitung beginnt mit der gleichen Frage: Was hat der Kunde eigentlich an IT — Anwendungen, Server, Clients, Netzwerke, Räume, Gebäude — und wie ist das alles bewertet hinsichtlich Schutzbedarf, Bereitstellung, Lebenszyklus, Verantwortlichkeit?

Das Problem: Kein marktgängiges Tool trifft die Kombination aus BSI-Strukturanalyse-Logik, Cloud-Readiness-Bewertung und Beratungsworkflow-Integration. Die Alternativen sind:

- **Excel-Tabellen** — jedes Projekt neu gebaut, nicht wartbar, keine Auswertungslogik
- **Große GRC-Plattformen** (verinice, HiScout, Aris) — lizenzpflichtig, komplex, auf Kundenseite oft nicht vorhanden, nicht für Beratungssituationen ohne Infrastruktur beim Kunden geeignet
- **Word-Dokumente** — für Strukturanalysen kaum skalierbar, kein Scoring, kein Export

Was wir wollten: Ein leichtgewichtiges, offline-fähiges Werkzeug, das ein Berater zum Kunden mitbringen kann, ohne dass dort eine Infrastruktur vorhanden ist. Browser auf, loslegen. Daten exportieren. Fertig.

### Die Entscheidung: Selbst bauen mit KI-Unterstützung

Der entscheidende Wendepunkt war die Erkenntnis, dass Claude Code (das CLI-Tool von Anthropic) es realistisch macht, als Einzelperson eine komplexe React/TypeScript-Webanwendung zu entwickeln — ohne tiefes Frontend-Engineering-Hintergrundwissen, dafür mit klaren fachlichen Anforderungen.

Das ist kein „KI schreibt Code, ich klicke auf Akzeptieren". Es ist ein aktiver Entwicklungsprozess, bei dem die fachliche Führung (Was soll das Tool können? Welche BSI-Logik gilt? Was braucht ein Berater wirklich?) beim Menschen bleibt, und die technische Umsetzung (React-Komponenten, TypeScript-Interfaces, Scoring-Algorithmen, Export-Logik) von der KI übernommen wird.

---

## 2. Das Tool: Was es ist und kann

### Technischer Stack

- **React 18 + TypeScript + Vite** — moderne, wartbare Frontend-Architektur
- **Tailwind CSS** mit HiSolutions-Design-Tokens (hi-navy, hi-accent, hi-teal)
- **Kein Backend, kein Server** — alle Daten im Browser (localStorage + IndexedDB)
- **Deployment**: Docker (nginx) oder einfach `npx serve` — kein Cloud-Hosting nötig
- **Repository**: GitHub — `MarcusGraetsch/InfoCollectorforInfrastrukturAnalyse_ITM`

### Was das Tool heute kann (nach mehreren Entwicklungszyklen)

**Datenerfassung (BSI-Strukturanalyse):**
- Geführte Ersterfassung aller IT-Objekte: Geschäftsprozesse, Anwendungen, Server, Clients, Netzkomponenten, ICS/IoT-Systeme, Räume, Gebäude, Datenträger
- Schnittstellen-Modell (App-zu-App-Kommunikation mit Protokoll, Port, Verschlüsselung)
- Betriebssysteme als eigenständige IT-Komponenten (reusable, wie iTop)
- Hardware-Felder (Hersteller, Seriennummer, CPU/RAM, Strombedarf, HE)
- Wirtschaftlichkeitsfelder (AfA, Betriebskosten, Vertragsende, Support-Ende)

**Bewertungslogik:**
- Cloud-Readiness-Scoring (heuristisch, 0–100, Schwellen ≥70/45/<45)
- 6R-Strategieempfehlung je Objekt (Retain, Retire, Rehost, Replatform, Refactor, Replace)
- SEAL-Bewertung (Souveränitätsanforderung S0–S3, jetzt migriert auf EU SEAL 0–4)
- CIA-Triade + Schutzbedarfsvererbung (BSI 200-2 konform)
- NIS2-Assessment (Sektor, Einstufung, 10 Mindestmaßnahmen)
- EU AI Act (Risikoklassifizierung, Logging, menschliche Aufsicht)
- DORA/IKT-Drittparteien-Register
- Nachhaltigkeit: Energieverbrauch, CO₂, AfA/TCO-Aggregation

**Governance-Modell (Cross-Compliance):**
- Zentrales Evidence-/Nachweismodell (keine Dateninseln je Modul)
- Rollen-Modell (20 ISMS-/BCM-/NIS2-Rollen)
- GovernanceTopic-Konzept: NIS2, Cloud-Souveränität, BCM, Cloud-Exit referenzieren zentrale Objekte
- Maßnahmen-Tracking mit Fälligkeit und Verantwortlichem

**Visualisierungen und Export:**
- Infrastruktur-Landkarte (Cytoscape-Graph, mehrere Ansichtsmodi)
- ArchiMate-lite Export (JSON + Archi-XML im Open Exchange 3.0 Format)
- Schnittstellen-Matrix (n×n, druckbar)
- HTML-Report, Excel-Export, JSON-Backup/Restore
- Snapshot-Versionierung (Delta-Ansicht zwischen zwei Aufnahmen)

---

## 3. Der Entwicklungsprozess: Wie das mit Claude Code funktioniert

### Das Werkzeug: Claude Code CLI

Claude Code ist das offizielle CLI von Anthropic — ein Terminal-Tool, das Claude Zugriff auf das lokale Filesystem, Git, die Build-Tools und den Browser gibt. Es ist kein Copilot-Autocomplete, sondern ein vollständig autonomer Entwicklungsassistent, der auf Anweisung:

- Dateien liest, schreibt, refactored
- Tests ausführt und auf Fehler reagiert
- Git-Commits erstellt (mit aussagekräftigen Messages)
- Buildfehler interpretiert und behebt
- Architekturentscheidungen begründet und dokumentiert

Das Besondere: Claude Code liest beim Start immer zuerst die `CLAUDE.md`-Datei im Repository — ein projektspezifisches Kontextdokument, das ich selbst pflege und das dem Assistenten erklärt, was das Tool ist, wie es aufgebaut ist, welche Designprinzipien gelten und was als nächstes kommen soll.

### Das Prompting-Muster

Der Entwicklungsprozess folgte einem bewährten Muster, das sich über alle Entwicklungszyklen bewährt hat:

**1. Fachliche Anforderung als strukturierter Prompt**

Ich schreibe keine technischen Tickets, sondern fachliche Anforderungen. Beispiel für das Souveränitäts-Assessment:

> *„Erstelle src/compliance/sovereignty.ts mit: Typen SovObjective, SealLevel, WorkloadSovProfile. SOV_WEIGHTS-Konstante (exakt diese Gewichte). Funktion computeSovereigntyScore(). Funktion deriveSollSeal() aus Schutzbedarf — nutze die vorhandenen BSI-Felder, erfinde keine Parallelstruktur. Funktion computeGaps() priorisiert nach Gewicht × Gap × Schutzbedarfsfaktor."*

Der Prompt enthält das Fachliche (Gewichte, Logik, Designprinzip „keine Parallelstruktur"), aber kein TypeScript. Das ist Aufgabe der KI.

**2. Human-in-the-Loop-Gates**

Bei architektonisch wichtigen Entscheidungen baue ich explizite Review-Gates ein. Beispiel: Beim SOV-Mapping (6 alte Souveränitätsdimensionen → 8 neue SOV-Objektive) habe ich den Assistenten explizit angewiesen, zuerst das Mapping zu zeigen und auf meine Freigabe zu warten, bevor er weiterbaut. Das verhindert, dass eine falsche Designentscheidung tief in den Code eingebaut wird, bevor sie sichtbar ist.

**3. Schrittweises Vorgehen mit Build-Check nach jedem Block**

Jeder Entwicklungsblock endet mit `npm run build` (TypeScript-Check + Vite-Build) und `npx vitest run` (Testlauf). Erst wenn beides grün ist, wird committed. Das hält den Main-Branch immer deploybar.

**4. Tests als Spezifikation**

Vitest-Tests werden nicht nachträglich geschrieben, sondern zusammen mit dem Feature. Die Tests beschreiben das erwartete Verhalten (Grenzfälle: alle SEAL-0, alle SEAL-4, gemischte Werte) — das zwingt zu klarer Spezifikation, bevor Code entsteht.

**5. Commit-Disziplin**

Jeder Commit hat eine aussagekräftige Message (feat/fix/docs/refactor), einen klaren Scope (`feat(A1): ...`) und einen Co-Author-Tag für Claude. Das macht den Entwicklungsverlauf für Kollegen nachvollziehbar — auch wenn sie nicht dabei waren.

### Was ich als Berater beitrage, was die KI beiträgt

| Ich (fachlich) | Claude Code (technisch) |
|---|---|
| BSI-Grundschutz-Logik | TypeScript-Interfaces + Type-Safety |
| EU Framework-Interpretation | React-Komponenten + Tailwind-Styling |
| Designprinzipien (kein Backend, offline, kein Login) | Scoring-Algorithmen + Testfälle |
| Priorisierung der Features | Build-Fehler-Behebung + Refactoring |
| Review-Gates + Qualitätskontrolle | Git-Commit-Messages + Doku |
| Kundenperspektive | ArchiMate-Export, Excel-Export, HTML-Report |

Das Verhältnis: Ich schreibe ca. 10–20 % des Codes direkt (manchmal Korrekturen, manchmal Startvorgaben). Der Rest kommt von Claude Code. Aber ich schreibe 100 % der fachlichen Anforderungen und Reviews.

---

## 4. Der neue Use Case: Souveränitäts-Risiko-Matrix

### Wie dieser Use Case entstanden ist

Der Ausgangspunkt war ein konkretes Beratungsproblem: Ein Kunde fragte nach einer Übersicht, welche seiner Cloud-Dienste unter Souveränitätsgesichtspunkten das höchste Risiko haben — nicht abstrakt, sondern als priorisierte Liste mit Handlungsbedarf.

Das Tool hatte bis dahin bereits eine SEAL-Bewertung je Objekt (S0–S3), aber keine Matrix-Ansicht und keine explizite Risikopriorisierung. Die Idee war: Wenn ich Souveränitätsbedarf (Y-Achse) und tatsächliche Exposition (X-Achse) in einer Matrix zusammenbringe, entsteht sofort ein visuell lesbares Bild — ähnlich wie eine klassische Risikomatrix, nur mit Souveränitätsbezug.

### Das Entwicklungs-Gespräch (Claude Code Web + Chat)

Der Prozess begann in einem Claude.ai-Chat (https://claude.ai/chat/d15e2497-ff67-448f-8293-236677af29d9), in dem ich die Grundidee und den Kontext des Tools beschrieben habe. Von dort wurde er in eine Claude Code Session überführt, die direkten Zugriff auf das Repository hatte.

Der zentrale Prompt beschrieb das Konzept der Matrix:

> *„Souveränitäts-Risiko-Matrix: Y-Achse = Souveränitätsbedarf (SEAL-Level S0–S3 aus assessSovereignty), X-Achse = Ist-Risiko/Exposition (aus Jurisdiktion, Schlüsselhoheit, Portabilität, Bereitstellung, Gaia-X der Cloud-Felder). Kritikalität = Bedarf × Exposition: nur wo hoher Bedarf auf hohe Exposition trifft, entsteht echtes Souveränitätsrisiko. Kein neues Datenerfassen."*

Das letzte Prinzip ist entscheidend: **Kein neues Datenerfassen.** Die Matrix darf keine neuen Felder brauchen, die der Berater erst noch erfassen muss. Sie entsteht vollständig aus bereits vorhandenen Daten.

### Die Logik der Matrix

**Y-Achse — Souveränitätsbedarf:**
Kommt direkt aus der bestehenden `assessSovereignty()`-Funktion: S0 (kein Bedarf) bis S3 (streng souverän). Dieser Bedarf ist bereits in der Strukturanalyse erfasst (Datensouveränität, Schutzbedarf, Gaia-X).

**X-Achse — Expositions-Risiko (0–100):**
Eine neue Hilfsfunktion `expositionsRisiko()` aggregiert die vorhandenen Felder:
- Anbieter-Jurisdiktion (USA = +45, Gemischt = +30, Unklar = +20)
- Verschlüsselungshoheit (Anbieter = +30, Unklar = +18)
- Portabilitätsreife (proprietär = +30, Mittel = +15)
- Bereitstellungsmodell (Public Cloud/SaaS = +15)
- Gaia-X-Zertifizierung (mindernd: −12)

Ergebnis: Ein Risiko-Score 0–100, der beschreibt, wie stark das Objekt tatsächlich exponiert ist.

**Severity-Berechnung:**
`severity = SEAL-Rank × Risiko-Rank` — ein zweidimensionaler Wert, der in vier Stufen mündet: gering / mittel / hoch / kritisch. Nur wenn hoher Bedarf (S2/S3) auf hohe Exposition trifft, entsteht „kritisch". Ein S0-Objekt bei US-Anbietern ist „mittel" — weil es keinen Souveränitätsbedarf hat.

### Warum das wertvoll ist

Die Matrix löst ein Priorisierungsproblem. Vor der Matrix war die Frage „Welche Objekte sind souveränitätskritisch?" nur durch manuelles Durchgehen der SEAL-Bewertungen zu beantworten. Die Matrix macht es in Sekunden sichtbar:

- Rote Zelle (S2/S3 × Hohe Exposition) = sofortiger Handlungsbedarf
- Grüne Zelle (S0 × Niedrige Exposition) = kein Handlungsbedarf
- Gelbe Zelle (S1 × Mittlere Exposition) = beobachten

Dazu kommt der **Datenarm-Indikator**: Objekte, für die noch keine Cloud-Souveränitätsfelder erfasst wurden, werden explizit markiert — das ist ebenfalls eine Aussage, die im Kundengespräch wichtig ist.

---

## 5. Die Erweiterung: EU Cloud Sovereignty Framework v1.2.1

### Von der Matrix zum vollständigen EU-Framework

Die Risiko-Matrix war der erste Schritt. Der nächste war die Integration des offiziellen EU-Frameworks (DG DIGIT, Oktober 2025), das die Bewertung auf acht Objektive mit exakten Gewichten erweitert und das SEAL-Modell von S0–S3 auf SEAL 0–4 formalisiert.

Der Entwicklungsauftrag für diesen Block (aktueller Chat) war präziser als frühere Iterationen — er beschrieb explizit das Mapping zwischen den sechs alten Dimensionen und den acht neuen Objektiven und forderte einen Human-in-the-Loop-Gate nach der Datenmodell-Phase.

**Das Mapping (6 alt → 8 neu):**

| Alte Dimension | Neues SOV-Objektiv |
|---|---|
| Datenschutz (Jurisdiktion) | SOV-2 Legal & Jurisdictional |
| Datenschutz (Verschlüsselung) + KI-Governance | SOV-3 Data & AI |
| Cybersicherheit | SOV-7 Security & Compliance |
| Operative Resilienz | SOV-4 Operational Resilience |
| Lock-in / Portabilität | SOV-6 Technology |
| Supply-Chain-Transparenz | SOV-5 Supply Chain |
| *(neu, bisher nicht explizit)* | SOV-1 Strategic Sovereignty |
| *(aus Nachhaltigkeitsmodul)* | SOV-8 Environmental Sustainability |

### Der Change-of-Control-Stresstest

Das Differenzierungs-Feature des neuen Moduls: Simulation einer Konzernübernahme (Default: US CLOUD Act). Die Frage dahinter ist nicht akademisch — sie tritt in Beratungsprojekten regelmäßig auf: „Wir nutzen einen EU-Provider, aber der gehört zu einem US-Konzern. Wie souverän sind wir wirklich?"

Der Stresstest berechnet, welche SOV-Objektive durch eine solche Übernahme auf welchen SEAL-Maximalwert fallen, und gibt Score vorher/nachher sowie eine Liste der ausgelösten Gaps. Das Ergebnis ist eine konkrete Zahl — kein abstraktes Risiko.

---

## 6. Lessons Learned: Was ich anderen Beratern empfehle

### Was funktioniert gut

**Fachliche Tiefe in Prompts zahlt sich aus.** Je genauer ich die Fachlogik (BSI-Schutzbedarf-Vererbung, EU-Gewichte, SEAL-Stufendefinition) im Prompt beschreibe, desto weniger Korrekturrunden brauche ich. Eine Stunde in einen guten Prompt investieren spart vier Stunden Review.

**Designprinzipien früh festschreiben und konsequent verteidigen.** „Kein Backend", „kein Login", „keine Breaking Changes am Export-Format", „kein neues Datenerfassen für neue Features" — diese Prinzipien stehen in der CLAUDE.md und werden bei jedem Chat als Kontext geladen. Claude Code hält sie ein, solange sie klar formuliert sind.

**Human-in-the-Loop-Gates explizit benennen.** „Zeig mir das Mapping zur Freigabe, BEVOR du weiterbaust" muss im Prompt stehen. Ohne diese Anweisung baut Claude Code weiter — das ist meistens gut, aber bei architektonischen Weichenstellungen will ich zuerst zustimmen.

**Tests vor Features formulieren lassen.** Wenn ich Claude Code bitte, zuerst die Testfälle zu schreiben und mir zu zeigen, bevor es implementiert, erzwingt das eine saubere Spezifikation. Lücken im Konzept zeigen sich sofort in fehlenden Testfällen.

### Was Grenzen hat

**Domänenwissen kann ich nicht delegieren.** Die KI kennt BSI 200-2 und EU-Frameworks aus Trainingsdaten — aber ob eine bestimmte Schutzbedarf-Logik für einen konkreten Kundenkontext passt, bleibt meine Entscheidung. Claude Code ist kein Ersatz für BSI-Grundschutz-Erfahrung.

**Große Refactorings brauchen meine Aufmerksamkeit.** Wenn Claude Code eine bestehende Datenstruktur umbauen soll, schaue ich mir den Diff genau an. Abwärtskompatibilität (alte Backups müssen laden) ist ein kritisches Prinzip, das ich aktiv überwache.

**Kundenkommunikation und Beratungsurteil bleiben meine Aufgabe.** Das Tool liefert Scores und Prioritätslisten. Was der Kunde damit macht, was wirklich kritisch ist in seinem Kontext, und wie wir das kommunizieren — das ist Beratungsleistung, die nicht delegierbar ist.

---

## 7. Nächste Schritte & offene Einladung

Das Tool ist Open Source (MIT-Lizenz) im GitHub-Repository `MarcusGraetsch/InfoCollectorforInfrastrukturAnalyse_ITM`. Es ist kein Produkt, sondern ein Beratungswerkzeug — das heißt, es entwickelt sich mit den Projekten weiter.

Wer es testen möchte: `git clone`, `npm install`, `npm run dev` — fertig. Keine Accounts, keine API-Keys, keine Cloud-Dienste nötig.

Wer Ideen hat, was fehlt oder falsch ist: Issues auf GitHub oder direkt an mich. Besonders interessiert mich Feedback zur Souveränitätsbewertungslogik — die heuristischen SEAL-Ableitungen sind validiert gegen das EU-Framework, aber nicht gegen echte Audit-Ergebnisse.

Und wer selbst ausprobieren möchte, ein eigenes Beratungstool mit Claude Code zu bauen: Die Kombination aus klarer CLAUDE.md-Datei, strukturierten fachlichen Prompts und konsequenten Review-Gates ist der Kern. Der Rest ist iterative Entwicklung.

---

*Dokument generiert mit Claude Sonnet 4.6 · Entwickelt mit Claude Code CLI · Repository: github.com/MarcusGraetsch/InfoCollectorforInfrastrukturAnalyse_ITM*
