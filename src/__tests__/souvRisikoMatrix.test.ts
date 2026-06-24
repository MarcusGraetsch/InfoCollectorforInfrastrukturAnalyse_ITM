import { describe, it, expect } from 'vitest';
import { souveraenitaetsRisikoMatrix, expositionsRisiko } from '../compliance/souveraenitaet';
import { createDefaultState } from '../store';
import type { AppState, Anwendung } from '../types';

const app = (over: Partial<Anwendung> = {}): Anwendung => ({
  id: over.id ?? 'a1', kuerzel: over.kuerzel ?? 'A-001', name: over.name ?? 'App', erlaeuterung: '', tags: '',
  status: 'Aktiv', typ: '', verantwortlicher: '', benutzer: '',
  anwendungen: [], itSysteme: [], netzverbindungen: [], ...over,
});
const withApps = (apps: Anwendung[]): AppState => ({ ...createDefaultState(), anwendungen: apps });

describe('Souveränitäts-Risiko-Matrix', () => {
  it('expositionsRisiko: US-Jurisdiktion + Anbieter-Schlüssel + proprietär = hoch', () => {
    const r = expositionsRisiko({ cloudAnbieterJurisdiktion: 'USA', verschluesselungshoheit: 'Anbieter', portabilitaetsreife: 'Niedrig (proprietär)' });
    expect(r.score).toBeGreaterThanOrEqual(55);
    expect(r.datenarm).toBe(false);
    expect(r.treiber.length).toBeGreaterThan(0);
  });

  it('expositionsRisiko: EU + BYOK + hohe Portabilität = niedrig', () => {
    const r = expositionsRisiko({ cloudAnbieterJurisdiktion: 'EU', verschluesselungshoheit: 'Eigene Schlüssel (BYOK)', portabilitaetsreife: 'Hoch (Standard-Formate)' });
    expect(r.score).toBeLessThan(25);
  });

  it('Gaia-X-Zertifizierung mindert den Score', () => {
    const ohne = expositionsRisiko({ cloudAnbieterJurisdiktion: 'Gemischt' });
    const mit = expositionsRisiko({ cloudAnbieterJurisdiktion: 'Gemischt', gaixZertifiziert: 'Ja' });
    expect(mit.score).toBeLessThan(ohne.score);
  });

  it('datenarm=true wenn keine Souveränitätsfelder erfasst', () => {
    expect(expositionsRisiko({}).datenarm).toBe(true);
  });

  it('Matrix hat 12 Zellen (4 SEAL × 3 Risiko), zeilenweise S3→S0', () => {
    const m = souveraenitaetsRisikoMatrix(withApps([app()]));
    expect(m.zellen.length).toBe(12);
    expect(m.zellen[0].seal).toBe('S3');
    expect(m.zellen[11].seal).toBe('S0');
  });

  it('hoher Bedarf (S3) + hohe Exposition = kritisch', () => {
    const m = souveraenitaetsRisikoMatrix(withApps([app({
      schutzbedarf: 'Sehr hoch',
      datensouveraenitaet: 'Streng souverän (C5 / Gaia-X)',
      cloudAnbieterJurisdiktion: 'USA', verschluesselungshoheit: 'Anbieter', portabilitaetsreife: 'Niedrig (proprietär)',
    })]));
    expect(m.kritisch).toBeGreaterThanOrEqual(1);
    const obj = m.objekte[0];
    expect(obj.seal).toBe('S3');
    expect(obj.risiko).toBe('Hoch');
    expect(obj.severity).toBe('kritisch');
  });

  it('kein Bedarf (S0) + hohe Exposition = gering (kein Souveränitätsrisiko)', () => {
    const m = souveraenitaetsRisikoMatrix(withApps([app({
      cloudAnbieterJurisdiktion: 'USA', verschluesselungshoheit: 'Anbieter', portabilitaetsreife: 'Niedrig (proprietär)',
    })]));
    expect(m.objekte[0].seal).toBe('S0');
    expect(m.objekte[0].severity).toBe('gering');
    expect(m.kritisch).toBe(0);
  });

  it('leerer State liefert leere Matrix', () => {
    const m = souveraenitaetsRisikoMatrix(createDefaultState());
    expect(m.gesamt).toBe(0);
    expect(m.zellen.every(z => z.count === 0)).toBe(true);
  });
});
