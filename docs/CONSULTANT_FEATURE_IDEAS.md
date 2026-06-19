# Feature-Ideen & strategischer Produkt-Backlog

**Aus Sicht eines IT-Beraters · Stand: Juni 2026**

Dieses Dokument ist eine fundierte Analyse des aktuellen Funktionsstands der Anwendung, abgeglichen mit den relevanten Frameworks, Methoden und Markttrends moderner IT-Beratung (Cloud, Cybersecurity, Governance/Compliance, SAM, FinOps, GenAI/AI-Agents, Nachhaltigkeit). Ziel ist ein priorisierter Backlog mit echtem Mehrwert für Berater:innen — inklusive Begründung, Aufwandseinschätzung und Quellen.

> **Hinweis zur Einordnung:** Die bestehende `CLAUDE.md` enthält bereits einen Feature-Fahrplan (ToDo-Listen, Aufgabenverwaltung, Risikobewertung, Audit-Modus, Multi-User, KI-Vorschläge). Dieses Dokument ergänzt und vertieft diesen Fahrplan um **regulatorisch und marktseitig getriebene** Funktionen, die seit 2025/2026 an Bedeutung gewonnen haben, und verbindet sie konkret mit der bestehenden Architektur (`src/types.ts`, `src/cloudReadiness.ts`, Komponenten in `src/components/`).

---

## 1. Methodik & Bewertungsraster

Jeder Vorschlag wird bewertet nach:

| Dimension | Bedeutung |
|---|---|
| **Mehrwert** | Konkreter Nutzen für den Beratungsauftrag / Verkaufsargument |
| **Arbeitserleichterung** | Wie viel manuelle Arbeit entfällt für den Consultant |
| **Aufwand** | S (klein, 1 Session) · M (mittel, 2–4 Sessions) · L (groß, mehrwöchig / Architekturänderung) |
| **Designprinzip-Konformität** | Bleibt „kein Backend / offline / druckbar" gewahrt? |

Die Reihenfolge folgt grob abnehmendem **Aufwand-Nutzen-Verhältnis** (oben = schnell viel Wirkung).

---

## 2. Bestandsaufnahme — Was die Anwendung heute kann

- **Strukturierte Datenaufnahme** nach BSI IT-Grundschutz 200-2 (Geschäftsprozesse, Anwendungen, Server, Clients, Netze, ICS/IoT, Räume, Gebäude)
- **Cloud-Readiness-Scoring** (heuristisch, 0–100, 6R-Empfehlung, Souveränitäts-Flag) — `src/cloudReadiness.ts`
- **Beratungs-Workflow**: Liefergegenstände (19 LGs), Stakeholder-Register, Meetings/Protokolle, TOPs, offene Punkte, Interview-Fragenliste
- **Analyse-Sichten**: Infrastruktur-Landkarte (Mermaid), Lizenz-/Kostenanalyse (LG 5), TCO-Modell (LG 6), Security-/Governance-Architektur (LG 9), Zielarchitektur (LG 10), Bericht, Executive Summary
- **Export**: JSON-Backup, HTML-Bericht, Excel, Workshop-Paket
- **Architektur**: React 18 + TS + Vite + Tailwind, localStorage + IndexedDB (Dateianhänge), kein Backend

**Fazit:** Das Tool deckt die *Aufnahme* und die *Cloud-Strategie-Vorbereitung* sehr gut ab. Die größten Lücken liegen bei (a) **regulatorischem Compliance-Mapping**, (b) **belastbarer Risiko-/Schutzbedarfsmethodik**, (c) **FinOps/Nachhaltigkeit** und (d) **(halb-)automatisierter Anreicherung** der Daten.

---

## 3. Vorschläge — Block A: Regulatorik & Compliance-Mapping

### A1 — NIS2-/BSIG-Betroffenheits- & Readiness-Check ⭐ (Aufwand: M)

