import React, { useEffect, useMemo, useState } from 'react';
import type { AppState } from '../types';
import { buildArchiMateModel, buildArchiMateJson } from '../utils/archimate';
import type { ArchiMateViewType } from '../utils/archimate';
import { buildArchiMateExchangeXml } from '../utils/archimateXml';
import { esc, openPrintWindow } from '../utils/safePrint';

interface Props {
  state: AppState;
}

const TABS: { key: ArchiMateViewType; label: string }[] = [
  { key: 'application-cooperation', label: 'Application Cooperation' },
  { key: 'technology-usage', label: 'Technology Usage' },
  { key: 'business-application-alignment', label: 'Business/Application Alignment' },
];

function downloadBlob(content: string, mime: string, filename: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function dateStamp(): string {
  return new Date().toISOString().split('T')[0];
}

export const ArchiMateViews: React.FC<Props> = ({ state }) => {
  const [activeView, setActiveView] = useState<ArchiMateViewType>('application-cooperation');
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const model = useMemo(() => buildArchiMateModel(state), [state]);
  const view = useMemo(
    () => model.views.find(v => v.type === activeView) ?? model.views[0],
    [model, activeView]
  );

  useEffect(() => {
    if (!view) return;
    setLoading(true);
    setError('');
    let cancelled = false;
    import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'strict', fontFamily: 'Arial, sans-serif' });
      const id = 'archimate-' + Date.now();
      mermaid.render(id, view.mermaid)
        .then(({ svg: rendered }) => { if (!cancelled) { setSvg(rendered); setLoading(false); } })
        .catch(err => { if (!cancelled) { setError(String(err)); setSvg(''); setLoading(false); } });
    });
    return () => { cancelled = true; };
  }, [view]);

  const customer = state.customerName || 'kunde';

  const handleExportJSON = () => {
    downloadBlob(
      buildArchiMateJson(state),
      'application/json',
      `archimate-lite-${customer}-${dateStamp()}.json`
    );
  };

  const handleExportXML = () => {
    downloadBlob(
      buildArchiMateExchangeXml(state),
      'application/xml',
      `archimate-open-exchange-${customer}-${dateStamp()}.xml`
    );
  };

  const handleExportSVG = () => {
    if (!svg) return;
    downloadBlob(svg, 'image/svg+xml', `archimate-${activeView}-${customer}.svg`);
  };

  const handlePrint = () => {
    // svg comes from mermaid's renderer directly — title/customer are escaped.
    const body = `
      <h1>${esc(view?.name ?? 'ArchiMate View')}</h1>
      <p style="font-size:11px;color:#666">Kunde: <strong>${esc(state.customerName || '–')}</strong> &middot; ${esc(view?.description ?? '')}</p>
      ${svg}`;
    openPrintWindow(`ArchiMate — ${view?.name ?? ''} — ${state.customerName || 'Kunde'}`, body);
  };

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-hi-navy mb-1">ArchiMate-Views (abgeleitet)</h2>
          <p className="text-sm text-gray-500">
            {model.elements.length} Elemente · {model.relationships.length} Beziehungen · automatisch aus der Strukturanalyse erzeugt
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0 flex-wrap">
          <button onClick={handleExportSVG} disabled={!svg} className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40">
            SVG
          </button>
          <button onClick={handleExportJSON} className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
            JSON-Export
          </button>
          <button onClick={handleExportXML} className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
            Archi-XML
          </button>
          <button onClick={handlePrint} disabled={!svg} className="flex items-center gap-1.5 px-3 py-2 bg-hi-navy text-white rounded-lg text-sm font-medium hover:bg-hi-navy/90 disabled:opacity-40">
            Drucken
          </button>
        </div>
      </div>

      {/* Hinweis: abgeleitete Natur */}
      <div className="bg-sky-50 border border-sky-100 rounded-xl px-4 py-3 text-xs text-sky-900/90">
        Diese Views werden <strong>automatisch aus der Infrastruktur-Analyse abgeleitet</strong>.
        ArchiMate-Elemente können hier nicht direkt bearbeitet werden — Änderungen erfolgen über die
        Erfassung und Verknüpfung der Objekte (Geschäftsprozesse, Anwendungen, Daten, Server,
        Betriebssysteme, Schnittstellen, Netzverbindungen …). Je sauberer die Verknüpfungen, desto
        aussagekräftiger das Modell.
      </div>

      {/* View-Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveView(t.key)} className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeView === t.key ? 'bg-white text-hi-navy shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {view && <p className="text-xs text-gray-500">{view.description}</p>}

      {/* Diagramm */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 min-h-64 overflow-auto">
        {loading && <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Diagramm wird generiert …</div>}
        {error && (
          <div className="text-red-600 text-xs p-4 bg-red-50 rounded-lg">
            <p className="font-semibold mb-1">Fehler beim Rendern:</p>
            <pre className="whitespace-pre-wrap">{error}</pre>
            <details className="mt-2"><summary className="cursor-pointer">Mermaid-Code</summary><pre className="text-[10px] mt-1">{view?.mermaid}</pre></details>
          </div>
        )}
        {!loading && !error && svg && (
          <div className="overflow-auto" dangerouslySetInnerHTML={{ __html: svg }} />
        )}
        {!loading && !error && !svg && model.elements.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm gap-2 text-center px-6">
            <p>Noch keine verknüpften Objekte erfasst.</p>
            <p className="text-xs">Erfassen Sie Geschäftsprozesse, Anwendungen, Daten und Infrastruktur und verknüpfen Sie diese — daraus werden die ArchiMate-Views automatisch abgeleitet.</p>
          </div>
        )}
      </div>

      {/* Mermaid-Quellcode (Transparenz / Debug) */}
      {view && (
        <details className="text-xs text-gray-400">
          <summary className="cursor-pointer hover:text-gray-600">Mermaid-Quellcode anzeigen</summary>
          <pre className="mt-2 p-3 bg-gray-50 rounded-lg whitespace-pre-wrap border text-[10px]">{view.mermaid}</pre>
        </details>
      )}

      {/* Warnungen */}
      {model.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <h3 className="text-sm font-bold text-amber-800 mb-2">
            Hinweise zur Modellqualität ({model.warnings.length})
          </h3>
          <ul className="text-xs text-amber-900/90 space-y-1 list-disc pl-4 max-h-56 overflow-y-auto">
            {model.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
          <p className="text-[11px] text-amber-700/80 mt-2">
            Diese Hinweise zeigen nicht aufgelöste Referenzen und lose Objekte. Sie sind kein Fehler,
            sondern Hinweise auf noch fehlende Verknüpfungen in der Erfassung.
          </p>
        </div>
      )}

      <p className="text-[11px] text-gray-400 text-center">
        ArchiMate-lite — abgeleitetes Modell, kein vollständiger ArchiMate-Editor. Export für das
        Open-Source-Tool „Archi" (Open Exchange XML) und als JSON-Mapping.
      </p>
    </div>
  );
};
