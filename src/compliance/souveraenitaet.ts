import type { AppState, Anwendung, CloudFields } from '../types';
import { assessSovereignty, assessAll, ASSESSABLE_CATEGORIES } from '../cloudReadiness';
import { berechneEinstufung, nis2GapAmpel } from './nis2';
import { getEffektiverSchutzbedarf } from '../schutzbedarfsVererbung';

/**
 * Mehrdimensionale Souveränitäts-Scorecard + deterministischer
 * Souveränitäts-Washing-Check.
 *
 * Alles offline, deterministisch (keine KI). Die Scores werden heuristisch aus
 * bereits im Tool vorhandenen Daten abgeleitet (Cloud-Felder, SEAL-Bewertung,
 * NIS2-Assessment, EU-AI-Act-Felder, DORA-Register). Fehlt eine Datengrundlage,
 * trägt die Dimension neutral bei (kein Punktabzug) — konsistent mit der
 * Unklar-Philosophie des Tools. Schwellen wie cloudReadiness: ≥70 Hoch,
 * 45–69 Mittel, <45 Niedrig.
 */

// ─── Feature A — Scorecard ──────────────────────────────────────────────────

export type SouvDimension =
  | 'datenschutz'
  | 'cybersicherheit'
  | 'resilienz'
  | 'lockin'
  | 'kiGovernance'
  | 'supplyChain';

export type SouvLevel = 'Hoch' | 'Mittel' | 'Niedrig';

export interface DimensionScore {
  dimension: SouvDimension;
  label: string;
  score: number; // 0–100
  level: SouvLevel;
  begruendung: string[];
}

export interface SouvScorecard {
  dimensionen: DimensionScore[];
  gesamt: number;
}

