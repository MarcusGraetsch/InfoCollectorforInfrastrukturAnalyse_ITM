# Feature-Dokumentation — IT Strukturanalyse · Cloud-Readiness Suite

Vollständige Beschreibung aller Funktionen. Zielgruppe: Berater:innen der HiSolutions AG im Kundeneinsatz.

**Stand: 2026-06-24**

---

## Inhaltsverzeichnis

1. [Datenerfassung](#1-datenerfassung)
   - 1.1 Schritt-für-Schritt-Assistent (Wizard)
   - 1.2 Direkte Kategorie-Formulare
   - 1.3 Globale Suche (Ctrl+K)
   - 1.4 Feldtypen
   - 1.5 Objekt-Notizen
2. [Kategorien & Datenmodell](#2-kategorien--datenmodell)
   - 2.1 Übersicht der 14 Kategorien
   - 2.2 Hardware-Felder (Mixin, 7 Kategorien)
   - 2.3 Wirtschaftlichkeits-Felder (Mixin, 8 Kategorien)
   - 2.4 Software-Tiefe + 8 typabhängige Feldsätze (Anwendungen)
   - 2.5 Betriebssysteme (eigene Kategorie)
   - 2.6 Schnittstellen (App-zu-App-Kommunikation)
   - 2.7 Multi-Data-Sections (Tabellenfelder)
3. [Analysen & Dashboards](#3-analysen--dashboards)
4. [Import / Export](#4-import--export)
5. [Datenpersistenz & Sicherheit](#5-datenpersistenz--sicherheit)
6. [Tastaturkürzel & Tipps](#6-tastaturkürzel--tipps)
7. [BSI-Kontexthilfe & E-Mail-Vorlage](#7-bsi-kontexthilfe--e-mail-vorlage)
8. [Deinstallation](#8-deinstallation)

---

## 1. Datenerfassung

### 1.1 Schritt-für-Schritt-Assistent (Wizard)

**Aufruf:** Tab „Assistent" (Standard beim Start)

Der Wizard führt durch die gesamte Ersterfassung in fester Reihenfolge:

| Schritt | Inhalt |
|---|---|
| **Begrüßung** | Projektname (Kundenname), E-Mail-Vorlage |
| **Cloud-Strategie-Rahmen** | Geschäftliches Ziel, Cloud-Treiber, Zielumgebung, Zeithorizont |
| **Gelieferte Unterlagen** | Vom Kunden bereitgestellte Dokumente (Name, Art, Datum, Status) |
| **14 BSI-Kategorien** | Datenaufnahme mit Kontexthilfe je Kategorie |
| **Zusammenfassung** | Cloud-Readiness-Übersicht, Links zu Dashboard und Export |

Alle Eingaben werden sofort automatisch gespeichert — kein Speichern-Button nötig.

---

### 1.2 Direkte Kategorie-Formulare

**Aufruf:** Tab „Detailansicht" → Kategorie auswählen

Tabellarische Übersicht aller Einträge je Kategorie mit:
- Neue Einträge anlegen (Button „+ Neu")
- Bestehende Einträge bearbeiten (Stift-Icon)
- Einträge löschen (Mülleimer-Icon, mit Bestätigung)
- Automatisch generierte Kürzel (z. B. `S-001`, `IF-003`, `OS-007`)

---

### 1.3 Globale Suche (Ctrl+K)

**Aufruf:** `Ctrl+K` oder Suchsymbol im Header

Modal-Overlay mit Volltext-Suche über alle 14 Kategorie-Arrays:

- Sucht gleichzeitig in allen Felder-Werten aller Objekte
- Ergebnisse gruppiert nach Kategorie mit farbigen Badges
- Tastaturnavigation mit `↑` / `↓` / `Enter` (öffnet Objekt direkt)
- Maximum 50 Ergebnisse, sofortiges Filtern beim Tippen
- `Escape` schließt das Modal

---

### 1.4 Feldtypen

| Typ | Darstellung | Besonderheit |
|---|---|---|
| `text` | Eingabefeld mit Datalist-Vorschlägen (Combobox) | Freie Eingabe immer möglich |
| `textarea` | Mehrzeiliges Feld mit Schnellauswahl-Buttons | Klick auf Vorschlag befüllt das Feld |
| `select` | Einfach-Dropdown | Vordefinierte Optionen |
| `multiref` | Mehrfach-Verknüpfung zu anderen Kategorien | Generiert automatisch lesbare Labels |
| `number` | Zahlenfeld mit Einheiten-Suffix | Einheiten: W, kW, V, GB, HE, €, Jahre … |
| `date` | Natives Datumfeld | Speicherung als ISO-String `YYYY-MM-DD` |
| `url` | URL-Eingabe mit „Öffnen ↗"-Link | Validierung `https?://` |
| `table` | Wiederholbare Zeilengruppen (Multi-Data-Sections) | Inline-Tabelleneditor, JSON-Array im Store. Spalten unterstützen `text`, `select`, `date` (native Datumsauswahl, ISO `YYYY-MM-DD`), `number` und `url` sowie Spalten-Tooltips |

**Conditional Fields (`showIf`):** Felder können typabhängig ein-/ausgeblendet werden (z. B. Datenbank-Felder nur wenn `typ = 'Datenbank'`). Versteckte Felder behalten ihren Wert und zählen nicht als „fehlend" in der Vollständigkeits-Berechnung.

**Collapsible Sektionen:** Formularfelder sind in einklappbare Blöcke gruppiert (z. B. „Technische Details", „Wirtschaftlichkeit & Vertrag") — die Übersicht bleibt auch bei vielen Feldern gewahrt.

**Feldvorschläge:** Textfelder mit Combobox-Vorschlägen decken gängige Bezeichnungen ab (Plattformen, Protokolle, Hersteller, Normen). Eigene Eingaben sind immer möglich.

---

### 1.5 Objekt-Notizen

An jedem Objekt-Formular befindet sich ein ausklappbarer Notizen-Bereich:

- Kommentar-Feed mit Timestamp und optionalem Autorfeld
- Neuen Kommentar hinzufügen ohne das Formular zu speichern
- Einzelne Notizen löschen (Bestätigung)
- Ideal für Workshop-Protokoll-Einträge: „Laut Herrn Müller läuft hier noch ein Legacy-Prozess"

Notizen werden in `BaseItem.notizen[]` gespeichert und erscheinen in JSON-Backups und HTML-Berichten.

---

## 2. Kategorien & Datenmodell

### 2.1 Übersicht der 14 Kategorien

| Kürzel | Kategorie | Besonderheiten |
|---|---|---|
| `GP` | Geschäftsprozesse | Basis für Schutzbedarfsvererbung |
| `D` | Daten | Datenkategorien, Schutzbedarf |
| `A` | Anwendungen | Software-Tiefe, 8 typabh. Feldsätze, AfA, Cloud-Readiness |
| `S` | Server | Hardware-Felder, AfA, Cloud-Readiness, Netzwerk-Interfaces (MDS) |
| `C` | Clients | Hardware-Felder, AfA, Cloud-Readiness |
| `NK` | Netzkomponenten | Hardware-Felder, AfA |
| `NV` | Netzverbindungen | Protokolle, Bandbreite, Verschlüsselung |
| `SK` | Sicherheitskomponenten | Hardware-Felder, AfA |
| `ICS` | ICS-Systeme | Hardware-Felder, AfA, Cloud-Readiness |
| `IOT` | IoT-Systeme | Hardware-Felder, AfA, Cloud-Readiness |
| `DT` | Datenträger | Hardware-Felder, AfA |
| `R` | Räume | Gebäude-/RZ-Infrastruktur |
| `OS` | Betriebssysteme | Eigene Kategorie, wiederverwendbar, multiref von Server/Client |
| `SS` | Schnittstellen | App-zu-App-Kommunikation, Protokoll, Port, Verschlüsselung |

**Cloud-Readiness-Kategorien** (erhalten heuristischen Score): Anwendungen, Server, Clients, ICS-Systeme, IoT-Systeme.

---

### 2.2 Hardware-Felder (Mixin)

Angehängt an: Server, Clients, Netzkomponenten, Sicherheitskomponenten, ICS-Systeme, IoT-Systeme, Datenträger.

| Feld | Typ | Einheit |
|---|---|---|
| Hersteller | text (Combobox) | Dell, HPE, Cisco, Lenovo … |
| Modell / Typ | text | |
| Seriennummer | text | |
| Inventar-/Asset-Nummer | text | für Anlagenbuchhaltung |
| Produktivnahme-Datum | date | für AfA-Beginn |
| Management-IP | text | |
| Redundanz | select | Ja / Nein / Unklar |
| Formfaktor | select | Rack / Tower / Blade / Virtuell / Mobil / Embedded |
| Höheneinheiten | number | HE |
| Stromverbrauch (typ.) | number | W |
| Leistungsaufnahme (max.) | number | kW |
| Versorgungsspannung | text | V |
| Redundante Netzteile | select | Ja / Nein / Unklar |
| **Technische Details** (einklappbar) | | |
| CPU (Typ / Kerne) | text | |
| Arbeitsspeicher | number | GB |
| Speicher / Kapazität | text | |
| Rack / Standort-Detail | text | |

Software-Support-Ende ist ebenfalls vorhanden (date).

---

### 2.3 Wirtschaftlichkeits-Felder (Mixin)

Angehängt an: alle Hardware-Kategorien + Anwendungen.

| Feld | Typ | Einheit |
|---|---|---|
| Anschaffungsdatum | date | AfA-Startdatum |
| Anschaffungspreis (netto) | number | € |
| Abschreibungsdauer | number | Jahre |
| Jährl. Betriebskosten | number | € |
| Wartungsvertrag | select | Ja / Nein / Unklar |
| Wartungskosten / Jahr | number | € |
| Vertragsbeginn / -ende | date | |
| Kündigungsfrist | text | |
| Support-Ende (EoL/EoS) | date | |
| Kostenstelle | text | |

**Automatische AfA-Berechnung** (`src/wirtschaftlichkeit.ts`): Linearer Buchwert und Restlaufzeit werden aus Anschaffungsdatum, -preis und Abschreibungsdauer berechnet. Sichtbar in der druckbaren AfA-Übersicht und im TCO-Modul.

**TCO-Aggregation:** Das TCO-Modul bietet „Aus Objektdaten übernehmen" — liest die Ist-Kosten aller Objekte nicht-destruktiv in die TCO-Erfassung ein (Single Source of Truth).

---

### 2.4 Software-Tiefe + typabhängige Feldsätze (Anwendungen)

Zusätzliche Basis-Felder:

| Feld | Typ |
|---|---|
| Hersteller / Anbieter | text (Combobox) |
| Produktname | text |
| Version | text |
| Update-Zyklus | select |
| Link Betriebshandbuch | url |
| Link Repository | url |
| Link Hersteller / Produkt | url |

**8 typabhängige Feldsätze** (eingeblendet via `showIf: { field: 'typ', equals: [...] }`):

| Typ | Zusatz-Felder |
|---|---|
| **Datenbank** | DB-Modell, DB-Produkt, Version, Backup-Strategie, Backup-Ort, Replikation, HA-Setup |
| **Webserver / Backend** | Server-Software, TLS-Version, Exponierte Ports, Reverse Proxy / WAF |
| **Betriebssystem-nah** | OS-Version, Patch-Level, Kernel, Support-Ende, Edition |
| **Middleware** | Middleware-Typ, Protokolle, Anzahl Endpunkte/Flows |
| **ERP / CRM** | Aktive Module, Customizing-Grad, Mandanten, Angebundene Systeme |
| **Monitoring / Security** | Kategorie (SIEM/EDR/…), Abdeckung, Log-Aufbewahrung |
| **Backup-Software** | Produkt, RPO, RTO, 3-2-1-Regel, Offsite-Kopie |
| **Virtualisierung / Hypervisor** | Produkt, Cluster-Knoten, Anzahl VMs, Live-Migration |

---

### 2.5 Betriebssysteme (eigene Kategorie, Präfix `OS`)

Betriebssysteme werden als **eigenständige, wiederverwendbare IT-Components** geführt — analog zu LeanIX „IT Component". Damit kann ein OS-Objekt von mehreren Servern und Clients referenziert werden.

Felder: Hersteller, Version, Kernel, Support-Ende, Patch-Level, Lizenztyp, Architektur + vollständige Wirtschaftlichkeits-Felder.

Beziehung: `Server.betriebssystem → [OS-001]`, `Client.betriebssystem → [OS-002]`

Ergebnis: In der Infrastruktur-Landkarte ist die Kette **Server A → OS x → Apps a, b, c** sichtbar.

---

### 2.6 Schnittstellen (App-zu-App-Kommunikation, Präfix `SS`)

Typisierte Kommunikationsbeziehungen zwischen Anwendungen — analog zu LeanIX „Interface Fact Sheet".

| Feld | Typ | Optionen / Hinweis |
|---|---|---|
| Quell-Anwendung | multiref | → `anwendungen` |
| Ziel-Anwendung | multiref | → `anwendungen` |
| Richtung | select | Unidirektional / Bidirektional |
| Initiator | select | Quelle / Ziel / Beide |
| Protokoll | text (Combobox) | HTTPS/REST, gRPC, JDBC, AMQP, Kafka, SFTP, MQTT, OPC UA … |
| Port(s) | text | |
| Übertragungsart | select | Synchron / Asynchron / Batch |
| Frequenz | select | Echtzeit / Stündlich / Täglich / Nächtlich / On Demand |
| Datenfluss (welche Daten?) | textarea | |
| Verknüpfte Datenobjekte | multiref | → `daten` |
| Verschlüsselung | select | TLS 1.3 / TLS 1.2 / mTLS / VPN / Keine / Unklar |
| Authentifizierung | select | OAuth2 / API-Key / mTLS / Zertifikat / Basic Auth / Keine / Unklar |
| Firewall-Regel / Voraussetzungen | textarea | |
| Status | select | Aktiv / Inaktiv / In Planung / Außer Betrieb |

---

### 2.7 Multi-Data-Sections (Tabellenfelder)

Wiederholbare Zeilengruppen pro Objekt — FieldType `table` in `categories.ts`.

Aktuell eingesetzt bei:

**Server — Netzwerk-Interfaces:**
| Spalte | Beschreibung |
|---|---|
| Interface-Name | eth0, ens3, bond0 … |
| IP-Adresse | IPv4 oder IPv6 |
| MAC-Adresse | |
| VLAN | |
| Typ | Management / Produktion / Backup / iDRAC |

**Anwendungen — Lizenzen:**
| Spalte | Typ | Beschreibung |
|---|---|---|
| Lizenztyp | select | Perpetual / Subscription / OEM / Open Source / Freeware / Sonstige |
| Anzahl | text | z. B. „50 CAL" (Freitext erlaubt) |
| Ablaufdatum | **date** | Native Datumsauswahl, gespeichert als `YYYY-MM-DD`. Bestehende Freitext-Altwerte bleiben sichtbar/editierbar (gelb markiertes Fallback-Feld) |
| Lizenzgeber / Vertragspartner | text | Über wen läuft Lizenz/Vertrag (Hersteller direkt, Reseller, Rahmenvertrag, Cloud Marketplace, IT-Dienstleister) — **nicht** zwingend der Software-Hersteller |

> **Begriffsklärung (Hersteller vs. Lizenzgeber):** Das Anwendungsfeld **„Hersteller / Software-Anbieter"** bezeichnet den Produkthersteller (z. B. Microsoft, SAP, Atlassian, Red Hat). Die Lizenztabellen-Spalte **„Lizenzgeber / Vertragspartner"** bezeichnet die Organisation, über die der Lizenz-/Vertrag läuft (Hersteller, Reseller, Rahmenvertragspartner, Marketplace oder Dienstleister). Beide Begriffe sind bewusst getrennt; die Keys (`hersteller`, `anbieter`) bleiben unverändert → Export/Import bleibt kompatibel.

---

## 3. Analysen & Dashboards

### Cloud-Readiness-Dashboard

**Aufruf:** Tab „Cloud-Readiness"

Automatische Bewertung aller cloud-relevanten Objekte (Anwendungen, Server, Clients, ICS, IoT).

| Anzeige | Beschreibung |
|---|---|
| **KPI-Kacheln** | Gesamtanzahl, Hoch/Mittel/Niedrig, Souveräne Cloud erforderlich, Ø Score |
| **6R-Verteilung** | Kreisdiagramm (Rehost / Replatform / Repurchase / Refactor / Retire / Retain) |
| **SEAL-Level** | Souveränitäts-Bewertung S0–S3 (S0=keine Anforderung, S3=Gaia-X/C5 + BYOK) |
| **FinOps-Szenarien** | Konservativ / Realistisch / Optimistisch mit Szenario-Vergleichstabelle |
| **Bewertungstabelle** | Score, Level, 6R, SEAL, Souveränitätsbedarf, Begründung je Objekt — **Zeilen anklickbar: öffnet direkt „Eintrag bearbeiten"** für das Objekt |

Scoring-Logik (0–100): ≥70 = Hoch · 45–69 = Mittel · <45 = Niedrig. `Unklar`-Werte sind neutral (kein Punktabzug) — sie markieren offene Fragen.

---

### Vollständigkeits-Cockpit

**Aufruf:** Gruppe „Projektsteuerung" → Tab „Fortschritt"

Gesamtfortschritts-Balken + Kategorie-Kacheln (Ampel-Farbe: Grün ≥80 % · Gelb 40–79 % · Rot <40 %).

Zeigt je Kategorie: Anzahl Einträge, Einträge mit `Unklar`-Feldern, Felder ohne Wert. Button „Zur Fragenliste →" springt direkt zur Interview-Fragenliste. Druckbar.

---

### Infrastruktur-Landkarte + Schnittstellen-Graph

**Aufruf:** Gruppe „Analyse & Strategie" → Tab „Infrastruktur-Landkarte"

Mermaid-basierte Graphen in mehreren Modi:
- **Kategorien-Übersicht:** alle Einträge und Relationen
- **Server → Anwendungen:** welche Apps laufen auf welchen Servern
- **Schnittstellen-Graph:** gerichteter App-zu-App-Graph, Kantenfarbe nach Verschlüsselung (rot = „Keine", grün = TLS/mTLS)

Mermaid läuft mit `securityLevel: 'strict'` — Node-Labels werden vor Einbau escaped.

---

### Schnittstellen-Matrix (n×n)

**Aufruf:** Gruppe „Analyse & Strategie" → Tab „Schnittstellen-Matrix"

Druckbare HTML-Tabelle: Zeilen = Quell-Anwendung, Spalten = Ziel-Anwendung, Zellen markiert wo eine Schnittstelle existiert (Protokoll-Kürzel, Tooltip mit Details). Kein Chart-Framework nötig. Optimal für Reviews mit dem Kunden.

---

### Security- & Governance-Architektur (LG 9)

Automatisch aus der Infrastruktur abgeleitete Empfehlungen (Pflicht/Empfohlen/Optional)
mit Status & Detailnotizen. Ergänzt um **strukturierte, bearbeitbare Governance-Themen**
(Paket 3):

- **Business Continuity Management (BCM)** und **Cloud-Exit-Strategie** als klickbare
  geführte Detailansichten (`GovernanceTopicDrawer`): Warum-wichtig, normative Einordnung
  (BSI 200-4 / NIS2 / ISO 22301 bzw. EU Data Act / DORA / C5), Soll-Inhalte
  (BCM: BIA, RTO/RPO, Backup/Restore, Notfallhandbuch, Krisenmanagement,
  Notfallübungen — Cloud-Exit: Exit-Szenarien, Datenportabilität, Kündigungsfristen,
  technische Abhängigkeiten, IAM/Schlüssel, IaC, Zielplattformen, Kosten/Risiken),
  Status/Reifegrad, **Nachweis- und Rollen-Verknüpfung** (zentral), Workshop-Fragen,
  nächste Schritte, Notizen. Persistenz als `GovernanceTopic` (domain `bcm` / `cloudExit`).

### Executive Summary + Spider-Chart

Überblick für Managementpräsentationen:

- Reifegradmodell in 6 Dimensionen (Strategie & Wirtschaftlichkeit, Personal & Kompetenz, Governance & Compliance, Plattform & Infrastruktur, Sicherheit, Betrieb)
- SVG-Spider-Chart (kein Chart-Framework), 5 Stufen
- Benchmark-Linie (statisch, branchentypisch Mittelstand 2026)
- Jede Dimension anklickbar → Erklärung mit Ableitung aus Projektdaten
- Druckbar über Print-Button

---

### AfA / TCO-Übersicht

- Lineare AfA-Berechnung: Buchwert, Restwert, Restlaufzeit je Objekt
- Druckbare Asset-/AfA-Tabelle über alle Hardware-Kategorien
- TCO-Modul mit Szenario-Vergleich (Konservativ / Realistisch / Optimistisch)
- AI/GenAI-Kostenblock (Token-/Inferenzkosten als eigene Position)
- „Aus Objektdaten übernehmen" — non-destruktive Übernahme der Ist-Kosten

---

### NIS2-Compliance-Check

5-Schritt-Stepper (Sektor → Größe → KRITIS → Einstufung → Gap-Analyse):

- Automatische Einstufung: Besonders wichtig / Wichtig / Nicht betroffen
- Gap-Analyse: 10 Mindestmaßnahmen nach Art. 21 NIS2 / §30 BSIG
- **Geführte Detailansicht je Maßnahme** (klickbar, einzelnes Panel — kein Schritt-für-Schritt-Wizard): Warum-wichtig, normative
  Einordnung, „was muss vorhanden sein", Hinweis auf nutzbare App-Daten, Ist-Zustand
  (Status + Reifegrad 0–4), **Nachweise** (Verknüpfung zentraler Evidence-Items mit
  passenden Vorschlägen + interne/externe URL + Dateiverweis), **verantwortliche Rolle**
  (aus Rollenübersicht, mit Vorschlag), Workshop-Fragen, empfohlene nächste Schritte,
  Fälligkeit/Follow-up, Notizen. Daten in `nis2Assessment.massnahmenDetail` (additiv).
- Ampel-Zusammenfassung + Druckbericht (Status + Reifegrad + Verantwortlich + Nachweise
  + Follow-up je Maßnahme) mit Datum und Kundenname

---

### EU AI Act Inventar

- Shadow-AI-Heuristik: erkennt wahrscheinliche KI-Systeme anhand von Schlüsselwörtern in Anwendungsfeldern
- KI-System-Klassifizierung inline in der Tabelle (Verboten / Hoch / Begrenzt / Minimal)
- **Klickbarer Klärungs-Wizard je KI-System / Shadow-AI-Kandidat** (Paket 7): geführter
  7-Schritt-Drawer — Warum als KI-relevant erkannt (Shadow-AI-Treffer), Einstufung +
  Rolle der Organisation (Anbieter/Betreiber/**Importeur/Händler/Nutzer**/Beides),
  Zweck, Datenarten, Personenbezug, Trainingsdaten, menschliche Aufsicht, Logging,
  technische Dokumentation, Modell-/Anbieterinfo, Drittanbieter, **Betriebsort/
  Cloud-Service und Hersteller über die vorhandenen Anwendungsfelder** (keine
  Doppelerfassung), **Evidence-Verknüpfung**, offene Fragen, nächster Klärungsschritt.
- **Klärungsbedarf sichtbar:** Badge „N offen" zählt unklare/leere Schlüsselfelder je
  KI-System (fehlende Informationen als Aufgaben).
- CSV-Register-Export (EU AI Act Pflichtfelder); vollständige Daten im JSON-Backup.

---

### DORA IKT-Register

- Erfassung von IKT-Drittdienstleistern (Anbieter, Leistung, Kritikalität, Substituierbarkeit, Sitzland, Exit-Strategie)
- Verknüpfbar mit Anwendungen und Servern
- „Aus Anwendungsdaten ableiten" — liest vorhandene `lizenzAnbieter`-Werte aus
- CSV-Export im Format des BaFin-Informationsregisters

---

### EnEfG / CO₂ Nachhaltigkeitsmodul (transparent & drill-down, Paket 10)

- **Server-Drilldown:** anklickbare Server-Energiebilanz mit Leistung (Quelle:
  gemessen / aus max. Leistungsaufnahme / Default), Betriebsstunden, PUE, Strommix,
  berechnetem Energieverbrauch und CO₂ je Server. Klick auf eine Zeile blendet den
  **kompletten Rechenweg** ein (`src/sustainability.ts: berechneEnergieDetail`).
- **Editierbare Annahmen** (persistiert in `state.nachhaltigkeitAnnahmen`): PUE On-Prem,
  PUE Cloud, Betriebsstunden/Jahr, Strommix-Faktor On-Prem/Cloud, Auslastung,
  Default-Leistung je Server — mit „Auf Richtwerte zurücksetzen".
- **Berechnungsformeln sichtbar** (IT-Energie → ×PUE → ×Strommix; Cloud = IT-Energie×PUE Cloud).
- **CO₂-Einsparung Cloud — Detailrechnung:** On-Prem-Baseline, Cloud-Szenario, Differenz/%
  + ausgewiesene **Unsicherheit/Annahme** (±30 %, „Schätzung, keine Messung").
- Nutzt echte Server-Leistungsdaten (`stromverbrauch`, `leistungsaufnahmeMax`, `anzahl`);
  EnEfG-Pflicht-Banner; Maßnahmen mit Einsparpotenzial.
- **Druck-/Export** enthält Annahmen, Formeln, Server-Tabelle und Summen; vollständig im
  JSON-Backup (`nachhaltigkeitAnnahmen`).

---

### SAM-Analyse (Software Asset Management)

- Soll-/Ist-Abgleich: lizenzierte vs. eingesetzte Instanzen
- Audit-Risiko-Ampel (Microsoft / Oracle / SAP / Adobe = hohes Risiko)
- True-Up-Schätzung: Delta × durchschnittlicher Lizenzpreis

---

### Snapshot-Versionierung + Delta-Vergleich

- Snapshots mit Datum-Stempel und frei wählbarem Label
- Delta-Ansicht zwischen zwei Snapshots: neu (grün) / geändert (gelb) / entfernt (rot)
- Einzelexport eines Snapshots als JSON (Archiv)
- Maximum 10 Snapshots (älteste werden mit Warnung gelöscht)

---

### Souveränitätsbewertung (SEAL-Level)

- S0: keine Souveränitätsanforderung
- S1: EU-Jurisdiktion erforderlich
- S2: EU-Jurisdiktion + eigene Schlüssel (BYOK/HYOK)
- S3: S2 + Gaia-X-Zertifizierung / C5-Testat

Sichtbar im Cloud-Dashboard (KPI-Karte, Filter) und in der Zielbild-Ansicht.

### Cloud-Souveränität & Compliance (Gruppe „Compliance & Regulatorik")

Vertieft das einzelne SEAL-Level zu einem mehrdimensionalen Souveränitäts-Block
(`src/compliance/souveraenitaet.ts`, `nachweise.ts`, `quellen.ts`):

- **Mehrdimensionale Souveränitäts-Scorecard** (Tab „Cloud-Souveränität"): sechs
  getrennte Scores (Datenschutz, Cybersicherheit, Operative Resilienz,
  Souveränität/Lock-in, KI-Governance, Supply-Chain-Transparenz) als Spider-Chart
  + Dimensions-Karten. Heuristisch aus vorhandenen Daten abgeleitet; fehlende
  Daten → neutral statt Punktabzug.
- **Dimensionen als klickbare Detailansichten** (Paket 6): Jede Kachel öffnet
  einen geführten Drawer (`GovernanceTopicDrawer`, wiederverwendbar): Warum-wichtig,
  normative Einordnung, **welche Daten den Score beeinflussen** (live aus der
  Bewertung), fehlende Infos, score-verbessernde Entscheidungen, erforderliche
  **Nachweise** (Verknüpfung zentraler Evidence-Items), **beteiligte Rollen**
  (aus Rollenübersicht), Workshop-Fragen, nächste Schritte sowie erfassbarer
  Status/Reifegrad/Notizen. Persistenz als `GovernanceTopic` (domain
  `cloudSovereignty`, key = Dimension) im zentralen Modell — keine Doppelerfassung.
- **Souveränitäts-Risiko-Matrix** (`souveraenitaetsRisikoMatrix`): deterministische
  4×3-Heatmap **Bedarf × Exposition** — Zeilen = Souveränitätsbedarf (SEAL S0–S3 aus
  `assessSovereignty`), Spalten = Ist-Risiko (Jurisdiktion, Schlüsselhoheit,
  Portabilität, Bereitstellung, Gaia-X). Kritikalität = Bedarf × Exposition (nur hoher
  Bedarf + hohe Exposition = kritisch). Klickbare Zellen mit Objekt-Drilldown
  (Risiko-Treiber je Objekt), Kennzahlen „kritisch / Handlungsbedarf / ohne Cloud-Daten".
  Leitet sich vollständig aus vorhandenen Cloud-Feldern ab (kein neues Erfassen).
  Drilldown-Objekte und die **SEAL-Tabelle pro Objekt sind anklickbar → öffnet
  direkt „Eintrag bearbeiten"**. Der Tab hat einen **Drucken/PDF-Export** inkl.
  Scorecard, Risiko-Matrix und SEAL-Tabelle.
- **Souveränitäts-Washing-Check**: deterministische Regel-Engine (DSGVO, BSI C5,
  EU AI Act, Data Act …) mit Verdikt-Tabelle (fail/warn/pass/unklar), Filter und
  benötigtem Nachweis je Befund.
- **Evidence-/Nachweis-Katalog** (Tab „Evidence-Katalog"): interaktive, zentrale
  Nachweisverwaltung auf Basis des Querschnittsmodells (`state.evidenceItems`,
  s. `docs/GOVERNANCE_MODEL.md`). Jeder Nachweis ist ein **bearbeitbares Objekt**:
  Titel, Warum-wichtig, Norm-/Themenbezug-Tags (DSGVO/NIS2/BSI/C5/DORA/AI Act/…),
  normative Referenzen, benötigte Infos, Beispiel-Nachweise, typische Quelle,
  Status (Offen/Angefragt/Erhalten/Geprüft/Nicht anwendbar), verantwortliche **Rolle**
  (aus Rollenübersicht), Link/Datei/Review-/Gültigkeitsdatum, Notizen.
  **n:m-Beziehungen:** ein Nachweis (z. B. AVV) lässt sich mehreren Themen,
  Governance-Themen und Objekten (Anwendungen/Server/Provider) zuordnen — keine
  Doppel­erfassung. Seed „Aus Standardkatalog erzeugen" (~20 Einträge AVV, SCC, TIA,
  C5, AIC4, ISO 42001, Exit-Plan, SBOM …) **migriert vorhandenen Alt-Status**
  (`nachweisStatus`) non-destruktiv. „Offene als E-Mail" + druckbares Evidence-Mapping;
  vollständig im JSON-Backup enthalten.
- **Quellen-Bibliothek + Regulatorik-Zeitstrahl** (Tab „Quellen-Bibliothek"):
  ~35 kuratierte Offline-Quellen über 5 Ebenen, Filter nach Ebene/Status,
  klickbare offizielle URLs (ISO nur Metadaten) + status-bewusster Zeitstrahl.

### ISMS-/BCM-Rollen & Verantwortlichkeiten (Tab „ISMS-/BCM-Rollen")

Strukturierte Rollenübersicht als Grundlage für IT-Grundschutz-/ISO-27001-Zertifizierungs-
fähigkeit und NIS2. Nutzt das zentrale Rollenmodell (`AppState.roleAssignments`,
s. `docs/GOVERNANCE_MODEL.md`).

- **Seed-Katalog mit 20 Rollen** (`ROLE_CATALOG`): Geschäftsleitung, ISB, IT-SiBe,
  ISMS-Team, Asset Owner, Prozess-/IT-Betriebsverantwortliche, DSB, Risikomanagement,
  BCM-Beauftragte:r, Krisenstabsleitung/-mitglieder, Krisenkommunikation,
  Incident-Response/CSIRT, Cloud-Service-Owner, Cloud-Governance, Lieferanten-Management,
  Compliance/Audit, IAM, Kryptographie. Anlegen per Klick (idempotent — fehlende ergänzen).
- **Relevanz-Klassifizierung** je Rolle (ISMS / BCM-Krise / NIS2 / Cloud-Governance /
  Datenschutz / Empfohlen) statt „formal vorgeschrieben" — mit Filter.
- **Eingabemaske je Rolle** (Detail-Drawer): benannte Person, Stellvertretung,
  Organisationseinheit, Kontakt, Verantwortung, Status (Offen/Benannt/Vertretung
  offen/Vollständig/N/A), Bestellungsdokument-Verweis, Notizen; normative Einordnung
  (BSI 200-2/200-4, NIS2/BSIG, ISO 27001) eingeblendet.
- **Fortschritt:** x von y Rollen erfasst / benannt / mit Stellvertretung / mit Nachweis.
- **Eigene Rollen** ergänzbar; Rollen werden im JSON-Export mitgeführt und sind von
  NIS2-/Evidence-/Governance-Themen referenzierbar (zentrale Rollenobjekte, keine
  doppelten Verantwortlichkeitsfelder).

---

## 4. Import / Export

### Excel-Import

**Aufruf:** Button „Import" im Header (`.xlsx` oder `.xls`)

1. **Analyse:** Spaltennamen werden gegen alle Felder aller 14 Kategorien geprüft
2. **Fuzzy-Mapping:** `feldAliase.ts` enthält 60+ Felder mit je 3–5 deutschen und englischen Aliasen (200+ Aliase gesamt) — erkennt z. B. „Hostname", „Servername", „Server Name" alle als `name`
3. **Konfidenz-Anzeige:** Grün ≥50 % · Gelb ≥25 % · Rot <25 %
4. **Manuelles Mapping:** Zuordnung je Blatt über Dropdown korrigierbar
5. **Fehler-Recovery:** Nach dem Import: Validierungstabelle mit fehlgeschlagenen Zeilen (Feld, Problem), valide Zeilen werden trotzdem importiert, Fehler-Zeilen als CSV downloadbar
6. **Merge-Strategie:** Gleiche Kürzel → Update, neue Kürzel → hinzufügen

---

### Excel-Export

**Aufruf:** Button „Excel Export" (grün)

Alle 14 Kategorien als separate Tabellenblätter + Übersichtsblatt. Neue Felder erscheinen automatisch (deklarative Engine).

---

### Workshop-Export

**Aufruf:** Button „Workshop-Export" (türkis)

Erweitertes XLSX-Paket:

| Tabellenblatt | Inhalt |
|---|---|
| Übersicht | Kundendaten, Kategorien-Zusammenfassung |
| Cloud-Strategie | Ziel, Treiber, Zielumgebung, Zeithorizont |
| Cloud-Readiness | Score, Level, 6R, SEAL je Objekt |
| Readiness-Summary | KPIs, Verteilung, 6R-Disposition |
| Unterlagen | Erfasste Quelldokumente mit Status |
| + alle 14 Kategorien | Vollständige Strukturanalyse-Daten |

---

### JSON-Backup & Re-Import

**Aufruf:** Button „JSON-Backup" (indigo)

Vollständige, versionierte Sicherungsdatei:
```
IT-Strukturanalyse-Backup_<Kunde>_<Datum>.json
```

Format mit `version`, `exportDate`, `customerName` und vollständigem `state`. Re-Import: Button „Import" → `.json`-Datei auswählen — Format wird automatisch erkannt.

> Der Import überschreibt den aktuellen Zustand vollständig. Vorher eigenes Backup anlegen.

---

### HTML Consultant-Bericht

**Aufruf:** Button „Bericht (HTML)" (violett)

Selbst-enthaltener, druckbarer HTML-Report:
- Deckblatt mit HiSolutions-Branding
- KPI-Kacheln, 6R-Disposition
- Cloud-Readiness-Tabelle (farbkodiert)
- Alle Einträge je Kategorie
- Objekt-Notizen je Objekt
- `Strg+P` → „Als PDF speichern"

---

### Druckbare Spezialansichten

| Ansicht | Aufruf |
|---|---|
| **AfA-/Asset-Übersicht** | Button in TCO-Modul |
| **Schnittstellen-Matrix** | Button in Schnittstellen-Matrix-Tab |
| **NIS2-Bericht** | Button in NIS2-Check |
| **CO₂/EnEfG-Kennzahlen** | Button in Nachhaltigkeitsmodul |
| **EU AI Act Register** | CSV-Export in EuAiActInventar |

Alle Druckausgaben nutzen die zentrale `printHtml()`-Utility mit eingebautem XSS-Escaping und einheitlichem HiSolutions-Header/Fußzeile.

---

## 5. Datenpersistenz & Sicherheit

### Dual-Layer-Persistenz

| Schicht | Technologie | Zweck |
|---|---|---|
| **Primär** | IndexedDB (`it-sa-db`) | Robuster Hauptspeicher, kein 5-MB-Limit, resistent gegen Browser-Bereinigung |
| **Cache** | localStorage | Schneller synchroner Lesecache für initialen App-Start |

`loadState()` ist synchron (aus localStorage). `loadStateFromIDB()` wird beim App-Start aufgerufen und gewinnt, wenn IndexedDB einen neueren Stand enthält (`lastUpdated`-Vergleich) → Recovery-Banner im UI.

### Auto-Save & Statusanzeige

- Jede Zustandsänderung → sofortiges asynchrones Schreiben in beide Schichten
- Header zeigt: „Speichern…" (Spinner) → „✓ Gespeichert" → „⚠ Speicherfehler"
- `beforeunload`-Warnung wenn ein Speichervorgang noch läuft

### Optionale At-Rest-Verschlüsselung

- AES-256/GCM + PBKDF2 (310.000 Iterationen), implementiert via Web Crypto API
- Opt-in: Passwort bei Ersteinrichtung festlegen
- Entsperr-Screen beim App-Start wenn Verschlüsselung aktiv
- JSON-Export bleibt im Klartext (nur Browserspeicher ist verschlüsselt)

### Snapshot-Versionierung

Snapshots werden in separatem localStorage-Key `it-sa-snapshots` gespeichert (nicht im Haupt-AppState). Delta-Vergleich auf Kategorieebene (hinzugefügt / geändert / entfernt).

### Daten vollständig löschen

„Alle Daten löschen" entfernt:
- Alle `it-strukturanalyse*` localStorage-Keys
- Den IndexedDB-Store `it-sa-db`
- Den KI-Konfigurations-Key

---

## 6. Tastaturkürzel & Tipps

| Kürzel | Funktion |
|---|---|
| `Ctrl+K` | Globale Suche öffnen |
| `↑` / `↓` | Navigation in Suchergebnissen |
| `Enter` | Suchergebnis öffnen |
| `Escape` | Suche / Modal schließen |

**Tipps:**
- Alle Felder mit Wert `Unklar` werden im Vollständigkeits-Cockpit als offene Punkte geführt
- Objekt-Notizen eignen sich als Workshop-Protokoll-Ersatz (Timestamp + Autor)
- Der JSON-Backup enthält alle Daten — regelmäßig exportieren, besonders vor Gerätewechsel
- Der Workshop-Export enthält alles für den Kunden-Workshop in einer Datei

---

## 7. BSI-Kontexthilfe & E-Mail-Vorlage

### BSI-Kontexthilfe

Jede Kategorie hat eine eingebaute Hilfe im Wizard (rechte Seitenleiste):

| Abschnitt | Inhalt |
|---|---|
| Einleitung | Was ist diese Kategorie im BSI-Sinne? |
| Warum (BSI) | Welche BSI-Anforderung steckt dahinter? |
| Warum (Cloud) | Relevanz für Cloud-Readiness |
| Interview-Fragen | Konkrete Fragen für das Kundengespräch |
| Ansprechpartner-Tipps | Wer hat die richtigen Informationen? |

### E-Mail-Vorlage (Dokumentenanforderung)

**Aufruf:** Button „E-Mail-Vorlage" im Einstiegsschritt

Professionelle deutsche E-Mail mit Kundennamen, neun Dokumentenkategorien und HiSolutions-Stil. „In Zwischenablage kopieren" → direkt in E-Mail-Client einfügen.

---

## 8. Deinstallation

**Vor der Deinstallation Daten sichern** (JSON-Backup-Button im Header).

### Linux / macOS / WSL
```bash
cd InfoCollectorforInfrastrukturAnalyse_ITM
./uninstall.sh
```

### Windows (PowerShell)
```powershell
cd InfoCollectorforInfrastrukturAnalyse_ITM
powershell -ExecutionPolicy Bypass -File .\uninstall.ps1
```

Das Skript:
1. Erinnert an Datensicherung (Bestätigung erforderlich)
2. Stoppt Node.js-Prozess (`app.pid`) und Docker-Container/Image
3. Löscht optional den Projektordner (Standard: Nein)

> Browser-localStorage und IndexedDB gehören zum Browser und werden durch das Skript nicht berührt. Nach Deinstallation und Neuinstallation sind die Daten im Browser noch vorhanden, bis der Browser-Cache manuell geleert wird.

---

*HiSolutions AG · IT Strukturanalyse · Cloud-Readiness Suite · Stand 2026-06-22*
