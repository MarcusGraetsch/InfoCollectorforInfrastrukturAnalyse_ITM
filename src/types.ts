export interface BaseEntry {
  id: string;
  kuerzel: string;
  name: string;
  erlaeuterung: string;
  status: string;
  tags: string;
}

export interface Geschaeftsprozess extends BaseEntry {
  prozessArt: string;
  verantwortlicher: string;
  beteiligte: string;
  daten: string[];
  anwendungen: string[];
}

export interface Datum extends BaseEntry {
  personenbezug: string;
  verantwortlicher: string;
  beteiligte: string;
  anwendungen: string[];
}

export interface Anwendung extends BaseEntry {
  verantwortlicher: string;
  benutzer: string;
  anwendungen: string[];
  itSysteme: string[];
  netzverbindungen: string[];
}

export interface Datentraeger extends BaseEntry {
  anzahl: string;
  verantwortlicher: string;
  benutzer: string;
  daten: string[];
  anwendungen: string[];
}

export interface Server extends BaseEntry {
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

export interface Netzkomponente extends BaseEntry {
  anzahl: string;
  plattform: string;
  verantwortlicher: string;
  itSysteme: string[];
  netzverbindungen: string[];
  raeume: string[];
  gebaeude: string[];
}

export interface Netzverbindung extends BaseEntry {
  protokolle: string;
  externNetz: string;
  anwendungen: string[];
  clients: string[];
  server: string[];
  netzverbindungen: string[];
  netzkomponenten: string[];
  raeume: string[];
  gebaeude: string[];
}

export interface Client extends BaseEntry {
  anzahl: string;
  plattform: string;
  verantwortlicher: string;
  benutzer: string;
  itSysteme: string[];
  netzverbindungen: string[];
  raeume: string[];
  gebaeude: string[];
}

export interface ICSSystem extends BaseEntry {
  anzahl: string;
  plattform: string;
  verantwortlicher: string;
  benutzer: string;
  itSysteme: string[];
  netzverbindungen: string[];
  raeume: string[];
  gebaeude: string[];
}

export interface IoTSystem extends BaseEntry {
  anzahl: string;
  plattform: string;
  verantwortlicher: string;
  benutzer: string;
  itSysteme: string[];
  netzverbindungen: string[];
  raeume: string[];
  gebaeude: string[];
}

export interface Raum {
  id: string;
  kuerzel: string;
  name: string;
  erlaeuterung: string;
  anzahl: string;
  verantwortlicher: string;
  benutzer: string;
  tags: string;
  gebaeude: string[];
}

export interface Gebaeude {
  id: string;
  kuerzel: string;
  name: string;
  erlaeuterung: string;
  anzahl: string;
  verantwortlicher: string;
  benutzer: string;
  tags: string;
}

export interface AppData {
  kundenname: string;
  letzteAktualisierung: string;
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

export type CategoryKey = keyof Omit<AppData, 'kundenname' | 'letzteAktualisierung'>;
