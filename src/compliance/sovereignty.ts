/**
 * EU Cloud Sovereignty Framework v1.2.1 (DG DIGIT, Oct 2025)
 * Block A — Datenmodell, Scoring, Gaps, Change-of-Control-Stresstest
 *
 * Mapping: 6 bisherige Souveränitäts-Dimensionen → 8 SOV-Objektive
 * ─────────────────────────────────────────────────────────────────
 * datenschutz     → SOV-2 Legal & Jurisdictional + SOV-3 Data & AI (aufgeteilt)
 * cybersicherheit → SOV-7 Security & Compliance
 * resilienz       → SOV-4 Operational
 * lockin          → SOV-6 Technology  (Portabilität, Interoperabilität)
 * kiGovernance    → SOV-3 Data & AI   (AI-Governance-Anteil)
 * supplyChain     → SOV-5 Supply Chain
 *
 * Neue SOV-Objektive ohne direktes Altvorgänger-Mapping:
 * SOV-1 Strategic Sovereignty  — bisher nicht explizit modelliert
 *   (abgeleitet aus Cloud-Strategie-Ziel + Gaia-X/EU-Cloud-Präferenz)
 * SOV-8 Environmental Sustainability — entspricht dem Nachhaltigkeitsmodul
 *   (NachhaltigkeitsAnnahmen / NachhaltigkeitsModul.tsx)
 *
 * Overlap-Hinweise:
 * • datenschutz wird auf SOV-2 (juristische/gesetzliche Aspekte) UND
 *   SOV-3 (Datenklassifizierung, Verschlüsselung, AI-Datenpflicht) aufgeteilt.
 *   Der AI-Governance-Anteil (KI-Systeme) fließt exklusiv in SOV-3 (nicht mehr
 *   kiGovernance als separate Dimension).
 * • resilienz (DORA/BCM/Exit) → SOV-4; Konzentrationsrisiko → SOV-5 (anteilig).
 */

import type { AppState, CloudFields, SchutzbedarfNiveau } from '../types';
import { ASSESSABLE_CATEGORIES } from '../cloudReadiness';
import { getEffektiverSchutzbedarf } from '../schutzbedarfsVererbung';
import { nis2GapAmpel } from './nis2';

// ─── Typen ──────────────────────────────────────────────────────────────────

export type SovObjective =
  | 'SOV-1' | 'SOV-2' | 'SOV-3' | 'SOV-4'
  | 'SOV-5' | 'SOV-6' | 'SOV-7' | 'SOV-8';

/** SEAL 0–4 (Sovereignty Effectiveness Assurance Level). Migration: S0→SEAL-0 usw. */
export type SealLevel = 0 | 1 | 2 | 3 | 4;

/** Menschenlesbare Labels je SEAL-Stufe. */
export const SEAL_LABELS: Record<SealLevel, string> = {
  0: 'SEAL-0 · No Sovereignty',
  1: 'SEAL-1 · Jurisdictional',
  2: 'SEAL-2 · Data',
  3: 'SEAL-3 · Digital Resilience',
  4: 'SEAL-4 · Full Digital Sovereignty',
};

/** Gewichte je SOV-Objektiv (Summe = 1.0). */
export const SOV_WEIGHTS: Record<SovObjective, number> = {
  'SOV-1': 0.15, // Strategic
  'SOV-2': 0.10, // Legal & Jurisdictional
  'SOV-3': 0.10, // Data & AI
  'SOV-4': 0.15, // Operational
  'SOV-5': 0.20, // Supply Chain
  'SOV-6': 0.15, // Technology
  'SOV-7': 0.10, // Security & Compliance
  'SOV-8': 0.05, // Environmental Sustainability
};

export const SOV_LABELS: Record<SovObjective, string> = {
  'SOV-1': 'Strategic Sovereignty',
  'SOV-2': 'Legal & Jurisdictional',
  'SOV-3': 'Data & AI',
  'SOV-4': 'Operational Resilience',
  'SOV-5': 'Supply Chain',
  'SOV-6': 'Technology',
  'SOV-7': 'Security & Compliance',
  'SOV-8': 'Environmental Sustainability',
};

