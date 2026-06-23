import type { AppState, CategoryKey } from '../types';

/**
 * ArchiMate-lite — automatisch abgeleitete View- und Export-Schicht.
 *
 * WICHTIG: Dies ist KEIN ArchiMate-Editor. Das ArchiMate-Modell wird
 * deterministisch aus dem bestehenden AppState (Single Source of Truth)
 * erzeugt. Es gibt keine manuelle Bearbeitung von ArchiMate-Elementen.
 *
 * Reine Transformationsfunktionen, keine UI-Abhängigkeit, keine Mutation
 * des AppState.
 */

export type ArchiMateElementType =
  | 'BusinessProcess'
  | 'BusinessActor'
  | 'ApplicationComponent'
  | 'ApplicationService'
  | 'DataObject'
  | 'Node'
  | 'Device'
  | 'SystemSoftware'
  | 'CommunicationNetwork'
  | 'TechnologyService'
  | 'Artifact'
  | 'Location';

export type ArchiMateRelationshipType =
  | 'Serving'
  | 'Access'
  | 'Flow'
  | 'Assignment'
  | 'Association'
  | 'Composition'
  | 'Deployment';

export interface ArchiMateElement {
  id: string;
  sourceCategory: string;
  sourceId: string;
  type: ArchiMateElementType;
  name: string;
  documentation?: string;
  properties?: Record<string, string>;
}

export interface ArchiMateRelationship {
  id: string;
  type: ArchiMateRelationshipType;
  source: string;
  target: string;
  name?: string;
  documentation?: string;
  properties?: Record<string, string>;
}

export type ArchiMateViewType =
  | 'application-cooperation'
  | 'technology-usage'
  | 'business-application-alignment';

export interface ArchiMateView {
  id: string;
  type: ArchiMateViewType;
  name: string;
  description: string;
  elementIds: string[];
  relationshipIds: string[];
  mermaid: string;
}

export interface ArchiMateModel {
  id: string;
  name: string;
  generatedAt: string;
  customerName: string;
  generatorName: string;
  elements: ArchiMateElement[];
  relationships: ArchiMateRelationship[];
  views: ArchiMateView[];
  warnings: string[];
}

export const GENERATOR_NAME = 'IT-Strukturanalyse ArchiMate-lite';

// ---------------------------------------------------------------------------
// Helpers (deterministisch, defensiv gegen leere/beschädigte Daten)
// ---------------------------------------------------------------------------

/** Stabile, deterministische Element-ID aus Kategorie + Quell-ID. */
function elementId(category: string, sourceId: string): string {
  return `el-${category}-${sourceId}`;
}

/** Stabile, deterministische Relationship-ID. */
function relationshipId(type: ArchiMateRelationshipType, source: string, target: string): string {
  return `rel-${type}-${source}-${target}`;
}

/** Mermaid-Sanitizing für Knoten-IDs (nur [A-Za-z0-9_]). */
function nodeId(s: string): string {
  return s.replace(/[^a-zA-Z0-9]/g, '_');
}

