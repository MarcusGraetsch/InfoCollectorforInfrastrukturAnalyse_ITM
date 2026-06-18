export type Status = 'Aktiv' | 'Inaktiv' | 'In Planung' | 'Außer Betrieb';
export type JaNein = 'Ja' | 'Nein';
export type ProzessArt = 'Kernprozess' | 'Unterstützungsprozess';

export interface BaseItem {
  id: string;
  kuerzel: string;
  name: string;
  erlaeuterung: string;
  tags: string;
}

/**
 * Zusätzliche cloud-relevante Attribute zur Vorbereitung des
 * Cloud-Readiness-Workshops. Werden bei Anwendungen und IT-Systemen erfasst.
 */
export interface CloudFields {
  schutzbedarf?: 'Normal' | 'Hoch' | 'Sehr hoch' | 'Unklar' | '';
  datensouveraenitaet?: string;
  bereitstellung?: string;
  cloudDienst?: string;
  lizenzCloudfaehig?: string;
  migrationskomplexitaet?: string;
  lebenszyklus?: string;
  internetfaehig?: string;
  cloudEignung?: string;
  cloudNotiz?: string;
}

export interface Geschaeftsprozess extends BaseItem {
  status: Status;
  prozessArt: ProzessArt | '';
  verantwortlicher: string;
  beteiligte: string;
  daten: string[];
  anwendungen: string[];
}

export interface Datum extends BaseItem {
  status: Status;
  personenbezug: JaNein | '';
  datensouveraenitaet?: string;
  verantwortlicher: string;
  beteiligte: string;
  anwendungen: string[];
}

export interface Anwendung extends BaseItem, CloudFields {
  status: Status;
  verantwortlicher: string;
  benutzer: string;
  anwendungen: string[];
  itSysteme: string[];
  netzverbindungen: string[];
}

export interface Datentraeger extends BaseItem {
  status: Status;
  anzahl: string;
  verantwortlicher: string;
  benutzer: string;
  daten: string[];
  anwendungen: string[];
}

export interface Server extends BaseItem, CloudFields {
  status: Status;
  anzahl: string;
  plattform: string;
  verantwortlicher: string;
  benutzer: string;
  anwendungen: string[];
  itSysteme: string[];
  netzverbindungen: string[];
  raeume: string[];
  gebaeude: string[];
}

export interface Netzkomponente extends BaseItem {
  status: Status;
  anzahl: string;
  plattform: string;
  verantwortlicher: string;
  itSysteme: string[];
  netzverbindungen: string[];
  raeume: string[];
  gebaeude: string[];
}

export interface Netzverbindung extends BaseItem {
  status: Status;
  protokolle: string;
  externNetz: JaNein | '';
  anwendungen: string[];
  clients: string[];
  server: string[];
  netzverbindungen: string[];
  netzkomponenten: string[];
  raeume: string[];
  gebaeude: string[];
}

export interface Client extends BaseItem, CloudFields {
  status: Status;
  anzahl: string;
  plattform: string;
  verantwortlicher: string;
  benutzer: string;
  itSysteme: string[];
  netzverbindungen: string[];
  raeume: string[];
  gebaeude: string[];
}

export interface ICSSystem extends BaseItem, CloudFields {
  status: Status;
  anzahl: string;
  plattform: string;
  verantwortlicher: string;
  benutzer: string;
  itSysteme: string[];
  netzverbindungen: string[];
  raeume: string[];
  gebaeude: string[];
}

export interface IoTSystem extends BaseItem, CloudFields {
  status: Status;
  anzahl: string;
  plattform: string;
  verantwortlicher: string;
  benutzer: string;
  itSysteme: string[];
  netzverbindungen: string[];
  raeume: string[];
  gebaeude: string[];
}

export interface Raum extends BaseItem {
  anzahl: string;
  verantwortlicher: string;
  benutzer: string;
  gebaeude: string[];
}

export interface Gebaeude extends BaseItem {
  anzahl: string;
  verantwortlicher: string;
  benutzer: string;
}

/** Vom Kunden bereits gelieferte Unterlagen (Phase A der Erhebung). */
export interface Quelldokument {
  id: string;
  name: string;
  art: string;
  erhaltenAm: string;
  ausgewertet: boolean;
  notiz: string;
}

/** Rahmendaten für die spätere Cloud-Strategie / den Readiness-Workshop. */
export interface CloudStrategyMeta {
  ziel: string;
  treiber: string[];
  zielumgebung: string[];
  zeithorizont: string;
  notizen: string;
}

export interface AppState {
  customerName: string;
  lastUpdated: string;
  cloudStrategy: CloudStrategyMeta;
  quelldokumente: Quelldokument[];
  geschaeftsprozesse: Geschaeftsprozess[];
  daten: Datum[];
  anwendungen: Anwendung[];
  datentraeger: Datentraeger[];
  server: Server[];
  netzkomponenten: Netzkomponente[];
  netzverbindungen: Netzverbindung[];
  clients: Client[];
  icsSysteme: ICSSystem[];
  iotSysteme: IoTSystem[];
  raeume: Raum[];
  gebaeude: Gebaeude[];
}

export type CategoryKey = keyof Omit<
  AppState,
  'customerName' | 'lastUpdated' | 'cloudStrategy' | 'quelldokumente'
>;
