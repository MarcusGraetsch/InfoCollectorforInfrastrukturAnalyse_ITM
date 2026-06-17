import type { CategoryKey } from './types';

export type FieldType = 'text' | 'textarea' | 'select' | 'multiref';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  refCategory?: CategoryKey;
  tooltip?: string;
  required?: boolean;
}

export interface CategoryDef {
  key: CategoryKey;
  label: string;
  prefix: string;
  fields: FieldDef[];
}

const STATUS_FIELD: FieldDef = {
  key: 'status',
  label: 'Status',
  type: 'select',
  options: ['Aktiv', 'Inaktiv', 'In Planung', 'Außer Betrieb'],
  tooltip: 'Aktueller Betriebsstatus des Eintrags',
  required: true,
};

const TAGS_FIELD: FieldDef = {
  key: 'tags',
  label: 'Tags',
  type: 'text',
  tooltip: 'Kommagetrennte Schlagwörter zur Kategorisierung',
};

export const CATEGORIES: CategoryDef[] = [
  {
    key: 'geschaeftsprozesse',
    label: 'Geschäftsprozesse',
    prefix: 'GP',
    fields: [
      { key: 'kuerzel', label: 'Kürzel', type: 'text', tooltip: 'Eindeutiges Kürzel, z.B. GP-001', required: true },
      { key: 'name', label: 'Name', type: 'text', tooltip: 'Bezeichnung des Geschäftsprozesses', required: true },
      { key: 'erlaeuterung', label: 'Erläuterung', type: 'textarea', tooltip: 'Beschreibung und Zweck des Prozesses' },
      STATUS_FIELD,
      { key: 'prozessArt', label: 'Prozess-Art', type: 'select', options: ['Kernprozess', 'Unterstützungsprozess'], tooltip: 'Art des Prozesses: Kern- oder Unterstützungsprozess' },
      { key: 'verantwortlicher', label: 'Verantwortlicher/Fachabteilung', type: 'text', tooltip: 'Zuständige Person oder Abteilung' },
      { key: 'beteiligte', label: 'Beteiligte', type: 'text', tooltip: 'Weitere beteiligte Personen oder Rollen' },
      TAGS_FIELD,
      { key: 'daten', label: 'Daten', type: 'multiref', refCategory: 'daten', tooltip: 'Verknüpfte Datenobjekte' },
      { key: 'anwendungen', label: 'Anwendungen', type: 'multiref', refCategory: 'anwendungen', tooltip: 'Unterstützende Anwendungen' },
    ],
  },
  {
    key: 'daten',
    label: 'Daten',
    prefix: 'D',
    fields: [
      { key: 'kuerzel', label: 'Kürzel', type: 'text', tooltip: 'Eindeutiges Kürzel, z.B. D-001', required: true },
      { key: 'name', label: 'Name', type: 'text', tooltip: 'Bezeichnung des Datenobjekts', required: true },
      { key: 'erlaeuterung', label: 'Erläuterung', type: 'textarea', tooltip: 'Beschreibung der Daten und ihres Verwendungszwecks' },
      STATUS_FIELD,
      { key: 'personenbezug', label: 'Personenbezug', type: 'select', options: ['Ja', 'Nein'], tooltip: 'Enthält das Datenobjekt personenbezogene Daten (DSGVO relevant)?' },
      { key: 'verantwortlicher', label: 'Verantwortlicher/Fachabteilung', type: 'text', tooltip: 'Zuständige Person oder Abteilung' },
      { key: 'beteiligte', label: 'Beteiligte', type: 'text', tooltip: 'Weitere beteiligte Personen oder Rollen' },
      TAGS_FIELD,
      { key: 'anwendungen', label: 'Anwendungen', type: 'multiref', refCategory: 'anwendungen', tooltip: 'Anwendungen, die diese Daten verarbeiten' },
    ],
  },
  {
    key: 'anwendungen',
    label: 'Anwendungen',
    prefix: 'A',
    fields: [
      { key: 'kuerzel', label: 'Kürzel', type: 'text', tooltip: 'Eindeutiges Kürzel, z.B. A-001', required: true },
      { key: 'name', label: 'Name', type: 'text', tooltip: 'Name der Anwendung/Software', required: true },
      { key: 'erlaeuterung', label: 'Erläuterung', type: 'textarea', tooltip: 'Beschreibung und Zweck der Anwendung' },
      STATUS_FIELD,
      { key: 'verantwortlicher', label: 'Verantwortlich/Administrator', type: 'text', tooltip: 'Technisch verantwortliche Person oder Rolle' },
      { key: 'benutzer', label: 'Benutzer', type: 'text', tooltip: 'Nutzergruppen oder Personen die die Anwendung verwenden' },
      TAGS_FIELD,
      { key: 'anwendungen', label: 'Abhängige Anwendungen', type: 'multiref', refCategory: 'anwendungen', tooltip: 'Andere Anwendungen von denen diese abhängt' },
      { key: 'itSysteme', label: 'IT-Systeme', type: 'multiref', refCategory: 'server', tooltip: 'Server und Systeme auf denen die Anwendung läuft' },
      { key: 'netzverbindungen', label: 'Netzverbindungen', type: 'multiref', refCategory: 'netzverbindungen', tooltip: 'Genutzte Netzverbindungen' },
    ],
  },
  {
    key: 'datentraeger',
    label: 'Datenträger',
    prefix: 'DT',
    fields: [
      { key: 'kuerzel', label: 'Kürzel', type: 'text', tooltip: 'Eindeutiges Kürzel, z.B. DT-001', required: true },
      { key: 'name', label: 'Name', type: 'text', tooltip: 'Bezeichnung des Datenträgers', required: true },
      { key: 'erlaeuterung', label: 'Erläuterung', type: 'textarea', tooltip: 'Beschreibung des Datenträgers (Typ, Verwendung)' },
      STATUS_FIELD,
      { key: 'anzahl', label: 'Anzahl', type: 'text', tooltip: 'Anzahl der vorhandenen Einheiten' },
      { key: 'verantwortlicher', label: 'Verantwortlich/Administrator', type: 'text', tooltip: 'Zuständige Person oder Rolle' },
      { key: 'benutzer', label: 'Benutzer', type: 'text', tooltip: 'Nutzergruppen des Datenträgers' },
      TAGS_FIELD,
      { key: 'daten', label: 'Daten', type: 'multiref', refCategory: 'daten', tooltip: 'Auf dem Datenträger gespeicherte Daten' },
      { key: 'anwendungen', label: 'Anwendungen', type: 'multiref', refCategory: 'anwendungen', tooltip: 'Anwendungen die den Datenträger nutzen' },
    ],
  },
  {
    key: 'server',
    label: 'Server',
    prefix: 'S',
    fields: [
      { key: 'kuerzel', label: 'Kürzel', type: 'text', tooltip: 'Eindeutiges Kürzel, z.B. S-001', required: true },
      { key: 'name', label: 'Name', type: 'text', tooltip: 'Hostname oder Bezeichnung des Servers', required: true },
      { key: 'erlaeuterung', label: 'Erläuterung', type: 'textarea', tooltip: 'Beschreibung und Funktion des Servers' },
      STATUS_FIELD,
      { key: 'anzahl', label: 'Anzahl', type: 'text', tooltip: 'Anzahl gleichartiger Server' },
      { key: 'plattform', label: 'Plattform', type: 'text', tooltip: 'Betriebssystem und Version, z.B. Windows Server 2022' },
      { key: 'verantwortlicher', label: 'Verantwortlich/Administrator', type: 'text', tooltip: 'Systemadministrator oder zuständige Rolle' },
      { key: 'benutzer', label: 'Benutzer', type: 'text', tooltip: 'Nutzergruppen des Servers' },
      TAGS_FIELD,
      { key: 'anwendungen', label: 'Anwendungen', type: 'multiref', refCategory: 'anwendungen', tooltip: 'Auf dem Server betriebene Anwendungen' },
      { key: 'itSysteme', label: 'IT-Systeme', type: 'multiref', refCategory: 'server', tooltip: 'Verknüpfte IT-Systeme' },
      { key: 'netzverbindungen', label: 'Netzverbindungen', type: 'multiref', refCategory: 'netzverbindungen', tooltip: 'Netzverbindungen des Servers' },
      { key: 'raeume', label: 'Räume', type: 'multiref', refCategory: 'raeume', tooltip: 'Aufstellungsort (Raum)' },
      { key: 'gebaeude', label: 'Gebäude', type: 'multiref', refCategory: 'gebaeude', tooltip: 'Aufstellungsort (Gebäude)' },
    ],
  },
  {
    key: 'netzkomponenten',
    label: 'Netzkomponenten',
    prefix: 'NK',
    fields: [
      { key: 'kuerzel', label: 'Kürzel', type: 'text', tooltip: 'Eindeutiges Kürzel, z.B. NK-001', required: true },
      { key: 'name', label: 'Name', type: 'text', tooltip: 'Bezeichnung der Netzkomponente', required: true },
      { key: 'erlaeuterung', label: 'Erläuterung', type: 'textarea', tooltip: 'Beschreibung und Funktion (Switch, Router, Firewall, etc.)' },
      STATUS_FIELD,
      { key: 'anzahl', label: 'Anzahl', type: 'text', tooltip: 'Anzahl gleichartiger Komponenten' },
      { key: 'plattform', label: 'Plattform', type: 'text', tooltip: 'Hersteller, Modell und Firmware-Version' },
      { key: 'verantwortlicher', label: 'Verantwortlich/Administrator', type: 'text', tooltip: 'Zuständige Person oder Rolle' },
      TAGS_FIELD,
      { key: 'itSysteme', label: 'IT-Systeme', type: 'multiref', refCategory: 'server', tooltip: 'Angeschlossene IT-Systeme' },
      { key: 'netzverbindungen', label: 'Netzverbindungen', type: 'multiref', refCategory: 'netzverbindungen', tooltip: 'Zugehörige Netzverbindungen' },
      { key: 'raeume', label: 'Räume', type: 'multiref', refCategory: 'raeume', tooltip: 'Aufstellungsort (Raum)' },
      { key: 'gebaeude', label: 'Gebäude', type: 'multiref', refCategory: 'gebaeude', tooltip: 'Aufstellungsort (Gebäude)' },
    ],
  },
  {
    key: 'netzverbindungen',
    label: 'Netzverbindungen',
    prefix: 'N',
    fields: [
      { key: 'kuerzel', label: 'Kürzel', type: 'text', tooltip: 'Eindeutiges Kürzel, z.B. N-001', required: true },
      { key: 'name', label: 'Name', type: 'text', tooltip: 'Bezeichnung der Netzverbindung', required: true },
      { key: 'erlaeuterung', label: 'Erläuterung', type: 'textarea', tooltip: 'Beschreibung der Verbindung und ihres Zwecks' },
      STATUS_FIELD,
      { key: 'protokolle', label: 'Protokolle', type: 'text', tooltip: 'Verwendete Protokolle, z.B. TCP/IP, HTTPS, VPN' },
      { key: 'externNetz', label: 'Extern.Netz', type: 'select', options: ['Ja', 'Nein'], tooltip: 'Handelt es sich um eine externe Netzverbindung (Internet, WAN)?' },
      TAGS_FIELD,
      { key: 'anwendungen', label: 'Anwendungen', type: 'multiref', refCategory: 'anwendungen', tooltip: 'Anwendungen die diese Verbindung nutzen' },
      { key: 'clients', label: 'Clients', type: 'multiref', refCategory: 'clients', tooltip: 'Verbundene Clients' },
      { key: 'server', label: 'Server', type: 'multiref', refCategory: 'server', tooltip: 'Verbundene Server' },
      { key: 'netzverbindungen', label: 'Netzverbindungen', type: 'multiref', refCategory: 'netzverbindungen', tooltip: 'Verknüpfte Netzverbindungen' },
      { key: 'netzkomponenten', label: 'Netzkomponenten', type: 'multiref', refCategory: 'netzkomponenten', tooltip: 'Beteiligte Netzkomponenten' },
      { key: 'raeume', label: 'Räume', type: 'multiref', refCategory: 'raeume', tooltip: 'Betroffene Räume' },
      { key: 'gebaeude', label: 'Gebäude', type: 'multiref', refCategory: 'gebaeude', tooltip: 'Betroffene Gebäude' },
    ],
  },
  {
    key: 'clients',
    label: 'Clients',
    prefix: 'C',
    fields: [
      { key: 'kuerzel', label: 'Kürzel', type: 'text', tooltip: 'Eindeutiges Kürzel, z.B. C-001', required: true },
      { key: 'name', label: 'Name', type: 'text', tooltip: 'Bezeichnung des Clients', required: true },
      { key: 'erlaeuterung', label: 'Erläuterung', type: 'textarea', tooltip: 'Beschreibung und Verwendungszweck des Clients' },
      STATUS_FIELD,
      { key: 'anzahl', label: 'Anzahl', type: 'text', tooltip: 'Anzahl gleichartiger Clients' },
      { key: 'plattform', label: 'Plattform', type: 'text', tooltip: 'Betriebssystem und Version, z.B. Windows 11' },
      { key: 'verantwortlicher', label: 'Verantwortlich/Administrator', type: 'text', tooltip: 'Zuständige Person oder Rolle' },
      { key: 'benutzer', label: 'Benutzer', type: 'text', tooltip: 'Nutzergruppen des Clients' },
      TAGS_FIELD,
      { key: 'itSysteme', label: 'IT-Systeme', type: 'multiref', refCategory: 'server', tooltip: 'Verknüpfte IT-Systeme' },
      { key: 'netzverbindungen', label: 'Netzverbindungen', type: 'multiref', refCategory: 'netzverbindungen', tooltip: 'Netzverbindungen des Clients' },
      { key: 'raeume', label: 'Räume', type: 'multiref', refCategory: 'raeume', tooltip: 'Aufstellungsort (Raum)' },
      { key: 'gebaeude', label: 'Gebäude', type: 'multiref', refCategory: 'gebaeude', tooltip: 'Aufstellungsort (Gebäude)' },
    ],
  },
  {
    key: 'icsSysteme',
    label: 'ICS-Systeme',
    prefix: 'ICS',
    fields: [
      { key: 'kuerzel', label: 'Kürzel', type: 'text', tooltip: 'Eindeutiges Kürzel, z.B. ICS-001', required: true },
      { key: 'name', label: 'Name', type: 'text', tooltip: 'Bezeichnung des ICS-Systems', required: true },
      { key: 'erlaeuterung', label: 'Erläuterung', type: 'textarea', tooltip: 'Beschreibung des industriellen Steuerungssystems' },
      STATUS_FIELD,
      { key: 'anzahl', label: 'Anzahl', type: 'text', tooltip: 'Anzahl gleichartiger Systeme' },
      { key: 'plattform', label: 'Plattform', type: 'text', tooltip: 'Hersteller, Typ und Version des Systems' },
      { key: 'verantwortlicher', label: 'Verantwortlich/Administrator', type: 'text', tooltip: 'Zuständige Person oder Rolle' },
      { key: 'benutzer', label: 'Benutzer', type: 'text', tooltip: 'Nutzergruppen des Systems' },
      TAGS_FIELD,
      { key: 'itSysteme', label: 'IT-Systeme', type: 'multiref', refCategory: 'server', tooltip: 'Verknüpfte IT-Systeme' },
      { key: 'netzverbindungen', label: 'Netzverbindungen', type: 'multiref', refCategory: 'netzverbindungen', tooltip: 'Netzverbindungen des Systems' },
      { key: 'raeume', label: 'Räume', type: 'multiref', refCategory: 'raeume', tooltip: 'Aufstellungsort (Raum)' },
      { key: 'gebaeude', label: 'Gebäude', type: 'multiref', refCategory: 'gebaeude', tooltip: 'Aufstellungsort (Gebäude)' },
    ],
  },
  {
    key: 'iotSysteme',
    label: 'IoT-Systeme',
    prefix: 'IoT',
    fields: [
      { key: 'kuerzel', label: 'Kürzel', type: 'text', tooltip: 'Eindeutiges Kürzel, z.B. IoT-001', required: true },
      { key: 'name', label: 'Name', type: 'text', tooltip: 'Bezeichnung des IoT-Geräts', required: true },
      { key: 'erlaeuterung', label: 'Erläuterung', type: 'textarea', tooltip: 'Beschreibung und Verwendungszweck des IoT-Geräts' },
      STATUS_FIELD,
      { key: 'anzahl', label: 'Anzahl', type: 'text', tooltip: 'Anzahl gleichartiger Geräte' },
      { key: 'plattform', label: 'Plattform', type: 'text', tooltip: 'Hersteller, Modell und Firmware-Version' },
      { key: 'verantwortlicher', label: 'Verantwortlich/Administrator', type: 'text', tooltip: 'Zuständige Person oder Rolle' },
      { key: 'benutzer', label: 'Benutzer', type: 'text', tooltip: 'Nutzergruppen des Geräts' },
      TAGS_FIELD,
      { key: 'itSysteme', label: 'IT-Systeme', type: 'multiref', refCategory: 'server', tooltip: 'Verknüpfte IT-Systeme' },
      { key: 'netzverbindungen', label: 'Netzverbindungen', type: 'multiref', refCategory: 'netzverbindungen', tooltip: 'Netzverbindungen des Geräts' },
      { key: 'raeume', label: 'Räume', type: 'multiref', refCategory: 'raeume', tooltip: 'Aufstellungsort (Raum)' },
      { key: 'gebaeude', label: 'Gebäude', type: 'multiref', refCategory: 'gebaeude', tooltip: 'Aufstellungsort (Gebäude)' },
    ],
  },
  {
    key: 'raeume',
    label: 'Räume',
    prefix: 'R',
    fields: [
      { key: 'kuerzel', label: 'Kürzel', type: 'text', tooltip: 'Eindeutiges Kürzel, z.B. R-001', required: true },
      { key: 'name', label: 'Name', type: 'text', tooltip: 'Bezeichnung des Raums', required: true },
      { key: 'erlaeuterung', label: 'Erläuterung', type: 'textarea', tooltip: 'Beschreibung und Verwendungszweck des Raums' },
      { key: 'anzahl', label: 'Anzahl', type: 'text', tooltip: 'Anzahl gleichartiger Räume' },
      { key: 'verantwortlicher', label: 'Verantwortlich', type: 'text', tooltip: 'Zuständige Person oder Rolle' },
      { key: 'benutzer', label: 'Benutzer', type: 'text', tooltip: 'Nutzergruppen des Raums' },
      TAGS_FIELD,
      { key: 'gebaeude', label: 'Gebäude', type: 'multiref', refCategory: 'gebaeude', tooltip: 'Gebäude in dem sich der Raum befindet' },
    ],
  },
  {
    key: 'gebaeude',
    label: 'Gebäude',
    prefix: 'G',
    fields: [
      { key: 'kuerzel', label: 'Kürzel', type: 'text', tooltip: 'Eindeutiges Kürzel, z.B. G-001', required: true },
      { key: 'name', label: 'Name', type: 'text', tooltip: 'Bezeichnung des Gebäudes', required: true },
      { key: 'erlaeuterung', label: 'Erläuterung', type: 'textarea', tooltip: 'Adresse und Beschreibung des Gebäudes' },
      { key: 'anzahl', label: 'Anzahl', type: 'text', tooltip: 'Anzahl gleichartiger Gebäude' },
      { key: 'verantwortlicher', label: 'Verantwortlich', type: 'text', tooltip: 'Zuständige Person oder Rolle' },
      { key: 'benutzer', label: 'Benutzer', type: 'text', tooltip: 'Nutzergruppen des Gebäudes' },
      TAGS_FIELD,
    ],
  },
];

export const CATEGORY_MAP: Record<CategoryKey, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c])
) as Record<CategoryKey, CategoryDef>;
