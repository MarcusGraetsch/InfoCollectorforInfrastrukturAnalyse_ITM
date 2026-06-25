# Konzept: Souveränitäts- & Compliance-Features aus dem RAG-Wissenskorpus

**Stand:** 2026-06-23 · **Branch:** `claude/dazzling-ride-04upm4`
**Grundlage:** Drei interne HiSolutions-Dokumente zum Cloud-/KI-Souveränitäts-Korpus
(RAG-Blueprint v3, RAG-Korpus v1, „EU and German Cloud and AI Compliance Corpus")

---

## 1. Ausgangslage & wichtige Abgrenzung

Die drei Dokumente beschreiben ein **RAG-System** (Retrieval-Augmented Generation) mit:
Vektordatenbank, Knowledge-Graph, LLM-Pipeline, Web-Scraper für Live-Ingestion und einem
Reviewer-Backend.

Das steht **im direkten Konflikt** mit unseren nicht verhandelbaren Designprinzipien:

| RAG-Korpus verlangt | Unser Tool |
|---|---|
| Backend (Python/Vektor-DB/LLM) | **Kein Backend** |
| Live-Web-Ingestion / Scraper | **Offline-fähig, kein Internet nötig** |
| Reviewer-Konsole, Mehrbenutzer | **Kein Login** |
| Massen-Ingestion von ISO-Volltexten | Lizenzrechtlich verboten (ISO) |

**Schlussfolgerung:** Wir bauen **kein** RAG nach. Wir extrahieren die *fachlichen* Kernideen
und gießen sie in unsere bewährte **deterministische, deklarative, offline-fähige** Architektur —
genau wie bei `cloudReadiness.ts`, `nis2.ts`, `euAiAct.ts`. Die Dokumente liefern den
**Wissens- und Regelinhalt**; wir liefern die **regelbasierte Engine** ohne KI-Abhängigkeit.

---

## 2. Die übertragbare Kernerkenntnis

> **„Souveränität ist mehr als Datenresidenz."**

Der stärkste Befund beider Korpus-Dokumente: Ein gutes Bewertungswerkzeug braucht **getrennte
Scores** statt eines einzelnen „compliant / nicht compliant"-Urteils. Souveränität ist ein Bündel aus:

- **Jurisdiktionsexposition** (Schrems II, US CLOUD Act, Datenzugriff Drittstaat)
- **Portabilität & Switching** (Data Act, Exit-Klauseln, Export-Formate)
- **Interoperabilität** (offene Standards, kein Lock-in)
- **Identität & Vertrauensanker** (Gaia-X, IAM-Hoheit)
- **Vertragliche Exit-Rechte** (Kündigung, Datenrückgabe)
- **Operative Unabhängigkeit** (Admin-Zugriff, Subprozessoren)
- **Supply-Chain-Transparenz** (SBOM, Provenance)

Unser heutiges SEAL-Level (S0–S3 in `SouveraenitaetsBewertung.tsx`) ist **ein einzelner Wert** —
das ist genau die vom Korpus kritisierte Verkürzung. Hier liegt das größte Verbesserungspotenzial.

---

## 3. Abgeleitete Feature-Vorschläge (offline-konform)

### Vorschlag A — Mehrdimensionale Souveränitäts-Scorecard ⭐⭐⭐⭐⭐

**Was:** Das einzelne SEAL-Level zu einer **Scorecard mit getrennten Dimensions-Scores** ausbauen:

| Dimension | Speist sich aus | Frameworks |
|---|---|---|
| Datenschutz | Schutzbedarf, Datenklassifikation, Drittstaat-Zugriff | DSGVO, BDSG, Schrems II, SCC |
| Cybersicherheit | NIS2-Check, C5-Nachweise | NIS2/BSIG, BSI C5:2026 |
| Operative Resilienz | DORA-Register, BCM-Felder | DORA, BSI IT-Grundschutz |
| Souveränität / Lock-in | Bereitstellung, Exit-Plan, Portabilität | Data Act, Gaia-X, DSK |
| KI-Governance | EU-AI-Act-Inventar, ML-Lifecycle | EU AI Act, AIC4, ISO 42001 |
| Supply-Chain | SBOM vorhanden, Provenance | SLSA, CycloneDX/SPDX |

**Darstellung:** Radar-/Spider-Chart (Code aus dem Reifegradmodell bereits vorhanden!) +
Einzel-Scores pro Cloud-Objekt **oder pro Provider**. Gewichtung anpassbar (öffentlicher Sektor:
Souveränität höher gewichten).

**Warum stark:** Setzt die Kernerkenntnis der Dokumente exakt um, nutzt vorhandene Daten +
vorhandene Chart-Komponente, ersetzt keine bestehende Funktion sondern vertieft sie.

**Aufwand:** M (2–3 Sessions)

---

### Vorschlag B — Souveränitäts-Washing-Check (deterministische Regel-Engine) ⭐⭐⭐⭐⭐

**Was:** Die **Requirement→Evidence→Verdict-Tabellen** der Dokumente (S. 20–22) als
**deterministische Prüfregeln** kodieren — kein KI, reine Wenn-Dann-Logik (wie schon NIS2).

Beispiele aus dem Korpus, 1:1 umsetzbar:

| Regel | Verdikt |
|---|---|
| Personenbezogene Daten + Drittstaat-Zugriff + kein SCC/TIA | ❌ **Fail** |
| Cloud-Vendor verarbeitet PII + kein AVV/Art.-28-Vertrag | ❌ **Fail** |
| Als „souverän" vermarktet + kein Exit-Test / Admin-Kontroll-Nachweis | ⚠️ **Souveränitäts-Washing** |
| KI-Dienst „vertrauenswürdig" + keine ML-Lifecycle-Kontrollen | ⚠️ **Warn** |
| Cloud-Dienst + kein C5-Report im Scope | ⚠️ **Warn** |
| Portabilität gefordert + Provider blockiert Export | ❌ **Fail** |

Ausgabe als **Gap-Liste** → fließt in die bestehende „Offene Punkte"-Logik. Vermarktbar als
**„Souveränitäts-Quick-Check"** (vgl. ZenDiS-Whitepaper „Souveränitäts-Washing").

