# Berater-Workflows — IT-Strukturanalyse-Tool

Konkrete Schritt-für-Schritt-Anleitungen für die häufigsten Beratungsszenarien.

---

## Workflow 1: BSI-IT-Strukturanalyse (Erstaufnahme)

**Zeitbedarf:** 2–4 Stunden (je nach Kundengröße)  
**Ergebnis:** Vollständige IT-Inventarliste mit Schutzbedarf, exportierbar als Excel und JSON

### Vorbereitung

1. Browser öffnen, Tool-URL aufrufen
2. Falls Daten aus einem früheren Projekt vorliegen: „Import" → JSON-Datei laden
3. Falls frische Erfassung: Sicherstellen, dass der Datenbestand leer ist (oder neues Profil anlegen)
4. Snapshot erstellen: „Snapshots" → „Jetzt sichern" → Name „Projektstart [Kundenname] [Datum]"

### Schritt 1: Standorte und Räume

Kategorie „Standorte" → alle Unternehmensstandorte anlegen (Name, Adresse, Typ: Hauptstandort / Filiale / RZ).

Kategorie „Räume" → relevante Räume je Standort (Serverraum, RZ-Cage, …).

**Tipp:** Standorte werden später von Servern, Clients und anderen Geräten als Referenz genutzt. Jetzt anlegen spart Zeit.

### Schritt 2: Assistent starten

„Wizard / Assistent" aufrufen. Der Wizard führt durch:
- Server (physisch und virtuell)
- Clients (Arbeitsplätze, Laptops)
- Anwendungen
- Netzkomponenten
- Sicherheitskomponenten

Für jedes System mindestens ausfüllen: **Name, Kürzel, Typ, Bereitstellungsmodell, Schutzbedarf, Verantwortlicher**.

Unbekannte Werte → **„Unklar"** setzen, nicht leer lassen.

### Schritt 3: Schutzbedarf zuweisen

Bei Anwendungen ist der **Schutzbedarf** das wichtigste Feld für die BSI-Strukturanalyse:

| Stufe | Wählen wenn |
|---|---|
| Normal | Ausfall/Kompromittierung hätte begrenzte Auswirkungen |
| Hoch | Beeinträchtigung wichtiger Geschäftsprozesse |
| Sehr hoch | Existenzbedrohende Auswirkungen, personenbezogene Massendaten |

CIA-Triade (Vertraulichkeit / Integrität / Verfügbarkeit) kann optional separat bewertet werden.

**Hinweis:** Schutzbedarf-Vererbung von Anwendungen auf Server ist manuell — das Tool zeigt welche Anwendungen auf welchem Server laufen, aber berechnet den Server-Schutzbedarf nicht automatisch.

### Schritt 4: Fehlende Informationen markieren

Nach der Ersterfassung: alle noch unklaren Felder stehen auf „Unklar". Das ist gewollt.

„Vollständigkeits-Cockpit" aufrufen → zeigt:
- Ampelstatus je Kategorie
- Liste aller Einträge mit offenen Feldern
- Wie viele Einträge komplett sind

### Schritt 5: E-Mail-Vorlage für offene Punkte

„E-Mail-Vorlage" → generiert eine strukturierte Erstanfrage-E-Mail an den IT-Ansprechpartner beim Kunden, die alle offenen Punkte auflistet — gruppiert nach Thema.

Alternativ: Vollständigkeits-Cockpit → Export als Liste für Tagesordnungspunkt oder Workshop-Agenda.

### Schritt 6: Abschluss und Lieferables

- **Excel exportieren:** „Export" → „Excel" → Datei an Kunden oder ins Projektarchiv
- **JSON exportieren:** vollständiger Backup, Basis für Folgesitzungen
- **Snapshot erstellen:** „Snapshots" → „Jetzt sichern" → Name „Erstaufnahme [Datum] abgeschlossen"

---

## Workflow 2: Cloud-Readiness-Assessment

**Zeitbedarf:** 1–3 Stunden (setzt Workflow 1 voraus)  
**Ergebnis:** 6R-Strategie, SEAL-Level, FinOps-Szenarien, Executive Summary

### Voraussetzung

Alle Anwendungen und Server sind bereits erfasst (Workflow 1). Für Cloud-Readiness müssen zusätzlich Cloud-spezifische Felder ausgefüllt sein.

