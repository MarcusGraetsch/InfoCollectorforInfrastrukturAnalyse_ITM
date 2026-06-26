import { describe, it, expect } from 'vitest';
import {
  SOV_WEIGHTS,
  SEAL_LABELS,
  computeSovereigntyScore,
  deriveSollSeal,
  computeGaps,
  simulateChangeOfControl,
  buildPortfolioProfile,
  migrateLegacySeal,
  schutzbedarfFaktor,
} from '../compliance/sovereignty';
import type { WorkloadSovProfile, SovObjective, SealLevel } from '../compliance/sovereignty';
import type { AppState } from '../types';

// ─── Hilfsfunktion: leeres Profil ──────────────────────────────────────────

function makeProfile(
  overrides: Partial<Record<SovObjective, SealLevel>>,
  schutzbedarf: 'Normal' | 'Hoch' | 'Sehr hoch' | 'Unklar' | '' = 'Normal',
): WorkloadSovProfile {
  const sollMap = deriveSollSeal(schutzbedarf);
  const assessments = {} as WorkloadSovProfile['assessments'];
  for (const obj of Object.keys(SOV_WEIGHTS) as SovObjective[]) {
    const ist: SealLevel = overrides[obj] ?? 0;
    assessments[obj] = {
      objective: obj,
      istSeal: ist,
      sollSeal: sollMap[obj],
      gap: Math.max(0, sollMap[obj] - ist),
      contributingFactorScores: {},
      evidenceRefs: [],
    };
  }
  return { workloadId: 'test', workloadName: 'Test', schutzbedarf, assessments };
}

// ─── Gewichte ───────────────────────────────────────────────────────────────

