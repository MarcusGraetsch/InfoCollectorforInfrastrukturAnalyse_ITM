# Benutzerhandbuch — IT-Strukturanalyse-Tool

**Version:** Juni 2026 · **Hersteller:** HiSolutions AG

---

## 1. Über dieses Tool

### Was ist das Tool?

Das IT-Strukturanalyse-Tool ist eine browserbasierte Erfassungs- und Auswertungsplattform für IT-Berater. Es unterstützt die **strukturierte Inventarisierung von IT-Infrastruktur** — von Servern und Anwendungen bis hin zu Schnittstellen und Verträgen — und bietet fertige Auswertungen für BSI-Strukturanalysen, Cloud-Readiness-Assessments und Wirtschaftlichkeitsanalysen.

### Zielgruppe

- IT-Berater und IT-Auditoren bei Strukturanalysen nach BSI IT-Grundschutz
- Cloud-Strategie-Projekte (6R-Bewertung, SEAL-Level, FinOps)
- NIS2-Compliance-Checks und EU AI Act Inventarisierungen
- Jeder, der eine saubere IT-Bestandsaufnahme beim Kunden braucht — ohne externe Tools

### Technische Voraussetzungen

- **Browser:** Chrome, Firefox oder Edge (aktuell) — kein Internet erforderlich nach Installation
- **Kein Server, kein Login, keine Installation** — URL aufrufen, fertig
- **Deployment:** Wird als Docker-Container oder per `npx serve` bereitgestellt (Port 8080)

### Datensicherheit

Alle Daten bleiben **ausschließlich im Browser** des Nutzers. Es gibt keinen Server, der Daten empfängt oder speichert. Das Tool ist damit auch in Umgebungen ohne Internetzugang oder mit restriktiven Datenschutzvorgaben nutzbar. Optional kann der JSON-Export verschlüsselt gesichert werden (AES-256, passwortgeschützt).

---

## 2. Schnellstart (5-Minuten-Einstieg)

### Schritt 1: Tool öffnen

URL im Browser aufrufen (z.B. `http://localhost:8080`). Das Tool startet sofort — kein Login, keine Registrierung.

### Schritt 2: Neues Projekt beginnen