/** Score je Contributing Factor (0–4 = SEAL-Analogie). */
export type ContributingFactorScores = Partial<Record<string, number>>;

/** Bewertung je Workload × Objektiv. */
export interface SovObjectiveAssessment {
  objective: SovObjective;
  istSeal: SealLevel;      // aktueller Stand
  sollSeal: SealLevel;     // Mindest-SEAL aus Schutzbedarf
  gap: number;             // sollSeal − istSeal (≥0)
  contributingFactorScores: ContributingFactorScores;
  evidenceRefs: string[];  // → EvidenceItem.id
  note?: string;
}

/** Vollständiges Profil eines Workloads (alle 8 Objektive). */
export interface WorkloadSovProfile {
  /** Workload-Name (z.B. Kategorie + Name des Objekts oder "Portfolio" für den Gesamtstand). */
  workloadId: string;
  workloadName: string;
  kategorie?: string;
  /** Schutzbedarf des Workloads — aus bestehenden BSI-Feldern. */
  schutzbedarf: SchutzbedarfNiveau;
  assessments: Record<SovObjective, SovObjectiveAssessment>;
}

/** Sovereignty-Score-Ergebnis: Gesamt + je Objektiv. */
export interface SovereigntyScoreResult {
  /** Gesamt-Score 0–100 (EU-Formel: Σ normierter Teilscore × Gewicht). */
  gesamtScore: number;
  /** Teilscores je Objektiv, 0–100. */
  teilscores: Record<SovObjective, number>;
  /** Gewichteter Beitrag je Objektiv (teilscore × weight × 100). */
  beitraege: Record<SovObjective, number>;
}

/** Eine priorisierte Gap-Empfehlung. */
export interface SovGap {
  objective: SovObjective;
  objectiveLabel: string;
  workloadId: string;
  workloadName: string;
  istSeal: SealLevel;
  sollSeal: SealLevel;
  gap: number;
  /** Priorisierungsfaktor = Gewicht × Gap × Schutzbedarfsfaktor. */
  prioritaet: number;
  schutzbedarfFaktor: number;
}

// ─── Change-of-Control-Stresstest ───────────────────────────────────────────

export type CoCSzenario = 'US-CLOUD-Act' | 'Non-EU-Acquisition' | 'Custom';

/** Konfiguration eines Change-of-Control-Szenarios. */
export interface CoCConfig {
  name: string;
  beschreibung: string;
  /** Je SOV-Objektiv: auf welchen SEAL-Wert fällt es maximal (Obergrenze nach Übernahme). */
  sealObergrenzen: Partial<Record<SovObjective, SealLevel>>;
}

/** Default: US CLOUD Act — Zugriff durch US-Behörden, FISA 702 / EO 12333. */
export const COC_SZENARIEN: Record<Exclude<CoCSzenario, 'Custom'>, CoCConfig> = {
  'US-CLOUD-Act': {
    name: 'US CLOUD Act / FISA 702',
    beschreibung:
      'Ein EU-Provider wird durch einen US-Konzern übernommen. US-Behörden erhalten Zugriff auf Daten ' +
      'unabhängig vom Speicherort (CLOUD Act, FISA 702, EO 12333). ' +
      'SOV-1 (strategische Unabhängigkeit), SOV-2 (EU-Rechtsrahmen) und SOV-7 (Security) sinken ' +
      'unmittelbar; SOV-3 (Datenkontrolle) und SOV-4 (Betrieb) sind mittelbar betroffen.',
    sealObergrenzen: {
      'SOV-1': 1, // kein EU-strategisches Interesse mehr
      'SOV-2': 1, // EU-Rechtsrahmen nicht mehr allein maßgeblich
      'SOV-3': 1, // Datenkontrolle kompromittiert (behördlicher Zugriff)
      'SOV-4': 2, // Operative Kontrolle bleibt teilweise, aber SLA-Risiko
      'SOV-7': 1, // Security-Compliance unter US-Regime
    },
  },
  'Non-EU-Acquisition': {
    name: 'Nicht-EU-Konzernübernahme (generisch)',
    beschreibung:
      'Übernahme durch einen Nicht-EU-Konzern ohne CLOUD-Act-Reichweite, aber mit ' +
      'potenziell anderem Rechtsrahmen (z.B. CN, IN). Betrifft vor allem strategische ' +
      'und rechtliche Souveränität; Supply-Chain-Risiken steigen.',
    sealObergrenzen: {
      'SOV-1': 1,
      'SOV-2': 1,
      'SOV-5': 1, // Supply-Chain-Risiko steigt massiv
      'SOV-7': 2,
    },
  },
};