**Kontext:** Das NIS-2-Umsetzungsgesetz (NIS2UmsuCG) ist in Deutschland seit dem **6. Dezember 2025** in Kraft und betrifft rund **29.500 Unternehmen** als „besonders wichtige" bzw. „wichtige Einrichtungen". Bußgelder reichen bis **20 Mio. €** bzw. umsatzabhängig. Nahezu jeder Mittelstands- und KRITIS-Kunde fragt aktuell: *„Bin ich betroffen, und was muss ich tun?"*

**Feature:** Ein geführter Fragebogen (Sektor, Mitarbeiterzahl, Umsatz → Einstufung *besonders wichtig / wichtig / nicht betroffen*) plus ein Mapping der NIS2-Mindestmaßnahmen (Art. 21: Risikomanagement, Business Continuity, Lieferkette, Incident-Meldepflichten 24h/72h/1 Monat) auf die im Tool bereits erfassten Objekte. Ausgabe: Ampel-Gap-Liste + To-Dos in der bestehenden „Offene Punkte"-Logik.

**Mehrwert:** Sofort verkaufbares Eröffnungsgespräch („NIS2-Quick-Check"). **Arbeitserleichterung:** Berater muss Betroffenheitslogik nicht jedes Mal manuell durchdeklinieren.

**Umsetzung:** Neue deklarative Regel-Datei `src/compliance/nis2.ts` (analog `categories.ts`), neue Komponente `ComplianceCheck.tsx`. Kein Backend nötig.

**Quellen:**
- https://www.bsi.bund.de/DE/Service-Navi/Presse/Pressemitteilungen/Presse2025/251205_NIS-2-Umsetzungsgesetz_in_Kraft.html
- https://www.openkritis.de/it-sicherheitsgesetz/nis2-umsetzung-gesetz-cybersicherheit.html
- https://www.deloitte.com/de/de/services/consulting-risk/perspectives/umsetzung-eu-direktive-nis2-nis2umsucg.html

---

### A2 — DORA-Modul: IKT-Drittparteien-Register (Aufwand: M)

**Kontext:** DORA gilt seit **17. Januar 2025** verbindlich für Finanzunternehmen. Pflicht ist u. a. ein **Informationsregister** aller IKT-Drittdienstleister (jährliche Einmeldung, 2026 im Fenster 16.2.–13.3.); die ESAs haben am 18.11.2025 eine Liste von 18 kritischen Drittdienstleistern (CTPPs) veröffentlicht.

**Feature:** Erweiterung des Datenmodells um ein **Dienstleister-/Vertrags-Objekt** (Anbieter, Leistung, Kritikalität, Substituierbarkeit, Exit-Strategie, Sitzland) und einen Export im Format des DORA-Informationsregisters. Verknüpfbar mit Anwendungen/Servern (`itSysteme`-Relationen existieren bereits).

**Mehrwert:** Öffnet das Finanzsektor-Segment (Banken, Versicherungen, Zahlungsdienstleister). **Arbeitserleichterung:** Register entsteht als Nebenprodukt der ohnehin erfassten Infrastruktur.

**Umsetzung:** Neues Interface `Dienstleister` in `types.ts`, Kategorie + Export-Mapping. Aufwand v. a. im präzisen Register-Schema.

**Quellen:**
- https://www.bafin.de/DE/Aufsicht/DORA/Management_IKT_Drittparteienrisikos/Management_IKT_Drittparteirisikos_node.html
- https://www.openkritis.de/eu/dora-digital-operational-resilience-act_nis-2.html

---

### A3 — Multi-Framework-Audit-Cockpit: ISO 27001 / BSI-Grundschutz / TISAX (Aufwand: L)

**Kontext:** In `CLAUDE.md` als „Audit-Vorbereitungs-Modus" bereits angedacht. Der Markt verlangt zunehmend **Mehrnormen-Mapping** (eine Datenbasis, mehrere Testate), da Kunden parallel ISO 27001, BSI-Grundschutz und (Automotive) TISAX bedienen müssen.

**Feature:** Prüfkatalog-Ansicht mit Control-Mapping: Welche im Tool erfassten Informationen erfüllen welches Control? Ampel „erfüllt / teilweise / offen / nicht zutreffend". Cross-Mapping ISO 27001 Annex A ↔ BSI-Bausteine. Export als Auditoren-Paket (PDF/Excel mit Nachweis-Referenzen auf die `LGAnhang`-Dateien).

**Mehrwert:** Macht aus dem Aufnahme-Tool ein **Zertifizierungs-Begleitwerkzeug** — hoher Folgeauftragswert. **Aufwand L**, weil der Control-Katalog gepflegt werden muss.

**Quellen:** (Methodisch, BSI-Grundschritte) – siehe README-Bezug BSI 200-2; ISO/IEC 27001:2022 Annex A.

---

## 4. Block B: Cloud-Souveränität (Vertiefung des Kernfeatures)

### B1 — Souveränitäts-Bewertung nach EU Cloud Sovereignty Framework / SEAL-Levels ⭐ (Aufwand: M)

**Kontext:** Die EU hat 2025/2026 ein **Cloud Sovereignty Framework** mit messbaren **SEAL-Levels** (Sovereignty Effectiveness Assurance Levels) eingeführt; der **EU Data Act** (voll anwendbar seit Sept. 2025) erzwingt Datenportabilität und Anbieterwechsel; **Gaia-X** hat sich zum funktionierenden Qualitätssiegel entwickelt; der **EUCS** (ENISA) soll nationale Zertifizierungen ablösen. Der europäische Cloud-Markt wuchs 2025 um **24 %**, getrieben vom Souveränitäts-Trend.

**Feature:** Das bestehende `souveraen`-Flag in `cloudReadiness.ts` (heute binär) wird zu einer **abgestuften Souveränitäts-Bewertung** ausgebaut: Datenstandort, Betreiber-Jurisdiktion, Verschlüsselungshoheit (BYOK/HYOK), Exit-/Portabilitäts-Reifegrad → SEAL-ähnliches Level. Empfehlung souveräner Zielumgebungen (z. B. Deutsche/EU-Cloud, Gaia-X-zertifiziert) je Objekt.

**Mehrwert:** Differenzierendes Beratungsthema Nr. 1 in DACH/EU 2026. **Arbeitserleichterung:** Strukturierte Argumentationshilfe statt freitextlicher Einschätzung.

**Umsetzung:** Erweiterung `CloudFields` + Scoring-Logik in `assess()`. Klein bis mittel, da Logik bereits existiert.

**Quellen:**
- https://blog.doubleslash.de/en/software-technologien/cloud-technology/making-cloud-sovereignty-measurable-what-is-the-new-eu-framework/
- https://www.cloudcomputing-insider.de/cloud-souveraenitaet-eu-framework-a-7fc15c48928aa995d4999a1a2f85feb4/
- https://www.cloudmagazin.com/2025/10/15/cloud-souveraenitaet-2026-gaia-x-sovereign-cloud-standort/
- https://www.securitytoday.de/2026/03/11/cloud-security-exportartikel-c5-sovereign-cloud-gaia-x-reboot-2026/

---

### B2 — Vendor-Lock-in- & Exit-Strategie-Bewertung (Aufwand: S)

**Kontext:** Der EU Data Act macht **Portabilität** zur Pflicht; FinOps-Berichte betonen Exit-Kosten (Egress) als „Hidden Cost".

**Feature:** Pro Cloud-Kandidat ein kurzer Exit-Readiness-Score (proprietäre Dienste? Datenformate? Egress-Volumen?). Ergänzt das TCO-Modell um die qualitative Lock-in-Dimension.

**Mehrwert:** Vermeidet teure Fehlentscheidungen, stärkt die Beraterrolle als „neutraler Architekt".  **Aufwand S** (Felder + Hinweistexte).

**Quelle:** https://blog.etengo.de/souver%C3%A4ne-eu-cloud

---

## 5. Block C: FinOps & Wirtschaftlichkeit (Ausbau LG 6)

### C1 — FinOps-Dimension: Optimierungspotenziale & Value-Tracking ⭐ (Aufwand: M)

**Kontext:** FinOps hat sich 2026 von reiner Kostenkontrolle zu **„Technology Value Management"** entwickelt. **90 %** der Organisationen managen inzwischen SaaS mit (vorher 65 %), 64 % auch Lizenzen, 57 % Private Cloud. **AI-Kostenmanagement** ist die meistgefragte FinOps-Kompetenz; 49 % halten KI-Einsatz im FinOps für hochrelevant. Markt: 15,2 Mrd. USD (2025) → 50,2 Mrd. USD (2035).

**Feature:** Erweiterung des TCO-Modells um FinOps-Hebel: Rightsizing-Annahmen, Reserved/Savings-Plans vs. Pay-as-you-go (bereits in den Richtwerten erwähnt), Idle-Resource-Schätzung, **separater Block „AI/GenAI-Kosten"** (Token-/Inferenzkosten als neue, schnell wachsende Position). Szenario-Vergleich (konservativ/realistisch/optimistisch).

**Mehrwert:** Wandelt die einmalige TCO-Rechnung in eine **fortlaufende Value-Story** — verlängert die Kundenbeziehung. **Arbeitserleichterung:** vorkonfigurierte Hebel statt freier Tabellenkalkulation.

**Umsetzung:** Erweiterung `TCODaten` in `types.ts` + UI in `TCOModell.tsx` (Szenario-Tabs).

**Quellen:**
- https://www.cloudkeeper.com/insights/blog/state-finops-2026-report-key-trends-insights-and-what-comes-next
- https://data.finops.org/
- https://www.techtarget.com/searchcloudcomputing/feature/3-FinOps-trends-to-look-out-for-in-2026

---

## 6. Block D: SAM, Shadow-AI & EU AI Act

### D1 — EU-AI-Act-Inventar & Shadow-AI-Discovery ⭐ (Aufwand: M)

**Kontext:** Der EU AI Act greift gestaffelt (Verbote seit Feb. 2025, GPAI-Pflichten Aug. 2025, Hochrisiko ab 2026/2027). **Software-Sichtbarkeit ist Vorbedingung** für Compliance: „You can't produce a risk register for AI assets you haven't inventoried." Shadow-AI-Discovery wird als Pflicht-Vorstufe genannt (Art. 12 Logging).

**Feature:** Neue Objektklasse / Flag **„KI-System"** auf Anwendungen: Risikoklasse (verboten / hoch / begrenzt / minimal), Rolle (Anbieter/Betreiber), Trainingsdaten-Herkunft, menschliche Aufsicht. Automatischer AI-Risk-Register-Export. Heuristik zur Shadow-AI-Erkennung (Name/Tag enthält „GPT", „Copilot", „AI", „LLM" → Markierung „prüfen").

