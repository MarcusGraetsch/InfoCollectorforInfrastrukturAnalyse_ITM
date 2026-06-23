import { describe, it, expect } from 'vitest';
import type { AppState, Beziehung } from '../types';
import {
  BEZIEHUNGS_TYPEN,
  TYP_LABEL,
  beziehungenFuerObjekt,
  pruneOrphanBeziehungen,
  addBeziehung,
  removeBeziehung,
} from '../utils/beziehungen';

function makeState(beziehungen: Beziehung[]): AppState {
  return {
    server: [{ id: 's1', kuerzel: 'SRV-001', name: 'Server 1' }],
    anwendungen: [{ id: 'a1', kuerzel: 'APP-001', name: 'App 1' }],
    iotSysteme: [{ id: 'i1', kuerzel: 'IOT-001', name: 'IoT 1' }],
    beziehungen,
  } as unknown as AppState;
}

const b1: Beziehung = { id: 'b1', quelleKategorie: 'server', quelleId: 's1', zielKategorie: 'anwendungen', zielId: 'a1', typ: 'abhaengig', richtung: 'uni' };
const b2: Beziehung = { id: 'b2', quelleKategorie: 'iotSysteme', quelleId: 'i1', zielKategorie: 'server', zielId: 's1', typ: 'physisch', richtung: 'uni' };
const bOrphan: Beziehung = { id: 'b3', quelleKategorie: 'server', quelleId: 'sX', zielKategorie: 'anwendungen', zielId: 'a1', typ: 'kommuniziert', richtung: 'bi' };

describe('beziehungen utils', () => {
  it('beziehungenFuerObjekt returns edges where item is source OR target', () => {
    const state = makeState([b1, b2]);
    const forServer = beziehungenFuerObjekt(state, 'server', 's1');
    expect(forServer.map(b => b.id).sort()).toEqual(['b1', 'b2']);
    const forApp = beziehungenFuerObjekt(state, 'anwendungen', 'a1');
    expect(forApp.map(b => b.id)).toEqual(['b1']);
  });

  it('addBeziehung appends without mutating', () => {
    const list = [b1];
    const next = addBeziehung(list, b2);
    expect(next).toHaveLength(2);
    expect(list).toHaveLength(1);
  });

  it('removeBeziehung drops by id', () => {
    expect(removeBeziehung([b1, b2], 'b1').map(b => b.id)).toEqual(['b2']);
  });

  it('pruneOrphanBeziehungen drops edges with missing endpoints, keeps valid', () => {
    const state = makeState([b1, b2, bOrphan]);
    const pruned = pruneOrphanBeziehungen(state);
    expect(pruned.map(b => b.id).sort()).toEqual(['b1', 'b2']);
  });

  it('TYP_LABEL has all six types', () => {
    const typen: Array<keyof typeof TYP_LABEL> = ['kommuniziert', 'physisch', 'treiber', 'abhaengig', 'teil-von', 'redundanz'];
    for (const t of typen) expect(TYP_LABEL[t]).toBeTruthy();
    expect(Object.keys(TYP_LABEL)).toHaveLength(6);
  });

  it('BEZIEHUNGS_TYPEN default directions are correct', () => {
    const byTyp = Object.fromEntries(BEZIEHUNGS_TYPEN.map(t => [t.typ, t.defaultRichtung]));
    expect(byTyp.kommuniziert).toBe('bi');
    expect(byTyp.physisch).toBe('uni');
    expect(byTyp.treiber).toBe('uni');
    expect(byTyp.abhaengig).toBe('uni');
    expect(byTyp['teil-von']).toBe('uni');
    expect(byTyp.redundanz).toBe('bi');
  });
});
