# IT-Komponentenkatalog

## Zweck

Der lokale IT-Komponentenkatalog (`src/data/componentCatalog.ts`) enthält 120+ vordefinierte Einträge für gängige IT-Produkte und -Plattformen. Er ermöglicht es, Formularfelder in der Strukturanalyse mit einem Klick mit sinnvollen Standardwerten zu befüllen (nicht-destruktiv: nur leere Felder werden überschrieben).

## Einsatzgebiet

Der Katalog ist in der Komponente `CategoryForm.tsx` integriert und erscheint als Button "Aus Komponentenkatalog befüllen" für folgende Kategorien:

- `anwendungen`, `server`, `clients`, `betriebssysteme`
- `netzkomponenten`, `sicherheitskomponenten`, `icsSysteme`, `iotSysteme`, `datentraeger`

## Interface `ComponentCatalogEntry`

```typescript
export interface ComponentCatalogEntry {
  id: string;                    // stabile, eindeutige kebab-case ID
  kind: ComponentKind;           // Produktkategorie (os, database, iam, ...)
  vendor: string;                // Hersteller/Anbieter
  product: string;               // Produktname (für Suche und Anzeige)
  aliases?: string[];            // alternative Namen für die Suche
  versions?: string[];           // bekannte Versionen (neueste zuerst)
  categoryTargets: string[];     // BSI-Kategorien, in denen das Produkt auftaucht
  defaultFields: Record<string, string>; // Feld → Standardwert (autofill)
  relevance?: 'de' | 'eu' | 'global';
  cpePrefix?: string;            // CPE-Präfix (optional)
  purlType?: string;             // PURL-Typ (optional)
  endoflifeSlug?: string;        // Slug für endoflife.date (optional)
  tags?: string[];               // freie Tags für die Suche
  oeffentlicherSektor?: boolean; // für Behörden/BRD besonders relevant
  spec?: string;                 // kurze technische Spezifikation (NUR Anzeige, nie Autofill)
  priceInfo?: string;            // indikativer Preishinweis (NUR Anzeige, nie Autofill)
}
```

## Schema-validiertes Autofill (seit 2026-06)

Das Befüllen läuft über `buildCatalogAutofill(entry, version, categoryDef, currentValues)`
in `src/utils/componentCatalog.ts`. Es ist **schema-validiert** und **nicht-destruktiv**:

- Es werden **nur Felder** geschrieben, die in der `CategoryDef` der aktuellen Kategorie
  tatsächlich existieren. Phantom-Schlüssel der Katalogdaten (z.B. `betriebssystem`,
  `lizenzart`) werden verworfen und tauchen nie im Formular auf.
- Für `select`-Felder wird ein Wert nur gesetzt, wenn er **exakt eine der `options`** ist
  (andernfalls übersprungen — kein ungültiger Wert).
- `multiref`/`table`-Felder werden nie befüllt.
- Bereits ausgefüllte Felder werden **nie überschrieben**.
- `lizenztyp` wird aus dem (Freitext-)Lizenzstring des Eintrags heuristisch auf eine
  gültige Select-Option abgebildet (`Open Source (frei)`, `Subscription`,
  `Proprietär (OEM)`, `Proprietär (Volumenlizenz)`).
- `spec` und `priceInfo` sind **reine Anzeigefelder** im Picker-Detail und werden
  niemals in Formularfelder übernommen.

Die Picker-Komponente gibt nur noch `(entry, version)` zurück; die Validierung erfolgt
in `CategoryForm.tsx`, da nur dort die `categoryDef` vorliegt.

## Verfügbare `ComponentKind`-Werte