**Mehrwert:** Top-aktuelles Pflichtthema; positioniert den Berater früh bei einem neuen Regelwerk. **Arbeitserleichterung:** Inventar entsteht aus vorhandenen Anwendungsdaten.

**Umsetzung:** `CloudFields`/`Anwendung` um KI-Felder erweitern, Export-Mapping, einfache Klassifizierungsheuristik.

**Quellen:**
- https://xensam.com/resources/blog/the-eu-ai-act-and-how-software-visibility-can-support-compliance/
- https://predictionguard.com/blog/best-eu-ai-act-compliance-tools-for-enterprise-ai-programs-in-2026

---

### D2 — SAM-Compliance: Lizenz-Über-/Unterdeckung & Audit-Risiko (Aufwand: M)

**Kontext:** SAM (Optimierung von Kauf, Einsatz, Nutzung, Entsorgung von Software) bleibt ein kontinuierliches Beratungsfeld, eng verzahnt mit FinOps und Vendor-Audits (insb. Microsoft/Oracle).

**Feature:** Aufbauend auf LG 5 (Lizenzanalyse): Soll-/Ist-Abgleich (lizenzierte vs. eingesetzte Instanzen über die `anzahl`-Felder von Server/Client), Audit-Risiko-Ampel je Anbieter, True-Up-Schätzung.