### Schritt 1: Cloud-Felder ergänzen

Für jede Anwendung und jeden Server folgende Felder prüfen/ergänzen:
- **Bereitstellungsmodell:** On-Premises (physisch) / On-Premises (virtualisiert) / Private Cloud / Public Cloud / Hybrid / SaaS
- **Internetfähigkeit:** Ja / Nein / Unklar
- **Migrationskomplexität:** Niedrig / Mittel / Hoch / Unklar
- **Lebenszyklus:** Aktiv / Auslaufend / Ersatz geplant / End of Life
- **Cloud-Eignung (6R):** Retain / Rehost / Replatform / Refactor / Retire / Replace

Schnellweg über den **Cloud-Readiness-Wizard:** „Cloud" → „Cloud-Felder nacherfassen" → führt automatisch durch alle Einträge, bei denen Cloud-Felder fehlen.

### Schritt 2: Cloud-Dashboard öffnen

„Cloud-Dashboard" aufrufen. Sofort sichtbar:
- Gesamtanzahl bewerteter Systeme und Cloud-Readiness-Score-Verteilung
- **6R-Verteilung:** Balkendiagramm (Retain / Rehost / …)
- Systeme mit den größten Blockadern für eine Cloud-Migration

**Score-Interpretation:** ≥70 = Hohe Cloud-Readiness, 45–69 = Mittel (mit Aufwand möglich), <45 = Niedrig (On-Premises bleibt zunächst sinnvoller)

### Schritt 3: SEAL-Level prüfen

SEAL = Datensouveränitätsstufen (S0–S3):
- **S0:** Unkritisch, alle Cloud-Modelle erlaubt
- **S1:** Öffentliche Cloud erlaubt, aber Verschlüsselung erforderlich
- **S2:** Nur europäische Anbieter / DSGVO-konforme Clouds
- **S3:** Nur On-Premises oder zertifizierte souveräne Cloud

SEAL-Bewertung gibt Leitplanken für die Cloud-Strategie vor.

### Schritt 4: FinOps-Szenarien berechnen