/** Ergebnis eines Change-of-Control-Stresstests. */
export interface CoCStressTestResult {
  szenario: string;
  beschreibung: string;
  /** Score vor dem Stresstest. */
  scorerVorher: SovereigntyScoreResult;
  /** Score nach dem Stresstest (adjustierte Profile). */
  scoreNachher: SovereigntyScoreResult;
  scoreEinbruch: number; // vorher − nachher (positiv = Verlust)
  /** Je Objektiv: SEAL vorher, nach Anpassung, Delta. */
  objektiveDeltas: Array<{
    objective: SovObjective;
    objectiveLabel: string;
    sealVorher: SealLevel;
    sealNachher: SealLevel;
    delta: number;
    gewicht: number;
  }>;
  ausgeloestGaps: SovGap[];
}

// ─── Hilfsfunktionen ────────────────────────────────────────────────────────

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

/** Normiert SEAL 0–4 auf 0–100 (linear). */
function sealToScore(seal: SealLevel): number {
  return seal * 25;
}

/** Schutzbedarf → Mindest-SEAL-Faktor für die Gap-Priorisierung. */
export function schutzbedarfFaktor(sb: SchutzbedarfNiveau): number {
  switch (sb) {
    case 'Sehr hoch': return 2.0;
    case 'Hoch': return 1.5;
    case 'Normal': return 1.0;
    default: return 0.8; // 'Unklar' oder ''
  }
}

/** Migration: altes S0–S3-SEAL auf SEAL 0–4. */
export function migrateLegacySeal(legacy: string | undefined): SealLevel {
  switch (legacy) {
    case 'S3': return 4;
    case 'S2': return 3;
    case 'S1': return 2;
    case 'S0': return 0;
    default: return 0;
  }
}

// ─── Kernlogik: deriveSollSeal ───────────────────────────────────────────────

/**
 * Leitet das Mindest-SEAL je SOV-Objektiv aus dem Schutzbedarf des Workloads ab.
 * Nutzt die vorhandenen BSI-Schutzbedarfsfelder (CloudFields) — keine Parallelstruktur.
 *
 * Logik-Rationale:
 * • Normal → SEAL-1 (jurisdiktionelle Mindestanforderungen)
 * • Hoch   → SEAL-2 (Datensouveränität: eigene Schlüssel, EU-Hosting)
 * • Sehr hoch → SEAL-3 (digitale Resilienz: Exit-Fähigkeit, Compliance-Nachweis)
 * • Unklar → SEAL-1 als konservativer Default
 * Für SOV-8 (Nachhaltigkeit) gilt immer SEAL-1 als Mindest (Reporting-Pflicht).
 * Für SOV-5 (Supply Chain) bei hohem Schutzbedarf → SEAL-3 (SBOM/Provenance).
 */
export function deriveSollSeal(
  schutzbedarf: SchutzbedarfNiveau,
): Record<SovObjective, SealLevel> {
  const base: SealLevel = schutzbedarf === 'Sehr hoch' ? 3
    : schutzbedarf === 'Hoch' ? 2
    : schutzbedarf === 'Normal' ? 1
    : 1; // Unklar / '' → konservativ SEAL-1

  return {
    'SOV-1': base,
    'SOV-2': base,
    'SOV-3': (schutzbedarf === 'Hoch' || schutzbedarf === 'Sehr hoch') ? Math.max(base, 2) as SealLevel : base,
    'SOV-4': base,
    'SOV-5': (schutzbedarf === 'Sehr hoch') ? 3 : base,
    'SOV-6': base,
    'SOV-7': (schutzbedarf === 'Hoch' || schutzbedarf === 'Sehr hoch') ? Math.max(base, 2) as SealLevel : base,
    'SOV-8': 1, // Mindest-Reporting immer SEAL-1
  };
}

