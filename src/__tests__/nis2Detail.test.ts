import { describe, it, expect } from 'vitest';
import { NIS2_MASSNAHMEN_INFO } from '../compliance/nis2Detail';
import { NIS2_MASSNAHMEN } from '../compliance/nis2';
import { ROLE_CATALOG } from '../utils/governance';
import { NACHWEIS_KATALOG } from '../compliance/nachweise';

describe('NIS2 Detail-Inhalte (Paket 8)', () => {
  it('für jede der 10 Mindestmaßnahmen existiert ein Detail-Inhalt', () => {
    expect(NIS2_MASSNAHMEN.length).toBe(10);
    for (const m of NIS2_MASSNAHMEN) {
      expect(NIS2_MASSNAHMEN_INFO[m.key], `Info fehlt für ${m.key}`).toBeDefined();
    }
  });

  it('jeder Detail-Inhalt hat die geführten Felder befüllt', () => {
    for (const info of Object.values(NIS2_MASSNAHMEN_INFO)) {
      expect(info.whyImportant.length).toBeGreaterThan(10);
      expect(info.normative.length).toBeGreaterThan(5);
      expect(info.mussVorhanden.length).toBeGreaterThan(0);
      expect(info.beispielNachweise.length).toBeGreaterThan(0);
      expect(info.workshopFragen.length).toBeGreaterThan(0);
      expect(info.naechsteSchritte.length).toBeGreaterThan(0);
      expect(info.roleKeys.length).toBeGreaterThan(0);
      expect(info.appDataHint.length).toBeGreaterThan(0);
    }
  });

  it('referenzierte roleKeys existieren im ROLE_CATALOG (keine toten Verweise)', () => {
    const roleKeys = new Set(ROLE_CATALOG.map(r => r.key));
    for (const info of Object.values(NIS2_MASSNAHMEN_INFO)) {
      for (const rk of info.roleKeys) {
        expect(roleKeys.has(rk), `unbekannter roleKey ${rk}`).toBe(true);
      }
    }
  });

  it('referenzierte evidenceSeedKeys existieren im NACHWEIS_KATALOG', () => {
    const ids = new Set(NACHWEIS_KATALOG.map(n => n.id));
    for (const info of Object.values(NIS2_MASSNAHMEN_INFO)) {
      for (const ek of info.evidenceSeedKeys) {
        expect(ids.has(ek), `unbekannter evidenceSeedKey ${ek}`).toBe(true);
      }
    }
  });
});
