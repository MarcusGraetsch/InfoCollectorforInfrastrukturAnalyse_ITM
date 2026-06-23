import { describe, it, expect } from 'vitest';
import type { AppState } from '../types';
import {
  isPlatformUnassigned,
  findPlatformGaps,
  PLATTFORM_RELATION_FIELDS,
  RUNTIME_CATEGORIES,
} from '../utils/plattform';

const UNKLAR = 'Unklar — beim Kunden erfragen';

describe('isPlatformUnassigned', () => {
  it('empty item → true', () => {
    expect(isPlatformUnassigned({}, 'anwendungen')).toBe(true);
  });
  it('item with itSysteme link → false', () => {
    expect(isPlatformUnassigned({ itSysteme: ['S-1'] }, 'anwendungen')).toBe(false);
  });
  it('concrete plattformTyp "Virtuelle Maschine" → false', () => {
    expect(isPlatformUnassigned({ plattformTyp: 'Virtuelle Maschine' }, 'anwendungen')).toBe(false);
  });
  it('plattformTyp Unklar with no link → true', () => {
    expect(isPlatformUnassigned({ plattformTyp: UNKLAR }, 'anwendungen')).toBe(true);
  });
  it('"Externes System (Dienstleister)" → false', () => {
    expect(isPlatformUnassigned({ plattformTyp: 'Externes System (Dienstleister)' }, 'anwendungen')).toBe(false);
  });
});

describe('findPlatformGaps', () => {
  it('returns only the unassigned item with correct explicitUnklar', () => {
    const state = {
      anwendungen: [
        { id: 'A-1', kuerzel: 'A-001', name: 'Offen', plattformTyp: UNKLAR, itSysteme: [], betriebssysteme: [] },
        { id: 'A-2', kuerzel: 'A-002', name: 'Verknüpft', itSysteme: ['S-1'], betriebssysteme: [] },
      ],
      betriebssysteme: [],
      clients: [],
      icsSysteme: [],
      iotSysteme: [],
    } as unknown as AppState;

    const gaps = findPlatformGaps(state);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].id).toBe('A-1');
    expect(gaps[0].category).toBe('anwendungen');
    expect(gaps[0].explicitUnklar).toBe(true);
  });
});

describe('PLATTFORM_RELATION_FIELDS', () => {
  it('all keys appear in RUNTIME_CATEGORIES', () => {
    for (const key of Object.keys(PLATTFORM_RELATION_FIELDS)) {
      expect(RUNTIME_CATEGORIES).toContain(key);
    }
  });
});
