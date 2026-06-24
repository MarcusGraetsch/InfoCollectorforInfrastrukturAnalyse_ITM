import type { ComponentCatalogEntry } from './data/componentCatalog';

export type Status = 'Aktiv' | 'Inaktiv' | 'In Planung' | 'Außer Betrieb';
export type JaNein = 'Ja' | 'Nein';
export type ProzessArt = 'Kernprozess' | 'Unterstützungsprozess';

export interface ObjektNotiz {
  id: string;
  text: string;
  datum: string; // ISO date string
  autor?: string;
}

export interface BaseItem {
  id: string;
  kuerzel: string;
  name: string;
  erlaeuterung: string;
  tags: string;
  notizen?: ObjektNotiz[];
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

/**
 * Technische Hardware-/Asset-Attribute (LeanIX IT-Component / iTop PhysicalDevice).
 * Wird per `extends` an Server, Client, Netzkomponente, ICS, IoT, Datenträger gemischt.
 * Alle Felder optional → keine Migration nötig.
 */
export interface HardwareFields {
  hersteller?: string;
  modell?: string;
  seriennummer?: string;
  inventarnummer?: string;       // iTop asset_number
  managementIp?: string;         // iTop managementip
  stromverbrauch?: string;       // W
  hoeheneinheiten?: string;      // HE
  formfaktor?: string;
  standortDetail?: string;
  redundanz?: string;            // iTop redundancy (redundante Netzteile / HA)
  // Technische Tiefe (collapsible "Technische Details")
  cpu?: string;
  ram?: string;                  // GB
  speicher?: string;
  leistungsaufnahmeMax?: string; // kW
  spannung?: string;             // V
}

/**
 * Betriebswirtschaftliche Attribute (AfA, Verträge, Betriebskosten).
 * Wird an alle HW-Kategorien + Anwendungen gemischt. Alle Felder optional.
 */
export interface WirtschaftlichkeitFields {
  anschaffungsdatum?: string;       // ISO YYYY-MM-DD — AfA-Beginn
  produktivnahmeDatum?: string;     // iTop move2production
  anschaffungspreis?: string;       // €
  abschreibungsdauer?: string;      // Jahre
  buchwert?: string;                // € — kann automatisch berechnet werden (Phase 7)
  betriebskostenJahr?: string;      // €
  wartungsvertrag?: string;         // Ja/Nein/Unklar
  wartungskostenJahr?: string;      // €
  vertragsbeginn?: string;          // ISO Datum
  // vertragsende existiert bereits an Anwendung — hier ergänzt für HW-Kategorien
  vertragsende?: string;            // ISO Datum
  kuendigungsfrist?: string;
  supportEnde?: string;             // EoL/EoS (Hersteller)
  softwareSupportEnde?: string;     // iTop software_end_of_support
  kostenstelle?: string;
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

export interface Anwendung extends BaseItem, CloudFields, WirtschaftlichkeitFields {
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
  // vertragsende kommt aus WirtschaftlichkeitFields (ISO-String, abwärtskompatibel)
  // Phase 3 — Software-Tiefe
  hersteller?: string;
  produktname?: string;
  version?: string;
  updateZyklus?: string;
  linkBetriebshandbuch?: string;
  linkRepository?: string;
  linkHersteller?: string;
  // Phase 3 — typabhängige Felder (conditional via showIf auf `typ`)
  dbTyp?: string;
  dbVersion?: string;
  dbBackupStrategie?: string;
  dbBackupOrt?: string;
  dbReplikation?: string;
  dbHochverfuegbarkeit?: string;
  webServerSoftware?: string;
  webTlsVersion?: string;
  webPorts?: string;
  webReverseProxy?: string;
  osVersion?: string;
  osPatchLevel?: string;
  osKernel?: string;
  osSupportEnde?: string;
  osEdition?: string;
  middlewareTyp?: string;
  middlewareProtokolle?: string;
  middlewareEndpunkte?: string;
  erpModule?: string;
  customizingGrad?: string;
  mandanten?: string;
  monitoringKategorie?: string;
  monitoringAbdeckung?: string;
  monitoringLogRetention?: string;
  backupProdukt?: string;
  backupRpo?: string;
  backupRto?: string;
  backup321?: string;
  backupOffsite?: string;
  hypervisorProdukt?: string;
  virtClusterKnoten?: string;
  virtVmAnzahl?: string;
  virtLiveMigration?: string;
  // EU AI Act (Block 5) — alle optional
  istKISystem?: boolean;
  aiRisikoklasse?: 'Verboten' | 'Hoch' | 'Begrenzt' | 'Minimal' | 'Kein KI' | 'Unklar';
  aiRolle?: 'Anbieter' | 'Betreiber' | 'Importeur' | 'Händler' | 'Nutzer' | 'Beides' | 'Unklar';
  aiTrainingsdaten?: 'Interne Daten' | 'Öffentliche Daten' | 'Drittanbieter' | 'Unklar';
  aiMenschlicheAufsicht?: 'Vollständig' | 'Teilweise' | 'Keine' | 'Unklar';
  aiLoggingVorhanden?: 'Ja' | 'Nein' | 'Teilweise' | 'Unklar';
  aiNotizen?: string;
  // EU AI Act — geführte Klärung (Paket 7), alle optional/additiv.
  // Betriebsort/Cloud-Service und Anbieter werden über die vorhandenen Felder
  // `cloudDienst` bzw. `hersteller` abgebildet (keine Doppelerfassung).
  aiZweck?: string;
  aiDatenarten?: string;
  aiPersonenbezug?: 'Ja' | 'Nein' | 'Unklar';
  aiDokumentation?: 'Vorhanden' | 'Teilweise' | 'Fehlt' | 'Unklar';
  aiModellInfo?: string;          // Modell-/Versionsinformationen
  aiDrittanbieter?: string;       // Drittanbieter/Provider des Modells/Dienstes
  aiEvidenceIds?: string[];       // → EvidenceItem.id
  aiOffeneFragen?: string;
  aiNaechsterSchritt?: string;
}

export interface Datentraeger extends BaseItem, HardwareFields, WirtschaftlichkeitFields {
  status: Status;
  anzahl: string;
  verantwortlicher: string;
  benutzer: string;
  daten: string[];
  anwendungen: string[];
}

export interface Server extends BaseItem, CloudFields, HardwareFields, WirtschaftlichkeitFields {
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
  // Phase 4 — referenzierte Betriebssysteme (IT-Component)
  betriebssysteme?: string[];
}

export interface Netzkomponente extends BaseItem, HardwareFields, WirtschaftlichkeitFields {
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

export interface Client extends BaseItem, CloudFields, HardwareFields, WirtschaftlichkeitFields {
  status: Status;
  anzahl: string;
  plattform: string;
  verantwortlicher: string;
  benutzer: string;
  itSysteme: string[];
  netzverbindungen: string[];
  raeume: string[];
  gebaeude: string[];
  betriebssysteme?: string[];
}

export interface ICSSystem extends BaseItem, CloudFields, HardwareFields, WirtschaftlichkeitFields {
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

export interface IoTSystem extends BaseItem, CloudFields, HardwareFields, WirtschaftlichkeitFields {
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

/**
 * Schnittstelle / Kommunikationsbeziehung zwischen Anwendungen (Decision 3,
 * LeanIX-"Interface"). quellAnwendung/zielAnwendung sind multiref → anwendungen
 * (Engine-konform; primär wird der erste Eintrag verwendet).
 */
export interface Schnittstelle extends BaseItem {
  status: Status;
  quellAnwendung: string[];
  zielAnwendung: string[];
  protokoll: string;
  ports: string;
  richtung: string;            // Unidirektional / Bidirektional
  initiator: string;           // Quelle / Ziel / Beide
  synchronitaet: string;       // Synchron / Asynchron / Batch
  frequenz: string;
  datenfluss: string;
  verschluesselung: string;
  authentifizierung: string;
  firewallRegel: string;
  voraussetzungen: string;
  daten?: string[];
}

/**
 * Betriebssystem als eigene, wiederverwendbare IT-Component (Decision 1,
 * analog iTop OSFamily/OSVersion). Wird von Servern/Clients per multiref
 * referenziert → ermöglicht "Server A → OS x → Apps a,b,c".
 */
export interface Betriebssystem extends BaseItem, WirtschaftlichkeitFields {
  status: Status;
  hersteller?: string;
  version?: string;
  kernel?: string;
  // supportEnde kommt aus WirtschaftlichkeitFields
  patchLevel?: string;
  lizenztyp?: string;
  architektur?: string;
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

/**
 * Vertiefende, geführte Bearbeitung je NIS2-Mindestmaßnahme (Paket 8).
 * Ergänzt den flachen Status in `massnahmen` — referenziert zentrale Rollen/Evidence
 * (keine Duplikate). Alle Felder optional → abwärtskompatibel.
 */
export interface NIS2MassnahmeDetail {
  reifegrad?: number;        // 0–4 (optional)
  ownerRoleId?: string;      // → RoleAssignment.id
  evidenceIds?: string[];    // → EvidenceItem.id
  sourceUrl?: string;        // interne/externe URL
  fileReference?: string;    // Datei-/Dokumentenverweis
  dueDate?: string;          // Fälligkeit / Follow-up (ISO)
  notes?: string;
}

export interface NIS2Assessment {
  sektor: string;
  mitarbeiter: string;       // '<50' | '50-249' | '≥250' | ''
  umsatzMio: string;         // '<10' | '10-49' | '≥50' | ''
  kritis: string;            // 'Ja' | 'Nein' | 'Unklar'
  einstufung: NIS2Einstufung;
  massnahmen: Record<string, NIS2MassnahmeStatus>;
  /** Geführte Detaildaten je Maßnahme (Paket 8), optional. */
  massnahmenDetail?: Record<string, NIS2MassnahmeDetail>;
  notizen: string;
  erstelltAm: string;
}

// Block 10 — KI-Anreicherungs-Assistent (separate localStorage, never in AppState)
export interface AIConfig {
  enabled: boolean;
  provider: 'openai' | 'custom';
  endpoint?: string;
  model?: string;
  // API key is stored in localStorage as 'it-sa-ai-config' and NEVER exported
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
  betriebssysteme: Betriebssystem[];
  schnittstellen: Schnittstelle[];
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
  /** Status des Nachweis-/Evidence-Katalogs (Key = NachweisItem.id). */
  nachweisStatus?: Record<string, { vorhanden: boolean; notiz: string }>;
  /** Zentrales Kantenmodell: generische Beziehungen zwischen beliebigen Objekten. */
  beziehungen?: Beziehung[];
  /** Kundenspezifische Katalogeinträge (ergänzen den statischen Basiskatalog, persistiert + exportiert). */
  customComponentCatalog?: ComponentCatalogEntry[];
  /** Querschnitt: zentrale Governance-Themen (NIS2, Souveränität, BCM, Cloud-Exit …). */
  governanceTopics?: GovernanceTopic[];
  /** Querschnitt: zentrale Nachweis-/Evidence-Objekte (n:m zu Themen). */
  evidenceItems?: EvidenceItem[];
  /** Querschnitt: zentrale ISMS-/BCM-/NIS2-Rollenzuweisungen. */
  roleAssignments?: RoleAssignment[];
}

export type CategoryKey = keyof Omit<
  AppState,
  'customerName' | 'lastUpdated' | 'cloudStrategy' | 'quelldokumente' | 'tcoData' | 'beziehungen' | 'customComponentCatalog'
  | 'governanceTopics' | 'evidenceItems' | 'roleAssignments'
>;

// Zentrales Beziehungsmodell (generische Objekt-Verknüpfungen)
export type BeziehungsTyp = 'kommuniziert' | 'physisch' | 'treiber' | 'abhaengig' | 'teil-von' | 'redundanz';
export type BeziehungsRichtung = 'uni' | 'bi';
export interface Beziehung {
  id: string;
  quelleKategorie: CategoryKey;
  quelleId: string;
  zielKategorie: CategoryKey;
  zielId: string;
  typ: BeziehungsTyp;
  richtung: BeziehungsRichtung;
  protokoll?: string;        // optional, only meaningful for 'kommuniziert'
  verbindungsmedium?: string; // optional, only meaningful for 'physisch'
  notiz?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Querschnitt — Gemeinsames Control-/Evidence-/Rollen-/Action-Modell
// Eine Datenbasis für NIS2, Cloud-Souveränität, EU AI Act, BCM, Cloud-Exit,
// Nachhaltigkeit und IT-Grundschutz-Rollen. Vermeidet doppelte Felder/Dateninseln:
// Module referenzieren zentrale Evidence- und Rollen-Objekte über IDs.
// Alle Strukturen sind additiv + optional in AppState → keine Migration nötig.
// ─────────────────────────────────────────────────────────────────────────────

/** Fachdomäne eines Governance-Themas. */
export type GovernanceDomain =
  | 'nis2' | 'cloudSovereignty' | 'aiAct' | 'bcm' | 'cloudExit'
  | 'sustainability' | 'itGrundschutz';

/** Einheitlicher Bearbeitungsstatus für Governance-Themen (Reifegrad-orientiert). */
export type GovernanceStatus = 'Offen' | 'In Arbeit' | 'Teilweise' | 'Erfüllt' | 'N/A';

/** Status einer Maßnahme/Aufgabe. */
export type ActionStatus = 'Offen' | 'In Arbeit' | 'Erledigt';

/** Verweis auf ein beliebiges Erfassungs-Objekt (kategorieübergreifend). */
export interface ObjectRef {
  kategorie: CategoryKey;
  id: string;
}

/** Konkrete Maßnahme / nächster Schritt (kann an Thema/Evidence/Rolle hängen). */
export interface ActionItem {
  id: string;
  title: string;
  description?: string;
  ownerRoleId?: string;       // → RoleAssignment.id
  dueDate?: string;           // ISO YYYY-MM-DD
  status: ActionStatus;
  relatedEvidenceIds?: string[];
}

/**
 * Governance-Thema (Control). Wiederverwendbar über alle Domänen — z.B. eine
 * NIS2-Mindestmaßnahme, eine Cloud-Souveränitäts-Dimension oder ein BCM-Baustein.
 */
export interface GovernanceTopic {
  id: string;
  domain: GovernanceDomain;
  /** Stabiler fachlicher Schlüssel innerhalb der Domäne (z.B. 'nis2-3', 'bcm', 'cloud-exit'). */
  key?: string;
  title: string;
  description?: string;
  whyImportant?: string;
  normativeReferences?: string[];
  relatedEvidenceIds?: string[];   // → EvidenceItem.id
  relatedRoleIds?: string[];       // → RoleAssignment.id
  relatedObjectRefs?: ObjectRef[];
  status?: GovernanceStatus;
  maturity?: number;               // 0–4 (optional)
  notes?: string;
  actionItems?: ActionItem[];
}

/** Lebenszyklus-Status eines Nachweises. */
export type EvidenceStatus = 'Offen' | 'Angefragt' | 'Erhalten' | 'Geprüft' | 'Nicht anwendbar';

/**
 * Zentrales Nachweis-/Evidence-Objekt. Ein Nachweis (z.B. AVV) kann mehreren
 * Themen/Domänen zugeordnet sein (Datenschutz, NIS2-Lieferkette, Souveränität …)
 * → relatedTopicIds bildet n:m ab, ohne den Nachweis zu duplizieren.
 */
export interface EvidenceItem {
  id: string;
  title: string;
  description?: string;
  evidenceType?: string;           // z.B. 'Vertrag', 'Konzept', 'Protokoll', 'Zertifikat'
  status: EvidenceStatus;
  ownerRoleId?: string;            // → RoleAssignment.id
  sourceUrl?: string;
  fileReference?: string;
  reviewDate?: string;             // ISO
  validUntil?: string;             // ISO
  relatedTopicIds?: string[];      // → GovernanceTopic.id
  relatedObjectRefs?: ObjectRef[];
  notes?: string;
  // Beratungsfelder (Paket 9, alle optional/additiv)
  whyImportant?: string;           // Warum wichtig?
  themen?: string[];               // Norm-/Themenbezug-Tags (DSGVO, NIS2, BSI, DORA, AI Act, C5, …)
  normativeReferences?: string[];  // konkrete Norm-/Quellenangaben
  benoetigteInfos?: string;        // Welche Informationen werden benötigt?
  beispielNachweise?: string;      // Beispiel-Nachweise / Artefakte
  typischeQuelle?: string;         // Typische Quelle im Unternehmen (Abteilung/Tool)
  /** Stabiler Seed-Schlüssel aus dem statischen Nachweis-Katalog (für idempotentes Seeding). */
  seedKey?: string;
}

/** Relevanz-/Domänen-Klassifizierung einer Rolle (eine Rolle kann mehreren dienen). */
export type RoleRelevance = 'isms' | 'bcm' | 'nis2' | 'cloudGovernance' | 'datenschutz' | 'empfohlen';

/** Benennungs-Status einer Rolle. */
export type RoleAssignmentStatus = 'Offen' | 'Benannt' | 'Vertretung offen' | 'Vollständig' | 'N/A';

/**
 * Rollen-/Verantwortlichkeitszuweisung (ISMS-/BCM-/NIS2-Rollen). Zentrales
 * Rollenobjekt, auf das Governance-Themen und Evidence referenzieren — keine
 * doppelten Verantwortlichkeitsfelder in NIS2/Evidence/BCM.
 */
export interface RoleAssignment {
  id: string;
  roleName: string;
  /** Stabiler fachlicher Schlüssel aus dem Seed-Katalog (z.B. 'isb', 'bcm-beauftragter'). */
  key?: string;
  relevanz: RoleRelevance[];
  personName?: string;
  orgUnit?: string;
  email?: string;
  deputy?: string;                 // Stellvertretung
  responsibility?: string;
  status?: RoleAssignmentStatus;
  evidenceIds?: string[];          // → EvidenceItem.id (z.B. Bestellungsdokument)
  bestellungsdokument?: string;    // freier Verweis (URL/Datei), falls kein EvidenceItem
  notes?: string;
}

// Block 11 — Snapshot-Versionierung
export interface Snapshot {
  id: string;
  label: string;
  createdAt: string; // ISO timestamp
  state: AppState;
}
