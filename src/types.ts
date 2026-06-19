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

// Block 4 — CIA-Triade & Schutzbedarfsvererbung
export type SchutzbedarfNiveau = 'Normal' | 'Hoch' | 'Sehr hoch' | 'Unklar' | '';

export interface CIASchutzbedarf {
  vertraulichkeit: SchutzbedarfNiveau;
  integritaet: SchutzbedarfNiveau;
  verfuegbarkeit: SchutzbedarfNiveau;
  begruendung?: string;
  vererbt?: boolean;
}

/**
 * Zusätzliche cloud-relevante Attribute zur Vorbereitung des
 * Cloud-Readiness-Workshops. Werden bei Anwendungen und IT-Systemen erfasst.
 */
export interface CloudFields {
  schutzbedarf?: CIASchutzbedarf | SchutzbedarfNiveau;
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
  // Block 3 — EU-Cloud-Souveränitäts-Bewertung
  cloudAnbieterJurisdiktion?: 'EU' | 'USA' | 'Gemischt' | 'Unklar';
  verschluesselungshoheit?: 'Anbieter' | 'Eigene Schlüssel (BYOK)' | 'Hardware-Schlüssel (HYOK)' | 'Unklar';
  portabilitaetsreife?: 'Hoch (Standard-Formate)' | 'Mittel' | 'Niedrig (proprietär)' | 'Unklar';
  gaixZertifiziert?: 'Ja' | 'Nein' | 'Geplant' | 'Unklar';
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
  // EU AI Act (Block 5) — alle optional
  istKISystem?: boolean;
  aiRisikoklasse?: 'Verboten' | 'Hoch' | 'Begrenzt' | 'Minimal' | 'Kein KI' | 'Unklar';
  aiRolle?: 'Anbieter' | 'Betreiber' | 'Beides' | 'Unklar';
  aiTrainingsdaten?: 'Interne Daten' | 'Öffentliche Daten' | 'Drittanbieter' | 'Unklar';
  aiMenschlicheAufsicht?: 'Vollständig' | 'Teilweise' | 'Keine' | 'Unklar';
  aiLoggingVorhanden?: 'Ja' | 'Nein' | 'Teilweise' | 'Unklar';
  aiNotizen?: string;
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
  // Block 6 — FinOps: AI-Kosten & Optimierungen
  aiInferenzkosten?: string;
  savingsPlanRabatt?: string;
  idleRessourcen?: string;
}

// Block 6 — Szenarien
export interface TCOSzenario {
  name: 'Konservativ' | 'Realistisch' | 'Optimistisch';
  faktor: number;
  notiz: string;
}

export interface TCODaten {
  zeithorizont: string;
  istkostenOnPrem: TCOIstkostenBlock;
  zielkostenCloud: TCOZielkostenBlock;
  notizen: string;
  // Block 6 — Szenarien
  szenarien?: TCOSzenario[];
  aktivesSzenario?: 'Konservativ' | 'Realistisch' | 'Optimistisch';
}

export type NIS2Einstufung = 'Besonders wichtig' | 'Wichtig' | 'Nicht betroffen' | 'Unklar';
export type NIS2MassnahmeStatus = 'Vorhanden' | 'Teilweise' | 'Fehlend' | 'N/A';

export interface NIS2Assessment {
  sektor: string;
  mitarbeiter: string;       // '<50' | '50-249' | '≥250' | ''
  umsatzMio: string;         // '<10' | '10-49' | '≥50' | ''
  kritis: string;            // 'Ja' | 'Nein' | 'Unklar'
  einstufung: NIS2Einstufung;
  massnahmen: Record<string, NIS2MassnahmeStatus>;
  notizen: string;
  erstelltAm: string;
}

// Block 8 — DORA IKT-Drittparteien-Register
export interface IKTDienstleister {
  id: string;
  name: string;
  art: 'Cloud' | 'Software' | 'Hardware' | 'Managed Service' | 'Rechenzentrum' | 'Sonstiges';
  leistung: string;
  kritiisch: 'Ja' | 'Nein' | 'Unklar';
  land: string;
  vertragsende?: string;
  sla?: string;
  exitStrategie?: string;
  doraKategorie?: 'Kritisch' | 'Wichtig' | 'Standard';
  konzentrationsrisiko?: 'Hoch' | 'Mittel' | 'Niedrig' | 'Unklar';
  notizen?: string;
}

export interface AppState {
  customerName: string;
  lastUpdated: string;
  cloudStrategy: CloudStrategyMeta;
  nis2Assessment?: NIS2Assessment;
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
  iktDienstleister?: IKTDienstleister[];
}

export type CategoryKey = keyof Omit<
  AppState,
  'customerName' | 'lastUpdated' | 'cloudStrategy' | 'quelldokumente' | 'tcoData'
>;