**Mehrwert:** Direkt monetarisierbar (vermiedene Nachzahlungen). **Aufwand M**.

**Quellen:**
- https://en.wikipedia.org/wiki/Software_asset_management
- https://redresscompliance.com/microsoft-software-asset-management-sam-guide

---

## 7. Block E: KI-Agenten & Automatisierung (zukunftsweisend)

### E1 — Optionaler KI-Anreicherungs-Assistent via n8n / lokales LLM ⭐ (Aufwand: L)

**Kontext:** Gartner prognostiziert für **2026 Ausgaben von 201,9 Mrd. USD** für agentische KI (+141 % ggü. 2025); **80 % der Enterprise-Apps** sollen bis 2026 Agenten einbetten. Junior-Consultants werden zunehmend zu „Managern von KI-Agenten". In `CLAUDE.md` ist „KI-gestützte Vorschläge" bereits als experimentelles Feature vorgemerkt — inkl. der Idee einer optionalen n8n-Anbindung (bei HiSolutions im Einsatz).

**Feature:** Eine **optionale, abschaltbare** Integrationsschicht: Pro Objekt ein „Vorschlag holen"-Button, der Kategorie + Name an einen konfigurierbaren Endpunkt (n8n-Webhook **oder** lokales/On-Prem-LLM via OpenAI-kompatibler API) sendet und Schutzbedarf, Bereitstellung, 6R-Strategie als **unverbindlichen Vorschlag** zurückbekommt. Datenschutz-by-Design: Standardmäßig aus, Endpunkt frei wählbar (souverän/on-prem), keine Telemetrie.

