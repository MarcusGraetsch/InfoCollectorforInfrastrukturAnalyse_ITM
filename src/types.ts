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
  lebenszyklusDatum?: string;
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
  typ: string;
  verantwortlicher: string;
  benutzer: string;
  anwendungen: string[];
  itSysteme: string[];
  netzverbindungen: string[];
  lizenzAnbieter?: string;
  lizenzmodell?: string;
  lizenzkosten?: string;
  vertragsende?: string;
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

export interface Stakeholder {
  id: string;
  name: string;
  rolle: string;
  bereich: string;
  email: string;
  telefon: string;
  lgIds: number[];
  notizen: string;
}

export type MeetingTyp = 'Jour Fixe' | 'Lenkungsausschuss' | 'Workshop' | 'Sonstiges';

export interface MeetingTOP {
  id: string;
  titel: string;
  ergebnis: string;
  verantwortlich: string;
  faelligAm: string;
  status: 'Offen' | 'Erledigt';
}

export interface Meeting {
  id: string;
  typ: MeetingTyp;
  datum: string;
  beginn: string;
  ende: string;
  ort: string;
  teilnehmer: string;
  tops: MeetingTOP[];
  naechsteMeeting: string;
  protokolliert: boolean;
}

export type LiefergegenstandStatus = 'Offen' | 'In Arbeit' | 'Abgenommen';

export interface LGAnhang {
  id: string;
  name: string;
  size: number;
  type: string;
  addedAt: string;
}

export interface Liefergegenstand {
  id: number;
  phase: string;
  titel: string;
  beschreibung: string;
  aufwandAuftraggeber: string;
  status: LiefergegenstandStatus;
  faelligAm: string;
  notizen: string;
  anhaenge: LGAnhang[];
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

export interface TCOIstkostenBlock {
  hardware: string;
  lizenzen: string;
  personalBetrieb: string;
  wartung: string;
  raumEnergie: string;
  sonstiges: string;
}

export interface TCOZielkostenBlock {
  cloudInfrastruktur: string;
  lizenzenSaaS: string;
  personalCloud: string;
  migration: string;
  sonstiges: string;
}

export interface TCODaten {
  zeithorizont: string;
  istkostenOnPrem: TCOIstkostenBlock;
  zielkostenCloud: TCOZielkostenBlock;
  notizen: string;
}

export interface AppState {
  customerName: string;
  lastUpdated: string;
  cloudStrategy: CloudStrategyMeta;
  quelldokumente: Quelldokument[];
  tcoData: TCODaten;
  liefergegenstaende: Liefergegenstand[];
  stakeholder: Stakeholder[];
  meetings: Meeting[];
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
  'customerName' | 'lastUpdated' | 'cloudStrategy' | 'quelldokumente' | 'tcoData'
>;
