# Konzept: Datenmodell-Erweiterung — Hardware-/Wirtschaftlichkeits-Details, Software-Tiefe, Kommunikationsbeziehungen

**Stand:** Juni 2026 · **Branch:** `claude/dazzling-ride-04upm4`
**Stack:** React 18 + TypeScript + Vite + Tailwind CSS · Kein Backend · localStorage + IndexedDB · Offline
**Designprinzipien (nie brechen):** Kein Pflicht-Backend · Offline-fähig · Druckbar · **Kein Breaking-Change am JSON-Export ohne Migrationspfad**

> Dieses Dokument ist ein **Konzeptpapier** (noch keine Implementierung). Es beschreibt, wie das deklarative Datenmodell der IT-Strukturanalyse zu einem leichten CMDB-/EAM-Werkzeug („LeanIX-light") ausgebaut werden kann — ohne die bestehende Architektur zu brechen.

---

## 1. Ausgangslage & Ziel

### 1.1 Stärken des bestehenden Modells

Das Tool ist heute eine **deklarativ getriebene Inventarisierung** für BSI-IT-Grundschutz-Strukturanalysen. Die zentralen Stärken, auf denen jede Erweiterung aufbauen sollte:

- **Deklaratives Feld-Modell** (`src/categories.ts`): Jede Kategorie ist ein `CategoryDef` mit einer Liste von `FieldDef`. Formular (`CategoryForm.tsx`), Liste (`CategoryList.tsx`), Excel-Export (`src/utils/export.ts`, iteriert `cat.fields`) und Vollständigkeits-Anzeige werden **alle aus denselben Definitionen generiert**. Ein neues Feld muss daher nur an *einer* Stelle ergänzt werden und erscheint automatisch überall.
- **Mixin-Muster über Felder** (`CLOUD_FIELDS` in `categories.ts:58`): Ein gemeinsamer Feld-Block wird per Schleife (`categories.ts:554-558`) an mehrere Kategorien angehängt. Auf Typ-Ebene entspricht das dem `CloudFields`-Interface (`types.ts:28`), das per `extends BaseItem, CloudFields` an `Anwendung`, `Server`, `Client`, `ICSSystem`, `IoTSystem` gemischt wird. **Dieses Muster ist exakt die Blaupause für Hardware- und Wirtschaftlichkeits-Felder.**
- **Robuste, additive Migration** (`mergeWithDefault`, `store.ts:115`): Geladene/importierte Daten werden tief mit dem Default zusammengeführt. Neue *optionale* Felder benötigen keinerlei Migrationscode — fehlende Felder bleiben schlicht `undefined`. Nur neue **Top-Level-Arrays** (neue Kategorien) müssen in der `arrayKeys`-Liste (`store.ts:167`) ergänzt werden.
- **Bestehende Beziehungs-Visualisierung** (`InfrastrukturLandkarte.tsx`): Baut Mermaid-Graphen aus `multiref`-Feldern (z.B. Server→Anwendungen, `InfrastrukturLandkarte.tsx:89-96`). Erweiterbar um neue Diagramm-Modi.

### 1.2 Ziel

Der Anwender (IT-Berater) und sein Kollege wünschen sich die Erfassungstiefe von **LeanIX** (https://www.leanix.net/de/). Konkret: ein vollwertiges **Asset-/Configuration-Management** mit technischen Hardware-Details, betriebswirtschaftlichen Kennzahlen (AfA, Verträge, Betriebskosten), tieferen Software-Attributen mit **typabhängigen Feldern** und — als wichtigster konzeptioneller Sprung — **typisierten Kommunikationsbeziehungen zwischen Anwendungen** (das LeanIX-„Interface").

### 1.3 LeanIX-Konzepte und ihre Abbildung im Tool

LeanIX organisiert die EA-Welt in **Fact Sheet Types** (Meta-Model v4: u.a. Application, IT Component, Tech Category, Interface, Data Object, Provider). Relevante Konzepte und ihr Mapping:

| LeanIX-Konzept | Bedeutung | Abbildung im Tool |
|---|---|---|
| **Application Fact Sheet** | Geschäftsanwendung, Kernobjekt | Bestehende Kategorie `anwendungen` |
| **IT Component** | Technische Bausteine mit Lifecycle (OS, DB, Middleware), „supportet" Systeme | Erweiterte Software-Felder + ggf. eigene Kategorie `softwareKomponenten` (offene Entscheidung) |
| **Interface Fact Sheet** | Schnittstelle *zwischen zwei Applikationen* mit Frequency, Direction, Type | **Neue Kategorie `schnittstellen`** (Kapitel 3.5) |
| **Lifecycle** (Plan/Active/Phase Out/End of Life) | Zeitbezogener Lebenszyklus jedes Objekts | Bereits teilweise via `lebenszyklus`/`lebenszyklusDatum`; ergänzt um `WirtschaftlichkeitFields` (Support-Ende) |
| **Technical/Asset-Attribute** | Hersteller, Version, Kosten | **Neue Mixins** `HardwareFields`, `WirtschaftlichkeitFields` (Kapitel 3) |
| **Data Flow / Interface Circle Map** | Visualisierung des Datenflusses | Neuer Landkarten-Modus + Matrix (Kapitel 4) |

> Hinweis zum „TIME-Modell": Das TIME-Bewertungsraster (Tolerate / Invest / Migrate / Eliminate) ist ein Gartner-Konzept zur Applikations-Portfolio-Bewertung und in LeanIX als Auswertung verfügbar — es ist das EA-Pendant zum bereits implementierten **6R-Modell** (`cloudEignung`). Eine zusätzliche TIME-Einstufung wäre optional, ist aber für dieses Konzept nicht nötig.

**Quellen:** [SAP LeanIX Meta Model](https://help.sap.com/docs/leanix/ea/meta-model) · [Fact Sheets](https://help.sap.com/docs/leanix/ea/fact-sheets) · [IT Components / Lifecycle Catalog](https://docs-eam.leanix.net/docs/lifecycle-catalog) · [Interface Fact Sheets](https://www.slideshare.net/leanIX_net/new-interface-fact-sheet) · [LeanIX Features](https://www.leanix.net/en/enterprise-architecture/features)

---

## 2. Architektur-Entscheidungen / Framework-Erweiterungen

Bevor Felder ergänzt werden, muss das deklarative Framework an vier Stellen erweitert werden. Alle Erweiterungen sind **abwärtskompatibel**.

### 2.1 Neue FieldTypes: `number`, `date`, `url`

Heute: `type FieldType = 'text' | 'textarea' | 'select' | 'multiref'` (`categories.ts:3`). Alle Werte werden als String gespeichert.

Vorschlag — Erweiterung:

```ts
export type FieldType =
  | 'text' | 'textarea' | 'select' | 'multiref'
  | 'number' | 'date' | 'url';
```

Rendering-Anpassungen in `CategoryForm.tsx` (`renderField`, ab `categories.ts`/`CategoryForm.tsx:124`):

| Typ | Render | Hinweise |
|---|---|---|
| `number` | `<input type="number">` mit optionalem `unit`-Suffix (W, V, kW, GB, HE, €, Jahre) | Wert bleibt als **String** im State (Konsistenz mit `anzahl`, das heute schon `string` ist) → kein Migrations-/Typbruch. `min`, `step` optional aus FieldDef. |
| `date` | `<input type="date">` | Speicherung als ISO-String `YYYY-MM-DD` — identisch zum bereits genutzten `vertragsende` (heute `text`). |
| `url` | `<input type="url">` + klickbarer „Öffnen ↗"-Link im Bearbeiten-Modus | Validierung `https?://`. In `CategoryList` als Link rendern. |

Empfohlene optionale FieldDef-Ergänzungen für diese Typen:

```ts
export interface FieldDef {
  // ... bestehend ...
  unit?: string;          // z.B. 'W', 'kW', 'V', '€', 'GB', 'HE', 'Jahre'
  min?: number;
  step?: number;
  placeholder?: string;
}
```

> **Aufwand S.** Rein additiv. Bestehende Felder bleiben `text`. Wichtig: Da Werte weiter als String persistiert werden, ändert sich **nichts am JSON-Export-Format**.

### 2.2 Conditional / dependent Fields (`showIf`)

Kernanforderung für software-typabhängige Felder (DB-Felder nur bei „Datenbank" etc.). Vorschlag — neues optionales Attribut an `FieldDef`:

```ts
export interface FieldDef {
  // ... bestehend ...
  /** Feld nur anzeigen, wenn ein anderes Feld einen der Werte hat. */
  showIf?: { field: string; equals: string[] };
}
```

Auswertung in `CategoryForm.tsx`: In `renderField` (bzw. einem Wrapper vor dem `.map(renderField)`, `CategoryForm.tsx:244`) wird vor dem Rendern geprüft:

```ts
function isVisible(field: FieldDef, form: Record<string, unknown>): boolean {
  if (!field.showIf) return true;
  const current = String(form[field.showIf.field] ?? '');
  return field.showIf.equals.includes(current);
}
```

- Sichtbarkeit ist **rein UI-seitig**. Versteckte Felder behalten ihren Wert im State (kein Datenverlust beim Umschalten), werden aber nicht validiert/required-geprüft, solange unsichtbar.
- Für die Vollständigkeits-Logik in `CategoryList.tsx` (`getGeneralCompleteness`, Zeile 19) muss `isVisible` mitberücksichtigt werden, damit ausgeblendete Felder nicht als „fehlend" zählen → Prozentanzeige bleibt korrekt.

> **Aufwand M.** Additiv, kein Datenformat-Bruch. Einziger Folgeaufwand: Completeness-Berechnung um `showIf` ergänzen.

### 2.3 Geteilte Feld-Mixins: `HardwareFields` & `WirtschaftlichkeitFields`

Analog zu `CloudFields` / `CLOUD_FIELDS`:

**Typ-Ebene** (`types.ts`):

```ts
export interface HardwareFields {
  hersteller?: string;
  modell?: string;
  seriennummer?: string;
  // ... s. Katalog 3.1
}
export interface WirtschaftlichkeitFields {
  anschaffungsdatum?: string;
  anschaffungspreis?: string;
  // ... s. Katalog 3.2
}
```

Gemischt per `extends`:

```ts
export interface Server extends BaseItem, CloudFields, HardwareFields, WirtschaftlichkeitFields { ... }
```

**Feld-Ebene** (`categories.ts`): zwei neue Konstanten `HARDWARE_FIELDS` und `WIRTSCHAFTLICHKEIT_FIELDS` (mit eigenem `group`-Wert, s.u.), angehängt per Schleife — exakt nach dem Muster `categories.ts:546-558`:

```ts
const HARDWARE_RELEVANT: CategoryKey[] =
  ['server','clients','netzkomponenten','icsSysteme','iotSysteme','datentraeger'];
const WIRTSCHAFT_RELEVANT: CategoryKey[] =
  ['server','clients','netzkomponenten','icsSysteme','iotSysteme','datentraeger','anwendungen'];

for (const cat of CATEGORIES) {
  if (HARDWARE_RELEVANT.includes(cat.key))
    cat.fields.push(...HARDWARE_FIELDS.map(f => ({ ...f })));
  if (WIRTSCHAFT_RELEVANT.includes(cat.key))
    cat.fields.push(...WIRTSCHAFTLICHKEIT_FIELDS.map(f => ({ ...f })));
}
```

**Erweiterung der `group`-Eigenschaft** für visuelle Gruppierung im Formular (heute nur `'basis' | 'cloud'`, `categories.ts:16`):

```ts
group?: 'basis' | 'cloud' | 'hardware' | 'wirtschaft';
```

`CategoryForm.tsx` rendert Felder heute in zwei Fieldsets (basis + cloud, `CategoryForm.tsx:224-256`). Vorschlag: pro Gruppe ein einklappbares `<fieldset>` mit eigener Überschrift/Farbe („Technik & Hardware", „Wirtschaftlichkeit & Vertrag"). Damit bleibt das Formular trotz vieler neuer Felder übersichtlich.

> **Aufwand M.** Additiv. Alle neuen Felder optional → `mergeWithDefault` braucht **keine** Änderung.

### 2.4 Neue Entität: Kommunikationsbeziehung / Schnittstelle (LeanIX-„Interface")

Dies ist der einzige Teil, der eine **neue Top-Level-Kategorie** einführt. Vorschlag (`types.ts`):

```ts
export interface Schnittstelle extends BaseItem {
  status: Status;
  quellAnwendung: string[];   // multiref → anwendungen (Initiator-Seite)
  zielAnwendung: string[];    // multiref → anwendungen
  richtung: 'Unidirektional' | 'Bidirektional' | '';
  initiator: 'Quelle' | 'Ziel' | 'Beide' | '';
  protokoll: string;          // HTTPS/REST, gRPC, JDBC, AMQP, SFTP, ...
  ports: string;
  uebertragungsart: 'Synchron' | 'Asynchron' | 'Batch' | '';
  frequenz: string;           // Echtzeit / stündlich / nächtlich / on demand
  datenfluss: string;         // textarea: welche Daten?
  verschluesselung: string;   // TLS 1.3 / mTLS / VPN / keine / Unklar
  authentifizierung: string;  // OAuth2 / API-Key / mTLS / Basic / Unklar
  firewallRegel: string;      // textarea: Regeln/Voraussetzungen
  daten?: string[];           // optional multiref → daten
}
```

**Einbindung in `AppState`** (`types.ts:335`): neues Array `schnittstellen: Schnittstelle[];`. Da `CategoryKey = keyof Omit<AppState, ...>` (`types.ts:360`) ist die neue Kategorie damit **automatisch** ein gültiger `CategoryKey` und in `multiref`-Feldern referenzierbar.

**Migration** (`store.ts`): `schnittstellen: []` in `createDefaultState()` ergänzen (`store.ts:71`) **und** in die `arrayKeys`-Liste (`store.ts:167`) aufnehmen, damit alte Backups ohne dieses Feld nicht abstürzen. Das ist die einzige notwendige Code-Migration.

> **Aufwand M–L.** Einzige nicht-rein-additive Stelle (neue Top-Level-Property), aber durch `mergeWithDefault` sauber abgefedert. **Bestehender JSON-Export bleibt lesbar**, da nur ein Array hinzukommt.

### 2.5 Zusammenfassung Migrationsstrategie

| Erweiterung | Migration nötig? |
|---|---|
| Neue FieldTypes (`number`/`date`/`url`) | Nein — Werte bleiben Strings |
| `showIf`, `unit`, `min`, `step` | Nein — nur Definitionsmetadaten |
| `HardwareFields`, `WirtschaftlichkeitFields` | Nein — alle Felder optional |
| Erweiterte Anwendungs-/Software-Felder | Nein — alle optional |
| Neue Kategorie `schnittstellen` | **Ja, minimal:** Default-Array + `arrayKeys` in `store.ts` |

**Kein bestehendes Feld wird umbenannt oder entfernt.** Alte JSON-Backups laden unverändert.

---

## 3. Konkrete Feld-Kataloge

Notation: `key` · `label` · `type` (· `unit`/`options`).

### 3.1 `HardwareFields` (Server, Clients, Netzkomponenten, ICS, IoT, Datenträger)

| key | label | type | unit / options |
|---|---|---|---|
| `hersteller` | Hersteller | text (suggestions) | Dell, HPE, Lenovo, Fujitsu, Cisco, Supermicro … |
| `modell` | Modell / Typ | text | z.B. „PowerEdge R750" |
| `seriennummer` | Seriennummer | text | Asset-Tag / S/N |
| `inventarnummer` | Inventar-/Asset-Nummer | text | für Anlagenbuchhaltung |
| `cpu` | CPU (Typ / Kerne) | text | z.B. „2× Xeon Gold 6338, 64C" |
| `ram` | Arbeitsspeicher | number | unit `GB` |
| `speicher` | Speicher / Kapazität | text | „2× 1,92 TB SSD RAID1" |
| `formfaktor` | Formfaktor | select | Rack / Tower / Blade / Virtuell / Mobil / Embedded |
| `hoeheneinheiten` | Höheneinheiten | number | unit `HE` |
| `stromverbrauch` | Stromverbrauch (typ.) | number | unit `W` |
| `leistungsaufnahmeMax` | Leistungsaufnahme (max.) | number | unit `kW` |
| `spannung` | Versorgungsspannung | text | unit `V` (z.B. 230 / 400) |
| `redundanteNetzteile` | Redundante Netzteile | select | Ja / Nein / Unklar |
| `anschaffungsjahr` | Anschaffungsjahr (HW) | number | unit `Jahr` (Schnellerfassung; Detail s. 3.2) |
| `standortDetail` | Rack / Standort-Detail | text | „Rack 4, HE 12–13" |

> `group: 'hardware'`. Für `datentraeger` sind v.a. Hersteller/Modell/Seriennummer/Kapazität relevant; nicht passende Felder bleiben einfach leer.

### 3.2 `WirtschaftlichkeitFields` (alle HW-Kategorien + `anwendungen`)

| key | label | type | unit / options |
|---|---|---|---|
| `anschaffungsdatum` | Anschaffungsdatum | date | für AfA-Beginn |
| `anschaffungspreis` | Anschaffungspreis (netto) | number | unit `€` |
| `abschreibungsdauer` | Abschreibungsdauer | number | unit `Jahre` (Server/PC üblich 3) |
| `buchwert` | Aktueller Buchwert | number | unit `€` (Erfassung; optionale Berechnung s. Kap. 7) |
| `betriebskostenJahr` | Betriebskosten / Jahr | number | unit `€` |
| `wartungsvertrag` | Wartungsvertrag vorhanden | select | Ja / Nein / Unklar |
| `wartungskostenJahr` | Wartungskosten / Jahr | number | unit `€` |
| `vertragsbeginn` | Vertragsbeginn | date | |
| `vertragsende` | Vertragsende | date | *(ersetzt heutiges `text`-Feld bei Anwendung — typkompatibel, ISO-String)* |
| `kuendigungsfrist` | Kündigungsfrist | text | „3 Monate zum Quartalsende" |
| `supportEnde` | Support-Ende (EoL/EoS) | date | Herstellersupport |
| `kostenstelle` | Kostenstelle | text | für Controlling |

> `group: 'wirtschaft'`. Hinweis: Das bestehende `vertragsende?: string` bei `Anwendung` (`types.ts:76`) und `IKTDienstleister` ist ISO-String-kompatibel — der Typ `date` produziert denselben Wert; lediglich der FieldType-Renderer ändert sich. Doppelpflege vermeiden: das alte Anwendungs-Feld in `WirtschaftlichkeitFields` aufgehen lassen.

### 3.3 Erweiterte Anwendungs-/Software-Felder (`anwendungen`)

Zusätzlich zum bestehenden `typ`-Feld (`categories.ts:309`) und den Lizenzfeldern:

| key | label | type | Hinweis |
|---|---|---|---|
| `herstellerSW` | Hersteller / Anbieter | text (suggestions) | Microsoft, SAP, Oracle, Atlassian … |
| `produktname` | Produktname | text | offizieller Produktname |
| `version` | Version | text | „2024 R2", „15.6.1" |
| `updateZyklus` | Update-Zyklus | select | Kontinuierlich / Monatlich / Quartalsweise / Jährlich / Bei Bedarf / Unklar |
| `linkBetriebshandbuch` | Link Betriebshandbuch | url | |
| `linkRepository` | Link Repository | url | Git/Artefakt-Repo |
| `linkHersteller` | Link Hersteller/Produkt | url | Produkt-/Doku-Website |

Außerdem: das `typ`-Feld um Werte erweitern, die als **Schalter für Conditional Fields** dienen (s. 3.4) — u.a. „Betriebssystem", „Virtualisierung / Hypervisor", „Backup-Software". Siehe dazu offene Entscheidung 7.1 (OS als eigene Kategorie vs. Anwendungstyp).

### 3.4 Typabhängige (conditional) Feldsätze je Software-Typ

Jeweils mit `showIf: { field: 'typ', equals: [...] }`, `group: 'basis'` (oder eigene Gruppe „Typ-Details"). Auswahl nach Software-Typ:

**a) Datenbank** (`equals: ['Datenbank / Datenhaltung']`)
| key | label | type | options |
|---|---|---|---|
| `dbModell` | DB-Modell | select | Relational / NoSQL (Dokument) / Key-Value / Graph / Zeitreihen / Spaltenorientiert |
| `dbHersteller` | DB-Produkt | text (sugg.) | PostgreSQL, Oracle, MS SQL Server, MySQL/MariaDB, MongoDB, Redis … |
| `dbVersion` | DB-Version | text | |
| `dbBackupStrategie` | Backup-Strategie | select | Full täglich / Inkrementell / Dump / Snapshot / Keine / Unklar |
| `dbBackupOrt` | Backup-Ort | text | NAS / Band / Cloud / Offsite |
| `dbReplikation` | Replikation | select | Keine / Master-Replica / Multi-Master / Log-Shipping / Unklar |
| `dbHaSetup` | HA-/Cluster-Setup | select | Keines / Failover-Cluster / Always-On / Patroni / Unklar |

**b) Webserver** (`equals: ['Web-Applikation (Browser-basiert)','Server-Dienst / Backend-Service']`)
| key | label | type | options |
|---|---|---|---|
| `webServerSoftware` | Server-Software | select | nginx / Apache HTTP / IIS / Caddy / Tomcat / Node.js … |
| `tlsVersion` | TLS-Version | select | TLS 1.3 / TLS 1.2 / gemischt / kein TLS / Unklar |
| `exposedPorts` | Exponierte Ports | text | „80, 443" |
| `reverseProxy` | Reverse Proxy / WAF | text | |

**c) Betriebssystem** (`equals: ['Betriebssystem','OS-nahe Software / Treiber']`)
| key | label | type | options |
|---|---|---|---|
| `osVersion` | OS-Version | text | |
| `osPatchLevel` | Patch-Level / Build | text | |
| `osKernel` | Kernel-Version | text | |
| `osSupportEnde` | OS-Support-Ende | date | |
| `osEdition` | Edition / Architektur | text | „Datacenter x64" |

**d) Middleware / Integration** (`equals: ['Middleware / Integration']`)
| key | label | type | options |
|---|---|---|---|
| `middlewareTyp` | Middleware-Typ | select | Message Broker / ESB / API-Gateway / ETL / App-Server / iPaaS |
| `middlewareProtokolle` | Protokolle | text | AMQP, JMS, Kafka, SOAP, REST |
| `middlewareEndpunkte` | Anzahl Endpunkte/Flows | number | |

**e) ERP / CRM (Geschäftssoftware)** (`equals: ['ERP / CRM (Geschäftssoftware)']`)
| key | label | type | options |
|---|---|---|---|
| `erpModule` | Aktive Module | text | FI/CO, MM, SD, HR … |
| `customizingGrad` | Customizing-Grad | select | Standard / Mittel / Stark angepasst / Unklar |
| `mandanten` | Anzahl Mandanten | number | |
| `integrationen` | Angebundene Systeme | multiref → anwendungen | |