**Mehrwert:** Massive Beschleunigung der Ersterfassung; positioniert HiSolutions als KI-affin. **Arbeitserleichterung:** Berater bestätigt nur noch statt einzutippen.

**Umsetzung:** Neue `src/integrations/aiSuggest.ts` (fetch gegen konfigurierbare URL), Settings-Panel für Endpunkt/API-Key (im localStorage), Vorschlags-UI im Wizard/Formular. Bewusst **L**, da es das „kein Backend / offline"-Prinzip berührt — daher strikt optional und ohne Default-Endpunkt halten (Designprinzipien gewahrt).

**Quellen:**
- https://www.itential.com/resource/analyst-report/gartner-predicts-2026-ai-agents-will-reshape-infrastructure-operations/
- https://nmsconsulting.com/it-services-consulting-industry-trends-2026/
- https://insights.daffodilsw.com/blog/top-generative-ai-trends-in-2026-the-definitive-guide-for-business-leaders

---

### E2 — Lokaler RAG-Chat über die erfassten Projektdaten (Aufwand: L)

**Feature:** „Frag dein Projekt": natürlichsprachliche Abfrage über den `AppState` („Welche Anwendungen mit sehr hohem Schutzbedarf laufen noch On-Prem physisch?"). Realisierbar zunächst **ohne LLM** als strukturierte Query-Oberfläche, optional mit lokalem LLM als Antwort-Layer.

**Mehrwert:** Schnelle Ad-hoc-Antworten im Kundengespräch ohne Tabellen-Wühlen. **Aufwand L** (mit LLM), **M** (als Query-Builder).

**Quelle:** https://www.blueprism.com/resources/blog/future-ai-agents-trends/

---

## 8. Block F: Nachhaltigkeit / Green IT (neues Beratungsfeld)

### F1 — CO₂-/Energie- & EnEfG-Modul ⭐ (Aufwand: M)

**Kontext:** Das **Energieeffizienzgesetz (EnEfG)** gilt für Rechenzentren ab 300 kW: Energiemanagementsystem seit **Juli 2025**, **PUE ≤ 1,3** für Bestand ab 2030 / **≤ 1,2** für Neubauten ab Juli 2026, Abwärmenutzung ab 2026. **CSRD** verpflichtet große Unternehmen zur standardisierten Nachhaltigkeitsberichterstattung; Green Cloud wird zum Auswahlkriterium.

