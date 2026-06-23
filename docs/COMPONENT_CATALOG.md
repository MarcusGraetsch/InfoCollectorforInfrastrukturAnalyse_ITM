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
}
```

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

## Neue Einträge hinzufügen

Eintrag am Ende des Arrays `COMPONENT_CATALOG` in `src/data/componentCatalog.ts` anfügen:

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
- **`src/utils/componentCatalog.ts`**: Hilfsfunktionen (Suche, Autofill, Matching)
- **`src/components/ComponentPicker.tsx`**: Modal-UI zur Auswahl
- **`src/components/CategoryForm.tsx`**: Integration (Button + Toast)

Der Katalog ist vollständig offline und erfordert keine Netzwerkverbindung.