Im TCO-/FinOps-Modul: verschiedene Migrationsszenarien berechnen (z.B. „alle Rehost-Kandidaten in IaaS migrieren") mit Kostengegenüberstellung On-Premises vs. Cloud.

### Schritt 5: Executive Summary exportieren

„Berichte" → „Executive Summary" → enthält Spider-Chart, 6R-Zusammenfassung, SEAL-Level und Handlungsempfehlungen.

Geeignet als Präsentationsfolie für das Management-Briefing.

---

## Workflow 3: Schnittstellen-Aufnahme & Kommunikationsmatrix

**Zeitbedarf:** 1–2 Stunden  
**Ergebnis:** Druckbare Schnittstellen-Matrix, gerichteter Kommunikationsgraph

### Voraussetzung

Alle Anwendungen sind erfasst (Workflow 1, Kategorie „Anwendungen").

### Schritt 1: Schnittstellen-Vorbereitung

Vor dem Workshop eine Liste der bekannten Systemgrenzen erstellen: Welche Anwendungen kommunizieren miteinander? Oft weiß der Anwendungsbetreuer am besten, was „von außen reinkommt und rausgeht".

Gute Quellen: Firewall-Regelwerke, Netzwerkpläne, Applikationshandbücher.

### Schritt 2: Schnittstellen anlegen

Kategorie „Schnittstellen" → für jede Kommunikationsbeziehung einen Eintrag:

1. **Name:** sprechend, z.B. „SAP → Finanzbuchhaltung-Export"
2. **Kürzel:** SS-001, SS-002, …
3. **Quell-Anwendung** und **Ziel-Anwendung** verknüpfen (Dropdown aus vorhandenen Anwendungen)
4. **Protokoll:** HTTPS/REST, gRPC, JDBC, AMQP, Kafka, SFTP, MQTT, OPC UA, …
5. **Port(s):** z.B. „443" oder „5432"
6. **Richtung:** Unidirektional / Bidirektional
7. **Übertragungsart:** Synchron / Asynchron / Batch
8. **Frequenz:** Echtzeit / Stündlich / Nächtlich / On Demand
9. **Verschlüsselung:** TLS 1.3 / TLS 1.2 / mTLS / VPN / **Keine** / Unklar
10. **Authentifizierung:** OAuth2 / API-Key / mTLS / Basic Auth / Keine / Unklar
11. **Firewall-Regeln:** benötigte Freischaltungen (Freitext)

**Tipp:** Verschlüsselung = „Keine" und Authentifizierung = „Keine" sind kritische Findings für BSI und NIS2. Diese erscheinen im Schnittstellen-Graph in Rot.

### Schritt 3: Schnittstellen-Graph aufrufen

„Infrastruktur-Landkarte" → Modus „Schnittstellen-Graph":
- Knoten = Anwendungen
- Pfeile = Schnittstellen (mit Richtung)
- **Rot** = unverschlüsselt, **Grün** = TLS oder mTLS
- Kantenbeschriftung zeigt Protokoll

Sofortige Identifikation von unverschlüsselten oder unauthentifizierten Verbindungen.

### Schritt 4: Schnittstellen-Matrix drucken

„Schnittstellen-Matrix" (Subtab in der Projektübersicht):
- n×n-Tabelle: Zeilen = Quell-Apps, Spalten = Ziel-Apps
- Zellen zeigen Protokoll-Kürzel wo eine Verbindung besteht
- Browser-Druck (Strg+P): direktes Lieferable für den Kunden

Die Matrix eignet sich besonders gut für Reviews mit IT-Verantwortlichen und als Anlage zu BSI-Berichten.

---

## Workflow 4: Excel-Import aus Bestandsdaten

**Zeitbedarf:** 30–60 Minuten  
**Ergebnis:** Bestandsdaten aus Kundenliste als strukturierte Einträge im Tool

### Schritt 1: Excel-Datei vorbereiten

Kundendaten-Excel so aufbereiten, dass das automatische Spalten-Mapping greift:

**Empfohlene Spaltenköpfe für automatisches Mapping:**

| Feld | Empfohlene Spaltenüberschrift |
|---|---|
| Name | Name |
| Kürzel | Kürzel |
| Typ | Typ |
| Hersteller | Hersteller |
| Modell | Modell |
| Seriennummer | Seriennummer |
| Inventarnummer | Inventarnummer |
| IP-Adresse | IP-Adresse |
| Standort | Standort |
| Betriebssystem | Betriebssystem |
| Schutzbedarf | Schutzbedarf |
| Bereitstellungsmodell | Bereitstellungsmodell |
| Lebenszyklus | Lebenszyklus |
| Verantwortlicher | Verantwortlicher |
| Anschaffungsdatum | Anschaffungsdatum |
| Vertragsende | Vertragsende |
| Bemerkungen | Bemerkungen |

Spaltenköpfe müssen nicht exakt übereinstimmen — das Tool versucht automatisches Fuzzy-Matching. Bei unklaren Zuordnungen erscheint ein manuelles Mapping-Dialog.

Tipp: Pro Tabellenblatt nur eine Kategorie (z.B. ein Blatt für Server, ein Blatt für Anwendungen). Das macht die Kategorie-Auswahl beim Import eindeutig.

### Schritt 2: Import starten

1. „Import" → „Excel-Datei importieren"
2. Datei auswählen (`.xlsx`)
3. Tabellenblatt auswählen (falls mehrere vorhanden)
4. **Kategorie wählen:** Wo sollen die importierten Objekte landen? (z.B. „Server")

### Schritt 3: Spalten-Mapping prüfen

Das Tool zeigt eine Vorschau des erkannten Mappings:
- Grüne Zeilen: automatisch erkannt und zugeordnet
- Gelbe Zeilen: unklare Zuordnung — manuell zuweisen per Dropdown
- Rote Zeilen: nicht erkannte Spalten — ignorieren oder manuell zuweisen

**Wichtig:** Nicht zuzuordnende Spalten einfach auf „Ignorieren" setzen — sie werden nicht importiert, aber der Import läuft trotzdem durch.

### Schritt 4: Import starten und Ergebnis prüfen

„Importieren" klicken. Nach dem Import:
- Erfolgreich importierte Zeilen: Anzahl wird angezeigt
- **Fehlerhafte Zeilen:** Tabelle zeigt welche Zeilen übersprungen wurden und warum (Pflichtfeld leer, Referenz nicht auflösbar, …)
- Fehler-Zeilen als CSV herunterladen, korrigieren, und erneut importieren

### Schritt 5: Nachbearbeitung

Nach dem Import fehlende Pflichtfelder manuell ergänzen:
1. Vollständigkeits-Cockpit aufrufen → zeigt welche importierten Einträge unvollständig sind
2. Einträge einzeln öffnen und Felder ergänzen
3. Alternativ: Cloud-Readiness-Wizard für die Cloud-spezifischen Felder

---

## Workflow 5: Workshop-Vorbereitung & Nachbearbeitung

**Zeitbedarf:** 20 Min Vorbereitung + Workshop + 20 Min Nachbearbeitung  
**Ergebnis:** Strukturierter Workshop, geklärte Felder, Snapshot mit Fortschritt

### Vor dem Workshop

1. **Vollständigkeits-Cockpit öffnen:** Welche Felder stehen noch auf „Unklar"?
2. **Fragenliste exportieren:** „Was muss noch geklärt werden?" als Liste exportieren — direkt als Workshop-Agenda nutzbar
3. **Snapshot erstellen:** „Snapshots" → „Jetzt sichern" → Name „Vor Workshop [Datum]"

Das schafft einen Vergleichspunkt: Nach dem Workshop sieht man per Delta-Ansicht genau, was geklärt wurde.

### Während des Workshops

- Tool auf dem Laptop öffnen, direkt während des Gesprächs eingeben
- Pro Objekt das **Notizfeld** nutzen für Aussagen des Ansprechpartners, z.B.:
  > „Laut Fr. Schmidt läuft hier noch ein Legacy-Datenbankprozess, Ablösung ist für Q1/2027 geplant"
- „Unklar"-Werte sofort durch konkrete Werte ersetzen, wenn geklärt
- Neues Objekt anlegen wenn im Gespräch ein bisher unbekanntes System auftaucht

### Nach dem Workshop

1. **Snapshot erstellen:** „Snapshots" → „Jetzt sichern" → Name „Nach Workshop [Datum]"
2. **Delta-Ansicht aufrufen:** Vergleich „Vor Workshop" vs. „Nach Workshop" zeigt:
   - Wie viele Felder von „Unklar" auf konkrete Werte geändert wurden
   - Neu angelegte Objekte
   - Geänderte Schutzbedarf-Einstufungen
3. **Verbleibende offene Punkte:** Vollständigkeits-Cockpit → Liste der noch offenen Punkte → Basis für die nächste Sitzung oder eine Follow-up-E-Mail
4. **JSON-Export:** Backup nach jedem Workshop-Tag sichern

---

## Workflow 6: Wirtschaftlichkeitsanalyse & AfA-Übersicht

**Zeitbedarf:** 1–2 Stunden  
**Ergebnis:** Asset-Register mit Buchwerten, TCO-Übersicht, druckbare AfA-Tabelle

### Schritt 1: Wirtschaftlichkeits-Felder befüllen

Bei Servern, Clients und Netzkomponenten in der Gruppe „Wirtschaftlichkeit":

| Feld | Hinweis |
|---|---|
| Anschaffungsdatum | Datum der Inbetriebnahme oder Kaufdatum |
| Anschaffungspreis (netto) | Listenpreis oder tatsächlicher Kaufpreis |
| Abschreibungsdauer | Server üblich: 3–5 Jahre, PC: 3 Jahre, Netz: 5–7 Jahre |
| Betriebskosten/Jahr | Strom, Wartung, Betreuung — falls bekannt |
| Wartungsvertrag | Ja / Nein / Unklar |
| Wartungskosten/Jahr | Jährliche Wartungs- oder Supportkosten |
| Vertragsende | Ablauf des Wartungsvertrags oder der Lizenz |
| Support-Ende (EoL) | Herstellersupport-Ende — wichtig für Lifecycle-Planung |

Das Tool **berechnet den aktuellen Buchwert automatisch** (lineare Abschreibung), sobald Anschaffungsdatum, Anschaffungspreis und Abschreibungsdauer eingetragen sind.

### Schritt 2: TCO-Modul öffnen

„Wirtschaftlichkeit" → „TCO-Übersicht":

- **„Aus Objektdaten übernehmen":** Klick auf diese Schaltfläche summiert alle OPEX-Werte aus den Einzel-Objekten automatisch in die TCO-Ist-Spalte
- **Non-destruktiv:** Manuell eingegebene TCO-Werte werden nicht überschrieben — nur leere Felder werden befüllt

### Schritt 3: FinOps-Szenarien berechnen

Im TCO-Modul Szenarien für verschiedene Betriebsmodelle berechnen:
- „Alle Rehost-Kandidaten in IaaS" — welche Kosten fallen stattdessen in der Cloud an?
- „SaaS-Migration für Office-Anwendungen" — Kostenvergleich

### Schritt 4: Asset-Übersicht drucken

„Druckbare Asset-Übersicht" → öffnet druckoptimierte Ansicht mit:
- Vollständigem Asset-Register (alle Objekte mit Anschaffungswert und aktuellem Buchwert)
- AfA-Tabelle (verbleibende Abschreibung je Asset)
- Reinvestitions-Ampel: Welche Assets sind bald vollständig abgeschrieben und müssen ersetzt werden?

Direkter Browser-Druck (Strg+P) oder als PDF speichern.

---

## Workflow 7: NIS2-Compliance-Check

**Zeitbedarf:** 1–2 Stunden  
**Ergebnis:** Compliance-Ampel, Lückenliste, Grundlage für Maßnahmenplan

### Voraussetzung

Das Unternehmen ist potenziell NIS2-pflichtig (Sektor: Energie, Wasser, Gesundheit, Transport, Banken, digitale Infrastruktur, Abfall, Chemie, Lebensmittel, öffentliche Verwaltung — ab 50 Mitarbeitern oder 10 Mio. € Umsatz).

### Schritt 1: Unternehmensprofil ausfüllen

NIS2-Modul → „Unternehmensprofil":
- Sektor und Unterschwelle (wesentlich / wichtig)
- Unternehmensgröße (Mitarbeiter, Umsatz)
- Kritische Dienste und deren Abhängigkeiten

### Schritt 2: Fünf-Stufen-Wizard durchlaufen

**Stufe 1 — Governance & Verantwortlichkeiten**
- Informationssicherheits-Richtlinie vorhanden?
- CISO oder ISB benannt?
- Schulungen für Geschäftsführung/Vorstand?

**Stufe 2 — Risikomanagement**
- Risikoanalyse-Prozess vorhanden?
- Schutzbedarf für kritische Systeme bewertet? (→ aus Workflow 1 übernehmen)
- Technische Schutzmaßnahmen (Patch-Management, Zugriffskontrolle, …)?

**Stufe 3 — Incident Response**
- Incident-Response-Plan vorhanden?
- Meldepflicht-Prozess für 24h/72h-Meldung an BSI?
- CSIRT-Kontakt bekannt?

**Stufe 4 — Business Continuity**
- Business-Continuity-Plan vorhanden?
- Backup-Strategie und Recovery-Test?
- Kritische Systeme identifiziert? (→ Schutzbedarf „sehr hoch" aus Workflow 1)

**Stufe 5 — Supply Chain Security**
- Lieferanten-Risikobewertung?
- Vertragliche Sicherheitsanforderungen gegenüber IT-Dienstleistern?
- Kritische Abhängigkeiten von Drittanbietern dokumentiert?

### Schritt 3: Compliance-Ampel auswerten

Nach dem Wizard: Ampeldarstellung je Stufe:
- **Grün:** Anforderung erfüllt
- **Gelb:** Teilweise erfüllt, Nacharbeit empfohlen
- **Rot:** Lücke, Handlungsbedarf

### Schritt 4: Lückenliste als Maßnahmenplan

Lückenliste exportieren → enthält alle roten und gelben Punkte mit:
- Beschreibung der Anforderung
- Aktueller Status
- Empfohlene Maßnahme

Die Liste dient direkt als Grundlage für einen NIS2-Maßnahmenplan oder als Vorlage für ein Projekt-Kickoff.

---

## Schnellreferenz: Welcher Workflow wofür?

| Szenario | Workflow |
|---|---|
| Erster Termin beim Kunden, Bestandsaufnahme | Workflow 1 |
| Cloud-Migration evaluieren | Workflow 2 |
| Netzwerkdokumentation, Firewall-Review | Workflow 3 |
| Kundenliste aus Excel übernehmen | Workflow 4 |
| Klärungsworkshop vorbereiten und auswerten | Workflow 5 |
| Reinvestitionsplanung, Kostenübersicht | Workflow 6 |
| NIS2-Pflicht prüfen, Lücken dokumentieren | Workflow 7 |