**Feature:** Energie-/CO₂-Schätzung je Server/RZ (kW-Aufnahme × PUE × Strommix-Faktor → kWh/Jahr und t CO₂/Jahr) und ein On-Prem-vs-Cloud-**Nachhaltigkeitsvergleich** parallel zum TCO. Knüpft direkt an die bereits im TCO-Panel hinterlegten Energie-Richtwerte (1,5 kW/Server, PUE 1,5) an. CSRD-/ESG-tauglicher Export.

**Mehrwert:** Erschließt das schnell wachsende Green-IT-/ESG-Beratungsfeld; Cloud-Migration bekommt ein zweites, nicht-monetäres Argument. **Arbeitserleichterung:** Wiederverwendung vorhandener Energie-Annahmen.

**Umsetzung:** Neue `src/sustainability.ts` (analog `cloudReadiness.ts`) + Sicht / TCO-Erweiterung.

**Quellen:**
- https://www.rechenzentren.org/news/energieeffizienz-in-rechenzentren-neue-gesetzgebung-zur-steigerung-der-nachhaltigkeit/
- https://www.cloudcomputing-insider.de/green-cloud-nachhaltigkeit-csrd-a-4d92b4df19775ee70c14ef9452e6728d/
- https://www.matrix.ag/blog/shared-infrastructure-esg-nachhaltigkeit

---

## 9. Block G: Risiko- & Schutzbedarfsmethodik (BSI-Tiefe)

### G1 — CIA-Triade & Schutzbedarfsvererbung nach BSI 200-2 ⭐ (Aufwand: M)

**Kontext:** In `CLAUDE.md` als mittelfristiges Feature vermerkt. BSI-Grundschutz verlangt differenzierten Schutzbedarf nach **Vertraulichkeit, Integrität, Verfügbarkeit** und dessen **Vererbung** entlang der Abhängigkeiten (Maximum-/Kumulations-/Verteilungsprinzip).

**Feature:** Aufspaltung des heutigen einwertigen `schutzbedarf` in C/I/A. Automatische **Vererbung** entlang der bereits modellierten Relationen (Geschäftsprozess → Anwendung → Server → Netz). Risikomatrix (Eintritt × Auswirkung) als Grundlage für BSI 200-3.

**Mehrwert:** Hebt das Tool von „Inventar" zu **echter Schutzbedarfsanalyse** — Kernleistung jeder BSI-Beratung. **Arbeitserleichterung:** Vererbung spart das manuelle Durchreichen über hunderte Objekte.