export const SOUV_DIMENSION_LABELS: Record<SouvDimension, string> = {
  datenschutz: 'Datenschutz',
  cybersicherheit: 'Cybersicherheit',
  resilienz: 'Operative Resilienz',
  lockin: 'Souveränität / Lock-in',
  kiGovernance: 'KI-Governance',
  supplyChain: 'Supply-Chain-Transparenz',
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function levelFor(score: number): SouvLevel {
  return score >= 70 ? 'Hoch' : score >= 45 ? 'Mittel' : 'Niedrig';
}

const ASSESSABLE = ASSESSABLE_CATEGORIES;

function cloudObjekte(state: AppState): CloudFields[] {
  return ASSESSABLE.flatMap((cat) => ((state as any)[cat] as CloudFields[]) ?? []);
}

/** Heuristische Bewertung aller sechs Souveränitäts-Dimensionen. */
export function assessSouveraenitaet(state: AppState): SouvScorecard {
  const objekte = cloudObjekte(state);
  const anwendungen = state.anwendungen ?? [];
  const kiSysteme = anwendungen.filter((a) => a.istKISystem);

  // ── Datenschutz: Schutzbedarf vs. Datensouveränität/Jurisdiktion ──────────
  const datenschutz = ((): DimensionScore => {
    const b: string[] = [];
    if (objekte.length === 0) {
      b.push('Keine cloud-relevanten Objekte erfasst — Dimension unklar.');
      return { dimension: 'datenschutz', label: SOUV_DIMENSION_LABELS.datenschutz, score: 50, level: 'Mittel', begruendung: b };
    }
    let score = 60;
    const drittstaat = objekte.filter(
      (o) => o.cloudAnbieterJurisdiktion === 'USA' || o.cloudAnbieterJurisdiktion === 'Gemischt'
    ).length;
    const hoherBedarf = objekte.filter((o) => {
      const sb = getEffektiverSchutzbedarf(o);
      return sb === 'Hoch' || sb === 'Sehr hoch';
    }).length;
    const souveraen = objekte.filter(
      (o) => o.datensouveraenitaet === 'Deutschland' || o.datensouveraenitaet === 'EU / DSGVO' ||
        o.datensouveraenitaet === 'Streng souverän (C5 / Gaia-X)'
    ).length;
    if (drittstaat > 0) {
      score -= Math.min(35, drittstaat * 12);
      b.push(`${drittstaat} Objekt(e) mit Drittstaat-/gemischter Jurisdiktion (Schrems-II-Exposition).`);
    }
    if (hoherBedarf > 0 && drittstaat > 0) {
      score -= 10;
      b.push('Hoher Schutzbedarf trifft auf Drittstaat-Anbieter — kritische Kombination.');
    }
    if (souveraen > 0) {
      score += Math.min(20, souveraen * 5);
      b.push(`${souveraen} Objekt(e) mit EU-/DE-Datensouveränität deklariert.`);
    }
    if (b.length === 0) b.push('Keine besonderen Datenschutz-Risiken erkannt.');
    score = clamp(score);
    return { dimension: 'datenschutz', label: SOUV_DIMENSION_LABELS.datenschutz, score, level: levelFor(score), begruendung: b };
  })();

  // ── Cybersicherheit: NIS2-Erfüllungsgrad ──────────────────────────────────
  const cybersicherheit = ((): DimensionScore => {
    const b: string[] = [];
    const a = state.nis2Assessment;
    if (!a || (!a.sektor && Object.keys(a.massnahmen ?? {}).length === 0)) {
      b.push('Kein NIS2-Assessment erfasst — Dimension unklar.');
      return { dimension: 'cybersicherheit', label: SOUV_DIMENSION_LABELS.cybersicherheit, score: 50, level: 'Mittel', begruendung: b };
    }
    const ampel = nis2GapAmpel(a.massnahmen ?? {});
    const einstufung = berechneEinstufung(a);
    let score = ampel.erfuellungsgrad;
    b.push(`NIS2-Erfüllungsgrad der 10 Mindestmaßnahmen: ${ampel.erfuellungsgrad}%.`);
    if (ampel.fehlend > 0) b.push(`${ampel.fehlend} Maßnahme(n) noch offen/fehlend.`);
    if (einstufung === 'Besonders wichtig' || einstufung === 'Wichtig') {
      b.push(`Betroffenheit: ${einstufung} — NIS2-Pflichten greifen.`);
    }
    score = clamp(score);
    return { dimension: 'cybersicherheit', label: SOUV_DIMENSION_LABELS.cybersicherheit, score, level: levelFor(score), begruendung: b };
  })();

  // ── Operative Resilienz: DORA-Register / Exit-Strategien ──────────────────
  const resilienz = ((): DimensionScore => {
    const b: string[] = [];
    const register = state.iktDienstleister ?? [];
    if (register.length === 0) {
      b.push('Kein DORA-/IKT-Drittparteien-Register gepflegt — Dimension unklar.');
      return { dimension: 'resilienz', label: SOUV_DIMENSION_LABELS.resilienz, score: 50, level: 'Mittel', begruendung: b };
    }
    let score = 55;
    const mitExit = register.filter((d) => d.exitStrategie && d.exitStrategie.trim()).length;
    const kritisch = register.filter((d) => d.kritiisch === 'Ja' || d.doraKategorie === 'Kritisch').length;
    const konzentration = register.filter((d) => d.konzentrationsrisiko === 'Hoch').length;
    score += Math.round((mitExit / register.length) * 30);
    b.push(`${mitExit}/${register.length} Dienstleister mit dokumentierter Exit-Strategie.`);
    if (kritisch > 0) b.push(`${kritisch} kritische(r) IKT-Dienstleister im Register.`);
    if (konzentration > 0) {
      score -= Math.min(20, konzentration * 8);
      b.push(`${konzentration} Dienstleister mit hohem Konzentrationsrisiko.`);
    }
    score = clamp(score);
    return { dimension: 'resilienz', label: SOUV_DIMENSION_LABELS.resilienz, score, level: levelFor(score), begruendung: b };
  })();

  // ── Souveränität / Lock-in: SEAL-Level + Portabilität ─────────────────────
  const lockin = ((): DimensionScore => {
    const b: string[] = [];
    if (objekte.length === 0) {
      b.push('Keine cloud-relevanten Objekte erfasst — Dimension unklar.');
      return { dimension: 'lockin', label: SOUV_DIMENSION_LABELS.lockin, score: 50, level: 'Mittel', begruendung: b };
    }
    let score = 55;
    const seal = objekte.map((o) => assessSovereignty(o));
    const s2s3 = seal.filter((s) => s.level === 'S2' || s.level === 'S3').length;
    const niedrigePortab = objekte.filter((o) => o.portabilitaetsreife === 'Niedrig (proprietär)').length;
    const hohePortab = objekte.filter((o) => o.portabilitaetsreife === 'Hoch (Standard-Formate)').length;
    const eigeneKeys = objekte.filter(
      (o) => o.verschluesselungshoheit === 'Eigene Schlüssel (BYOK)' || o.verschluesselungshoheit === 'Hardware-Schlüssel (HYOK)'
    ).length;
    if (hohePortab > 0) { score += Math.min(20, hohePortab * 6); b.push(`${hohePortab} Objekt(e) mit hoher Portabilität (Standard-Formate).`); }
    if (niedrigePortab > 0) { score -= Math.min(25, niedrigePortab * 8); b.push(`${niedrigePortab} Objekt(e) mit proprietärem Lock-in-Risiko.`); }
    if (eigeneKeys > 0) { score += Math.min(15, eigeneKeys * 5); b.push(`${eigeneKeys} Objekt(e) mit eigener Schlüsselhoheit (BYOK/HYOK).`); }
    if (s2s3 > 0) b.push(`${s2s3} Objekt(e) mit erhöhter/strenger Souveränitätsanforderung (S2/S3).`);
    if (b.length === 0) b.push('Solide Souveränitätslage, keine Lock-in-Auffälligkeiten.');
    score = clamp(score);
    return { dimension: 'lockin', label: SOUV_DIMENSION_LABELS.lockin, score, level: levelFor(score), begruendung: b };
  })();

  // ── KI-Governance: EU-AI-Act-Felder ───────────────────────────────────────
  const kiGovernance = ((): DimensionScore => {
    const b: string[] = [];
    if (kiSysteme.length === 0) {
      b.push('Keine KI-Systeme markiert — Dimension unklar (ggf. Shadow-AI prüfen).');
      return { dimension: 'kiGovernance', label: SOUV_DIMENSION_LABELS.kiGovernance, score: 50, level: 'Mittel', begruendung: b };
    }
    let score = 55;
    const mitLogging = kiSysteme.filter((a) => a.aiLoggingVorhanden === 'Ja').length;
    const mitAufsicht = kiSysteme.filter((a) => a.aiMenschlicheAufsicht === 'Vollständig' || a.aiMenschlicheAufsicht === 'Teilweise').length;
    const hochrisiko = kiSysteme.filter((a) => a.aiRisikoklasse === 'Hoch').length;
    const unklassifiziert = kiSysteme.filter((a) => !a.aiRisikoklasse || a.aiRisikoklasse === 'Unklar').length;
    score += Math.round((mitLogging / kiSysteme.length) * 20);
    score += Math.round((mitAufsicht / kiSysteme.length) * 15);
    b.push(`${mitLogging}/${kiSysteme.length} KI-Systeme mit Logging (Art. 12), ${mitAufsicht}/${kiSysteme.length} mit menschlicher Aufsicht.`);
    if (hochrisiko > 0) b.push(`${hochrisiko} Hochrisiko-KI-System(e) (strenge AI-Act-Pflichten).`);
    if (unklassifiziert > 0) { score -= Math.min(20, unklassifiziert * 6); b.push(`${unklassifiziert} KI-System(e) ohne Risikoklassifizierung.`); }
    score = clamp(score);
    return { dimension: 'kiGovernance', label: SOUV_DIMENSION_LABELS.kiGovernance, score, level: levelFor(score), begruendung: b };
  })();

  // ── Supply-Chain-Transparenz: Provider-/Subprozessor-Sichtbarkeit ─────────
  const supplyChain = ((): DimensionScore => {
    const b: string[] = [];
    const register = state.iktDienstleister ?? [];
    if (register.length === 0 && objekte.length === 0) {
      b.push('Keine Lieferketten-/Dienstleisterdaten erfasst — Dimension unklar.');
      return { dimension: 'supplyChain', label: SOUV_DIMENSION_LABELS.supplyChain, score: 50, level: 'Mittel', begruendung: b };
    }
    let score = 50;
    if (register.length > 0) {
      score += 15;
      b.push(`${register.length} IKT-Dienstleister im Register dokumentiert.`);
      const mitLand = register.filter((d) => d.land && d.land.trim()).length;
      score += Math.round((mitLand / register.length) * 15);
      b.push(`${mitLand}/${register.length} Dienstleister mit dokumentiertem Jurisdiktions-/Standort.`);
    } else {
      b.push('Lieferkette nur über Cloud-Objekte abgebildet — kein dediziertes Register.');
    }
    const gaix = objekte.filter((o) => o.gaixZertifiziert === 'Ja').length;
    if (gaix > 0) { score += Math.min(15, gaix * 5); b.push(`${gaix} Objekt(e) mit Gaia-X-Vertrauensanker.`); }
    b.push('Hinweis: SBOM/Provenance werden im Tool nicht erfasst — Nachweis offen.');
    score = clamp(score);
    return { dimension: 'supplyChain', label: SOUV_DIMENSION_LABELS.supplyChain, score, level: levelFor(score), begruendung: b };
  })();

  const dimensionen = [datenschutz, cybersicherheit, resilienz, lockin, kiGovernance, supplyChain];
  const gesamt = clamp(dimensionen.reduce((s, d) => s + d.score, 0) / dimensionen.length);
  return { dimensionen, gesamt };
}

// ─── Feature B — Souveränitäts-Washing-Check ────────────────────────────────

export type Verdikt = 'fail' | 'warn' | 'pass' | 'unklar';

export interface SouvFinding {
  id: string;
  regel: string;
  objekt: string;
  kategorie: string;
  verdikt: Verdikt;
  begruendung: string;
  nachweis: string;
  quelle: string;
}

const KAT_LABEL: Record<string, string> = {
  anwendungen: 'Anwendung',
  server: 'Server',
  clients: 'Client',
  icsSysteme: 'ICS-System',
  iotSysteme: 'IoT-System',
};

function verarbeitetPII(o: CloudFields): boolean {
  const sb = getEffektiverSchutzbedarf(o);
  return sb === 'Hoch' || sb === 'Sehr hoch' ||
    o.datensouveraenitaet === 'Deutschland' || o.datensouveraenitaet === 'EU / DSGVO' ||
    o.datensouveraenitaet === 'Streng souverän (C5 / Gaia-X)';
}

function istCloud(o: CloudFields): boolean {
  return !!o.bereitstellung && o.bereitstellung !== 'On-Premises (physisch)' && o.bereitstellung !== 'On-Premises (virtualisiert)';
}

/** Deterministische Prüfregeln (Requirement → Verdict). Keine KI. */
export function pruefeSouveraenitaet(state: AppState): SouvFinding[] {
  const findings: SouvFinding[] = [];
  let n = 0;
  const id = () => `souv-${++n}`;

  for (const cat of ASSESSABLE) {
    const items = ((state as any)[cat] as (CloudFields & { id: string; name: string; kuerzel: string })[]) ?? [];
    const katLabel = KAT_LABEL[cat] ?? cat;

    for (const o of items) {
      const objLabel = `${o.kuerzel ?? ''} ${o.name ?? ''}`.trim() || '(unbenannt)';
      const seal = assessSovereignty(o);

      // Regel 1 — PII + Drittstaat-Zugriff ohne SCC/AVV-Hinweis → fail
      if (verarbeitetPII(o) && (o.cloudAnbieterJurisdiktion === 'USA' || o.cloudAnbieterJurisdiktion === 'Gemischt')) {
        findings.push({
          id: id(), regel: 'PII + Drittstaat-Zugriff', objekt: objLabel, kategorie: katLabel,
          verdikt: 'fail',
          begruendung: `Personenbezogene/​schützenswerte Daten bei Anbieter mit ${o.cloudAnbieterJurisdiktion}-Jurisdiktion. Ohne SCC + Transfer-Impact-Assessment unzulässiger Drittlandstransfer.`,
          nachweis: 'SCC-Module + Annexe, Transfer-Impact-Assessment (TIA)',
          quelle: 'DSGVO Kap. V + Schrems II + SCC',
        });
      }

      // Regel 2 — Cloud-Vendor verarbeitet PII + kein AVV dokumentiert → fail/unklar
      if (istCloud(o) && verarbeitetPII(o)) {
        // Tool erfasst keinen AVV-Status → unklar statt false pass
        findings.push({
          id: id(), regel: 'AVV / Art.-28-Vertrag', objekt: objLabel, kategorie: katLabel,
          verdikt: 'unklar',
          begruendung: 'Cloud-Dienst verarbeitet personenbezogene Daten. AVV/Auftragsverarbeitungsvertrag nach Art. 28 nicht im Tool erfasst.',
          nachweis: 'AVV/Art.-28-Vertrag (DPA)',
          quelle: 'DSGVO Art. 28 + DSK',
        });
      }

      // Regel 3 — als souverän/Gaia-X vermarktet ohne Exit-Plan-Nachweis → warn
      const alsSouveraen = o.gaixZertifiziert === 'Ja' || o.datensouveraenitaet === 'Streng souverän (C5 / Gaia-X)' || seal.level === 'S3';
      if (alsSouveraen) {
        const exitNachweis = o.portabilitaetsreife === 'Hoch (Standard-Formate)';
        findings.push({
          id: id(), regel: 'Souveränitäts-Washing (Exit/Portabilität)', objekt: objLabel, kategorie: katLabel,
          verdikt: exitNachweis ? 'pass' : 'warn',
          begruendung: exitNachweis
            ? 'Als souverän deklariert und hohe Portabilität (Standard-Formate) belegt.'
            : 'Als souverän/Gaia-X vermarktet, aber kein Exit-/Portabilitäts-/Admin-Kontroll-Nachweis hinterlegt.',
          nachweis: 'Exit-Plan & Export-Test, Admin-Zugriffsmodell',
          quelle: 'DSK Souveräne Clouds + ZenDiS',
        });
      }

      // Regel 5 — Cloud-Dienst ohne C5-Zertifizierungsnachweis → warn/unklar
      if (istCloud(o)) {
        const c5Hinweis = o.datensouveraenitaet === 'Streng souverän (C5 / Gaia-X)' || o.gaixZertifiziert === 'Ja';
        findings.push({
          id: id(), regel: 'C5-Testat im Scope', objekt: objLabel, kategorie: katLabel,
          verdikt: c5Hinweis ? 'pass' : 'unklar',
          begruendung: c5Hinweis
            ? 'C5-/Gaia-X-konforme Souveränitätsanforderung gesetzt.'
            : 'Cloud-Dienst ohne dokumentierten BSI-C5-Zertifizierungsnachweis im Scope.',
          nachweis: 'C5:2026-Report + Bridge-Letter',
          quelle: 'BSI C5:2026',
        });
      }

      // Regel 6 — Portabilität/Switching nicht gewährleistet → warn/unklar
      if (istCloud(o)) {
        if (o.portabilitaetsreife === 'Niedrig (proprietär)') {
          findings.push({
            id: id(), regel: 'Portabilität / Switching', objekt: objLabel, kategorie: katLabel,
            verdikt: 'warn',
            begruendung: 'Proprietäre Formate — Portabilität/Anbieterwechsel nach Data Act nicht gewährleistet.',
            nachweis: 'Export-Test, Time-to-Exit-KPI, offene Formate',
            quelle: 'Data Act + Free Flow of Non-Personal Data',
          });
        } else if (!o.portabilitaetsreife || o.portabilitaetsreife === 'Unklar') {
          findings.push({
            id: id(), regel: 'Portabilität / Switching', objekt: objLabel, kategorie: katLabel,
            verdikt: 'unklar',
            begruendung: 'Portabilitätsreife nicht erfasst — Switching-Fähigkeit nach Data Act offen.',
            nachweis: 'Export-Test, Time-to-Exit-KPI',
            quelle: 'Data Act + Free Flow of Non-Personal Data',
          });
        }
      }
    }
  }

  // Regel 4 — KI-System vertrauenswürdig ohne ML-Lifecycle-/Logging-Kontrollen → warn
  for (const a of (state.anwendungen ?? []) as Anwendung[]) {
    if (!a.istKISystem) continue;
    const objLabel = `${a.kuerzel ?? ''} ${a.name ?? ''}`.trim() || '(unbenannt)';
    const loggingOk = a.aiLoggingVorhanden === 'Ja';
    const aufsichtOk = a.aiMenschlicheAufsicht === 'Vollständig' || a.aiMenschlicheAufsicht === 'Teilweise';
    const beideUnklar = (!a.aiLoggingVorhanden || a.aiLoggingVorhanden === 'Unklar') && (!a.aiMenschlicheAufsicht || a.aiMenschlicheAufsicht === 'Unklar');
    findings.push({
      id: id(), regel: 'KI-Lifecycle / Logging', objekt: objLabel, kategorie: 'Anwendung',
      verdikt: loggingOk && aufsichtOk ? 'pass' : beideUnklar ? 'unklar' : 'warn',
      begruendung: loggingOk && aufsichtOk
        ? 'KI-System mit Logging (Art. 12) und menschlicher Aufsicht.'
        : beideUnklar
          ? 'KI-System ohne erfasste ML-Lifecycle-Kontrollen (Logging/Aufsicht).'
          : 'KI-System als vertrauenswürdig geführt, aber Logging oder menschliche Aufsicht fehlt.',
      nachweis: 'AIC4-Nachweise (Logging, Inference-Monitoring), ISO 42001 AIMS',
      quelle: 'BSI AIC4 + EU AI Act',
    });
  }

  return findings;
}

export const VERDIKT_FARBE: Record<Verdikt, string> = {
  fail: 'bg-red-100 text-red-800',
  warn: 'bg-amber-100 text-amber-800',
  pass: 'bg-emerald-100 text-emerald-800',
  unklar: 'bg-gray-100 text-gray-600',
};

export const VERDIKT_LABEL: Record<Verdikt, string> = {
  fail: 'Fail',
  warn: 'Warnung',
  pass: 'Pass',
  unklar: 'Unklar',
};

// Re-export für ggf. nutzende Komponenten
export { assessAll };