Beim ersten Start ist der Datenbestand leer. Entweder:
- **Assistenten starten** (empfohlen für Einsteiger): Schaltfläche „Wizard / Assistent" im Hauptmenü — der Assistent führt Schritt für Schritt durch die wichtigsten Kategorien.
- **Direkteingabe:** Links im Menü eine Kategorie wählen (z.B. „Anwendungen") und mit „Neuer Eintrag" beginnen.
- **Import:** Vorhandene Excel- oder JSON-Datei importieren (Menüpunkt „Import").

### Schritt 3: Erste Daten erfassen

Im Wizard werden die Kategorien in einer sinnvollen Reihenfolge abgefragt:
1. Standorte und Räume
2. Server und Clients
3. Anwendungen
4. Netzwerk und Sicherheit
5. Personal und Verantwortliche

Jeder Schritt zeigt ein Formular mit den relevanten Feldern. Unbekannte Werte einfach auf **„Unklar"** setzen — das Tool zeigt später, was noch aussteht.

### Wichtige Bedienkonzepte

| Konzept | Erklärung |
|---|---|
| **Kategorien** | Alle Objekte sind einer Kategorie zugeordnet (Anwendung, Server, Schnittstelle …). Jede Kategorie hat eigene Felder. |
| **Kürzel (Prefix)** | Jedes Objekt bekommt ein Kürzel (z.B. `APP-001`, `SRV-001`). Damit wird in Referenzen auf Objekte verwiesen. |
| **Unklar** | Bewusster Platzhalter für noch unbekannte Werte. Das Vollständigkeits-Cockpit zeigt alle offenen Punkte. |
| **Ctrl+K** | Globale Suche: Sofortiges Durchsuchen aller Objekte aller Kategorien. |
| **Wizard vs. Direkteingabe** | Wizard = geführt, Schritt für Schritt. Direkteingabe = freie Navigation per Kategorie-Menü. Beide Wege schreiben in denselben Datenbestand. |

---

## 3. Dateneingabe

### 3.1 Assistent (Wizard)

Der Wizard eignet sich für die **Ersterfassung** und für Berater, die das Tool noch nicht kennen. Er führt durch alle Kategorien in einer logischen Reihenfolge und stellt nur die wichtigsten Felder je Schritt dar.

**So starten Sie den Wizard:** Menüpunkt „Assistent" oder „Wizard starten" auf der Startseite.

Der Wizard kann jederzeit unterbrochen und später fortgesetzt werden — alle bis dahin eingegebenen Daten werden automatisch gespeichert.

### 3.2 Direkteingabe je Kategorie

Für erfahrene Nutzer oder wenn gezielt eine einzelne Kategorie gepflegt werden soll:

1. Kategorie im linken Menü wählen (z.B. „Server")
2. Übersichtstabelle zeigt alle vorhandenen Einträge
3. „Neuer Eintrag" für eine neue Zeile — oder bestehenden Eintrag anklicken zum Bearbeiten
4. Formular ausfüllen, Felder sind in Gruppen gegliedert:
   - **Basis**: Name, Kürzel, Typ, Schutzbedarf, Status
   - **Technik & Hardware**: Hersteller, Modell, CPU, RAM, Seriennummer etc.
   - **Wirtschaftlichkeit**: Anschaffung, Abschreibung, Vertragsdetails
   - **Cloud**: Cloud-Eignung, Bereitstellungsmodell, Migrationsstrategie (nur bei cloudrelevanten Kategorien)
5. Speichern — erfolgt automatisch bei jedem Tastendruck (kein manuelles Speichern nötig)

**Tipp:** Felder, die nicht zum gewählten Typ passen, werden automatisch ausgeblendet (z.B. Datenbankfelder nur bei Typ „Datenbank").

### 3.3 Import (Excel/JSON)

Wenn bereits Bestandsdaten in Excel oder einer anderen Quelle vorliegen:

**JSON-Import (Backup wiederherstellen):**
- Menüpunkt „Import" → „JSON-Datei laden"
- Lädt einen vollständigen früheren Datenstand wieder her
- Achtung: überschreibt den aktuellen Datenbestand (vorher sichern!)

**Excel-Import (Neue Daten aus Kundenlisten):**
1. Menüpunkt „Import" → „Excel-Datei importieren"
2. Datei auswählen (`.xlsx`, `.xls`)
3. Kategorie wählen, in die importiert werden soll
4. Spalten-Mapping prüfen: Das Tool erkennt Spaltenköpfe automatisch. Nicht erkannte Spalten können manuell zugewiesen werden.
5. Import starten — fehlerhafte Zeilen werden angezeigt und können als CSV heruntergeladen werden

**Empfehlung für Excel-Vorbereitung:** Spaltenköpfe möglichst genau nach den Feldbeschriftungen des Tools benennen (z.B. „Name", „Kürzel", „Typ", „Hersteller", „Modell"). Dann klappt das automatische Mapping zuverlässig.

### 3.4 Feld-Typen

| Typ | Anzeige | Hinweise |
|---|---|---|
| **Text** | Einzeiliges Eingabefeld | Oft mit Vorschlagsliste (Autocomplete) |
| **Textarea** | Mehrzeiliges Textfeld | Für Beschreibungen, Notizen, Firewall-Regeln |
| **Auswahl (Select)** | Dropdown-Menü | Enthält „Unklar" als explizite Option |
| **Zahl (Number)** | Eingabe mit Einheit | Z.B. „512 GB", „2 HE", „3.500 €" |
| **Datum (Date)** | Datumspicker | Format JJJJ-MM-TT, z.B. für Vertragsende |
| **URL** | Link-Feld | Zeigt klickbaren „Öffnen"-Link nach Eingabe |
| **Verknüpfung (Multiref)** | Auswahl aus anderen Objekten | Z.B. „Anwendungen auf diesem Server" |
| **Tabelle (Table)** | Wiederholbare Zeilen | Z.B. mehrere Netzwerk-Interfaces, Lizenzen |
| **Notizen** | Kommentar-Bereich | Zeitgestempelter Notizfeed pro Objekt |

### 3.5 Globale Suche (Ctrl+K)

Drücken Sie **Ctrl+K** (bzw. Cmd+K auf Mac) um die globale Suche zu öffnen. Sie durchsucht alle Objekte aller Kategorien gleichzeitig.

- Sucheingabe wirkt auf Name, Kürzel und alle Textfelder
- Ergebnisse zeigen Kategorie-Badge und direkten Bearbeitungslink
- Ideal für schnelles Auffinden eines bestimmten Systems, Anwendung oder Servers

---

## 4. Kategorien & Datenmodell

### Überblick

Das Tool kennt folgende Kategorien. Jede Kategorie hat ein eindeutiges Kürzel-Präfix:

| Kategorie | Präfix | Beschreibung |
|---|---|---|
| Anwendungen | APP | Geschäftsanwendungen, Software-Systeme |
| Server | SRV | Physische und virtuelle Server |
| Clients | CLT | Arbeitsplätze, Laptops, Thin Clients |
| Netzkomponenten | NET | Switches, Router, Access Points |
| Sicherheitskomponenten | SEC | Firewalls, IDS/IPS, VPN-Gateways |
| ICS/OT-Systeme | ICS | Industrie- und Steuerungssysteme |
| IoT-Systeme | IOT | Vernetzte Geräte, Sensoren |
| Datenträger | DT | NAS, SAN, Backup-Medien |
| Betriebssysteme | OS | Wiederverwendbare OS-Objekte (verknüpft mit Server/Client) |
| Schnittstellen | SS | Kommunikationsbeziehungen zwischen Anwendungen |
| Standorte | ST | Gebäude, Rechenzentren |
| Räume | RM | Serverräume, Büros |
| Personen | PER | Verantwortliche, Ansprechpartner |

### Anwendungen (APP)

Die zentrale Kategorie. Felder werden je nach **Typ** der Anwendung automatisch angepasst:

- **Datenbank:** DB-Modell, Replikation, HA-Setup, Backup-Strategie
- **Web-Applikation / Backend-Service:** Server-Software, TLS-Version, Reverse Proxy
- **ERP/CRM:** Module, Customizing-Grad, Anzahl Mandanten
- **Middleware/Integration:** Middleware-Typ, Protokolle, Anzahl Flows
- **Backup-Software:** RPO, RTO, 3-2-1-Regel
- **Virtualisierung/Hypervisor:** Produkt, Cluster-Knoten, VMs, Live-Migration
- **Monitoring/Security:** Kategorie (SIEM/EDR/…), Abdeckung, Log-Aufbewahrung

Alle Anwendungen haben zusätzlich: Hersteller, Produktname, Version, Update-Zyklus, Links zu Betriebshandbuch und Repository.

### Server und Clients

Enthalten neben Basis-Informationen:
- **Hardware-Details:** Hersteller, Modell, Seriennummer, Inventarnummer, CPU, RAM, Speicher, Formfaktor, Höheneinheiten, Stromverbrauch, Management-IP
- **Wirtschaftlichkeit:** Anschaffungsdatum/-preis, Abschreibungsdauer, Wartungsvertrag, Kosten, Support-Ende
- **Cloud-Felder:** Bereitstellungsmodell, Cloud-Eignung (6R), Internetfähigkeit, Migrationskomplexität

### Betriebssysteme (OS)

Betriebssysteme werden als **eigene wiederverwendbare Objekte** geführt — nicht nur als Textfeld am Server. Das ermöglicht:
- Mehrere Server nutzen dasselbe OS-Objekt
- Zentrale Pflege von OS-Version, Patchlevel, Support-Ende
- Ansicht „Server → OS → Anwendungen" in der Infrastruktur-Landkarte

### Schnittstellen (SS)

Für jede Kommunikationsbeziehung zwischen Anwendungen wird ein Schnittstellen-Objekt angelegt. Felder:
- Quell- und Ziel-Anwendung (Verknüpfung)
- Protokoll, Ports, Übertragungsart (synchron/asynchron/Batch)
- Frequenz, Datenfluss (was wird übertragen?)
- Verschlüsselung (TLS 1.3, mTLS, VPN, keine)
- Authentifizierung (OAuth2, API-Key, Zertifikat …)
- Firewall-Regeln / Freischaltungsanforderungen

Schnittstellen fließen automatisch in die **Schnittstellen-Matrix** und den **Schnittstellen-Graph** ein.

### Hardware-Felder (Mixin)

Die folgenden Felder stehen bei allen Hardware-Kategorien (Server, Clients, Netzkomponenten, ICS, IoT, Datenträger) zur Verfügung:

Hersteller · Modell · Seriennummer · Inventarnummer · CPU · RAM · Speicher · Formfaktor · Höheneinheiten · Stromverbrauch · Management-IP · Redundante Netzteile

Technische Details (CPU, RAM, Speicher, Strom) sind in einem einklappbaren Block „Technische Details" zusammengefasst, um das Formular übersichtlich zu halten.

### Wirtschaftlichkeits-Felder (Mixin)

Stehen bei allen Hardware-Kategorien und bei Anwendungen zur Verfügung:

Anschaffungsdatum · Anschaffungspreis (netto) · Abschreibungsdauer · Buchwert · Betriebskosten/Jahr · Wartungsvertrag · Wartungskosten/Jahr · Vertragsbeginn/-ende · Kündigungsfrist · Support-Ende (EoL/EoS) · Kostenstelle

Das Tool berechnet den **aktuellen Buchwert** automatisch (lineare Abschreibung) wenn Anschaffungsdatum, Anschaffungspreis und Abschreibungsdauer eingetragen sind.

---

## 5. Auswertungen & Berichte

### Cloud-Readiness-Dashboard

Aufgerufen über „Cloud-Dashboard" im Hauptmenü. Zeigt:

- **KPI-Kacheln:** Anzahl bewerteter Systeme, Durchschnitts-Score, Verteilung Hoch/Mittel/Niedrig
- **6R-Verteilung:** Wie viele Systeme auf welche Cloud-Strategie entfallen (Retain, Rehost, Replatform, Refactor, Retire, Replace)
- **SEAL-Level (S0–S3):** Datensouveränitäts-Bewertung
- **FinOps-Szenarien:** Kostenvergleich On-Premises vs. Cloud
- **Detailtabelle:** Alle Systeme mit Score, 6R-Empfehlung, Begründung

Der Cloud-Readiness-Score (0–100) ist heuristisch. Werte ≥70 = Hoch, 45–69 = Mittel, <45 = Niedrig. „Unklar"-Werte gehen neutral ein — sie werden im Dashboard als offene Punkte markiert.

Fehlende Cloud-Felder können über den **Cloud-Readiness-Wizard** nacherfasst werden (Modal, iterativ über alle unvollständigen Einträge).

### Vollständigkeits-Cockpit

Zeigt den Erfassungsstand aller Kategorien:

- Ampel-Status je Kategorie: Grün (vollständig) / Gelb (teilweise) / Rot (leer oder viele Unklar-Werte)
- Prozentualer Vollständigkeitswert je Kategorie
- Liste aller Felder mit Wert „Unklar" — gruppiert nach Kategorie

Nützlich um vor einem Workshop zu wissen, was noch offen ist, und um nach dem Workshop zu prüfen, was geklärt wurde.

### Schnittstellen-Matrix

Druckbare **n×n-Matrix** aller Anwendungen: Zeilen = Quell-Anwendung, Spalten = Ziel-Anwendung. Zellen zeigen Protokoll-Kürzel wo eine Schnittstelle existiert. Über „Drucken" direkt als Bericht nutzbar — ohne externe Tools.

### Infrastruktur-Landkarte

Visualisierung der IT-Landschaft als Graph. Mehrere Ansichtsmodi:

| Modus | Zeigt |
|---|---|
| Kategorien-Übersicht | Alle Kategorien und ihre Mengen |
| Server → Anwendungen | Welche Anwendungen laufen auf welchem Server |
| Systemstapel | Server → Betriebssystem → Anwendungen |
| Netzwerktopologie | Netzkomponenten und ihre Verbindungen |
| Schnittstellen-Graph | Gerichteter App-zu-App-Graph (Kantenfarbe nach Verschlüsselung) |

Im Schnittstellen-Graph bedeutet: **Rot** = keine Verschlüsselung, **Grün** = TLS/mTLS.

### AfA / TCO-Übersicht

Im TCO-Modul (Menü „Wirtschaftlichkeit" / „TCO"):

- **Druckbare Asset-Übersicht:** Alle Objekte mit Anschaffungswert, Buchwert, Restlaufzeit
- **AfA-Tabelle:** Abschreibungsverlauf pro Asset
- **„Aus Objektdaten übernehmen":** Summiert Einzel-OPEX aus allen Objekten automatisch in das TCO-Modul (non-destruktiv — überschreibt keine manuellen Eingaben)
- **FinOps-Szenarien:** Kostenvergleiche zwischen Betriebsmodellen

### NIS2-Check

Fünfstufiger Wizard:
1. Governance & Verantwortlichkeiten
2. Risikomanagement
3. Incident Response
4. Business Continuity
5. Supply Chain Security

Ergebnis: Compliance-Ampel pro Bereich + Lückenliste als Grundlage für einen Maßnahmenplan.

### EU AI Act Inventar

Erfassung aller KI-Systeme im Unternehmen mit Risikoeinstufung (verboten / Hochrisiko / begrenzt / minimal) nach EU AI Act Kategorisierung.

### Reifegradmodell / Executive Summary

Übergreifende Bewertung der IT-Reife mit Spider-Chart-Darstellung. Kann direkt als Präsentationsfolie oder für den Abschlussbericht exportiert werden.

---

## 6. Datensicherung & Export

### Automatische Speicherung

Das Tool speichert **automatisch bei jeder Eingabe** — es gibt keinen „Speichern"-Button. Der Speicherstatus ist oben rechts im Header sichtbar:

| Anzeige | Bedeutung |
|---|---|
| Spinner „Speichern…" | Speichervorgang läuft |
| „✓ Gespeichert" | Alles sicher gespeichert |
| „⚠ Speicherfehler" | Fehler — Browser-Speicher möglicherweise voll |

Das Tool nutzt zwei Speicherschichten:
- **localStorage:** Schneller Lesecache für den App-Start
- **IndexedDB:** Primärer Speicher (robuster, kein 5 MB-Limit, widerstandsfähiger gegen Browser-Bereinigung)

Falls IndexedDB neuere Daten enthält als localStorage (z.B. nach unerwarteter Browser-Schließung), erscheint ein **Recovery-Banner** beim nächsten Start.

**Wichtig:** Der Browser warnt beim Schließen des Tabs, wenn noch ein Speichervorgang läuft.

### JSON-Export (vollständiger Backup)

Menü → „Export" → „JSON exportieren"

- Exportiert den vollständigen Datenbestand als JSON-Datei
- Kann jederzeit wieder importiert werden (vollständige Wiederherstellung)
- **Empfehlung:** Nach jeder wichtigen Projektsitzung exportieren und lokal sichern
- Dateiname enthält Datum/Zeit-Stempel

**Verschlüsselter Export:** Optional kann der JSON-Export mit AES-256 und einem Passwort verschlüsselt werden — für sensible Kundendaten.

### Excel-Export

Menü → „Export" → „Excel exportieren"

Exportiert alle Kategorien als separate Tabellenblätter in einer `.xlsx`-Datei. Neue Felder erscheinen automatisch als Spalten — kein manuelles Anpassen nötig. Geeignet für:
- Übergabe an den Kunden
- Weiterverarbeitung in anderen Tools
- Basis für Berichte

### Versionierung / Snapshots

Über „Snapshots" kann der aktuelle Datenstand mit Datum und einem frei wählbaren Namen gesichert werden (z.B. „Workshop 2026-06-22").

- Snapshots werden im Browser gespeichert (kein Download nötig)
- **Delta-Ansicht:** Vergleich zweier Snapshots zeigt, was sich geändert hat (neu / geändert / entfernt)
- Nützlich für Audit-Follow-ups und Projektfortschritt-Dokumentation

---

## 7. Tastenkürzel & Tipps

### Tastenkürzel

| Kürzel | Funktion |
|---|---|
| **Ctrl+K** | Globale Suche öffnen |
| **Esc** | Modal / Overlay schließen |
| **Tab** | Nächstes Formularfeld |
| **Shift+Tab** | Vorheriges Formularfeld |

### Tipps für den Beratungsalltag

**„Unklar" strategisch nutzen:** Beim ersten Termin ist vieles unbekannt. Lieber „Unklar" setzen als leer lassen — so zeigt das Vollständigkeits-Cockpit genau, was noch aussteht, und Sie haben eine fertige Agenda für den nächsten Workshop.

**Notizen je Objekt:** Jedes Objekt hat einen Notiz-Bereich. Nutzen Sie ihn für Protokollvermerke direkt am Objekt: „Laut Hr. Müller läuft hier noch ein Legacy-Prozess, der bis Q3 abgelöst wird." Das ist schneller als ein separates Protokoll-Dokument.

**Schnittstellen früh erfassen:** Schnittstellen zwischen Anwendungen sind oft der aufwendigste Teil einer Strukturanalyse. Schon bei der Anwendungserfassung kurz fragen „Mit welchen anderen Systemen kommuniziert diese Anwendung?" und Schnittstellen sofort anlegen — das spart einen eigenen Schnittstellen-Workshop.

**Snapshot vor dem Workshop:** Erstellen Sie einen Snapshot bevor Sie mit dem Kunden in eine Klärungssitzung gehen. Danach können Sie per Delta-Ansicht genau zeigen, was in der Sitzung erarbeitet wurde.

**Druck-Workflows:** Alle Matrizen und Übersichten sind für den Browser-Druck optimiert (Strg+P). Die Schnittstellen-Matrix und die AfA-Tabelle lassen sich direkt aus dem Browser drucken oder als PDF speichern.

**Backup-Rhythmus:** Exportieren Sie den JSON-Backup am Ende jedes Projekttags und speichern Sie ihn lokal (z.B. im Projektordner auf SharePoint oder Teams). Der Browser-Speicher ist zuverlässig, aber kein Ersatz für eine externe Sicherung.
