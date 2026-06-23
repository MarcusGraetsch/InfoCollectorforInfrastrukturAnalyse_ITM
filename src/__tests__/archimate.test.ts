import { describe, it, expect } from 'vitest';
import type { AppState } from '../types';
import { buildArchiMateModel, buildArchiMateJson } from '../utils/archimate';
import { buildArchiMateExchangeXml } from '../utils/archimateXml';

/** Minimaler, aber realistischer Test-State mit allen relevanten Verknüpfungen. */
function makeState(): AppState {
  return {
    customerName: 'Testkunde & Co <GmbH>',
    geschaeftsprozesse: [
      { id: 'gp1', kuerzel: 'GP-1', name: 'Auftragsabwicklung', anwendungen: ['a1'], daten: ['d1'] },
      { id: 'gp2', kuerzel: 'GP-2', name: 'Verwaister Prozess', anwendungen: [], daten: [] },
    ],
    daten: [
      { id: 'd1', kuerzel: 'D-1', name: 'Kundendaten', anwendungen: ['a1'] },
    ],
    anwendungen: [
      { id: 'a1', kuerzel: 'APP-1', name: 'ERP', itSysteme: ['s1'], erlaeuterung: 'Das ERP' },
      { id: 'a2', kuerzel: 'APP-2', name: 'CRM', itSysteme: [] },
    ],
    betriebssysteme: [
      { id: 'os1', kuerzel: 'OS-1', name: 'Linux' },
    ],
    schnittstellen: [
      {
        id: 'ss1', kuerzel: 'SS-1', name: 'ERP-CRM', quellAnwendung: ['a1'], zielAnwendung: ['a2'],
        protokoll: 'REST', ports: '443', richtung: 'Bidirektional', verschluesselung: 'TLS 1.3',
      },
      {
        id: 'ss2', kuerzel: 'SS-2', name: 'Defekt', quellAnwendung: ['a1'], zielAnwendung: ['unbekannt'],
        protokoll: 'SOAP', richtung: 'Unidirektional',
      },
    ],
    server: [
      { id: 's1', kuerzel: 'SRV-1', name: 'AppServer', anwendungen: ['a1'], betriebssysteme: ['os1'], netzverbindungen: ['nv1'], raeume: ['r1'] },
    ],
    netzverbindungen: [
      { id: 'nv1', kuerzel: 'NV-1', name: 'LAN' },
    ],
    netzkomponenten: [
      { id: 'nk1', kuerzel: 'NK-1', name: 'Firewall', netzverbindungen: ['nv1'] },
    ],
    raeume: [
      { id: 'r1', kuerzel: 'R-1', name: 'Serverraum' },
    ],
    clients: [],
    icsSysteme: [],
    iotSysteme: [],
    gebaeude: [],
    datentraeger: [],
  } as unknown as AppState;
}

describe('buildArchiMateModel — element mapping', () => {
  const model = buildArchiMateModel(makeState());

  it('maps Anwendungen to ApplicationComponent', () => {
    const app = model.elements.find(e => e.sourceId === 'a1');
    expect(app?.type).toBe('ApplicationComponent');
    expect(app?.name).toBe('ERP');
  });

  it('maps Geschäftsprozesse to BusinessProcess', () => {
    expect(model.elements.find(e => e.sourceId === 'gp1')?.type).toBe('BusinessProcess');
  });

  it('maps Daten to DataObject', () => {
    expect(model.elements.find(e => e.sourceId === 'd1')?.type).toBe('DataObject');
  });

  it('maps Server to Node and Betriebssystem to SystemSoftware', () => {
    expect(model.elements.find(e => e.sourceId === 's1')?.type).toBe('Node');
    expect(model.elements.find(e => e.sourceId === 'os1')?.type).toBe('SystemSoftware');
  });

  it('carries documentation from erlaeuterung', () => {
    expect(model.elements.find(e => e.sourceId === 'a1')?.documentation).toBe('Das ERP');
  });
});

