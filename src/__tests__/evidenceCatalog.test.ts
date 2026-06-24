import { describe, it, expect } from 'vitest';
import { seedEvidenceItems, missingSeedCount, makeBlankEvidence } from '../compliance/evidenceCatalog';
import { NACHWEIS_KATALOG } from '../compliance/nachweise';
import type { EvidenceItem } from '../types';

describe('Evidence-Katalog — Seed & Migration (Paket 9)', () => {
  it('seedEvidenceItems erzeugt für jeden Katalog-Nachweis ein EvidenceItem', () => {
    const seeded = seedEvidenceItems([]);
    expect(seeded.length).toBe(NACHWEIS_KATALOG.length);
    expect(seeded.every(e => e.seedKey && e.title && e.status === 'Offen')).toBe(true);
    // Themen-Tags gesetzt (Norm-/Themenbezug)
    expect(seeded.every(e => (e.themen?.length ?? 0) > 0)).toBe(true);
  });

  it('ist idempotent (keine Duplikate beim erneuten Seeding)', () => {
    const first = seedEvidenceItems([]);
    const again = seedEvidenceItems(first);
    expect(again.length).toBe(first.length);
    expect(missingSeedCount(first)).toBe(0);
  });

  it('migriert Alt-Status (nachweisStatus) non-destruktiv', () => {
    const legacy = {
      'nw-avv': { vorhanden: true, notiz: 'Ablage/AVV.pdf' },
      'nw-scc': { vorhanden: false, notiz: '' },
    };
    const seeded = seedEvidenceItems([], legacy);
    const avv = seeded.find(e => e.seedKey === 'nw-avv')!;
    expect(avv.status).toBe('Erhalten');
    expect(avv.fileReference).toBe('Ablage/AVV.pdf');
    const scc = seeded.find(e => e.seedKey === 'nw-scc')!;
    expect(scc.status).toBe('Offen');
  });

  it('überschreibt bestehende eigene EvidenceItems nicht', () => {
    const custom: EvidenceItem = { id: 'x', title: 'Eigen', status: 'Geprüft' };
    const seeded = seedEvidenceItems([custom]);
    expect(seeded.find(e => e.id === 'x')?.status).toBe('Geprüft');
    expect(seeded.length).toBe(NACHWEIS_KATALOG.length + 1);
  });

  it('ein Nachweis kann mehreren Themen zugeordnet sein (n:m, keine Duplikate)', () => {
    const seeded = seedEvidenceItems([]);
    const multi = seeded.find(e => (e.themen?.length ?? 0) > 1);
    expect(multi).toBeDefined(); // z.B. Cybersicherheit -> NIS2/BSI/ISO 27001
  });

  it('makeBlankEvidence erzeugt ein leeres, eigenes Item ohne seedKey', () => {
    const blank = makeBlankEvidence();
    expect(blank.seedKey).toBeUndefined();
    expect(blank.status).toBe('Offen');
    expect(blank.id.startsWith('ev-')).toBe(true);
  });
});