**f) Monitoring / Security** (`equals: ['Sicherheits-/Monitoring-Tool']`)
| key | label | type | options |
|---|---|---|---|
| `secKategorie` | Kategorie | select | SIEM / EDR/AV / Firewall-Mgmt / Monitoring / Vuln-Scan / IAM |
| `secAbdeckung` | Abdeckung | text | „alle Server + Clients" |
| `secLogRetention` | Log-Aufbewahrung | text | unit Tage |

**g) Backup-Software** (`equals: ['Backup-Software']`)
| key | label | type | options |
|---|---|---|---|
| `backupProdukt` | Produkt | text (sugg.) | Veeam, Veritas, Commvault, Bareos … |
| `backupRPO` | RPO (Recovery Point) | text | |
| `backupRTO` | RTO (Recovery Time) | text | |
| `backup321` | 3-2-1-Regel erfüllt | select | Ja / Teilweise / Nein / Unklar |
| `backupOffsite` | Offsite-/Air-Gap-Kopie | select | Ja / Nein / Unklar |

**h) Virtualisierung / Hypervisor** (`equals: ['Virtualisierung / Hypervisor']`)
| key | label | type | options |
|---|---|---|---|
| `hypervisorProdukt` | Hypervisor | select | VMware vSphere / Hyper-V / Proxmox VE / Nutanix AHV / KVM / Citrix |
| `clusterKnoten` | Cluster-Knoten | number | |
| `vmAnzahl` | Anzahl VMs | number | |
| `liveMigration` | Live-Migration | select | Ja / Nein / Unklar |