| Kind | Beschreibung |
|------|-------------|
| `os` | Betriebssysteme |
| `database` | Datenbanken |
| `webserver` | Web-Server (Apache, Nginx, IIS) |
| `appserver` | Application Server (Tomcat, Node.js, Spring) |
| `iam` | Identity & Access Management |
| `virtualization` | Hypervisoren (VMware, Proxmox, KVM) |
| `container` | Container/Kubernetes (Docker, K8s, OpenShift) |
| `devops` | CI/CD, Git, IaC (GitLab, Jenkins, Ansible) |
| `monitoring` | Monitoring & Logging (Zabbix, Prometheus, Grafana) |
| `backup` | Backup & Recovery |
| `storage` | Storage-Systeme (NAS, SAN, Object Storage) |
| `network` | Netzwerkgeräte (Router, Switches, Firewalls, VPN) |
| `security` | Sicherheitslösungen (EDR, SIEM, Vulnerability Scanner) |
| `office` | Office & Collaboration (M365, Nextcloud, LibreOffice) |
| `erp` | ERP-Systeme (SAP, Dynamics, Odoo) |
| `crm` | CRM-Systeme (Salesforce, SugarCRM) |
| `ics` | Industrial Control Systems (Siemens S7, SCADA) |
| `iot` | IoT-Plattformen (Mosquitto, Node-RED) |
| `middleware` | Middleware (Kafka, RabbitMQ, API Gateway) |
| `hardware` | Hardware (Server, Clients, Netzwerk-Appliances) |
| `cloud` | Cloud/Hyperscaler & souveräne Clouds (AWS, Azure, GCP, OTC, StackIT, …) |

### Hardware- und Cloud-Einträge

- **`hardware`**: physische Geräte. Bei Servern werden nur reale Felder befüllt
  (`hersteller`, `modell`, `formfaktor`), technische Eckdaten stehen in `spec`.
- **`cloud`**: Hyperscaler- und souveräne Cloud-Dienste. `bereitstellung` wird nur auf
  gültige Optionen gesetzt (`SaaS / Public Cloud`, `PaaS / App Service`,
  `Managed Kubernetes (Cloud)`). Instanz-/Service-Details stehen in `spec`,
  Richtpreise in `priceInfo`.

> **Hinweis zu Preisen:** Alle `priceInfo`-Angaben sind **indikativ** und mit Jahresstand
> versehen. Das Tool ist offline und ruft keine Live-Preise ab — die Werte müssen
> daher **regelmäßig manuell aktualisiert** werden.

### Ausgegraute Kind-Filter

Im `ComponentPicker` werden Kind-Filter-Buttons **ausgegraut und deaktiviert**, wenn der
Katalog für die aktuelle Kategorie keinen passenden Eintrag enthält. „Alle" ist immer
aktiv. Das verhindert leere „keine Einträge"-Ergebnisse beim Klick.

## Statistik (Stand 2026-06)

Insgesamt 120+ Einträge:

- OS: 18 Einträge
- Datenbanken: 14 Einträge
- Web-/App-Server: 10 Einträge
- IAM: 7 Einträge
- Virtualisierung: 6 Einträge
- Container: 4 Einträge
- DevOps: 13 Einträge
- Monitoring: 12 Einträge
- Backup/Storage: 12 Einträge
- Netzwerk: 12 Einträge
- Sicherheit: 14 Einträge
- Office/Kollaboration: 12 Einträge
- ERP/CRM: 8 Einträge
- Öffentlicher Sektor: 6 Einträge (oeffentlicherSektor: true)
- ICS/IoT: 9 Einträge
- Middleware: 8 Einträge

## Übersichts-Ansicht & Detail-Drawer (Subtab „Komponentenkatalog")

