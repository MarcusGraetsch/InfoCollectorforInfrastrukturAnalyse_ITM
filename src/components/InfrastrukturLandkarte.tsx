import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { AppState } from '../types';
import { esc, openPrintWindow } from '../utils/safePrint';

interface Props { state: AppState }

type Ansicht = 'kategorien' | 'server-anwendungen' | 'netzwerk';

const BEREITSTELLUNG_COLOR: Record<string, string> = {
  'On-Premises (physisch)':     '#6b7280',
  'On-Premises (virtualisiert)':'#4b5563',
  'Hybrid':                     '#7c3aed',
  'Private Cloud':              '#1d4ed8',
  'SaaS / Public Cloud':        '#0284c7',
  'Container (Docker/Podman)':  '#0891b2',
  'Kubernetes (On-Prem)':       '#0e7490',
  'Managed Kubernetes (Cloud)': '#0369a1',
};

function sanitize(s: string): string {
  return (s || 'Unbekannt').replace(/[^a-zA-Z0-9äöüÄÖÜß ._-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40);
}
function nodeId(prefix: string, id: string): string {
  return (prefix + id).replace(/[^a-zA-Z0-9]/g, '_');
}

function buildKategorienDiagram(state: AppState): string {
  const lines: string[] = ['graph TB'];
  const cats = [
    { key: 'anwendungen',    label: 'Anwendungen',    icon: '🖥' },
    { key: 'server',         label: 'Server',          icon: '🖧' },
    { key: 'clients',        label: 'Clients',         icon: '💻' },
    { key: 'netzkomponenten',label: 'Netzwerk',        icon: '🔀' },
    { key: 'icsSysteme',     label: 'ICS/OT',          icon: '⚙' },
    { key: 'iotSysteme',     label: 'IoT',             icon: '📡' },
    { key: 'raeume',         label: 'Räume',           icon: '🏢' },
  ] as const;

  for (const cat of cats) {
    const items = (state[cat.key as keyof AppState] as { id: string; name: string; kuerzel: string; bereitstellung?: string }[]);
    if (!items || items.length === 0) continue;
    const gid = cat.key;
    lines.push(`  subgraph ${gid}["${cat.icon} ${cat.label} (${items.length})"]`);
    for (const item of items.slice(0, 20)) {
      const nid  = nodeId(cat.key, item.id);
      const lbl  = sanitize(item.kuerzel || item.name);
      const ber  = item.bereitstellung || '';
      const col  = BEREITSTELLUNG_COLOR[ber] || '#9ca3af';
      lines.push(`    ${nid}["${lbl}"]:::ber_${nid.slice(-4)}`);
      lines.push(`    style ${nid} fill:${col}22,stroke:${col},color:#1f2937`);
    }
    if (items.length > 20) lines.push(`    more_${gid}["… +${items.length - 20} weitere"]:::more`);
    lines.push('  end');
  }

  lines.push('  classDef more fill:#f9fafb,stroke:#d1d5db,color:#9ca3af,font-style:italic');
  return lines.join('\n');
}

function buildServerAnwendungenDiagram(state: AppState): string {
  const lines: string[] = ['graph LR'];
  const server = (state.server as { id: string; name: string; kuerzel: string; bereitstellung?: string; anwendungen?: string[] }[]);
  const anwendungen = (state.anwendungen as { id: string; name: string; kuerzel: string }[]);

  if (server.length === 0 && anwendungen.length === 0) {
    return 'graph LR\n  empty["Noch keine Server oder Anwendungen erfasst"]';
  }

  lines.push('  subgraph srv["🖧 Server & Infrastruktur"]');
  for (const s of server.slice(0, 15)) {
    const nid = nodeId('srv', s.id);
    const lbl = sanitize(s.kuerzel || s.name);
    const col = BEREITSTELLUNG_COLOR[s.bereitstellung || ''] || '#6b7280';
    lines.push(`    ${nid}[("${lbl}")]`);
    lines.push(`    style ${nid} fill:${col}22,stroke:${col}`);
  }
  lines.push('  end');

  lines.push('  subgraph app["🖥 Anwendungen"]');
  for (const a of anwendungen.slice(0, 20)) {
    const nid = nodeId('app', a.id);
    const lbl = sanitize(a.kuerzel || a.name);
    lines.push(`    ${nid}["${lbl}"]`);
    lines.push(`    style ${nid} fill:#dbeafe,stroke:#3b82f6,color:#1e3a8a`);
  }
  lines.push('  end');

  // Verbindungen Server → Anwendungen
  for (const s of server.slice(0, 15)) {
    for (const appRef of (s.anwendungen || []).slice(0, 5)) {
      const appItem = anwendungen.find(a => a.id === appRef || a.kuerzel === appRef || a.name === appRef);
      if (appItem) {
        lines.push(`  ${nodeId('srv', s.id)} --> ${nodeId('app', appItem.id)}`);
      }
    }
  }

  return lines.join('\n');
}

function buildNetzwerkDiagram(state: AppState): string {
  const lines: string[] = ['graph TB'];
  const netz = (state.netzkomponenten as { id: string; name: string; kuerzel: string }[]);
  const verb = (state.netzverbindungen as { id: string; name: string; kuerzel: string; externNetz?: string }[]);
  const server = (state.server as { id: string; name: string; kuerzel: string; netzverbindungen?: string[] }[]);

  if (netz.length === 0 && verb.length === 0) {
    return 'graph TB\n  empty["Noch keine Netzkomponenten oder -verbindungen erfasst"]';
  }

  if (verb.some(v => v.externNetz === 'Ja')) {
    lines.push('  internet(("🌐 Internet"))');
    lines.push('  style internet fill:#dbeafe,stroke:#3b82f6');
  }

  lines.push('  subgraph nk["🔀 Netzkomponenten"]');
  for (const n of netz.slice(0, 12)) {
    const nid = nodeId('nk', n.id);
    lines.push(`    ${nid}{"${sanitize(n.kuerzel || n.name)}"}`);
    lines.push(`    style ${nid} fill:#fef3c7,stroke:#f59e0b`);
  }
  lines.push('  end');

  lines.push('  subgraph sv["🖧 Server"]');
  for (const s of server.slice(0, 10)) {
    const nid = nodeId('sv', s.id);
    lines.push(`    ${nid}[("${sanitize(s.kuerzel || s.name)}")]`);
    lines.push(`    style ${nid} fill:#dcfce7,stroke:#16a34a`);
  }
  lines.push('  end');

  for (const v of verb.slice(0, 15)) {
    const lbl = sanitize(v.kuerzel || v.name);
    if (v.externNetz === 'Ja') {
      const first = netz[0] ? nodeId('nk', netz[0].id) : null;
      if (first) lines.push(`  internet -->|"${lbl}"| ${first}`);
    }
  }

  return lines.join('\n');
}

export const InfrastrukturLandkarte: React.FC<Props> = ({ state }) => {
  const [ansicht, setAnsicht] = useState<Ansicht>('kategorien');
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const diagramCode = useMemo(() => {
    if (ansicht === 'kategorien')        return buildKategorienDiagram(state);
    if (ansicht === 'server-anwendungen') return buildServerAnwendungenDiagram(state);
    return buildNetzwerkDiagram(state);
  }, [ansicht, state]);

  useEffect(() => {
    setLoading(true);
    setError('');
    let cancelled = false;

    import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'strict', fontFamily: 'Arial, sans-serif' });
      const id = 'mermaid-' + Date.now();
      mermaid.render(id, diagramCode)
        .then(({ svg: rendered }) => {
          if (!cancelled) { setSvg(rendered); setLoading(false); }
        })
        .catch(err => {
          if (!cancelled) { setError(String(err)); setSvg(''); setLoading(false); }
        });
    });

    return () => { cancelled = true; };
  }, [diagramCode]);

  const handleExportSVG = () => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `Infrastruktur-Landkarte-${ansicht}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handlePrint = () => {
    // svg comes from mermaid's renderer directly — not user data interpolated into HTML
    // We escape the title/customer but keep the SVG as-is (mermaid output)
    const body = `
      <h1>Infrastruktur-Landkarte</h1>
      <p style="font-size:11px;color:#666">Kunde: <strong>${esc(state.customerName || '–')}</strong> &middot; Erstellt mit HiSolutions IT-Strukturanalyse</p>
      ${svg}`;
    openPrintWindow(`Infrastruktur-Landkarte — ${state.customerName || 'Kunde'}`, body);
  };

  const ANSICHTEN: { key: Ansicht; label: string }[] = [
    { key: 'kategorien',         label: 'Kategorien-Übersicht' },
    { key: 'server-anwendungen', label: 'Server → Anwendungen' },
    { key: 'netzwerk',           label: 'Netzwerktopologie' },
  ];

  const totalItems = (['anwendungen','server','clients','netzkomponenten','icsSysteme','iotSysteme'] as const)
    .reduce((n, k) => n + (state[k] as unknown[]).length, 0);

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-hi-navy mb-1">Infrastruktur-Landkarte (LG 3)</h2>
          <p className="text-sm text-gray-500">Auto-generiertes Diagramm aus {totalItems} erfassten Systemen</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={handleExportSVG} disabled={!svg} className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            SVG
          </button>
          <button onClick={handlePrint} disabled={!svg} className="flex items-center gap-1.5 px-3 py-2 bg-hi-navy text-white rounded-lg text-sm font-medium hover:bg-hi-navy/90 disabled:opacity-40">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Drucken
          </button>
        </div>
      </div>

      {/* Ansicht-Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {ANSICHTEN.map(a => (
          <button key={a.key} onClick={() => setAnsicht(a.key)} className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${ansicht === a.key ? 'bg-white text-hi-navy shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Legende */}
      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(BEREITSTELLUNG_COLOR).slice(0, 5).map(([label, col]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: col + '44', border: `1.5px solid ${col}` }} />
            {label}
          </span>
        ))}
      </div>

      {/* Diagramm */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 min-h-64 overflow-auto">
        {loading && (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Diagramm wird generiert …</div>
        )}
        {error && (
          <div className="text-red-600 text-xs p-4 bg-red-50 rounded-lg">
            <p className="font-semibold mb-1">Fehler beim Rendern:</p>
            <pre className="whitespace-pre-wrap">{error}</pre>
            <details className="mt-2"><summary className="cursor-pointer">Diagram-Code</summary><pre className="text-[10px] mt-1">{diagramCode}</pre></details>
          </div>
        )}
        {!loading && !error && svg && (
          <div ref={containerRef} className="overflow-auto" dangerouslySetInnerHTML={{ __html: svg }} />
        )}
        {!loading && !error && !svg && totalItems === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm gap-2">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
            <p>Erfassen Sie zuerst Systeme in der Infrastruktur-Analyse.</p>
          </div>
        )}
      </div>

      {/* Rohdaten */}
      <details className="text-xs text-gray-400">
        <summary className="cursor-pointer hover:text-gray-600">Mermaid-Quellcode anzeigen</summary>
        <pre className="mt-2 p-3 bg-gray-50 rounded-lg whitespace-pre-wrap border text-[10px]">{diagramCode}</pre>
      </details>
    </div>
  );
};
