import { describe, it, expect } from 'vitest';
import { berechneEnergieDetail, serverLeistungW, mergeAnnahmen, DEFAULT_ANNAHMEN } from '../sustainability';
import { createDefaultState } from '../store';
import type { AppState, Server } from '../types';

const srv = (over: Partial<Server> = {}): Server => ({
  id: over.id ?? 's1', kuerzel: 'S-001', name: 'Srv', erlaeuterung: '', tags: '',
  status: 'Aktiv', anzahl: '1', plattform: '', verantwortlicher: '', benutzer: '',
  anwendungen: [], itSysteme: [], netzverbindungen: [], raeume: [], gebaeude: [], ...over,
});

const withServers = (servers: Server[]): AppState => ({ ...createDefaultState(), server: servers });

describe('Nachhaltigkeit — Energie-/CO₂-Berechnung (Paket 10)', () => {
  it('serverLeistungW priorisiert Messwert > max. Leistung > Default', () => {
    const a = DEFAULT_ANNAHMEN;
    expect(serverLeistungW(srv({ stromverbrauch: '300' }), a)).toEqual({ w: 300, quelle: 'gemessen' });
    expect(serverLeistungW(srv({ leistungsaufnahmeMax: '0.5' }), a)).toEqual({ w: 500, quelle: 'max' });
    expect(serverLeistungW(srv({}), a)).toEqual({ w: a.defaultLeistungW, quelle: 'default' });
  });

  it('berechnet Energie und CO₂ nach Formel (gemessener Server)', () => {
    // 1000 W, 8760 h, Auslastung 1, PUE 1.6, Strommix 0.380
    const detail = berechneEnergieDetail(withServers([srv({ stromverbrauch: '1000' })]));
    const itKwh = 1 * 8760 * 1; // 8760
    expect(detail.itKwhJahr).toBe(itKwh);
    expect(detail.onPremKwhJahr).toBe(Math.round(itKwh * 1.6)); // 14016
    expect(detail.onPremCo2KgJahr).toBe(Math.round(itKwh * 1.6 * 0.380));
  });

  it('berücksichtigt Anzahl gleicher Server', () => {
    const single = berechneEnergieDetail(withServers([srv({ stromverbrauch: '500', anzahl: '1' })]));
    const triple = berechneEnergieDetail(withServers([srv({ stromverbrauch: '500', anzahl: '3' })]));
    expect(triple.onPremKwhJahr).toBe(single.onPremKwhJahr * 3);
  });

  it('Cloud-Szenario spart über PUE + Strommix, Einsparung positiv', () => {
    const detail = berechneEnergieDetail(withServers([srv({ stromverbrauch: '1000' })]));
    expect(detail.cloudKwhJahr).toBeLessThan(detail.onPremKwhJahr);
    expect(detail.cloudCo2KgJahr).toBeLessThan(detail.onPremCo2KgJahr);
    expect(detail.einsparungCo2KgJahr).toBe(detail.onPremCo2KgJahr - detail.cloudCo2KgJahr);
    expect(detail.einsparungProzent).toBeGreaterThan(0);
  });

  it('zählt Server ohne Messwert (Default-Annahme)', () => {
    const detail = berechneEnergieDetail(withServers([srv({ id: 'a', stromverbrauch: '300' }), srv({ id: 'b' })]));
    expect(detail.serverOhneMesswert).toBe(1);
    expect(detail.zeilen.find(z => z.id === 'b')?.quelle).toBe('default');
  });

  it('editierbare Annahmen ändern das Ergebnis', () => {
    const base = berechneEnergieDetail(withServers([srv({ stromverbrauch: '1000' })]));
    const custom = berechneEnergieDetail(withServers([srv({ stromverbrauch: '1000' })]), { pueOnPrem: 2.0 });
    expect(custom.onPremKwhJahr).toBeGreaterThan(base.onPremKwhJahr);
  });

  it('mergeAnnahmen füllt fehlende Keys aus Defaults', () => {
    expect(mergeAnnahmen({ pueOnPrem: 1.9 })).toEqual({ ...DEFAULT_ANNAHMEN, pueOnPrem: 1.9 });
    expect(mergeAnnahmen()).toEqual(DEFAULT_ANNAHMEN);
  });
});