describe('SOV_WEIGHTS', () => {
  it('Summe der Gewichte = 1.0', () => {
    const sum = Object.values(SOV_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(Math.round(sum * 1000) / 1000).toBe(1.0);
  });

  it('genau 8 Objektive', () => {
    expect(Object.keys(SOV_WEIGHTS).length).toBe(8);
  });
});

// ─── SEAL-Labels ────────────────────────────────────────────────────────────

describe('SEAL_LABELS', () => {
  it('5 Stufen 0–4 definiert', () => {
    for (let i = 0 as SealLevel; i <= 4; i++) {
      expect(SEAL_LABELS[i as SealLevel]).toBeDefined();
    }
  });
});

// ─── computeSovereigntyScore ─────────────────────────────────────────────────

describe('computeSovereigntyScore', () => {
  it('alle SEAL-0 → Score = 0', () => {
    const profile = makeProfile({});
    const { gesamtScore } = computeSovereigntyScore(profile);
    expect(gesamtScore).toBe(0);
  });

  it('alle SEAL-4 → Score = 100', () => {
    const profile = makeProfile({
      'SOV-1': 4, 'SOV-2': 4, 'SOV-3': 4, 'SOV-4': 4,
      'SOV-5': 4, 'SOV-6': 4, 'SOV-7': 4, 'SOV-8': 4,
    });
    const { gesamtScore } = computeSovereigntyScore(profile);
    expect(gesamtScore).toBe(100);
  });

  it('gemischtes Szenario — Plausibilitätscheck', () => {
    // SOV-5 (Gewicht 20%) = SEAL-4 = 100 → Beitrag = 20
    // SOV-1 (15%) = SEAL-2 = 50 → Beitrag = 7.5
    // Rest = 0
    const profile = makeProfile({ 'SOV-5': 4, 'SOV-1': 2 });
    const { gesamtScore, teilscores, beitraege } = computeSovereigntyScore(profile);
    expect(teilscores['SOV-5']).toBe(100);
    expect(teilscores['SOV-1']).toBe(50);
    expect(beitraege['SOV-5']).toBeCloseTo(20, 1);
    expect(beitraege['SOV-1']).toBeCloseTo(7.5, 1);
    expect(gesamtScore).toBeGreaterThan(0);
    expect(gesamtScore).toBeLessThan(100);
  });

  it('Teilscores liegen alle 0–100', () => {
    const profile = makeProfile({ 'SOV-1': 2, 'SOV-3': 3, 'SOV-7': 1 });
    const { teilscores } = computeSovereigntyScore(profile);
    for (const v of Object.values(teilscores)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});

// ─── deriveSollSeal ─────────────────────────────────────────────────────────

describe('deriveSollSeal', () => {
  it('Normal → SEAL-1 für alle Objektive (außer SOV-8)', () => {
    const m = deriveSollSeal('Normal');
    expect(m['SOV-1']).toBe(1);
    expect(m['SOV-2']).toBe(1);
    expect(m['SOV-8']).toBe(1);
  });

  it('Hoch → SOV-3 und SOV-7 mindestens SEAL-2', () => {
    const m = deriveSollSeal('Hoch');
    expect(m['SOV-3']).toBeGreaterThanOrEqual(2);
    expect(m['SOV-7']).toBeGreaterThanOrEqual(2);
  });

  it('Sehr hoch → SOV-5 = SEAL-3', () => {
    const m = deriveSollSeal('Sehr hoch');
    expect(m['SOV-5']).toBe(3);
  });

  it('SOV-8 ist immer mindestens SEAL-1', () => {
    for (const sb of ['Normal', 'Hoch', 'Sehr hoch', 'Unklar', ''] as const) {
      const m = deriveSollSeal(sb as Parameters<typeof deriveSollSeal>[0]);
      expect(m['SOV-8']).toBeGreaterThanOrEqual(1);
    }
  });

  it('Unklar → konservativer Default SEAL-1', () => {
    const m = deriveSollSeal('Unklar');
    expect(m['SOV-1']).toBe(1);
  });
});

// ─── computeGaps ─────────────────────────────────────────────────────────────

describe('computeGaps', () => {
  it('kein Gap wenn alle IST ≥ SOLL', () => {
    const profile = makeProfile(
      { 'SOV-1': 4, 'SOV-2': 4, 'SOV-3': 4, 'SOV-4': 4, 'SOV-5': 4, 'SOV-6': 4, 'SOV-7': 4, 'SOV-8': 4 },
      'Sehr hoch',
    );
    expect(computeGaps(profile).length).toBe(0);
  });

  it('Gaps sortiert nach Priorität (absteigend)', () => {
    // SOV-5 hat höchstes Gewicht (0.20) und Gap 3 → höchste Priorität
    const profile = makeProfile({ 'SOV-5': 0, 'SOV-8': 0 }, 'Normal');
    const gaps = computeGaps(profile);
    expect(gaps.length).toBeGreaterThan(0);
    for (let i = 0; i < gaps.length - 1; i++) {
      expect(gaps[i].prioritaet).toBeGreaterThanOrEqual(gaps[i + 1].prioritaet);
    }
  });

  it('Schutzbedarfsfaktor "Sehr hoch" erhöht Priorität', () => {
    const p1 = makeProfile({ 'SOV-5': 0 }, 'Normal');
    const p2 = makeProfile({ 'SOV-5': 0 }, 'Sehr hoch');
    const g1 = computeGaps(p1).find(g => g.objective === 'SOV-5')!;
    const g2 = computeGaps(p2).find(g => g.objective === 'SOV-5')!;
    expect(g2.prioritaet).toBeGreaterThan(g1.prioritaet);
  });
});

// ─── simulateChangeOfControl ────────────────────────────────────────────────

describe('simulateChangeOfControl', () => {
  it('US-CLOUD-Act senkt SOV-1/SOV-2 auf maximal SEAL-1', () => {
    const profile = makeProfile({ 'SOV-1': 3, 'SOV-2': 3 });
    const result = simulateChangeOfControl(profile, 'US-CLOUD-Act');
    const sov1Delta = result.objektiveDeltas.find(d => d.objective === 'SOV-1')!;
    const sov2Delta = result.objektiveDeltas.find(d => d.objective === 'SOV-2')!;
    expect(sov1Delta.sealNachher).toBeLessThanOrEqual(1);
    expect(sov2Delta.sealNachher).toBeLessThanOrEqual(1);
  });

  it('Score-Einbruch ist nicht negativ', () => {
    const profile = makeProfile({ 'SOV-1': 2, 'SOV-2': 2, 'SOV-3': 2, 'SOV-7': 2 });
    const result = simulateChangeOfControl(profile, 'US-CLOUD-Act');
    expect(result.scoreEinbruch).toBeGreaterThanOrEqual(0);
  });

  it('Score nachher ≤ Score vorher', () => {
    const profile = makeProfile({
      'SOV-1': 4, 'SOV-2': 4, 'SOV-3': 3, 'SOV-4': 2, 'SOV-5': 3, 'SOV-6': 3, 'SOV-7': 3, 'SOV-8': 2,
    });
    const result = simulateChangeOfControl(profile, 'US-CLOUD-Act');
    expect(result.scoreNachher.gesamtScore).toBeLessThanOrEqual(result.scorerVorher.gesamtScore);
  });

  it('Non-EU-Acquisition senkt SOV-5', () => {
    const profile = makeProfile({ 'SOV-5': 3 });
    const result = simulateChangeOfControl(profile, 'Non-EU-Acquisition');
    const sov5 = result.objektiveDeltas.find(d => d.objective === 'SOV-5')!;
    expect(sov5.sealNachher).toBeLessThanOrEqual(1);
  });

  it('Custom-Konfiguration wird korrekt angewendet', () => {
    const profile = makeProfile({ 'SOV-6': 4 });
    const result = simulateChangeOfControl(profile, 'Custom', {
      name: 'Custom',
      beschreibung: 'Test',
      sealObergrenzen: { 'SOV-6': 2 },
    });
    const sov6 = result.objektiveDeltas.find(d => d.objective === 'SOV-6')!;
    expect(sov6.sealNachher).toBeLessThanOrEqual(2);
  });

  it('Alle ausgelösten Gaps haben positiven Gap-Wert', () => {
    const profile = makeProfile({ 'SOV-1': 3, 'SOV-2': 3, 'SOV-3': 3 }, 'Hoch');
    const result = simulateChangeOfControl(profile, 'US-CLOUD-Act');
    for (const g of result.ausgeloestGaps) {
      expect(g.gap).toBeGreaterThan(0);
    }
  });
});

// ─── Migration ──────────────────────────────────────────────────────────────

describe('migrateLegacySeal', () => {
  it('S3 → SEAL-4, S2 → SEAL-3, S1 → SEAL-2, S0 → SEAL-0', () => {
    expect(migrateLegacySeal('S3')).toBe(4);
    expect(migrateLegacySeal('S2')).toBe(3);
    expect(migrateLegacySeal('S1')).toBe(2);
    expect(migrateLegacySeal('S0')).toBe(0);
  });

  it('Unbekannter Wert → SEAL-0 (safe default)', () => {
    expect(migrateLegacySeal(undefined)).toBe(0);
    expect(migrateLegacySeal('X9')).toBe(0);
  });
});

// ─── schutzbedarfFaktor ──────────────────────────────────────────────────────

describe('schutzbedarfFaktor', () => {
  it('Sehr hoch > Hoch > Normal > Unklar', () => {
    expect(schutzbedarfFaktor('Sehr hoch')).toBeGreaterThan(schutzbedarfFaktor('Hoch'));
    expect(schutzbedarfFaktor('Hoch')).toBeGreaterThan(schutzbedarfFaktor('Normal'));
    expect(schutzbedarfFaktor('Normal')).toBeGreaterThan(schutzbedarfFaktor('Unklar'));
  });
});

// ─── buildPortfolioProfile — Grenzfälle ────────────────────────────────────

describe('buildPortfolioProfile', () => {
  it('leerer State → SEAL-0 überall, keine Abstürze', () => {
    const state = { anwendungen: [], server: [], clients: [], icsSysteme: [], iotSysteme: [] } as unknown as AppState;
    const profile = buildPortfolioProfile(state);
    for (const a of Object.values(profile.assessments)) {
      expect(a.istSeal).toBe(0);
    }
  });
});
