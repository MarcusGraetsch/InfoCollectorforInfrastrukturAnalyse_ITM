import { describe, it, expect } from 'vitest';
import { searchComponents, matchComponentFromText, autofillFormFields, getComponentById, buildCatalogAutofill } from '../utils/componentCatalog';
import { COMPONENT_CATALOG } from '../data/componentCatalog';
import type { CategoryDef } from '../categories';

function stubCategory(fields: CategoryDef['fields']): CategoryDef {
  return { key: 'anwendungen' as CategoryDef['key'], label: 'Test', prefix: 'T', fields };
}

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

  it('catalog has hardware and cloud entries and >150 total', () => {
    expect(COMPONENT_CATALOG.some(e => e.kind === 'hardware')).toBe(true);
    expect(COMPONENT_CATALOG.some(e => e.kind === 'cloud')).toBe(true);
    expect(COMPONENT_CATALOG.length).toBeGreaterThan(150);
  });

  describe('buildCatalogAutofill', () => {
    const pg = getComponentById('postgresql-16')!;

    it('fills hersteller, produktname, name on fresh entry', () => {
      const cat = stubCategory([
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'hersteller', label: 'Hersteller', type: 'text' },
        { key: 'produktname', label: 'Produktname', type: 'text' },
      ]);
      const { merged, filled } = buildCatalogAutofill(pg, '', cat, {});
      expect(filled).toContain('hersteller');
      expect(filled).toContain('produktname');
      expect(filled).toContain('name');
      expect(merged.hersteller).toBe('PostgreSQL Global Dev Group');
    });

    it('does not fill select fields with invalid options', () => {
      const cat = stubCategory([
        { key: 'typ', label: 'Typ', type: 'select', options: ['A', 'B'] },
      ]);
      const { merged, filled } = buildCatalogAutofill(pg, '', cat, {});
      expect(filled).not.toContain('typ');
      expect(merged.typ).toBeUndefined();
    });

    it('never overwrites non-empty current values', () => {
      const cat = stubCategory([
        { key: 'hersteller', label: 'Hersteller', type: 'text' },
      ]);
      const { merged, filled } = buildCatalogAutofill(pg, '', cat, { hersteller: 'Bestehend' });
      expect(merged.hersteller).toBe('Bestehend');
      expect(filled).not.toContain('hersteller');
    });

    it('never produces phantom keys betriebssystem/lizenzart', () => {
      const win = getComponentById('windows-server-2022')!;
      const cat = stubCategory([
        { key: 'betriebssystem', label: 'OS', type: 'text' },
        { key: 'lizenzart', label: 'Lizenzart', type: 'text' },
        { key: 'hersteller', label: 'Hersteller', type: 'text' },
      ]);
      const { merged } = buildCatalogAutofill(win, '', cat, {});
      // Even if a category happened to define such keys, intendedFields drops them.
      expect(merged.betriebssystem).toBeUndefined();
      expect(merged.lizenzart).toBeUndefined();
    });
  });
});

  describe('categoryTargets BSI layer correctness', () => {
    it('hardware entries have categoryTargets containing server or clients, not anwendungen', () => {
      const hardwareEntries = COMPONENT_CATALOG.filter(e => e.kind === 'hardware');
      expect(hardwareEntries.length).toBeGreaterThan(0);
      for (const e of hardwareEntries) {
        const hasServerOrClients = e.categoryTargets.includes('server') || e.categoryTargets.includes('clients') || e.categoryTargets.includes('netzkomponenten');
        expect(hasServerOrClients, `${e.id} should target server/clients/netzkomponenten`).toBe(true);
        expect(e.categoryTargets.includes('anwendungen'), `${e.id} should NOT target anwendungen`).toBe(false);
      }
    });

    it('database entries have categoryTargets containing anwendungen only', () => {
      const dbEntries = COMPONENT_CATALOG.filter(e => e.kind === 'database');
      expect(dbEntries.length).toBeGreaterThan(0);
      for (const e of dbEntries) {
        expect(e.categoryTargets.includes('anwendungen'), `${e.id} should target anwendungen`).toBe(true);
        expect(e.categoryTargets.includes('server'), `${e.id} should NOT target server`).toBe(false);
      }
    });

    it('os entries have categoryTargets containing betriebssysteme', () => {
      const osEntries = COMPONENT_CATALOG.filter(e => e.kind === 'os');
      expect(osEntries.length).toBeGreaterThan(0);
      for (const e of osEntries) {
        expect(e.categoryTargets.includes('betriebssysteme'), `${e.id} should target betriebssysteme`).toBe(true);
        expect(e.categoryTargets.includes('server'), `${e.id} should NOT target server`).toBe(false);
      }
    });

    it('virtualization entries have categoryTargets containing server', () => {
      const virtEntries = COMPONENT_CATALOG.filter(e => e.kind === 'virtualization');
      expect(virtEntries.length).toBeGreaterThan(0);
      for (const e of virtEntries) {
        expect(e.categoryTargets.includes('server'), `${e.id} should target server`).toBe(true);
      }
    });
  });