// ─── Kernlogik: IST-SEAL-Ableitung ──────────────────────────────────────────

/**
 * Leitet den IST-SEAL je Objektiv aus den vorhandenen CloudFields (+ Staatskontext) ab.
 * Heuristisch, deterministisch, offline — kein KI-Aufruf.
 */
function deriveIstSeal(
  item: CloudFields,
  state: AppState,
): Record<SovObjective, SovObjectiveAssessment> {
  const sb = getEffektiverSchutzbedarf(item);
  const sollMap = deriveSollSeal(sb);

  // Hilfsvariablen aus vorhandenen Feldern
  const isCloud = item.bereitstellung &&
    !/On-Premises/.test(item.bereitstellung);
  const jurEU = item.cloudAnbieterJurisdiktion === 'EU';
  const jurUSA = item.cloudAnbieterJurisdiktion === 'USA' || item.cloudAnbieterJurisdiktion === 'Gemischt';
  const ownKeys = item.verschluesselungshoheit === 'Eigene Schlüssel (BYOK)' || item.verschluesselungshoheit === 'Hardware-Schlüssel (HYOK)';
  const highPortab = item.portabilitaetsreife === 'Hoch (Standard-Formate)';
  const lowPortab = item.portabilitaetsreife === 'Niedrig (proprietär)';
  const gaixJa = item.gaixZertifiziert === 'Ja';
  const souveraenDS = item.datensouveraenitaet === 'Streng souverän (C5 / Gaia-X)' || item.datensouveraenitaet === 'Confidential Computing (TEE / Enclave)';

  // NIS2-Erfüllungsgrad
  const nis2 = state.nis2Assessment;
  const nis2Grad = nis2 ? nis2GapAmpel(nis2.massnahmen ?? {}).erfuellungsgrad : 50;

  // DORA-/IKT-Register
  const ikt = state.iktDienstleister ?? [];
  const exitQuote = ikt.length > 0
    ? ikt.filter(d => d.exitStrategie?.trim()).length / ikt.length
    : 0;

  // Nachhaltigkeitsdaten vorhanden?
  const nachhaltigkeitVorhanden = !!(state.nachhaltigkeitAnnahmen);

  function makeAssessment(
    objective: SovObjective,
    istSeal: SealLevel,
    factors: ContributingFactorScores,
    evidenceRefs: string[] = [],
    note?: string,
  ): SovObjectiveAssessment {
    const soll = sollMap[objective];
    return {
      objective,
      istSeal,
      sollSeal: soll,
      gap: Math.max(0, soll - istSeal),
      contributingFactorScores: factors,
      evidenceRefs,
      note,
    };
  }

  // SOV-1: Strategic Sovereignty — EU-Cloud-Strategie + Gaia-X/EU-Präferenz
  const sov1: SealLevel = gaixJa || souveraenDS ? 4
    : jurEU && !isCloud ? 3
    : jurEU ? 2
    : jurUSA ? 0
    : 1;

  // SOV-2: Legal & Jurisdictional — Anbieter-Jurisdiktion + SCC/AVV-Indikator
  const sov2: SealLevel = gaixJa || souveraenDS ? 4
    : jurEU ? 3
    : jurUSA ? 0
    : !isCloud ? 3
    : 1;

  // SOV-3: Data & AI — Verschlüsselung + KI-Governance
  const anwendungen = state.anwendungen ?? [];
  const kiOhneLogging = anwendungen.filter(a => a.istKISystem && a.aiLoggingVorhanden !== 'Ja').length;
  const sov3: SealLevel = (gaixJa || souveraenDS) && ownKeys ? 4
    : ownKeys && jurEU ? 3
    : ownKeys ? 2
    : jurEU && kiOhneLogging === 0 ? 2
    : jurUSA ? 0
    : 1;

  // SOV-4: Operational Resilience — Exit-Strategien + DORA-Register
  const sov4: SealLevel = exitQuote >= 0.9 && highPortab ? 4
    : exitQuote >= 0.6 ? 3
    : exitQuote >= 0.3 ? 2
    : ikt.length > 0 ? 1
    : 0;

  // SOV-5: Supply Chain — IKT-Register + Jurisdiktions-Transparenz + Gaia-X
  const mitLand = ikt.filter(d => d.land?.trim()).length;
  const supplyScore = ikt.length > 0
    ? (mitLand / ikt.length) * 100
    : 0;
  const sov5: SealLevel = gaixJa && supplyScore >= 80 ? 4
    : supplyScore >= 80 ? 3
    : supplyScore >= 50 ? 2
    : ikt.length > 0 ? 1
    : 0;

  // SOV-6: Technology — Portabilität / Interoperabilität / offene Formate
  const sov6: SealLevel = highPortab && ownKeys ? 4
    : highPortab ? 3
    : lowPortab ? 0
    : item.portabilitaetsreife === 'Mittel' ? 2
    : 1;

  // SOV-7: Security & Compliance — NIS2-Erfüllungsgrad + C5/ISO-Indikator
  const c5Hinweis = gaixJa || item.datensouveraenitaet === 'Streng souverän (C5 / Gaia-X)';
  const sov7: SealLevel = c5Hinweis && nis2Grad >= 80 ? 4
    : nis2Grad >= 80 ? 3
    : nis2Grad >= 50 ? 2
    : nis2Grad >= 20 ? 1
    : 0;

  // SOV-8: Environmental Sustainability — Nachhaltigkeitsmodul vorhanden
  const sov8: SealLevel = nachhaltigkeitVorhanden ? 2 : 0;

  return {
    'SOV-1': makeAssessment('SOV-1', sov1, { 'EU-Strategie': sov1, 'Gaia-X': gaixJa ? 4 : 0 }),
    'SOV-2': makeAssessment('SOV-2', sov2, { 'Jurisdiktion': sov2, 'Rechtsrahmen': jurEU ? 3 : jurUSA ? 0 : 1 }),
    'SOV-3': makeAssessment('SOV-3', sov3, { 'Verschlüsselung': ownKeys ? 3 : 1, 'KI-Governance': kiOhneLogging === 0 ? 3 : 1 }),
    'SOV-4': makeAssessment('SOV-4', sov4, { 'Exit-Quote': Math.round(exitQuote * 4) as SealLevel, 'Portabilität': highPortab ? 3 : 1 }),
    'SOV-5': makeAssessment('SOV-5', sov5, { 'Lieferketten-Transparenz': Math.round(supplyScore / 25) as SealLevel }),
    'SOV-6': makeAssessment('SOV-6', sov6, { 'Portabilität': highPortab ? 4 : lowPortab ? 0 : 2, 'Interoperabilität': highPortab ? 3 : 1 }),
    'SOV-7': makeAssessment('SOV-7', sov7, { 'NIS2-Grad': Math.round(nis2Grad / 25) as SealLevel, 'C5/ISO': c5Hinweis ? 4 : 1 }),
    'SOV-8': makeAssessment('SOV-8', sov8, { 'Nachhaltigkeits-Reporting': sov8 }),
  };
}

