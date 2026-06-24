import { describe, it, expect, afterEach } from 'vitest';
import {
  setCustomCatalog,
  getCustomCatalog,
  effectiveCatalog,
  isCustomComponent,
  searchComponents,
  getComponentById,
  getComponentSuggestionsForCategory,
  getCatalogStats,
} from '../utils/componentCatalog';
import { COMPONENT_CATALOG } from '../data/componentCatalog';
import type { ComponentCatalogEntry } from '../data/componentCatalog';

const CUSTOM: ComponentCatalogEntry = {
  id: 'custom-acme-erp',
  kind: 'erp',
  vendor: 'ACME GmbH',
  product: 'ACME ERP 2024',
  aliases: ['ACME', 'AERP'],
  categoryTargets: ['anwendungen'],
  defaultFields: { hersteller: 'ACME GmbH', lizenzart: 'Proprietär' },
  tags: ['erp', 'custom-test'],
};

describe('customComponentCatalog merge/filter', () => {
  afterEach(() => setCustomCatalog([])); // Registry zurücksetzen

  it('effectiveCatalog ist ohne Custom identisch mit dem Basiskatalog', () => {
    setCustomCatalog([]);
    expect(effectiveCatalog().length).toBe(COMPONENT_CATALOG.length);
    expect(getCustomCatalog()).toEqual([]);
  });

  it('Custom-Eintrag wird in effectiveCatalog gemerged', () => {
    setCustomCatalog([CUSTOM]);
    expect(effectiveCatalog().length).toBe(COMPONENT_CATALOG.length + 1);
    expect(isCustomComponent('custom-acme-erp')).toBe(true);
    expect(isCustomComponent('windows-server-2022')).toBe(false);
  });

  it('Suche findet Custom-Einträge (Produkt + Alias + Tag)', () => {
    setCustomCatalog([CUSTOM]);
    expect(searchComponents('ACME ERP').some(e => e.id === 'custom-acme-erp')).toBe(true);
    expect(searchComponents('AERP').some(e => e.id === 'custom-acme-erp')).toBe(true);
    expect(searchComponents('custom-test').some(e => e.id === 'custom-acme-erp')).toBe(true);
  });

  it('getComponentById liefert Custom-Eintrag', () => {
    setCustomCatalog([CUSTOM]);
    expect(getComponentById('custom-acme-erp')?.product).toBe('ACME ERP 2024');
  });

  it('Kategorie-Vorschläge enthalten passende Custom-Einträge', () => {
    setCustomCatalog([CUSTOM]);
    expect(getComponentSuggestionsForCategory('anwendungen', 500).some(e => e.id === 'custom-acme-erp')).toBe(true);
  });

  it('getCatalogStats(override) zählt Custom-Einträge mit', () => {
    const withCustom = getCatalogStats([...COMPONENT_CATALOG, CUSTOM]);
    expect(withCustom.total).toBe(COMPONENT_CATALOG.length + 1);
  });

  it('setCustomCatalog(undefined) setzt sicher auf leer', () => {
    setCustomCatalog(undefined);
    expect(getCustomCatalog()).toEqual([]);
  });
});