/** Sanitisiert einen Anzeige-Text für Mermaid-Labels (keine Metazeichen, max 40). */
function sanitize(s: string): string {
  return (s || 'Unbekannt')
    .replace(/[^a-zA-Z0-9äöüÄÖÜß ._\-/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40);
}

interface NamedItem { id: string; kuerzel?: string; name?: string }

/** Menschlich lesbarer Name eines Quell-Objekts. */
function displayName(item: NamedItem | undefined, fallback: string): string {
  if (!item) return fallback;
  if (item.name && item.name.trim()) return item.name.trim();
  if (item.kuerzel && item.kuerzel.trim()) return item.kuerzel.trim();
  return fallback;
}

/**
 * Löst eine multiref-Referenz (kann id, kuerzel oder name sein) gegen eine
 * Liste auf — analog SchnittstellenMatrix.resolve.
 */
function resolveRef(ref: string, list: NamedItem[]): NamedItem | undefined {
  if (!ref) return undefined;
  return list.find(x => x.id === ref || x.kuerzel === ref || x.name === ref);
}

/** Sucht eine multiref-Referenz über mehrere Kategorien hinweg. */
function resolveAcross(
  ref: string,
  state: AppState,
  categories: CategoryKey[]
): { item: NamedItem; category: CategoryKey } | undefined {
  for (const cat of categories) {
    const list = (state[cat] as unknown as NamedItem[]) ?? [];
    const item = resolveRef(ref, list);
    if (item) return { item, category: cat };
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Element-Mapping
// ---------------------------------------------------------------------------

/** Mapping Kategorie → ArchiMate-Elementtyp. */
const CATEGORY_ELEMENT_TYPE: Partial<Record<CategoryKey, ArchiMateElementType>> = {
  geschaeftsprozesse: 'BusinessProcess',
  daten: 'DataObject',
  anwendungen: 'ApplicationComponent',
  server: 'Node',
  clients: 'Device',
  netzkomponenten: 'Device',
  netzverbindungen: 'CommunicationNetwork',
  betriebssysteme: 'SystemSoftware',
  raeume: 'Location',
  gebaeude: 'Location',
  icsSysteme: 'Device',
  iotSysteme: 'Device',
  datentraeger: 'Artifact',
};

// ---------------------------------------------------------------------------
// Model-Builder
// ---------------------------------------------------------------------------

interface BuildContext {
  elements: Map<string, ArchiMateElement>;
  relationships: Map<string, ArchiMateRelationship>;
  warnings: string[];
}

/** Fügt ein Element hinzu (idempotent über die deterministische ID). */
function addElement(
  ctx: BuildContext,
  category: CategoryKey,
  item: NamedItem,
  type: ArchiMateElementType,
  documentation?: string
): string {
  const id = elementId(category, item.id);
  if (!ctx.elements.has(id)) {
    ctx.elements.set(id, {
      id,
      sourceCategory: category,
      sourceId: item.id,
      type,
      name: displayName(item, item.id),
      documentation: documentation && documentation.trim() ? documentation.trim() : undefined,
    });
  }
  return id;
}

/** Fügt eine Relationship hinzu (dedupliziert über typ|source|target). */
function addRelationship(
  ctx: BuildContext,
  type: ArchiMateRelationshipType,
  source: string,
  target: string,
  opts?: { name?: string; documentation?: string; properties?: Record<string, string> }
): void {
  if (!source || !target || source === target) return;
  const id = relationshipId(type, source, target);
  if (ctx.relationships.has(id)) return;
  ctx.relationships.set(id, {
    id,
    type,
    source,
    target,
    name: opts?.name,
    documentation: opts?.documentation,
    properties: opts?.properties && Object.keys(opts.properties).length ? opts.properties : undefined,
  });
}

/**
 * Baut das vollständige ArchiMate-lite-Modell aus dem AppState.
 * Deterministisch und ohne Mutation des Eingangszustands.
 */
export function buildArchiMateModel(state: AppState): ArchiMateModel {
  const ctx: BuildContext = {
    elements: new Map(),
    relationships: new Map(),
    warnings: [],
  };

  const anwendungen = (state.anwendungen ?? []) as unknown as NamedItem[];
  const geschaeftsprozesse = (state.geschaeftsprozesse ?? []) as unknown as NamedItem[];
  const daten = (state.daten ?? []) as unknown as NamedItem[];

  // --- 1. Basis-Elemente aller relevanten Kategorien anlegen --------------
  // (nur Kategorien mit Element-Typ; Reihenfolge deterministisch)
  for (const cat of Object.keys(CATEGORY_ELEMENT_TYPE) as CategoryKey[]) {
    const type = CATEGORY_ELEMENT_TYPE[cat]!;
    const list = (state[cat] as unknown as (NamedItem & { erlaeuterung?: string })[]) ?? [];
    for (const item of list) {
      if (!item || !item.id) continue;
      addElement(ctx, cat, item, type, item.erlaeuterung);
    }
  }

  // --- 2. IKT-Dienstleister (optional) als TechnologyService -------------
  for (const ikt of state.iktDienstleister ?? []) {
    if (!ikt || !ikt.id) continue;
    const id = elementId('iktDienstleister', ikt.id);
    if (!ctx.elements.has(id)) {
      ctx.elements.set(id, {
        id,
        sourceCategory: 'iktDienstleister',
        sourceId: ikt.id,
        type: 'TechnologyService',
        name: ikt.name || ikt.id,
        documentation: ikt.leistung || undefined,
        properties: ikt.land ? { land: ikt.land } : undefined,
      });
    }
  }

  // --- 3. Geschäftsprozess → Anwendung (Serving: App → Prozess) ----------
  // und Geschäftsprozess → Daten (Access)
  for (const gp of state.geschaeftsprozesse ?? []) {
    const gpElId = elementId('geschaeftsprozesse', gp.id);
    for (const ref of gp.anwendungen ?? []) {
      const app = resolveRef(ref, anwendungen);
      if (!app) {
        ctx.warnings.push(`Geschäftsprozess „${displayName(gp, gp.id)}" referenziert unbekannte Anwendung „${ref}".`);
        continue;
      }
      addRelationship(ctx, 'Serving', elementId('anwendungen', app.id), gpElId);
    }
    for (const ref of gp.daten ?? []) {
      const d = resolveRef(ref, daten);
      if (!d) {
        ctx.warnings.push(`Geschäftsprozess „${displayName(gp, gp.id)}" referenziert unbekanntes Datenobjekt „${ref}".`);
        continue;
      }
      addRelationship(ctx, 'Access', gpElId, elementId('daten', d.id));
    }
  }

  // --- 4. Anwendung → Daten (Access), abgeleitet aus Datum.anwendungen ----
  for (const d of state.daten ?? []) {
    for (const ref of d.anwendungen ?? []) {
      const app = resolveRef(ref, anwendungen);
      if (!app) {
        ctx.warnings.push(`Datenobjekt „${displayName(d, d.id)}" referenziert unbekannte Anwendung „${ref}".`);
        continue;
      }
      addRelationship(ctx, 'Access', elementId('anwendungen', app.id), elementId('daten', d.id));
    }
  }

  // --- 5. Node/Device → Anwendung (Deployment) ---------------------------
  // Aus Server/Client/ICS/IoT.anwendungen[] sowie Anwendung.itSysteme[]
  const computeCats: CategoryKey[] = ['server', 'clients', 'icsSysteme', 'iotSysteme'];
  for (const cat of computeCats) {
    const list = (state[cat] as unknown as (NamedItem & { anwendungen?: string[]; betriebssysteme?: string[]; netzverbindungen?: string[]; raeume?: string[]; gebaeude?: string[] })[]) ?? [];
    for (const node of list) {
      const nodeElId = elementId(cat, node.id);
      for (const ref of node.anwendungen ?? []) {
        const app = resolveRef(ref, anwendungen);
        if (!app) {
          ctx.warnings.push(`${displayName(node, node.id)} referenziert unbekannte Anwendung „${ref}".`);
          continue;
        }
        addRelationship(ctx, 'Deployment', nodeElId, elementId('anwendungen', app.id));
      }
      // Node → OS (Assignment)
      for (const ref of node.betriebssysteme ?? []) {
        const os = resolveRef(ref, (state.betriebssysteme as unknown as NamedItem[]) ?? []);
        if (!os) {
          ctx.warnings.push(`${displayName(node, node.id)} referenziert unbekanntes Betriebssystem „${ref}".`);
          continue;
        }
        addRelationship(ctx, 'Assignment', nodeElId, elementId('betriebssysteme', os.id));
      }
      // Node → Netzverbindung (Association)
      for (const ref of node.netzverbindungen ?? []) {
        const nv = resolveRef(ref, (state.netzverbindungen as unknown as NamedItem[]) ?? []);
        if (nv) addRelationship(ctx, 'Association', nodeElId, elementId('netzverbindungen', nv.id));
      }
      // Node → Location (Association)
      for (const ref of node.raeume ?? []) {
        const r = resolveRef(ref, (state.raeume as unknown as NamedItem[]) ?? []);
        if (r) addRelationship(ctx, 'Association', nodeElId, elementId('raeume', r.id));
      }
      for (const ref of node.gebaeude ?? []) {
        const g = resolveRef(ref, (state.gebaeude as unknown as NamedItem[]) ?? []);
        if (g) addRelationship(ctx, 'Association', nodeElId, elementId('gebaeude', g.id));
      }
    }
  }

  // Anwendung.itSysteme[] → Deployment (Node/Device → App), falls nicht schon erfasst
  for (const app of state.anwendungen ?? []) {
    const appElId = elementId('anwendungen', app.id);
    for (const ref of app.itSysteme ?? []) {
      const hit = resolveAcross(ref, state, computeCats);
      if (!hit) {
        ctx.warnings.push(`Anwendung „${displayName(app, app.id)}" referenziert unbekanntes IT-System „${ref}".`);
        continue;
      }
      addRelationship(ctx, 'Deployment', elementId(hit.category, hit.item.id), appElId);
    }
  }

  // --- 6. Netzkomponente → Netzverbindung / Location (Association) -------
  for (const nk of state.netzkomponenten ?? []) {
    const nkElId = elementId('netzkomponenten', nk.id);
    for (const ref of nk.netzverbindungen ?? []) {
      const nv = resolveRef(ref, (state.netzverbindungen as unknown as NamedItem[]) ?? []);
      if (nv) addRelationship(ctx, 'Association', nkElId, elementId('netzverbindungen', nv.id));
    }
    for (const ref of nk.raeume ?? []) {
      const r = resolveRef(ref, (state.raeume as unknown as NamedItem[]) ?? []);
      if (r) addRelationship(ctx, 'Association', nkElId, elementId('raeume', r.id));
    }
    for (const ref of nk.gebaeude ?? []) {
      const g = resolveRef(ref, (state.gebaeude as unknown as NamedItem[]) ?? []);
      if (g) addRelationship(ctx, 'Association', nkElId, elementId('gebaeude', g.id));
    }
  }

  // --- 7. Schnittstellen → Flow (App → App) -----------------------------
  for (const ss of state.schnittstellen ?? []) {
    const q = resolveRef((ss.quellAnwendung ?? [])[0] ?? '', anwendungen);
    const z = resolveRef((ss.zielAnwendung ?? [])[0] ?? '', anwendungen);
    if (!q || !z) {
      ctx.warnings.push(`Schnittstelle „${displayName(ss, ss.id)}" hat keine auflösbare Quell- oder Zielanwendung.`);
      continue;
    }
    const labelParts = [ss.protokoll, ss.ports, ss.frequenz].filter(Boolean);
    const props: Record<string, string> = {};
    if (ss.protokoll) props.protokoll = ss.protokoll;
    if (ss.ports) props.ports = ss.ports;
    if (ss.frequenz) props.frequenz = ss.frequenz;
    if (ss.verschluesselung) props.verschluesselung = ss.verschluesselung;
    if (ss.authentifizierung) props.authentifizierung = ss.authentifizierung;
    if (ss.richtung) props.richtung = ss.richtung;
    const name = labelParts.join(' · ') || undefined;
    const qEl = elementId('anwendungen', q.id);
    const zEl = elementId('anwendungen', z.id);
    addRelationship(ctx, 'Flow', qEl, zEl, { name, properties: props });
    if (ss.richtung === 'Bidirektional') {
      addRelationship(ctx, 'Flow', zEl, qEl, { name, properties: props });
    }
  }

  const elements = [...ctx.elements.values()];
  const relationships = [...ctx.relationships.values()];

  // --- 8. Zusätzliche Warnungen für „lose" Objekte ----------------------
  const appsWithInfra = new Set(
    relationships
      .filter(r => r.type === 'Deployment')
      .map(r => r.target)
  );
  for (const app of anwendungen) {
    if (!appsWithInfra.has(elementId('anwendungen', app.id))) {
      ctx.warnings.push(`Anwendung „${displayName(app, app.id)}" ist mit keiner Infrastruktur (Server/Client) verknüpft.`);
    }
  }
  const procsWithApp = new Set(
    relationships
      .filter(r => r.type === 'Serving' && r.target.startsWith('el-geschaeftsprozesse-'))
      .map(r => r.target)
  );
  for (const gp of geschaeftsprozesse) {
    if (!procsWithApp.has(elementId('geschaeftsprozesse', gp.id))) {
      ctx.warnings.push(`Geschäftsprozess „${displayName(gp, gp.id)}" wird von keiner Anwendung unterstützt.`);
    }
  }

  // --- 9. Views ----------------------------------------------------------
  const views = [
    buildApplicationCooperationView(elements, relationships),
    buildTechnologyUsageView(elements, relationships),
    buildBusinessApplicationAlignmentView(elements, relationships),
  ];

  return {
    id: 'archimate-model',
    name: `ArchiMate-lite — ${state.customerName || 'Kunde'}`,
    generatedAt: new Date().toISOString(),
    customerName: state.customerName || '',
    generatorName: GENERATOR_NAME,
    elements,
    relationships,
    views,
    warnings: [...new Set(ctx.warnings)], // dedupliziert, Reihenfolge stabil
  };
}

// ---------------------------------------------------------------------------
// View-Builder
// ---------------------------------------------------------------------------

function elementsByType(elements: ArchiMateElement[], types: ArchiMateElementType[]): ArchiMateElement[] {
  const set = new Set(types);
  return elements.filter(e => set.has(e.type));
}

function relsByType(rels: ArchiMateRelationship[], types: ArchiMateRelationshipType[]): ArchiMateRelationship[] {
  const set = new Set(types);
  return rels.filter(r => set.has(r.type));
}

/** Mermaid-Knotenzeile. */
function mermaidNode(el: ArchiMateElement): string {
  return `${nodeId(el.id)}["${sanitize(el.name)}"]`;
}

/** View 1: Application Cooperation — Anwendungen + Schnittstellen (Flow). */
function buildApplicationCooperationView(
  elements: ArchiMateElement[],
  rels: ArchiMateRelationship[]
): ArchiMateView {
  const flows = relsByType(rels, ['Flow']);
  const usedElIds = new Set<string>();
  flows.forEach(r => { usedElIds.add(r.source); usedElIds.add(r.target); });
  const apps = elementsByType(elements, ['ApplicationComponent']).filter(e => usedElIds.has(e.id));

  const lines: string[] = ['graph LR'];
  if (apps.length === 0) {
    lines.push('  empty["Keine Anwendungen mit Schnittstellen erfasst"]');
  } else {
    apps.forEach(e => lines.push('  ' + mermaidNode(e)));
    // Bidirektionale Flows (beide Richtungen vorhanden) als <--> zusammenfassen
    const seen = new Set<string>();
    for (const f of flows) {
      const back = `${f.target}|${f.source}`;
      const key = `${f.source}|${f.target}`;
      if (seen.has(key)) continue;
      const isBi = flows.some(g => g.source === f.target && g.target === f.source);
      if (isBi) {
        seen.add(key); seen.add(back);
        const label = f.name ? `|${sanitize(f.name)}|` : '';
        lines.push(`  ${nodeId(f.source)} <-->${label} ${nodeId(f.target)}`);
      } else {
        seen.add(key);
        const label = f.name ? `|${sanitize(f.name)}|` : '';
        lines.push(`  ${nodeId(f.source)} -->${label} ${nodeId(f.target)}`);
      }
    }
  }

  return {
    id: 'view-application-cooperation',
    type: 'application-cooperation',
    name: 'Application Cooperation View',
    description: 'Anwendungslandschaft mit Schnittstellen und Datenflüssen zwischen Anwendungen (Flow-Relationships).',
    elementIds: apps.map(e => e.id),
    relationshipIds: flows.map(r => r.id),
    mermaid: lines.join('\n'),
  };
}

/** View 2: Technology Usage — Anwendungen auf Infrastruktur. */
function buildTechnologyUsageView(
  elements: ArchiMateElement[],
  rels: ArchiMateRelationship[]
): ArchiMateView {
  const techRels = rels.filter(r =>
    (r.type === 'Deployment') ||
    (r.type === 'Assignment') ||
    (r.type === 'Association' &&
      (r.target.startsWith('el-netzverbindungen-') ||
       r.target.startsWith('el-raeume-') ||
       r.target.startsWith('el-gebaeude-')))
  );
  const usedElIds = new Set<string>();
  techRels.forEach(r => { usedElIds.add(r.source); usedElIds.add(r.target); });
  const view = elements.filter(e => usedElIds.has(e.id));

  const groups: { label: string; types: ArchiMateElementType[]; nodes: ArchiMateElement[] }[] = [
    { label: 'Applications', types: ['ApplicationComponent'], nodes: [] },
    { label: 'Compute / Nodes', types: ['Node', 'Device'], nodes: [] },
    { label: 'System Software', types: ['SystemSoftware'], nodes: [] },
    { label: 'Network', types: ['CommunicationNetwork'], nodes: [] },
    { label: 'Locations', types: ['Location'], nodes: [] },
  ];
  for (const e of view) {
    const g = groups.find(gr => gr.types.includes(e.type));
    if (g) g.nodes.push(e);
  }

  const lines: string[] = ['graph TB'];
  if (view.length === 0) {
    lines.push('  empty["Keine technische Infrastruktur verknüpft"]');
  } else {
    let i = 0;
    for (const g of groups) {
      if (g.nodes.length === 0) continue;
      lines.push(`  subgraph sg${i++}["${g.label}"]`);
      g.nodes.forEach(e => lines.push('    ' + mermaidNode(e)));
      lines.push('  end');
    }
    for (const r of techRels) {
      const arrow = r.type === 'Association' ? '-.-' : '-->';
      lines.push(`  ${nodeId(r.source)} ${arrow} ${nodeId(r.target)}`);
    }
  }

  return {
    id: 'view-technology-usage',
    type: 'technology-usage',
    name: 'Technology Usage View',
    description: 'Welche Anwendungen auf welcher technischen Infrastruktur (Server, OS, Netz, Standorte) laufen.',
    elementIds: view.map(e => e.id),
    relationshipIds: techRels.map(r => r.id),
    mermaid: lines.join('\n'),
  };
}

/** View 3: Business/Application Alignment — Prozesse, Anwendungen, Daten. */
function buildBusinessApplicationAlignmentView(
  elements: ArchiMateElement[],
  rels: ArchiMateRelationship[]
): ArchiMateView {
  const relevant = rels.filter(r =>
    r.type === 'Serving' || r.type === 'Access'
  );
  const usedElIds = new Set<string>();
  relevant.forEach(r => { usedElIds.add(r.source); usedElIds.add(r.target); });
  const view = elements.filter(e =>
    usedElIds.has(e.id) &&
    (e.type === 'BusinessProcess' || e.type === 'ApplicationComponent' || e.type === 'DataObject')
  );

  const groups: { label: string; types: ArchiMateElementType[] }[] = [
    { label: 'Business', types: ['BusinessProcess'] },
    { label: 'Application', types: ['ApplicationComponent'] },
    { label: 'Data', types: ['DataObject'] },
  ];

  const lines: string[] = ['graph LR'];
  if (view.length === 0) {
    lines.push('  empty["Keine Prozess-/Anwendungs-/Daten-Verknüpfungen erfasst"]');
  } else {
    let i = 0;
    for (const g of groups) {
      const nodes = view.filter(e => g.types.includes(e.type));
      if (nodes.length === 0) continue;
      lines.push(`  subgraph sg${i++}["${g.label}"]`);
      nodes.forEach(e => lines.push('    ' + mermaidNode(e)));
      lines.push('  end');
    }
    for (const r of relevant) {
      // nur Kanten anzeigen, deren beide Endpunkte in der View sind
      if (!usedElIds.has(r.source) || !usedElIds.has(r.target)) continue;
      const label = r.type === 'Serving' ? '|unterstützt|' : '|nutzt|';
      lines.push(`  ${nodeId(r.source)} -->${label} ${nodeId(r.target)}`);
    }
  }

  return {
    id: 'view-business-application-alignment',
    type: 'business-application-alignment',
    name: 'Business/Application Alignment View',
    description: 'Welche Anwendungen welche Geschäftsprozesse unterstützen und welche Datenobjekte betroffen sind.',
    elementIds: view.map(e => e.id),
    relationshipIds: relevant.map(r => r.id),
    mermaid: lines.join('\n'),
  };
}

// ---------------------------------------------------------------------------
// JSON-Export
// ---------------------------------------------------------------------------

/** Serialisiert das Modell als formatiertes JSON (mit Metadaten/Hinweis). */
export function buildArchiMateJson(state: AppState): string {
  const model = buildArchiMateModel(state);
  const payload = {
    _note: 'ArchiMate-lite mapping derived from IT-Strukturanalyse AppState',
    _generator: GENERATOR_NAME,
    ...model,
  };
  return JSON.stringify(payload, null, 2);
}