// ─── Portfolio-Aggregation ───────────────────────────────────────────────────

/**
 * Erzeugt ein WorkloadSovProfile für alle cloud-relevanten Objekte im State.
 * Gibt ein Portfolio-Profil zurück (Durchschnitt über alle Objekte je Objektiv).
 */
export function buildPortfolioProfile(state: AppState): WorkloadSovProfile {
  const alleObjekte: Array<CloudFields & { id: string; name: string }> = [];
  for (const cat of ASSESSABLE_CATEGORIES) {
    const items = (state[cat] as unknown as Array<CloudFields & { id: string; name: string }>) ?? [];
    alleObjekte.push(...items);
  }

  if (alleObjekte.length === 0) {
    // Leeres Profil mit SEAL-0 überall
    const leereSoll = deriveSollSeal('Normal');
    const assessments = {} as Record<SovObjective, SovObjectiveAssessment>;
    for (const obj of Object.keys(SOV_WEIGHTS) as SovObjective[]) {
      assessments[obj] = {
        objective: obj,
        istSeal: 0,
        sollSeal: leereSoll[obj],
        gap: leereSoll[obj],
        contributingFactorScores: {},
        evidenceRefs: [],
        note: 'Keine cloud-relevanten Objekte erfasst.',
      };
    }
    return { workloadId: 'portfolio', workloadName: 'Portfolio (gesamt)', schutzbedarf: 'Normal', assessments };
  }

  // Aggregiere: je Objektiv Durchschnitt der IST-SEAL-Werte; höchster SOLL-SEAL dominiert
  const summaries: Record<SovObjective, { istSum: number; sollMax: SealLevel; count: number }> = {
    'SOV-1': { istSum: 0, sollMax: 0, count: 0 },
    'SOV-2': { istSum: 0, sollMax: 0, count: 0 },
    'SOV-3': { istSum: 0, sollMax: 0, count: 0 },
    'SOV-4': { istSum: 0, sollMax: 0, count: 0 },
    'SOV-5': { istSum: 0, sollMax: 0, count: 0 },
    'SOV-6': { istSum: 0, sollMax: 0, count: 0 },
    'SOV-7': { istSum: 0, sollMax: 0, count: 0 },
    'SOV-8': { istSum: 0, sollMax: 0, count: 0 },
  };

  let maxSb: SchutzbedarfNiveau = 'Normal';
  for (const item of alleObjekte) {
    const sb = getEffektiverSchutzbedarf(item);
    if (sb === 'Sehr hoch') maxSb = 'Sehr hoch';
    else if (sb === 'Hoch' && maxSb !== 'Sehr hoch') maxSb = 'Hoch';

    const assessments = deriveIstSeal(item, state);
    for (const [obj, a] of Object.entries(assessments) as [SovObjective, SovObjectiveAssessment][]) {
      summaries[obj].istSum += a.istSeal;
      summaries[obj].sollMax = Math.max(summaries[obj].sollMax, a.sollSeal) as SealLevel;
      summaries[obj].count++;
    }
  }

  const assessments = {} as Record<SovObjective, SovObjectiveAssessment>;
  for (const obj of Object.keys(SOV_WEIGHTS) as SovObjective[]) {
    const s = summaries[obj];
    const istSeal = s.count > 0 ? Math.round(s.istSum / s.count) as SealLevel : 0;
    const soll = s.sollMax;
    assessments[obj] = {
      objective: obj,
      istSeal,
      sollSeal: soll,
      gap: Math.max(0, soll - istSeal),
      contributingFactorScores: {},
      evidenceRefs: [],
    };
  }

  return {
    workloadId: 'portfolio',
    workloadName: 'Portfolio (gesamt)',
    schutzbedarf: maxSb,
    assessments,
  };
}

