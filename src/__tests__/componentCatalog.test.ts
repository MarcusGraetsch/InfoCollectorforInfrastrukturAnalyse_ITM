import { describe, it, expect } from 'vitest';
import { searchComponents, matchComponentFromText, autofillFormFields, getComponentById } from '../utils/componentCatalog';
import { COMPONENT_CATALOG } from '../data/componentCatalog';

describe('componentCatalog', () => {
  it('catalog has 100+ entries', () => {
    expect(COMPONENT_CATALOG.length).toBeGreaterThan(100);
  });
  it('all entries have unique ids', () => {
    const ids = COMPONENT_CATALOG.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('searchComponents finds PostgreSQL', () => {
    const r = searchComponents('postgresql');
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].product).toMatch(/PostgreSQL/i);
  });
  it('searchComponents filters by kind', () => {
    const r = searchComponents('', 'database' as any, 50);
    // kind filter with empty query returns []
    expect(r.length).toBe(0);
    const r2 = searchComponents('mysql', 'database' as any);
    expect(r2.every(e => e.kind === 'database')).toBe(true);
  });
  it('matchComponentFromText finds Windows Server', () => {
    const r = matchComponentFromText('Windows Server 2022');
    expect(r).toBeDefined();
    expect(r?.vendor).toBe('Microsoft');
  });
  it('autofillFormFields is non-destructive', () => {
    const current = { name: 'MyApp', hersteller: 'Existing', typ: '' };
    const { merged, filled } = autofillFormFields(current, { hersteller: 'New', typ: 'ERP' });
    expect(merged.hersteller).toBe('Existing'); // not overwritten
    expect(merged.typ).toBe('ERP');             // was empty, now filled
    expect(filled).toContain('typ');
    expect(filled).not.toContain('hersteller');
  });
  it('getComponentById returns correct entry', () => {
    const e = getComponentById('postgresql-16');
    expect(e?.product).toMatch(/PostgreSQL 16/);
  });
  it('all entries have at least one categoryTarget', () => {
    expect(COMPONENT_CATALOG.every(e => e.categoryTargets.length > 0)).toBe(true);
  });
});