> **Aufwand der Kataloge gesamt: M.** Reine Datendefinition in `categories.ts`. Voraussetzung: 2.1–2.3 umgesetzt.

### 3.5 Kategorie `schnittstellen` — Feld-Katalog (LeanIX-Interface)

`prefix: 'IF'`, in `CATEGORIES` aufgenommen.

| key | label | type | options / ref |
|---|---|---|---|
| `kuerzel` | Kürzel | text | required, z.B. IF-001 |
| `name` | Name | text | required |
| `erlaeuterung` | Erläuterung / Zweck | textarea | |
| `status` | Status | select | Aktiv / Inaktiv / In Planung / Außer Betrieb |
| `quellAnwendung` | Quell-Anwendung | multiref | → `anwendungen` |
| `zielAnwendung` | Ziel-Anwendung | multiref | → `anwendungen` |
| `richtung` | Richtung | select | Unidirektional / Bidirektional |
| `initiator` | Initiator | select | Quelle / Ziel / Beide |
| `protokoll` | Protokoll | text (sugg.) | HTTPS/REST, gRPC, SOAP, JDBC, AMQP, Kafka, SFTP, MQTT, OPC UA |
| `ports` | Port(s) | text | „443, 8443" |
| `uebertragungsart` | Übertragungsart | select | Synchron / Asynchron / Batch |
| `frequenz` | Frequenz | select | Echtzeit / Minütlich / Stündlich / Täglich / Nächtlich / On Demand / Unklar |
| `datenfluss` | Datenfluss (welche Daten?) | textarea | |
| `daten` | Verknüpfte Datenobjekte | multiref | → `daten` (optional) |
| `verschluesselung` | Verschlüsselung | select | TLS 1.3 / TLS 1.2 / mTLS / VPN / Keine / Unklar |
| `authentifizierung` | Authentifizierung | select | OAuth2 / API-Key / mTLS / Zertifikat / Basic Auth / Keine / Unklar |
| `firewallRegel` | Firewall-Regel / Voraussetzungen | textarea | benötigte Freischaltungen |
| `tags` | Tags | text | |