**Warum stark:** Genau unser bewährtes Muster (deklarative Regeldatei `src/compliance/souveraenitaet.ts`).
Hoher Beratungs-Verkaufswert. Keinerlei Backend.

**Aufwand:** M (2 Sessions)

---

### Vorschlag C — Nachweis-/Evidence-Katalog ⭐⭐⭐⭐

**Was:** Pro Anforderung eine **Checkliste, welche Nachweise** vom Cloud-Provider einzuholen sind
(AVV/DPA, SCC-Annexe, C5-Report, TIA, Exit-Plan, SBOM, Modell-Inventar …). Integriert sich in das
**bestehende „Gelieferte Unterlagen"-Modul + die E-Mail-Vorlage**.

**Warum stark:** Verwandelt vage Compliance-Aussagen in eine konkrete Dokumenten-Anforderungsliste —
„Was muss ich beim Kunden/Provider besorgen?". Schließt direkt an vorhandene Workflows an.

**Aufwand:** S–M (1–2 Sessions)

---

### Vorschlag D — Offline-Compliance-Quellen-Bibliothek ⭐⭐⭐⭐

**Was:** Das „Quellen-Register" der Dokumente als **kuratierte, gebündelte, statische Referenz**
im Tool — ein offline-Nachschlagewerk mit Karten je Rahmenwerk:

- Kurzbeschreibung, Bindungsgrad (Gesetz / Behördenvorgabe / Norm / Branchenrahmen)
- **Status** (`gilt jetzt` / `gilt ab Datum` / `in Entwicklung` / `Entwurf`)
- **Gültigkeits-/Anwendungsdatum**, offizielle URL (klickbar wenn online)

Abgedeckt: DSGVO, BDSG, EU AI Act, NIS2/BSIG, Data Act, DGA, Schrems II, SCC, BSI C5:2026, AIC4,
IT-Grundschutz, DSK Souveräne Clouds, ZenDiS, Gaia-X, DVC, ISO 27001/27017/27018/27701/42001
(nur Metadaten + Abstract — **keine Volltexte**, ISO-Lizenz!), NIST AI RMF/CSF, CSA CCM/AICM.

**Warum stark:** Liefert den *Wissenswert* des RAG-Korpus **ohne** RAG — als rechtssichere,
offline-verfügbare Distillation. Kann zugleich Kontexthilfe/Tooltips der Compliance-Module speisen.

