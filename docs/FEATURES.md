# Feature-Dokumentation — IT Strukturanalyse · Cloud-Readiness Suite

Vollständige Beschreibung aller Funktionen der Applikation. Zielgruppe: Berater:innen der HiSolutions AG, die das Tool im Kundeneinsatz verwenden.

---

## Inhaltsverzeichnis

1. [Schritt-für-Schritt-Assistent (Wizard)](#1-schritt-für-schritt-assistent-wizard)
2. [Detailansicht](#2-detailansicht)
3. [Cloud-Readiness-Dashboard](#3-cloud-readiness-dashboard)
4. [Feldvorschläge (Combobox / Schnellauswahl)](#4-feldvorschläge-combobox--schnellauswahl)
5. [BSI-Kontexthilfe & Interview-Leitfaden](#5-bsi-kontexthilfe--interview-leitfaden)
6. [Wen kann ich fragen? — Ansprechpartner-Tipps](#6-wen-kann-ich-fragen--ansprechpartner-tipps)
7. [E-Mail-Vorlage (Dokumentenanforderung)](#7-e-mail-vorlage-dokumentenanforderung)
8. [Excel-Import mit Smart-Mapping](#8-excel-import-mit-smart-mapping)
9. [Excel-Export & Workshop-Paket](#9-excel-export--workshop-paket)
10. [JSON-Backup & Re-Import](#10-json-backup--re-import)
11. [Consultant-Bericht (HTML)](#11-consultant-bericht-html)
12. [Deinstallation](#12-deinstallation)

---

## 1. Schritt-für-Schritt-Assistent (Wizard)

**Aufruf:** Tab „Assistent" (Standard beim Start)

Der Wizard führt Berater:innen strukturiert durch die gesamte Aufnahme — von der Strategie-Rahmung bis zur Abschluss-Zusammenfassung:

| Schritt | Inhalt |
|---|---|
| **Begrüßung** | Projektname (Kundenname), Einstieg, E-Mail-Vorlage |
| **Cloud-Strategie-Rahmen** | Geschäftliches Ziel, Cloud-Treiber (Mehrfachwahl), Zielumgebung, Zeithorizont, Notizen |
| **Gelieferte Unterlagen** | Erfassung der vom Kunden bereitgestellten Dokumente (Name, Art, Datum, Auswertungsstatus) |
| **12 BSI-Kategorien** | Jeweils Datenaufnahme mit Kontexthilfe (BSI-Begründung, Interview-Fragen, Ansprechpartner-Tipps) |
| **Zusammenfassung** | Cloud-Readiness-Übersicht, Links zu Dashboard und Export |

> **Hinweis:** Alle Eingaben werden sofort in `localStorage` gespeichert — kein separater Speichern-Button nötig.

---

## 2. Detailansicht

**Aufruf:** Tab „Detailansicht"

Tabellarische Übersicht aller erfassten Einträge je BSI-Kategorie. Funktionen:

- **Neue Einträge anlegen** (Button „+ Neu")
- **Bestehende Einträge bearbeiten** (Stift-Icon)
- **Einträge löschen** (Mülleimer-Icon, mit Bestätigung)
- **Kürzel** (z. B. `GP-001`, `S-003`) werden automatisch generiert

Das Formular unterstützt folgende Feldtypen:
- Freitext mit Datalist-Vorschlägen (Combobox)
- Textarea mit Schnellauswahl-Buttons
- Einfach-Dropdown (Select)
- Mehrfach-Verknüpfung (MultiSelect, z. B. Anwendungen → Server)

---

## 3. Cloud-Readiness-Dashboard

**Aufruf:** Tab „Cloud-Readiness"

Automatische Bewertung aller cloud-relevanten Objekte (Anwendungen, Server, Clients, ICS-/IoT-Systeme):

| Anzeige | Beschreibung |
|---|---|
| **KPI-Kacheln** | Gesamtanzahl, Hoch/Mittel/Niedrig, Souveräne Cloud erforderlich, Ø Score |
| **6R-Verteilung** | Kreisdiagramm der empfohlenen Migrationsstrategien |
| **Bewertungstabelle** | Score, Level, 6R-Empfehlung, Souveränitätsbedarf, Begründung je Objekt |

**Scoring-Logik (0–100):**

| Level | Score | Bedeutung |
|---|---|---|
| Hoch | ≥ 70 | Cloud-fähig, direkte Migration empfohlen |
| Mittel | 45–69 | Bedingt geeignet, Modernisierung sinnvoll |
| Niedrig | < 45 | Erheblicher Aufwand — Retain/Retire prüfen |

Die Cloud-Readiness-Felder je Objekt (Bereitstellung, Schutzbedarf, Lizenzierbarkeit, Migrationskomplexität, Lebenszyklus, Internet-Fähigkeit, Datensouveränität) werden im Formular unter „Cloud-Readiness — Workshop-Vorbereitung" eingegeben.

> Die Empfehlungen sind heuristische Vorschläge zur Workshop-Vorbereitung und ersetzen keine detaillierte Migrationsanalyse.

---

## 4. Feldvorschläge (Combobox / Schnellauswahl)

Viele Felder bieten vorausgefüllte Fachbegriffe an, damit Berater:innen gängige Bezeichnungen schnell auswählen können. Eigene Eingaben sind immer möglich.

**Textfelder (Combobox):** Beim Tippen erscheinen passende Vorschläge aus einer Datalist-Liste (Browser-nativ). Beispiele:

| Kategorie | Feld | Beispiel-Vorschläge |
|---|---|---|
| Server | Plattform | Windows Server 2022, Ubuntu Server 22.04 LTS, VMware ESXi 8.0, Proxmox VE 8 |
| Netzkomponenten | Plattform | Cisco Catalyst, Fortinet FortiGate, Palo Alto, Check Point, pfSense |
| Netzverbindungen | Protokolle | HTTPS/TLS 1.3, VPN (IPSec/IKEv2), MPLS, SD-WAN, LDAP/LDAPS, Modbus TCP |
| Clients | Plattform | Windows 11 Pro, macOS 15, Ubuntu Desktop, iOS 18, Android 15, Zero Client |
| ICS-Systeme | Plattform | Siemens SIMATIC S7, Allen-Bradley/Rockwell, Beckhoff TwinCAT, AVEVA |
| IoT-Systeme | Plattform | Siemens IOT2040, KNX/EIB, Azure IoT Hub, AWS IoT Greengrass |

**Textarea-Felder (Schnellauswahl-Buttons):** Klick auf einen vorgeschlagenen Begriff befüllt das Feld — danach kann der Text frei erweitert werden. Beispiele: Schutzbedarfskategorie, Bereitstellungsform, Migrationskomplexität.

---

## 5. BSI-Kontexthilfe & Interview-Leitfaden

**Position:** Rechte Seitenleiste im Wizard bei jeder BSI-Kategorie

Jede Kategorie besitzt eine eingebaute Hilfe mit vier Abschnitten:

| Abschnitt | Inhalt |
|---|---|
| **Einleitung** | Was ist diese Kategorie im BSI-Sinne? |
| **Warum (BSI)** | Welche BSI-Anforderung steckt dahinter? |
| **Warum (Cloud)** | Warum ist das für die Cloud-Readiness relevant? |
| **Interview-Fragen** | Konkrete Fragen für das Gespräch mit dem Kunden |

---

## 6. Wen kann ich fragen? — Ansprechpartner-Tipps

**Position:** Im Hilfe-Panel jeder BSI-Kategorie (amber-farbiger Abschnitt)

Für jede Kategorie werden typische Ansprechpartner beim Kunden mit konkreten Gesprächstipps genannt. Beispiele:

- **Geschäftsprozesse** → Prozessverantwortliche, Fachbereichsleitung, QM-Beauftragter
- **Server** → IT-Infrastruktur-Team, Systemadministrator, Rechenzentrumsbetreiber
- **ICS-Systeme** → OT-Verantwortlicher, Anlagenbetreiber, Maschinenbauer / Lieferant
- **Gebäude** → Facility Management, Gebäudeverantwortlicher, Haustechnik

Diese Tipps helfen besonders bei Erstkontakt oder wenn unklar ist, wer im Unternehmen die richtigen Informationen hat.

---

## 7. E-Mail-Vorlage (Dokumentenanforderung)

**Aufruf:** Button „E-Mail-Vorlage" im Einstiegsschritt des Wizards

Erzeugt eine professionelle deutsche E-Mail an den Kunden mit der Bitte, Unterlagen vor dem Workshop bereitzustellen. Die Vorlage enthält:

- Personalisierung mit dem eingetragenen Kundennamen
- Neun konkrete Dokumentenkategorien (Netzpläne, Inventarlisten, Richtlinien usw.)
- Verweis auf vertrauliche Behandlung
- HiSolutions-Briefkopf-Stil

**Verwendung:** Vorlage anzeigen → „In Zwischenablage kopieren" → in E-Mail-Client einfügen.

---

## 8. Excel-Import mit Smart-Mapping

**Aufruf:** Button „Import" im Header (`.xlsx` oder `.xls`)

Der Import-Assistent erkennt automatisch, welche Tabellenblätter welchen BSI-Kategorien entsprechen:

1. **Analyse:** Die App prüft Spaltennamen gegen die Felder jeder Kategorie
2. **Konfidenz-Anzeige:** Jedes Blatt erhält ein Konfidenz-Badge (grün ≥ 50 %, gelb ≥ 25 %, rot < 25 %)
3. **Manuelles Mapping:** Über ein Dropdown kann die Zuordnung je Blatt korrigiert oder deaktiviert werden
4. **Merge-Strategie:** Bestehende Einträge mit gleichem Kürzel werden aktualisiert, neue werden hinzugefügt

**Geeignet für:** Bestehende Kundenlisten aus Vorab-Fragebögen, Export aus CMDB-Systemen, vorausgefüllte Vorlagen.

---

## 9. Excel-Export & Workshop-Paket

**Aufruf:** Buttons „Excel Export" und „Workshop-Export" im Header

### Excel Export (grün)
Alle 12 Kategorien als separate Tabellenblätter plus Übersichtsblatt. Geeignet für Weiterverarbeitung in Excel.

### Workshop-Export (türkis)
Erweitertes XLSX-Paket für den Cloud-Readiness-Workshop:

| Tabellenblatt | Inhalt |
|---|---|
| Übersicht | Kundendaten, Kategorien-Zusammenfassung |
| Cloud-Strategie | Geschäftliches Ziel, Treiber, Zielumgebung, Zeithorizont |
| Cloud-Readiness | Score, Level, 6R-Empfehlung, Souveränitätsbedarf je Objekt |
| Readiness-Summary | KPIs: Durchschnittsscore, Verteilung, 6R-Disposition |
| Unterlagen | Erfasste Quelldokumente mit Status |
| + alle 12 Kategorien | Vollständige Strukturanalyse-Daten |

---

## 10. JSON-Backup & Re-Import

**Aufruf:** Button „JSON-Backup" (indigo) im Header

### Backup exportieren

Erstellt eine vollständige, versionierte Sicherungsdatei aller erfassten Daten:

```
IT-Strukturanalyse-Backup_<Kunde>_<Datum>.json
```

Das JSON-Format ist stabil und selbstbeschreibend:

```json
{
  "version": "1.0",
  "exportDate": "2025-11-15T09:30:00.000Z",
  "customerName": "Muster GmbH",
  "state": { ... vollständiger AppState ... }
}
```

**Anwendungsfälle:**
- Regelmäßige Sicherung während laufender Projekte
- Übergabe zwischen Berater:innen oder Geräten
- Sicherung vor der Deinstallation
- Archivierung nach Projektabschluss

### Backup re-importieren

Dieselbe JSON-Datei kann auf einer beliebigen (Neu-)Installation wiederhergestellt werden:

**Aufruf:** Button „Import" im Header → `.json`-Datei auswählen

Die App erkennt das JSON-Format automatisch und stellt den vollständigen Zustand (alle Kategorien, Cloud-Strategie, Kundenname) wieder her.

> **Wichtig:** Der Import überschreibt den aktuellen Zustand vollständig. Vorher ggf. einen eigenen Backup anlegen.

---

## 11. Consultant-Bericht (HTML)

**Aufruf:** Button „Bericht (HTML)" (violett) im Header

Erzeugt einen druckbaren, selbst-enthaltenen HTML-Bericht für IT- und Security-Consultants:

```
IT-Strukturanalyse-Bericht_<Kunde>_<Datum>.html
```

### Inhalt des Berichts

| Abschnitt | Beschreibung |
|---|---|
| **Deckblatt** | Kundenname, Erstellungsdatum, HiSolutions-Branding |
| **Gesamtübersicht** | KPI-Kacheln (Gesamtanzahl, Hoch/Mittel/Niedrig) |
| **Kategorien-Tabelle** | Alle 12 BSI-Kategorien mit Anzahl Einträge |
| **6R-Disposition** | Welche Strategie wird wie oft empfohlen |
| **Cloud-Readiness-Tabelle** | Score, Level, 6R, Souveränitätsbedarf je Objekt (farbkodiert) |
| **Detailtabellen** | Alle Einträge je BSI-Kategorie mit allen Feldern |

### Drucken / PDF erstellen

1. HTML-Datei im Browser öffnen (Doppelklick)
2. `Strg+P` / `Cmd+P` → „Als PDF speichern"
3. Seitenumbrüche sind optimiert (CSS `@media print`, `page-break-before`)

### Unterschied zum Excel-Export

| | Excel-Export | Consultant-Bericht (HTML) |
|---|---|---|
| **Zielgruppe** | Analyst:innen, weitere Bearbeitung | Präsentation, Archivierung |
| **Format** | XLSX (Excel) | HTML → PDF |
| **Lesbarkeit** | Tabellenkalkulation | Dokumenten-Layout mit Branding |
| **Druckbar** | Begrenzt | Optimiert für Druck |
| **Re-importierbar** | Ja (mit Mapping) | Nein |

---

## 12. Deinstallation

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

### Was das Skript macht

Das Deinstallations-Skript führt drei interaktive Schritte aus:

**Schritt 1 — Datensicherung (Bestätigung erforderlich)**
Das Skript hält an und erinnert daran, Daten zu sichern, bevor alles gelöscht wird. Es listet die drei Exportmethoden auf (JSON-Backup, HTML-Bericht, Excel) und fragt nach Bestätigung.

**Schritt 2 — Prozesse & Docker bereinigen**
- Stoppt einen laufenden Node.js-Prozess (via `app.pid`)
- Stoppt und entfernt den Docker-Container `strukturanalyse`
- Entfernt das Docker-Image `hisolutions-strukturanalyse`

**Schritt 3 — Projektordner (optional)**
Fragt, ob der gesamte Projektordner gelöscht werden soll. Standardantwort: Nein.

> **Hinweis:** Browser-localStorage wird durch das Skript nicht berührt — dieser gehört zum Browser und nicht zur App-Installation. Nach einer Deinstallation und Neuinstallation sind die Daten im Browser noch vorhanden, bis der Browser-Cache geleert wird.

---

*HiSolutions AG · IT Strukturanalyse · Cloud-Readiness Suite*