> Diese Felder decken die BSI-relevanten Schnittstellen-Attribute (externe Kopplung, Protokoll, Verschlüsselung) **und** die LeanIX-Interface-Attribute (Direction, Frequency, Type) ab.

---

## 4. Beziehungs-/Abhängigkeits-Visualisierung

### 4.1 Bestehende Basis

`InfrastrukturLandkarte.tsx` rendert bereits drei Mermaid-Modi (`Ansicht`): Kategorien-Übersicht, „Server → Anwendungen", Netzwerktopologie. Die Server→Anwendungen-Logik (`InfrastrukturLandkarte.tsx:60-98`) löst `multiref`-Referenzen auf und zeichnet Kanten. **Genau dieses Muster wird wiederverwendet.**

### 4.2 Neuer Modus „Systemstapel" (Server → OS → Apps)

Neuer `Ansicht`-Wert `'systemstapel'`: Pro Server eine vertikale Kette
`Server (HW) → Betriebssystem → Anwendung a, b, c`.
- OS-Knoten aus dem Software-Detail bzw. (je nach Entscheidung 7.1) aus einer OS-Kategorie/aus `plattform`.
- Apps aus `server.anwendungen` (multiref) — bereits vorhanden.
- Hardware-Kontext (Hersteller/Modell) als Knoten-Tooltip/Label.

