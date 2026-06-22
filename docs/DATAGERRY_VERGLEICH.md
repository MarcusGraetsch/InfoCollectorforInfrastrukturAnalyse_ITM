# DATAGerry vs. IT-Strukturanalyse-Tool — Feature-Vergleich

**Stand:** 2026-06-22

---

## 1. Kurzprofil beider Tools

| Merkmal | **DATAGerry** | **IT-Strukturanalyse-Tool** |
|---|---|---|
| Zielgruppe | IT-Abteilungen, Enterprise CMDB-Admins | IT-Berater, BSI-Strukturanalysen |
| Stack | Python + Angular + MongoDB | React + TypeScript (no backend) |
| Datenhaltung | MongoDB (Server-Side) | localStorage + IndexedDB (Client-Side) |
| Offline | Eingeschränkt (SPA-Cache) | Vollständig offline-fähig |
| Login / Auth | RBAC + Benutzer-Management | Kein Login (by design) |
| Lizenz | AGPLv3 | Intern / HiSolutions |
| Deployment | Docker + Server erforderlich | Browser-only, kein Server |
| Kern-Stärke | Flexibles Schema (User-definiert) | BSI-Workflow + Cloud-Readiness |

---

## 2. Feature-Matrix (DATAGerry → unser Tool)

| Feature | DATAGerry | Unser Tool | Gap |
|---|---|---|---|
| Custom Object Types (UI) | ✅ Visueller Type-Editor | ➖ Deklarativ in Code | Schema im Code, kein UI-Editor |
| Conditional Fields (showIf) | ✅ | ✅ | – |
| Repeating Field Sets (MDS) | ✅ Multi-Data-Sections | ❌ | Keine 1:N-Felder per Objekt |
| Relations / multiref | ✅ N:M bidirektional | ✅ multiref (unidirektional) | Keine inverse Verlinkung |
| CI Explorer (Beziehungs-Graph) | ✅ | ✅ (Infrastruktur-Landkarte) | Gut abgedeckt |
| Schnittstellen-Matrix | ❌ | ✅ | Wir haben Vorsprung |
| Full-Text-Suche | ✅ | ❌ | Fehlende Suche über alle Objekte |
| Bulk-Editing | ✅ | ❌ | Kein Massen-Bearbeiten |
| Import (CSV/XLSX/JSON) | ✅ Multi-Format mit Fehler-Recovery | ✅ (XLSX + JSON, kein Rollback) | Keine Fehler-Recovery |
| Export (CSV/XLSX/JSON/XML) | ✅ | ✅ (XLSX + JSON) | Kein XML |
| Custom Reports / Abfragen | ✅ Report-Builder | ❌ | Keine freie Abfragemaske |
| PDF-Dokumenten-Generator (DocAPI) | ✅ Jinja2-Templates | ❌ Print-Views only | Kein Template-basiertes PDF |
| Objekt-Attachments / Dateien | ✅ | ❌ | Keine Datei-Ablage |
| Versionshistorie / Audit-Log | ✅ (wer hat was wann geändert) | ✅ Snapshots (Datum-Stempel) | Kein Feld-Level-Diff |
| KI-gestützte Vorschläge | ✅ DataGerry Assistant | ✅ (optional, API-Key) | Gleichauf |
| Cloud-Readiness-Bewertung | ❌ | ✅ (6R, SEAL-Level, FinOps) | Wir haben Vorsprung |
| BSI / NIS2 / EU AI Act | ❌ | ✅ | Wir haben Vorsprung |
| AfA / TCO / Wirtschaftlichkeit | ❌ | ✅ | Wir haben Vorsprung |
| ISMS / Risikobewertung | ✅ | ➖ (Schutzbedarf, CIA) | DATAGerry tiefer |
| Dashboard / KPIs (Charts) | ✅ Chart.js-Widgets | ✅ (KPI-Cards, Auswertungen) | Weitgehend gleichauf |
| Vollständigkeits-Cockpit | ❌ | ✅ | Wir haben Vorsprung |
| Integration / Open Celium | ✅ Workflow-Automation | ❌ | Wir: no-backend by design |
| REST API | ✅ | ❌ | Nicht relevant (no-backend) |
| Mandantenfähigkeit | ✅ | ❌ | Nicht priorisiert |