**Aufwand:** M (Inhaltspflege ist der Hauptaufwand; Technik ist trivial)

---

### Vorschlag E — Regulatorik-Zeitstrahl ⭐⭐⭐

**Was:** Die Timeline der Dokumente (Schrems II → SCC → AI-Act-Stufendaten → C5:2026 → EUCS pending
→ 2026 AI-Omnibus) als **status-bewusste Zeitleiste**. Markiert „gilt jetzt" vs. „gilt ab" vs.
„in Verhandlung".

**Warum:** Gut für Kunden-Briefings („Was kommt wann auf Sie zu?"). Eigenständig eher „nice to have" —
**am besten als Teilansicht von Vorschlag D**, nicht als eigenes Modul (Überfrachtungsgefahr).

**Aufwand:** S

---

## 4. Was wir bewusst NICHT bauen

| Idee aus den Dokumenten | Warum nicht |
|---|---|
| Vektor-DB / Embeddings / LLM-Pipeline | Bricht „kein Backend / offline" |
| Web-Scraper / Live-Ingestion | Bricht „offline" |
| Reviewer-Konsole / Mehrbenutzer | Bricht „kein Login" |
| ISO-Volltexte indexieren | ISO-Lizenz verbietet ML-Nutzung |
| Kubernetes Pod-Security-Scans / Pipeline-Analyse | Außerhalb der Strukturanalyse-Reichweite |
| Vollständiger Knowledge-Graph (Neo4j etc.) | Massiv überdimensioniert für Beratungskontext |

---

## 5. Empfehlung & Reihenfolge

Um **nicht zu überfrachten**, empfehle ich einen **fokussierten Souveränitäts-Block**, der das
bestehende SEAL-Modul vertieft statt neue, isolierte Module danebenzustellen:

| Prio | Feature | Aufwand | Begründung |
|---|---|---|---|
| 1 | **A — Souveränitäts-Scorecard** | M | Kernerkenntnis, nutzt vorhandene Daten + Chart |
| 2 | **B — Souveränitäts-Washing-Check** | M | Höchster Beratungswert, bewährtes Regel-Muster |
| 3 | **C — Nachweis-Katalog** | S–M | Andockung an bestehenden Unterlagen-Workflow |
| 4 | **D — Quellen-Bibliothek (inkl. E-Zeitstrahl)** | M | Offline-Wissenswert, Kontexthilfe-Quelle |

**A + B zusammen** ergeben einen runden, sofort vermarktbaren „Cloud-Souveränitäts-Check"
und sind die klare Empfehlung für den ersten Schritt.

---

## 6. Umsetzungsstatus

**Stand 2026-06-23: Features A, B, C und D umgesetzt.**

| Feature | Status | Artefakte |
|---|---|---|
| A — Mehrdimensionale Scorecard | ✅ umgesetzt + erweitert | `src/compliance/souveraenitaet.ts` (`assessSouveraenitaet`), Spider-Chart + **klickbare Dimensions-Karten mit geführter Detailansicht & Maßnahmen** (Paket 6, `souvDetail.ts` + `GovernanceTopicDrawer.tsx`) in `SouveraenitaetsBewertung.tsx` |
| B — Souveränitäts-Washing-Check | ✅ umgesetzt | `pruefeSouveraenitaet()` (deterministische Regeln), Washing-Tabelle in `SouveraenitaetsBewertung.tsx` |
| C — Nachweis-/Evidence-Katalog | ✅ umgesetzt, **2026-06-24 überarbeitet (Paket 9)** | Aus der ursprünglichen Checkbox-Ansicht (`NachweisKatalog.tsx` + `AppState.nachweisStatus`) wurde der **interaktive Evidence-Katalog**: `EvidenceKatalog.tsx` + `src/compliance/evidenceCatalog.ts` auf `AppState.evidenceItems` (n:m zu Themen/Rollen/Objekten). `nachweise.ts` ist Seed-Quelle; alter `nachweisStatus` wird non-destruktiv migriert. Subtab heißt nun „Evidence-Katalog". |
| D — Quellen-Bibliothek + Zeitstrahl (inkl. E) | ✅ umgesetzt | `src/compliance/quellen.ts`, `QuellenBibliothek.tsx`, Subtab „Quellen-Bibliothek" |

Alles offline, deterministisch, ohne neue Abhängigkeiten — konform zu den Designprinzipien.