// ─── computeSovereigntyScore ─────────────────────────────────────────────────

/**
 * Berechnet den Sovereignty Score nach EU-Formel:
 * Score = Σ (IstSeal(SOVn) / 4) × Weight(SOVn)  → normiert auf 0–100.
 */
export function computeSovereigntyScore(profile: WorkloadSovProfile): SovereigntyScoreResult {
  const teilscores = {} as Record<SovObjective, number>;
  const beitraege = {} as Record<SovObjective, number>;
  let gesamt = 0;

  for (const obj of Object.keys(SOV_WEIGHTS) as SovObjective[]) {
    const a = profile.assessments[obj];
    const normiert = sealToScore(a.istSeal); // 0–100
    const gewicht = SOV_WEIGHTS[obj];
    teilscores[obj] = normiert;
    beitraege[obj] = Math.round(normiert * gewicht * 100) / 100;
    gesamt += normiert * gewicht;
  }

  return {
    gesamtScore: clamp(Math.round(gesamt)),
    teilscores,
    beitraege,
  };
}

// ─── computeGaps ────────────────────────────────────────────────────────────

/**
 * Gibt priorisierte Gap-Liste zurück: je Objektiv Soll−Ist,
 * sortiert nach Priorität = Gewicht × Gap × Schutzbedarf-Faktor (absteigend).
 */
