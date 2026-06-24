import { describe, it, expect } from 'vitest';
import { SOUV_DIMENSION_INFO } from '../compliance/souvDetail';
import { SOUV_DIMENSION_LABELS } from '../compliance/souveraenitaet';
import { ROLE_CATALOG, findTopic, makeTopic, upsertTopic } from '../utils/governance';
import { NACHWEIS_KATALOG } from '../compliance/nachweise';
import type { GovernanceTopic } from '../types';

describe('Cloud-Souveränität Wizard-Inhalte (Paket 6)', () => {
  it('für jede der 6 Dimensionen existiert ein Wizard-Inhalt', () => {
    const dims = Object.keys(SOUV_DIMENSION_LABELS);
    expect(dims.length).toBe(6);
    for (const d of dims) {
      expect(SOUV_DIMENSION_INFO[d as keyof typeof SOUV_DIMENSION_INFO], `Info fehlt für ${d}`).toBeDefined();
    }
  });

  it('jeder Wizard-Inhalt hat die geführten Felder befüllt', () => {
    for (const info of Object.values(SOUV_DIMENSION_INFO)) {
      expect(info.whyImportant.length).toBeGreaterThan(10);
      expect(info.normative.length).toBeGreaterThan(5);
      expect(info.workshopFragen.length).toBeGreaterThan(0);
      expect(info.naechsteSchritte.length).toBeGreaterThan(0);
      expect(info.roleKeys.length).toBeGreaterThan(0);
      expect(info.evidenceSeedKeys.length).toBeGreaterThan(0);
    }
  });

  it('referenzierte roleKeys + evidenceSeedKeys existieren (keine toten Verweise)', () => {
    const roleKeys = new Set(ROLE_CATALOG.map(r => r.key));
    const evIds = new Set(NACHWEIS_KATALOG.map(n => n.id));
    for (const info of Object.values(SOUV_DIMENSION_INFO)) {
      info.roleKeys.forEach(k => expect(roleKeys.has(k), `roleKey ${k}`).toBe(true));
      info.evidenceSeedKeys.forEach(k => expect(evIds.has(k), `evidenceSeedKey ${k}`).toBe(true));
    }
  });
});

describe('GovernanceTopic-Helper', () => {
  it('findTopic findet per Domäne + Schlüssel', () => {
    const t = makeTopic('cloudSovereignty', 'datenschutz', 'Datenschutz');
    const topics = [t];
    expect(findTopic(topics, 'cloudSovereignty', 'datenschutz')?.id).toBe(t.id);
    expect(findTopic(topics, 'cloudSovereignty', 'lockin')).toBeUndefined();
    expect(findTopic(topics, 'nis2', 'datenschutz')).toBeUndefined();
  });

  it('upsertTopic ersetzt per id, sonst fügt an', () => {
    const t = makeTopic('cloudSovereignty', 'lockin', 'Lock-in');
    let topics: GovernanceTopic[] = upsertTopic([], t);
    expect(topics.length).toBe(1);
    topics = upsertTopic(topics, { ...t, status: 'Erfüllt' });
    expect(topics.length).toBe(1);
    expect(topics[0].status).toBe('Erfüllt');
  });
});