describe('buildArchiMateModel — relationship mapping', () => {
  const model = makeModelHelper();

  function makeModelHelper() { return buildArchiMateModel(makeState()); }

  it('creates Flow relationships from Schnittstellen', () => {
    const flows = model.relationships.filter(r => r.type === 'Flow');
    // bidirektional → 2 Flows (a1<->a2)
    expect(flows.length).toBe(2);
    expect(flows.some(f => f.source === 'el-anwendungen-a1' && f.target === 'el-anwendungen-a2')).toBe(true);
    expect(flows.some(f => f.source === 'el-anwendungen-a2' && f.target === 'el-anwendungen-a1')).toBe(true);
  });

  it('creates Serving from Geschäftsprozess-Anwendung link (App → Process)', () => {
    const serving = model.relationships.find(r => r.type === 'Serving');
    expect(serving?.source).toBe('el-anwendungen-a1');
    expect(serving?.target).toBe('el-geschaeftsprozesse-gp1');
  });

  it('creates Access from Anwendung-Daten link', () => {
    const access = model.relationships.filter(r => r.type === 'Access');
    expect(access.some(r => r.source === 'el-anwendungen-a1' && r.target === 'el-daten-d1')).toBe(true);
  });

  it('creates a technical relationship from Server-Anwendung link', () => {
    const dep = model.relationships.filter(r => r.type === 'Deployment');
    expect(dep.some(r => r.source === 'el-server-s1' && r.target === 'el-anwendungen-a1')).toBe(true);
  });

  it('creates Assignment from Server-OS link', () => {
    expect(model.relationships.some(r => r.type === 'Assignment' && r.source === 'el-server-s1' && r.target === 'el-betriebssysteme-os1')).toBe(true);
  });

  it('collects warnings for unresolved references', () => {
    expect(model.warnings.some(w => w.includes('Defekt'))).toBe(true);
  });

  it('warns about applications without infrastructure and processes without apps', () => {
    expect(model.warnings.some(w => w.includes('CRM') && w.includes('Infrastruktur'))).toBe(true);
    expect(model.warnings.some(w => w.includes('Verwaister Prozess'))).toBe(true);
  });

  it('avoids duplicate relationships', () => {
    const ids = model.relationships.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('is referentially consistent — every relationship endpoint exists as an element', () => {
    const elIds = new Set(model.elements.map(e => e.id));
    for (const r of model.relationships) {
      expect(elIds.has(r.source), `source ${r.source} missing`).toBe(true);
      expect(elIds.has(r.target), `target ${r.target} missing`).toBe(true);
    }
  });

  it('deduplicates warnings', () => {
    expect(new Set(model.warnings).size).toBe(model.warnings.length);
  });

  it('produces deterministic ids across runs', () => {
    const a = buildArchiMateModel(makeState());
    const b = buildArchiMateModel(makeState());
    expect(a.elements.map(e => e.id)).toEqual(b.elements.map(e => e.id));
    expect(a.relationships.map(r => r.id)).toEqual(b.relationships.map(r => r.id));
  });
});

describe('buildArchiMateModel — views', () => {
  const model = buildArchiMateModel(makeState());

  it('produces mermaid code for all three views', () => {
    expect(model.views).toHaveLength(3);
    for (const v of model.views) {
      expect(v.mermaid).toMatch(/^graph /);
      expect(v.mermaid.length).toBeGreaterThan(10);
    }
  });

  it('application-cooperation view contains the apps with interfaces', () => {
    const v = model.views.find(x => x.type === 'application-cooperation')!;
    expect(v.elementIds).toContain('el-anwendungen-a1');
    expect(v.mermaid).toContain('<-->'); // bidirektionale Schnittstelle
  });

  it('technology-usage view groups infrastructure and contains the server', () => {
    const v = model.views.find(x => x.type === 'technology-usage')!;
    expect(v.elementIds).toContain('el-server-s1');
    expect(v.mermaid).toContain('subgraph');
  });

  it('business-application-alignment view links process, app and data', () => {
    const v = model.views.find(x => x.type === 'business-application-alignment')!;
    expect(v.elementIds).toEqual(expect.arrayContaining(['el-geschaeftsprozesse-gp1', 'el-anwendungen-a1', 'el-daten-d1']));
  });
});

describe('JSON export', () => {
  it('produces valid JSON containing model parts', () => {
    const json = buildArchiMateJson(makeState());
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed.elements)).toBe(true);
    expect(Array.isArray(parsed.relationships)).toBe(true);
    expect(Array.isArray(parsed.views)).toBe(true);
    expect(typeof parsed._note).toBe('string');
  });
});

describe('XML export (Open Exchange)', () => {
  const xml = buildArchiMateExchangeXml(makeState());

  it('contains elements and relationships', () => {
    expect(xml).toContain('<elements>');
    expect(xml).toContain('xsi:type="ApplicationComponent"');
    expect(xml).toContain('<relationships>');
    expect(xml).toContain('xsi:type="Flow"');
  });

  it('escapes special characters in names', () => {
    expect(xml).toContain('Testkunde &amp; Co &lt;GmbH&gt;');
    expect(xml).not.toContain('Co <GmbH>');
  });

  it('maps Deployment to a valid ArchiMate Assignment relationship', () => {
    expect(xml).not.toContain('xsi:type="Deployment"');
    expect(xml).toContain('xsi:type="Assignment"');
  });

  it('does not crash on empty / minimal state and omits an empty elements block', () => {
    const empty = { customerName: '', anwendungen: [] } as unknown as AppState;
    expect(() => buildArchiMateExchangeXml(empty)).not.toThrow();
    const x = buildArchiMateExchangeXml(empty);
    expect(x).toContain('<model');
    expect(x).not.toContain('<elements>'); // kein leerer, schema-ungültiger Block
  });
});