---

## 3. Die wertvollsten DATAGerry-Features für uns

Gefiltert: nur Features, die **offline / ohne Backend / ohne Login** umsetzbar sind.

### Rang 1 — **Globale Volltext-Suche** (hoch prio)

DATAGerry: Suchfeld über alle Objekte aller Typen, Ergebnis mit Typ-Badge und Feld-Highlight.

**Nutzen für uns:** Berater sucht "SAP" — findet sofort Anwendung + Server + Schnittstellen mit diesem Begriff. Aktuell muss jede Kategorie einzeln durchgeblättert werden.

**Umsetzung:** Client-side über alle `state.*`-Arrays iterieren, Felder gegen Query-String matchen, Ergebnis-Liste mit Kategorie-Badge + Edit-Link. Ein Suchfeld im AppHeader, ein `GlobalSearch.tsx`-Modal mit Keyboard-Shortcut `Ctrl+K`.

**Aufwand:** 1–2 Tage

---

### Rang 2 — **Multi-Data-Sections (MDS) / 1:N-Felder** (mittel prio)

DATAGerry: Pro Objekt können wiederholbare Feldgruppen als Tabelle erfasst werden — z.B. mehrere Netzwerkkarten, mehrere IP-Adressen, mehrere Lizenzen.

**Nutzen für uns:** Server hat oft mehrere Netzwerkinterfaces (IP, MAC, VLAN, Bandbreite). Heute: Freitext-Feld, das Nutzer selbst formatieren muss.

**Vorgeschlagene Anwendungsfälle:**
- Server: mehrere Netzwerkinterfaces (Interface-Name, IP, MAC, VLAN, Typ)
- Anwendung: mehrere Lizenzen / Lizenz-Pools (Typ, Anzahl, Key-Pattern, Ablauf)
- Schnittstelle: mehrere Ports / Protokoll-Kombinationen

**Umsetzung:** Neuer FieldType `'table'` in FieldDef. Im CategoryForm: Button „Zeile hinzufügen", editierbare Inline-Tabellenzeilen (kein Modal nötig). Wert im Store: JSON-Array als String.

**Aufwand:** 2–3 Tage

---

### Rang 3 — **Fehler-Recovery beim Import** (hoch prio, wenig Aufwand)

DATAGerry: Nach einem Import wird angezeigt, welche Zeilen fehlschlugen und warum (Pflichtfeld leer, Referenz nicht auflösbar, ungültiger Wert). Nutzer kann Fehler-Zeilen herunterladen, korrigieren und Re-Import starten.

**Nutzen für uns:** Aktuell bricht Import bei Mapping-Problemen stumm ab. Große Excel-Sheets (100+ Zeilen) beim Kunden sind fehleranfällig.

**Umsetzung:** In `ImportWizard.tsx` nach dem Mapping-Schritt eine Validation-Phase einbauen: alle Zeilen validieren, Fehler in einer Tabelle anzeigen (Zeile, Feld, Problem), valide Zeilen trotzdem importieren, Fehler-Zeilen als CSV downloadbar.

**Aufwand:** 1 Tag

---

### Rang 4 — **Objekt-Level Kommentare / Notizen-Feed** (mittel prio)

DATAGerry: Jedes Objekt hat einen Kommentar-/Aktivitäts-Feed mit Timestamp und Autor.

**Nutzen für uns:** Berater kann pro Objekt Notizen hinterlassen ("Laut Hr. Müller läuft hier noch ein Legacy-Prozess") — ohne Felder umzubauen. Gut für Workshop-Protokolle.

**Umsetzung:** Neues Array `notizen: Array<{text, datum, autor?}>` in `BaseItem`. In CategoryForm ein ausklappbarer „Notizen"-Bereich am Ende jedes Formulars. Kein extra Modal nötig.

**Aufwand:** 1 Tag

---

### Rang 5 — **Feld-Level Änderungshistorie** (niedrig prio, später)