### 4.3 Neuer Modus „Schnittstellen-Graph" (App-zu-App)

Neuer `Ansicht`-Wert `'schnittstellen'`: gerichteter Graph aus der neuen Kategorie.
- Knoten = Anwendungen; Kanten = `Schnittstelle` (Quelle → Ziel).
- Kantenlabel = Protokoll/Frequenz; Pfeilrichtung aus `richtung`/`initiator`.
- Farbcodierung der Kante nach `verschluesselung` (rot = „Keine", grün = TLS/mTLS) — analog zur bestehenden `BEREITSTELLUNG_COLOR`-Map (`InfrastrukturLandkarte.tsx:9`).

### 4.4 Matrix-Ansicht (Interface Circle Map / Data-Flow-Matrix)

Zusätzlich zur Graph-Ansicht eine **n×n-Matrix** aller Anwendungen (Zeilen = Quelle, Spalten = Ziel), Zellen markiert wo eine `Schnittstelle` existiert (mit Protokoll-Kürzel/Tooltip). Das ist das Pendant zur LeanIX **Interface Circle Map** und für Reviews mit dem Kunden sehr aussagekräftig. Reine HTML-Tabelle → **druckbar** (Designprinzip erfüllt), keine zusätzliche Lib nötig.

### 4.5 Per-Objekt-Panel „Abhängigkeiten"

Im Bearbeiten-/Detail-Kontext eines Objekts ein kleines Panel „Wer hängt an mir / woran hänge ich":
- eingehende & ausgehende `multiref`-Beziehungen (vorhandene `bidirectional.ts`-Logik nutzen),
- plus eingehende/ausgehende Schnittstellen.

> **Aufwand 4.2/4.3: M** (Mermaid-Builder analog vorhandenen). **4.4 Matrix: M.** **4.5: S–M.**

---

## 5. Auswirkungen auf bestehende Features

| Feature / Datei | Auswirkung | Aufwand |
|---|---|---|
| **Excel-Export** (`utils/export.ts:40-53`) | Iteriert `cat.fields` → neue Felder erscheinen **automatisch** als Spalten. Neue Kategorie `schnittstellen` erscheint automatisch, da `CATEGORIES` durchlaufen wird. Kein Code nötig. | – |
| **JSON-Export/Backup** | Additiv; alte Backups laden via `mergeWithDefault`. | – |
| **Vollständigkeit / Cockpit** (`CategoryList.tsx:19`) | `getGeneralCompleteness` zählt alle Nicht-multiref-Felder. Muss um `showIf`-Sichtbarkeit ergänzt werden, sonst zählen ausgeblendete Typ-Felder fälschlich als „fehlend". | S |
| **cloudReadiness-Scoring** (`cloudReadiness.ts`) | Unberührt — bewertet nur `CloudFields`. Optional könnten `supportEnde`/`lebenszyklus` aus den neuen Feldern den Score schärfen, ist aber nicht zwingend. | optional |
| **Excel-/Datei-Import-Mapping** (`utils/importAnalyzer.ts`) | Fuzzy-Spaltenerkennung kennt neue Felder/Kategorie noch nicht → Mapping-Schlüsselwörter ergänzen (Hersteller, Seriennummer, Schnittstelle …). Bereits als technische Schuld notiert. | M |
| **Druck-/Report-Export** (`utils/exportReport.ts`, `safePrint`) | Neue Felder/Kategorie in Report-Sektionen aufnehmen; Schnittstellen-Matrix als druckbare Tabelle. | M |
| **InfrastrukturLandkarte** | Neue Modi (Kap. 4). | M |
| **Snapshot/Delta** (`snapshotStore.ts`) | Speichert kompletten `AppState` → neue Felder/Kategorie automatisch versioniert/vergleichbar. | – |
| **Wizard / Ersterfassung** (`Wizard.tsx`) | Optional: neue Schnittstellen-Kategorie in den geführten Ablauf aufnehmen (sonst nur über Kategorie-Ansicht). | S |

---

## 6. Vorgeschlagene Umsetzungsreihenfolge (Phasen)

| Phase | Inhalt | Aufwand | Bruch? |
|---|---|---|---|
| **Phase 1 — Framework** | FieldTypes `number`/`date`/`url` + Render in `CategoryForm`; FieldDef-Attribute `unit`/`min`/`step`/`showIf`; `group` erweitern; gruppierte Fieldsets. | M | rein additiv |
| **Phase 2 — Mixins HW + Wirtschaft** | `HardwareFields` + `WirtschaftlichkeitFields` (Typen + Feldkataloge + Anhänge-Schleife). Completeness um `showIf` ergänzen. | M | additiv |
| **Phase 3 — Software-Tiefe + Conditional** | Erweiterte Anwendungsfelder (Hersteller/Version/Links/Update-Zyklus) + typabhängige Feldsätze (3.4) via `showIf`. | M | additiv |
| **Phase 4 — Kommunikationsbeziehungen** | Neue Kategorie `schnittstellen` (Typ, AppState, `createDefaultState`, `arrayKeys`, CATEGORIES, Help-Text). | M–L | **minimaler Bruch** (neues Array) — durch `mergeWithDefault` abgesichert |
| **Phase 5 — Visualisierung & Matrix** | Landkarten-Modi „Systemstapel" + „Schnittstellen-Graph", Schnittstellen-Matrix, Abhängigkeits-Panel. | M–L | additiv |
| **Phase 6 — Exporte/Reports & Import** | Report-Sektionen + druckbare Matrix; Import-Mapping-Keywords für neue Felder/Kategorie. | M | additiv |

Empfehlung: **Phasen 1–2 zuerst** (sofortiger Mehrwert: Asset-Register, AfA, Verträge). Phase 4 (Schnittstellen) ist konzeptionell der größte Sprung Richtung LeanIX und sollte erst nach gefestigtem Framework folgen.

---

## 7. Offene Entscheidungen für den Auftraggeber

1. **Betriebssysteme: eigene Kategorie oder Feld?** Sollen Betriebssysteme als **eigene Kategorie/IT-Component** (`betriebssysteme`, wiederverwendbar über mehrere Server, wie LeanIX „IT Component") geführt werden — oder genügen **typabhängige OS-Felder an der Anwendung** bzw. das bestehende `plattform`-Feld am Server? (Eigene Kategorie = saubere n:m-Wiederverwendung, aber mehr Pflegeaufwand.)

2. **Granularität der Hardware-Technik:** Nur **Asset-Basics** (Hersteller, Modell, Seriennummer, Strom, HE) — oder die **volle Tiefe** inkl. CPU/RAM/Disk-Spezifikation? Volle Specs bedeuten deutlich mehr Erfassungsaufwand pro Gerät; sinnvoll v.a. für Rechenzentrums-Server, weniger für Massen-Clients.

3. **Schnittstelle als eigene Kategorie mit Liste+Formular?** Soll die `Kommunikationsbeziehung`/`Schnittstelle` eine **vollwertige eigene Kategorie** (eigene Liste, eigenes Formular, eigener Wizard-Schritt) sein — oder genügt zunächst ein **einfaches multiref-Feld** „kommuniziert mit" an der Anwendung ohne die reichen Attribute (Protokoll, Port, Verschlüsselung …)?

4. **Matrix-/Data-Flow-Ansicht gewünscht?** Brauchen wir die **n×n-Schnittstellen-Matrix** (Interface Circle Map) zusätzlich zum Graphen — oder reicht der gerichtete Schnittstellen-Graph in der Infrastruktur-Landkarte?

5. **AfA/steuerliche Abschreibung: nur erfassen oder berechnen?** Sollen Anschaffungsdatum/-preis/Abschreibungsdauer **nur erfasst** werden — oder soll das Tool den **Buchwert automatisch berechnen** (lineare AfA, Restwert nach n Jahren) und ggf. eine Asset-Wert-Übersicht/Reinvestitionsplanung ausgeben? (Berechnung = Mehrwert fürs Controlling, aber zusätzliche Logik.)

6. **Reichweite der Wirtschaftlichkeits-Felder & Verhältnis zum TCO-Modul:** Sollen die betriebswirtschaftlichen Felder an **jedem** Objekt erfasst werden, oder nur an ausgewählten Kategorien? Und wie verhalten sie sich zum bestehenden **TCO-Modul** (`TCODaten`, aggregierte Ist-/Zielkosten) — soll künftig aus den Einzel-Objektkosten **automatisch** in die TCO-Ist-Summe aggregiert werden (Single Source of Truth) oder bleiben beide getrennt?

---

## 8. Abgleich mit iTop (Combodo) — Open-Source-CMDB als Referenz

[iTop](https://github.com/Combodo/iTop) ist eine etablierte Open-Source-CMDB/ITSM-Lösung (GPL-3). Ihr Konfigurationsmanagement-Datenmodell (`datamodels/2.x/itop-config-mgmt/datamodel.itop-config-mgmt.xml`) ist über Jahre praxiserprobt und eignet sich hervorragend als Referenz-Schema. Der direkte Abgleich mit dem Quellcode **bestätigt unsere oben vorgeschlagene Struktur weitgehend** — wir bauen damit keinen Sonderweg, sondern folgen einem bewährten CMDB-Modell.

### 8.1 iTop-Klassenhierarchie (aus dem Quellcode)

```
FunctionalCI (abstrakt)          name, description, org_id, business_criticity, move2production,
  │                              contacts_list, documents_list, applicationsolution_list, softwares_list
  ├─ PhysicalDevice (abstrakt)   serialnumber, location_id, status, brand_id, model_id,
  │   │                          model_end_of_support, asset_number, purchase_date, end_of_warranty
  │   └─ ConnectableCI           networkdevice_list, physicalinterface_list
  │       └─ DatacenterDevice    rack_id, enclosure_id, nb_u, managementip,
  │           │                  powerA/powerB, redundancy, san_list
  │           ├─ Server          osfamily_id, osversion_id, os_end_of_support, oslicence_id,
  │           │                  cpu, ram, logicalvolumes_list
  │           └─ NetworkDevice   networkdevicetype_id, iosversion_id, ios_end_of_support, ram
  ├─ SoftwareInstance (abstrakt) system_id (läuft auf!), software_id, software_end_of_support,
  │   │                          softwarelicence_id, path, status
  │   ├─ DBServer                dbschema_list
  │   ├─ WebServer               webapp_list
  │   ├─ Middleware              middlewareinstance_list
  │   └─ PCSoftware
  ├─ ApplicationSolution         functionalcis_list, businessprocess_list, status, redundancy
  └─ BusinessProcess             applicationsolutions_list, status

Referenz-/Stammdaten: OSFamily, OSVersion, Brand, Model, SoftwareLicence, NetworkDeviceType
Software-Kategorien:   DB Servers · Middlewares · PC Softwares · Web Servers · Other (5 Typen)
```

### 8.2 Was iTop unsere Vorschläge bestätigt

| Unser Vorschlag | iTop-Entsprechung | Schlussfolgerung |
|---|---|---|
| `HardwareFields` (Hersteller, Modell, Seriennummer, HE, Strom, Management-IP) | `PhysicalDevice`/`DatacenterDevice`: `brand_id`, `model_id`, `serialnumber`, `nb_u`, `powerA/B`, `managementip` | ✅ Felder praktisch deckungsgleich — übernehmen |
| `WirtschaftlichkeitFields` (Anschaffungsdatum, Support-/Garantie-Ende) | `asset_number`, `purchase_date`, `end_of_warranty`, `model_end_of_support`, `move2production` | ✅ bestätigt; `asset_number` (Inventarnummer) + `move2production` (Produktivnahme) ergänzen wir |
| Server-Technik CPU/RAM | `Server.cpu`, `Server.ram` | ✅ einfache Textfelder genügen (iTop macht es genauso) |
| **Betriebssysteme als eigene Kategorie** (Entscheidung 1) | `OSFamily` + `OSVersion` als **eigene, wiederverwendbare Klassen**, am Server nur referenziert (`osfamily_id`) | ✅ **starkes Argument für die eigene Kategorie** |
| **Conditional Fields nach Software-Typ** (Entscheidung 3-Kontext) | Software ist in **5 Unterklassen** modelliert (DBServer, WebServer, Middleware, PCSoftware, Other) mit je eigenen Beziehungen (`dbschema_list`, `webapp_list`) | ✅ unser `showIf`-Ansatz bildet dieselbe Idee schlanker ab (eine Klasse + typabhängige Felder statt Vererbungsbaum) |
| Software „läuft auf" Server | `SoftwareInstance.system_id` | ✅ entspricht unserem multiref `itSysteme` |
| Lizenz-Verknüpfung | `SoftwareLicence` (+ `oslicence_id`) | ✅ deckt sich mit bestehendem LG-5-Lizenzmodul |

### 8.3 Wo wir über iTop hinausgehen (LeanIX-Stärke)

iTops **kostenloses** CMDB-Modell hat **keine reiche App-zu-App-Schnittstelle** mit Port/Protokoll/Richtung/Firewall als Erstklassen-Objekt — Abhängigkeiten werden dort primär über die *Impact-Analyse* (depends-on/impacts) und physische Interfaces abgebildet. Unsere geplante Kategorie **`Schnittstelle`/`Kommunikationsbeziehung`** (Kap. 3.5) ist damit der bewusste **Schritt über iTop hinaus in Richtung LeanIX „Interfaces"/Data-Flow** — und bleibt der eigentliche Differenzierer.

### 8.4 Konkrete Übernahmen ins Konzept

Aus dem iTop-Abgleich ergänzen wir die Feldkataloge um:
- **`inventarnummer`** (asset_number) in `WirtschaftlichkeitFields`,
- **`produktivnahmeDatum`** (move2production) — wichtig auch für AfA-Beginn,
- **`managementIp`** und **`redundanz`** in `HardwareFields` (für RZ-Geräte),
- **Software-End-of-Support** (`software_end_of_support`) als eigenes Datum (ergänzt das bestehende `lebenszyklus`),
- Bestätigung, dass **CPU/RAM einfache Text-/Number-Felder** sein dürfen (kein eigener Spezifikationsbaum nötig).

> **Fazit:** iTop validiert die vorgeschlagene Richtung. Wir übernehmen sein bewährtes Asset-/Software-Schema 1:1 in unsere schlankere deklarative Form und ergänzen die LeanIX-artige Schnittstellen-Ebene, die iTop (frei) nicht bietet. Ein 1:1-Einsatz von iTop selbst scheidet aus, weil es ein server-/datenbankbasiertes PHP-System ist — unvereinbar mit dem Designprinzip „kein Backend, offline, localStorage".

---

## 9. Umsetzungsstatus

> Aus dem Konzeptpapier ist Implementierung geworden. Alle Phasen sind umgesetzt; `npx tsc -b --noEmit` ist fehlerfrei, `npm run build` und `npm test` laufen grün.

| Phase | Inhalt | Status |
|---|---|---|
| **1 — Framework** | FieldTypes `number`/`date`/`url`; FieldDef-Attribute `unit`/`min`/`step`/`placeholder`/`section`/`showIf`; `group` um `hardware`/`wirtschaft` erweitert; `isFieldVisible()`-Helper; Render in `CategoryForm` (Unit-Suffix, native date, url-„öffnen"-Link); einklappbare Sektionen; gruppierte Fieldsets; Completeness respektiert `showIf` | ✅ Erledigt |
| **2 — Mixins HW + Wirtschaft** | `HardwareFields` + `WirtschaftlichkeitFields` (Typen + `HARDWARE_FIELDS`/`WIRTSCHAFTLICHKEIT_FIELDS`-Kataloge + Anhänge-Schleife); iTop-Ergänzungen (`inventarnummer`, `produktivnahmeDatum`, `managementIp`, `redundanz`, `softwareSupportEnde`); tiefe Technik (CPU/RAM/Disk/Netzteile) in collapsible „Technische Details" (Decision 2) | ✅ Erledigt |
| **3 — Software-Tiefe + Conditional** | Anwendung: `hersteller`/`produktname`/`version`/`updateZyklus` + 3 URL-Links; 8 typabhängige Feldsätze via `showIf` auf `typ` (Datenbank, Webserver/Backend, Betriebssystem-nah, Middleware, ERP/CRM, Monitoring/Security, Backup, Virtualisierung); `typ`-Optionen um „Backup-Software" + „Virtualisierung / Hypervisor" ergänzt | ✅ Erledigt |
| **4 — Betriebssysteme (eigene Kategorie)** | `Betriebssystem`-Interface (IT-Component, Decision 1) + Kategorie `betriebssysteme` (Prefix `OS`); multiref von Server **und** Client; `store.ts` (`createDefaultState` + `arrayKeys`); Help-Text. Ermöglicht „Server → OS → Apps" | ✅ Erledigt |
| **5 — Schnittstellen (eigene Kategorie)** | `Schnittstelle`-Interface + Kategorie `schnittstellen` (Prefix `SS`) mit vollen Attributen; quell/ziel als `multiref → anwendungen` (engine-konform, primär = erster Eintrag); `store.ts`-Migration; Help-Text (Decision 3) | ✅ Erledigt |
| **6 — Visualisierung & Matrix** | `InfrastrukturLandkarte`: Modus „Schnittstellen-Graph" (gerichtet, Kantenfarbe nach Verschlüsselung); neue Komponente `SchnittstellenMatrix.tsx` (druckbare n×n-Data-Flow-Matrix); in `ProjectView` als Subtab verdrahtet (Decision 3) | ✅ Erledigt |
| **7 — AfA + TCO-Aggregation + Exporte** | `src/wirtschaftlichkeit.ts` (`berechneBuchwert` lineare AfA, `summiereObjektkosten`); TCO „Aus Objektdaten übernehmen" (non-destruktiv) + druckbare Asset-/AfA-Übersicht; Excel-/Report-Export automatisch über deklarative Engine (Decision 4) | ✅ Erledigt |

### Bestätigte Produktentscheidungen (umgesetzt)

1. **Betriebssysteme = eigene Kategorie** `betriebssysteme` (wiederverwendbare IT-Component, multiref von Server/Client).
2. **Hardware-Tiefe** = Basics immer sichtbar + volle Technik im einklappbaren Block „Technische Details".
3. **Schnittstellen = eigene Kategorie** `schnittstellen` mit voller Attributik **plus** n×n-Data-Flow-Matrix und gerichtetem Graph.
4. **Wirtschaftlichkeit** = Erfassungsfelder + automatische Buchwert-/lineare-AfA-Berechnung + Aggregation der Einzel-Objektkosten in das TCO-Modul (Single Source of Truth).

### DATAGerry-inspirierte Features (umgesetzt 2026-06-22)

Im Zuge des DATAGerry-Vergleichs (`docs/DATAGERRY_VERGLEICH.md`) wurden vier weitere Features umgesetzt, die das Tool näher an eine vollwertige CMDB-Ergonomie bringen:

| Feature | Dateien | Status |
|---|---|---|
| **Globale Volltext-Suche** (`Ctrl+K`) | `src/components/GlobalSearch.tsx` | ✅ Umgesetzt 2026-06-22 |
| **Import Fehler-Recovery** | `src/components/ImportWizard.tsx`, `src/utils/import.ts` | ✅ Umgesetzt 2026-06-22 |
| **Objekt-Notizen-Feed** | `src/components/ObjektNotizen.tsx`, `BaseItem.notizen[]` | ✅ Umgesetzt 2026-06-22 |
| **Multi-Data-Sections / Tabellenfelder** | `src/components/TableField.tsx`, FieldType `'table'` | ✅ Umgesetzt 2026-06-22 |
| **Fuzzy-Keyword-Mapping** | `src/utils/feldAliase.ts` (60+ Felder, 200+ Aliase) | ✅ Umgesetzt 2026-06-22 |

**GlobalSearch (`Ctrl+K`):** Modal-Overlay mit Volltext-Suche über alle 14 Kategorie-Arrays. Ergebnisse gruppiert nach Kategorie, Tastaturnavigation (↑↓Enter), max. 50 Ergebnisse.

**Import Fehler-Recovery:** Nach dem Excel-Mapping-Schritt wird jede Zeile validiert. Valide Zeilen werden importiert, fehlgeschlagene Zeilen erscheinen in einer Validierungstabelle (Zeile / Feld / Problem) und sind als CSV downloadbar für Korrektur und Re-Import.

**Objekt-Notizen:** `BaseItem` um `notizen: Array<{ text, datum, autor? }>` erweitert. Ausklappbarer Kommentar-Feed am Ende jedes Formulars. Migration: `mergeWithDefault` ergänzt `notizen: []` transparent in allen vorhandenen Objekten.

**Multi-Data-Sections:** Neuer `FieldType 'table'` in `FieldDef`. `TableField.tsx` rendert inline editierbare Tabellenzeilen (Zeile hinzufügen / löschen). Wert im Store: JSON-Array als String (Export-Format unverändert). Eingesetzt bei Server (Netzwerk-Interfaces) und Anwendungen (Lizenzen).

**Fuzzy-Keyword-Mapping:** `src/utils/feldAliase.ts` enthält 60+ Feld-Schlüssel mit je mehreren deutschen und englischen Aliasen (gesamt 200+ Aliase). Wird in `importAnalyzer.ts` für die Spalten-Erkennung beim Excel-Import verwendet — erkennt z. B. „Hostname", „Servername", „Server Name" alle als `name`.

### Migrationssicherheit

Alle neuen Felder sind optional; die einzigen Top-Level-Ergänzungen (`betriebssysteme`, `schnittstellen`) werden in `createDefaultState()` und der `arrayKeys`-Liste in `store.ts` abgefangen. Alte JSON-Backups laden über `mergeWithDefault` unverändert — **kein Breaking-Change am Export-Format**.

---

## Plattform-Zuordnung (Läuft-auf-Logik)

Sanfter Nudge, mit dem das Formular aktiv fragt: **„Worauf läuft dieses Objekt?"** — offen lassen ist erlaubt (kein Save-Block) und wird als offener Punkt erfasst.

**Scope (Laufzeit-Objekte):** `anwendungen`, `betriebssysteme`, `clients`, `icsSysteme`, `iotSysteme`. **NICHT** `server` — ein Server *ist* die Plattform.

- **Neues Feld `plattformTyp`** (`group: 'plattform'`, FieldType `select`) je Laufzeit-Kategorie. Optionen: `Physische Hardware`, `Virtuelle Maschine`, `Container`, `Cloud-Dienst / SaaS`, `Externes System (Dienstleister)`, `Unklar — beim Kunden erfragen`. Steht jeweils zuerst in der Plattform-Gruppe.
- **Relations-Felder (multiref) pro Kategorie** (`src/utils/plattform.ts` → `PLATTFORM_RELATION_FIELDS`):
  - `anwendungen`: `itSysteme` (→ server, „Läuft auf Server / Host") + neu `betriebssysteme` (→ betriebssysteme, „Läuft auf Betriebssystem")
  - `betriebssysteme`: neu `itSysteme` (→ server, „Installiert auf Server / Host")
  - `clients`: `betriebssysteme` + `itSysteme` (beide in Plattform-Gruppe)
  - `icsSysteme`, `iotSysteme`: `itSysteme` (→ server, „Läuft auf Server / Host")
- **Neue Form-Gruppe `'plattform'`** (FieldDef-`group`-Union erweitert). `CategoryForm.tsx` rendert sie als eigenes violett-getöntes `<fieldset>` „Plattform — Worauf läuft das?" direkt nach dem Basis-Block, vor Hardware.
- **Soft-Nudge** (nicht blockierend), berechnet aus dem aktuellen Formularstand via `isPlatformUnassigned()`:
  - `plattformTyp = 'Unklar — …'` → neutraler Hinweis „Als offener Punkt markiert".
  - kein Link und kein konkreter Typ → amber Hinweis „💡 Worauf läuft dieses Objekt? …".
  - sonst (verknüpft oder konkreter Typ gewählt) → kein Nudge.
- **OffenePunkte-Integration:** additiver, separater Block „Offene Plattform-Zuordnungen (Worauf läuft das?)" über `findPlatformGaps(state)` — unabhängig von der bestehenden Cloud-Feld-Logik. Badge „explizit Unklar" vs. „noch nicht zugeordnet", „Bearbeiten" springt via `onEditItem(id)` ins Formular.
- **Bidirektionale Konsistenz:** ein neues `BIDIR_PAIRS`-Paar `['betriebssysteme','itSysteme','server','betriebssysteme']` hält OS↔Server-Links synchron.
- **Migration:** alle Felder optional, Werte bleiben Strings/Arrays — alte Backups laden unverändert (kein Breaking-Change am Export-Format).
