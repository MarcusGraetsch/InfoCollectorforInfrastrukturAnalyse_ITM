import { describe, it, expect } from 'vitest';
import { LG9_GOVERNANCE_TOPICS } from '../compliance/lg9Governance';
import { ROLE_CATALOG } from '../utils/governance';
import { NACHWEIS_KATALOG } from '../compliance/nachweise';

describe('LG-9 Governance-Themen: BCM & Cloud-Exit (Paket 3)', () => {
  it('enthält BCM und Cloud-Exit als eigene Themen', () => {
    const keys = LG9_GOVERNANCE_TOPICS.map(t => t.key);
    expect(keys).toContain('bcm');
    expect(keys).toContain('cloud-exit');
    expect(LG9_GOVERNANCE_TOPICS.find(t => t.key === 'bcm')?.domain).toBe('bcm');
    expect(LG9_GOVERNANCE_TOPICS.find(t => t.key === 'cloud-exit')?.domain).toBe('cloudExit');
  });

  it('jedes Thema hat Titel, Kurzbeschreibung und geführte Felder', () => {
    for (const t of LG9_GOVERNANCE_TOPICS) {
      expect(t.title.length).toBeGreaterThan(3);
      expect(t.kurz.length).toBeGreaterThan(10);
      expect(t.info.whyImportant.length).toBeGreaterThan(10);
      expect(t.info.normative.length).toBeGreaterThan(5);
      expect(t.info.workshopFragen.length).toBeGreaterThan(0);
      expect(t.info.naechsteSchritte.length).toBeGreaterThan(0);
      expect(t.info.roleKeys.length).toBeGreaterThan(0);
    }
  });

  it('BCM deckt die geforderten Aspekte ab (BIA, RTO/RPO, Restore, Notfallhandbuch, Krise)', () => {
    const bcm = LG9_GOVERNANCE_TOPICS.find(t => t.key === 'bcm')!;
    const text = (bcm.info.missingInfos ?? []).join(' ') + ' ' + (bcm.info.improvements ?? []).join(' ');
    expect(text).toMatch(/BIA|Impact/);
    expect(text).toMatch(/RTO|RPO/);
    expect(text).toMatch(/Restore/);
    expect(text).toMatch(/Notfallhandbuch/);
    expect(text).toMatch(/Krisen/);
  });

  it('Cloud-Exit deckt die geforderten Aspekte ab (Portabilität, IAM, Schlüssel, IaC, Zielplattform)', () => {
    const exit = LG9_GOVERNANCE_TOPICS.find(t => t.key === 'cloud-exit')!;
    const text = (exit.info.missingInfos ?? []).join(' ') + ' ' + (exit.info.improvements ?? []).join(' ');
    expect(text).toMatch(/Portabilität|Exportformate|offene Formate/);
    expect(text).toMatch(/IAM|Identität/);
    expect(text).toMatch(/Schlüssel/);
    expect(text).toMatch(/IaC/);
    expect(text).toMatch(/Zielplattform/);
  });

  it('referenzierte roleKeys + evidenceSeedKeys existieren (keine toten Verweise)', () => {
    const roleKeys = new Set(ROLE_CATALOG.map(r => r.key));
    const evIds = new Set(NACHWEIS_KATALOG.map(n => n.id));
    for (const t of LG9_GOVERNANCE_TOPICS) {
      t.info.roleKeys.forEach(k => expect(roleKeys.has(k), `roleKey ${k}`).toBe(true));
      t.info.evidenceSeedKeys.forEach(k => expect(evIds.has(k), `evidenceSeedKey ${k}`).toBe(true));
    }
  });
});