DATAGerry: Pro Objekt ein Audit-Log mit Feld-Delta (vorher/nachher, Zeitstempel, User).

**Nutzen für uns:** Nützlich für Revisionen ("War das Schutzbedarf-Feld mal 'Hoch'?"). Wir haben schon Snapshots, aber nur auf AppState-Ebene, nicht auf Objekt-Ebene.

**Umsetzung:** Beim Speichern eines Objekts den Feld-Delta in `BaseItem.aenderungslog[]` schreiben. Im CategoryForm als ausklappbarer Bereich sichtbar.

**Aufwand:** 2 Tage (komplex wegen Diff-Logik)

---

### Rang 6 — **ISMS-Erweiterung / Risiko-Tracking** (mittel prio)

DATAGerry: ISMS-Modul mit Vulnerability-Import und Risiko-Tracking per Objekt.

**Nutzen für uns:** Wir haben Schutzbedarf + CIA, aber kein strukturiertes Risiko-Register pro Objekt. Für BSI-200-3-Risikoanalyse relevant.

**Umsetzung:** Erweiterung des bestehenden NIS2Check um ein Risiko-Register: Pro Objekt kann ein Risiko (Bedrohung, Wahrscheinlichkeit, Auswirkung, Maßnahme, Restrisiko) erfasst werden. Risiko-Matrix (2×2 Heatmap) in ProjectView.

**Aufwand:** 2–3 Tage

---

## 4. Was DATAGerry nicht hat — unsere Vorteile

| Unser Feature | Bedeutung |
|---|---|
| **Cloud-Readiness-Scoring (6R + SEAL)** | Einmalig — kein CMDB-Tool hat das |
| **BSI/NIS2/EU-AI-Act-Compliance** | Branchenspezifisch, hoher Mehrwert |
| **AfA / TCO / Wirtschaftlichkeit** | Sofort nutzbare Finanzanalyse |
| **Schnittstellen-Matrix (n×n)** | Klarer als DATAGerry-Graphen |
| **Vollständigkeits-Cockpit** | Zeigt Beratungsfortschritt sichtbar |
| **Vollständig offline + kein Login** | Ideal für Beratungssituationen |
| **Deutsche Sprache + BSI-Terminologie** | Passt exakt zur Zielgruppe |

---

## 5. Empfohlene Umsetzungsreihenfolge

| Priorität | Feature | Aufwand | Impact |
|---|---|---|---|
| 1 | Globale Volltext-Suche (`Ctrl+K`) | ~1,5 Tage | ⭐⭐⭐⭐⭐ |
| 2 | Import Fehler-Recovery | ~1 Tag | ⭐⭐⭐⭐ |
| 3 | Objekt-Notizen-Feed | ~1 Tag | ⭐⭐⭐⭐ |
| 4 | Multi-Data-Sections (Netzwerkinterfaces, Lizenzen) | ~2,5 Tage | ⭐⭐⭐ |
| 5 | ISMS Risiko-Register | ~2,5 Tage | ⭐⭐⭐ |
| 6 | Feld-Level Änderungshistorie | ~2 Tage | ⭐⭐ |

**Gesamtaufwand Rang 1–3:** ~3,5 Tage, hoher Return  
**Gesamtaufwand Rang 1–5:** ~8,5 Tage

---

## 6. Fazit

DATAGerry ist ein technisch solides Enterprise-CMDB mit starkem Schema-Editor und guten Import/Export-Workflows. Für unsere Zielgruppe (IT-Berater, BSI-Analysen, offline-first) ist unser Tool in den beratungsrelevanten Dimensionen bereits **deutlich stärker** (Cloud-Readiness, Compliance, Wirtschaftlichkeit, BSI-Workflow).

Die wertvollsten DATAGerry-Ideen die wir übernehmen sollten:
1. **Globale Suche** — eliminiert den wichtigsten Usability-Pain
2. **Import-Fehlerbehandlung** — macht das Tool produktionsreif für echte Kundensituationen
3. **Notizen-Feed** — schließt die Workshop-Protokoll-Lücke elegant