export function computeGaps(profile: WorkloadSovProfile): SovGap[] {
  const sbFaktor = schutzbedarfFaktor(profile.schutzbedarf);
  const gaps: SovGap[] = [];

  for (const obj of Object.keys(SOV_WEIGHTS) as SovObjective[]) {
    const a = profile.assessments[obj];
    if (a.gap <= 0) continue;
    const prioritaet = SOV_WEIGHTS[obj] * a.gap * sbFaktor;
    gaps.push({
      objective: obj,
      objectiveLabel: SOV_LABELS[obj],
      workloadId: profile.workloadId,
      workloadName: profile.workloadName,
      istSeal: a.istSeal,
      sollSeal: a.sollSeal,
      gap: a.gap,
      prioritaet: Math.round(prioritaet * 1000) / 1000,
      schutzbedarfFaktor: sbFaktor,
    });
  }

  return gaps.sort((a, b) => b.prioritaet - a.prioritaet);
}

// ─── simulateChangeOfControl ────────────────────────────────────────────────

/**
 * Stresstest: Simuliert eine Konzernübernahme und berechnet den Score-Einbruch.
 * Die Obergrenzen je Objektiv sind konfigurierbar; Default = US CLOUD Act.
 */
export function simulateChangeOfControl(
  profile: WorkloadSovProfile,
  szenarioKey: CoCSzenario = 'US-CLOUD-Act',
  customConfig?: CoCConfig,
): CoCStressTestResult {
  const config: CoCConfig = szenarioKey === 'Custom' && customConfig
    ? customConfig
    : COC_SZENARIEN[szenarioKey as Exclude<CoCSzenario, 'Custom'>];

  // Vorher-Score
  const scorerVorher = computeSovereigntyScore(profile);

  // Adjustiertes Profil: IST-SEAL wird auf die Obergrenze gekappt
  const adjustedAssessments = { ...profile.assessments };
  const objektiveDeltas: CoCStressTestResult['objektiveDeltas'] = [];

  for (const obj of Object.keys(SOV_WEIGHTS) as SovObjective[]) {
    const a = adjustedAssessments[obj];
    const obergrenze = config.sealObergrenzen[obj];
    const sealNachher: SealLevel = obergrenze !== undefined
      ? Math.min(a.istSeal, obergrenze) as SealLevel
      : a.istSeal;

    objektiveDeltas.push({
      objective: obj,
      objectiveLabel: SOV_LABELS[obj],
      sealVorher: a.istSeal,
      sealNachher,
      delta: sealNachher - a.istSeal, // ≤0
      gewicht: SOV_WEIGHTS[obj],
    });

    if (sealNachher !== a.istSeal) {
      adjustedAssessments[obj] = {
        ...a,
        istSeal: sealNachher,
        gap: Math.max(0, a.sollSeal - sealNachher),
      };
    }
  }

  const adjustedProfile: WorkloadSovProfile = {
    ...profile,
    assessments: adjustedAssessments,
  };

  const scoreNachher = computeSovereigntyScore(adjustedProfile);
  const ausgeloestGaps = computeGaps(adjustedProfile);

  return {
    szenario: config.name,
    beschreibung: config.beschreibung,
    scorerVorher,
    scoreNachher,
    scoreEinbruch: scorerVorher.gesamtScore - scoreNachher.gesamtScore,
    objektiveDeltas,
    ausgeloestGaps,
  };
}

// ─── Portfolio-Einstiegspunkt (für die UI) ──────────────────────────────────

/**
 * Vollständige Auswertung eines AppState:
 * Portfolio-Profil + Score + Gaps.
 */
export function assessPortfolio(state: AppState): {
  profile: WorkloadSovProfile;
  score: SovereigntyScoreResult;
  gaps: SovGap[];
} {
  const profile = buildPortfolioProfile(state);
  const score = computeSovereigntyScore(profile);
  const gaps = computeGaps(profile);
  return { profile, score, gaps };
}