Die Komponente `KatalogUebersicht.tsx` (Subtab „Komponentenkatalog" in der Projektsicht)
bietet eine durchsuch- und filterbare Tabelle über **Basiskatalog + eigene Einträge**:

- **Klickbare Zeilen:** Ein Klick öffnet einen Detail-Drawer mit allen Attributen —
  Hersteller, Produkt, Klasse, Zielkategorien, Aliases, Versionen, Tags, Relevanz,
  Öffentlicher-Sektor-Markierung, Spec, `priceInfo` (mit Hinweis „indikativ"),
  `endoflifeSlug`, CPE, purl-Typ sowie die Default-Felder (Autofill-Vorschau).
- **Stat-Karten & Klassen-Filter** berücksichtigen eigene Einträge reaktiv.

## Eigene Komponenten ohne Code hinzufügen (empfohlener Nutzerweg)

Über die Schaltfläche **„+ Eigene Komponente hinzufügen"** in der Katalog-Übersicht legen
Berater:innen kundenspezifische Einträge direkt in der UI an — **ohne Code, ohne
Datei-Bearbeitung**. Das ist im Beratungstermin der vorgesehene Weg.

- Gespeichert werden eigene Einträge im Projekt-Datenbestand unter
  `AppState.customComponentCatalog` (persistiert via localStorage/IndexedDB,
  enthalten in JSON-Export/-Import).
- Sie werden zur Laufzeit über `setCustomCatalog()` registriert und in **allen**
  Such-, Filter- und Statistik-Funktionen sowie im `ComponentPicker` gleichberechtigt
  mit dem Basiskatalog zusammengeführt (`effectiveCatalog()`). In der UI sind sie mit
  dem Badge **EIGEN** markiert und können im Detail-Drawer wieder gelöscht werden.
- Pflichtangaben im Formular: Hersteller, Produkt und mindestens eine Zielkategorie.
  Die ID wird automatisch als `custom-<vendor>-<product>` (kollisionssicher) erzeugt.

## Basiskatalog erweitern (Entwicklerhinweis)

Der statische Basiskatalog bleibt für dauerhafte, projektübergreifende Ergänzungen in
`src/data/componentCatalog.ts` pflegbar. Eintrag am Ende des Arrays `COMPONENT_CATALOG`
anfügen:

```typescript
{
  id: 'mein-produkt-v2',          // eindeutig, kebab-case
  kind: 'database',
  vendor: 'Mein Anbieter',
  product: 'Mein Produkt 2.0',
  aliases: ['Mein Produkt', 'MP'],
  versions: ['2.0', '1.9'],
  categoryTargets: ['server', 'anwendungen'],
  defaultFields: {
    hersteller: 'Mein Anbieter',
    typ: 'Datenbank',
    lizenzart: 'Open Source (MIT)',
  },
  tags: ['datenbank', 'open-source'],
}
```

### Pflichtfelder

- `id`: eindeutige kebab-case ID (keine Duplikate!)
- `kind`: gültiger `ComponentKind`
- `vendor`: Herstellername
- `product`: Produktname
- `categoryTargets`: mindestens ein BSI-Kategorie-Schlüssel
- `defaultFields`: mindestens `hersteller` oder `typ` empfohlen

### Prüfung

Nach dem Hinzufügen: `npm run test` — der Test "all entries have unique ids" prüft Duplikate.

## Technische Architektur

- **`src/data/componentCatalog.ts`**: Statische Datendatei (kein Import von React oder anderen Komponenten)
- **`src/utils/componentCatalog.ts`**: Hilfsfunktionen (Suche, Autofill, Matching) +
  Custom-Registry (`setCustomCatalog`, `getCustomCatalog`, `effectiveCatalog`,
  `isCustomComponent`) — merged Basis- und Custom-Katalog
- **`src/components/ComponentPicker.tsx`**: Modal-UI zur Auswahl (nutzt `effectiveCatalog()`)
- **`src/components/CategoryForm.tsx`**: Integration (Button + Toast)
- **`src/components/KatalogUebersicht.tsx`**: Übersicht, Detail-Drawer, Custom-Formular
- **`AppState.customComponentCatalog`**: Persistenz der eigenen Einträge (store.ts:
  `createDefaultState` + `arrayKeys`); App.tsx registriert sie via `setCustomCatalog`

Der Katalog ist vollständig offline und erfordert keine Netzwerkverbindung.