**Umsetzung:** `schutzbedarf` → `{ vertraulichkeit, integritaet, verfuegbarkeit }`; **Migrationslogik** im Store nötig (Designprinzip „keine Breaking Changes am JSON-Export"). Vererbungs-Algorithmus über die `*[]`-Relationen.

**Quelle:** BSI-Standard 200-2/200-3 (Methodik, vgl. README-Bezug).

---

## 10. Block H: Datenqualität, Versionierung & Reifegrad

### H1 — Fortschritts-/Vollständigkeits-Cockpit (Aufwand: S) — *Quick Win*

Bereits in `CLAUDE.md` priorisiert. Ampel je Kategorie (vollständig/teilweise/unbearbeitet), Anteil `Unklar`-Felder, Pflichtfeld-Abdeckung — sichtbar im Dashboard. **Sehr hoher Nutzen bei kleinem Aufwand**, da die Daten und die `Unklar`-Semantik schon existieren.

### H2 — Snapshot-Versionierung & Delta-Ansicht (Aufwand: M)

Ebenfalls in `CLAUDE.md` skizziert. JSON-Snapshots mit Zeitstempel; Delta zwischen zwei Ständen (neu/geändert/entfernt). Wertvoll für Audit-Follow-ups und Folgeprojekte. Vollständig localStorage-konform.

### H3 — Datenqualitäts-Validator (Aufwand: S)

Regelbasierte Plausibilitätsprüfung (z. B. „Anwendung ohne Server-Relation", „Server ohne Raum", „sehr hoher Schutzbedarf aber Bereitstellung Public Cloud ohne Souveränitätsangabe"). Liefert priorisierte Hinweisliste — robuster als das aktuell „fragile" Import-Mapping (bekannte techn. Schuld).

---

## 11. Block I: Kollaboration & Lieferung

### I1 — Kunden-Self-Service-Modus (Aufwand: L)

In `CLAUDE.md` als „Rollenkonzept" vermerkt. Read-only- bzw. Teilbearbeitungs-Link/Export, mit dem der Kunde bestimmte Felder (Schutzbedarf, Verantwortliche) selbst befüllt; Re-Import beim Berater. Bleibt ohne Server über export/import-Dateien realisierbar.

### I2 — Maturity-Assessment & Benchmarking (Aufwand: M)

Cloud-/Security-Reifegrad in Stufen (z. B. 1–5) je Domäne, Spider-Chart im Executive Summary, optional anonymer Branchen-Benchmark (statische Referenzwerte). Stärkt die Management-Kommunikation (LG 14).

---

## 12. Priorisierungs-Übersicht

| ID | Feature | Aufwand | Nutzen | Empfehlung |
|---|---|---|---|---|
| H1 | Vollständigkeits-Cockpit | S | Hoch | **Sofort** (Quick Win) |
| A1 | NIS2-/BSIG-Readiness-Check | M | Sehr hoch | **Sofort** (Marktnachfrage) |
| B1 | Souveränitäts-Bewertung (SEAL/Gaia-X) | M | Sehr hoch | **Sofort** (Kerndifferenzierung) |
| G1 | CIA-Triade & Vererbung | M | Sehr hoch | Kurzfristig |
| D1 | EU-AI-Act-Inventar / Shadow-AI | M | Hoch | Kurzfristig (aktuelles Thema) |
| C1 | FinOps-Dimension | M | Hoch | Kurzfristig |
| F1 | CO₂-/EnEfG-Modul | M | Hoch | Mittelfristig |
| H2/H3 | Versionierung & Datenqualität | S–M | Mittel–Hoch | Mittelfristig |
| A2 | DORA-Drittparteienregister | M | Hoch (Finanzsektor) | Mittelfristig |
| D2 | SAM-Compliance | M | Hoch | Mittelfristig |
| B2 | Lock-in/Exit-Bewertung | S | Mittel | Mittelfristig |
| E1 | KI-Anreicherung (n8n/LLM) | L | Sehr hoch | Strategisch |
| A3 | Multi-Framework-Audit-Cockpit | L | Sehr hoch | Strategisch |
| E2 | RAG-Chat über Projektdaten | L | Hoch | Strategisch |
| I1/I2 | Kundenportal / Maturity | M–L | Mittel–Hoch | Strategisch |

---

## 13. Architektonische Leitplanken für alle Vorschläge

- **Kein Pflicht-Backend:** KI-Features (E1/E2) bleiben strikt optional und ohne Default-Endpunkt; Souveränität/Offline-Prinzip nicht brechen.
- **Migrationslogik zwingend** bei Schema-Änderungen (G1, A2, C1, D1) — das JSON-Export-Format darf nicht ohne Migration brechen (bestehendes Designprinzip).
- **Deklarativ erweitern:** Compliance-Kataloge (A1–A3) analog zu `categories.ts` als Daten, nicht als Code-Logik — leicht durch Fachteams pflegbar.
- **Wiederverwendung:** TCO-Energie-Richtwerte (F1), `Unklar`-Aggregation (H1), Objekt-Relationen (G1-Vererbung) sind bereits vorhanden und sollten genutzt statt dupliziert werden.

---

*Erstellt im Rahmen einer Trend- & Lückenanalyse. Alle externen Aussagen sind mit Quellen (Stand Juni 2026) belegt; regulatorische Details vor Umsetzung im Mandat verifizieren.*
