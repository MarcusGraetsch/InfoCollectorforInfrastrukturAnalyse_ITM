import React, { useMemo, useState } from 'react';
import type { ComponentKind } from '../data/componentCatalog';
import { COMPONENT_CATALOG } from '../data/componentCatalog';
import { getCatalogStats, normalizeText } from '../utils/componentCatalog';

const KIND_LABEL: Record<ComponentKind, string> = {
  os: 'Betriebssysteme',
  database: 'Datenbanken',
  webserver: 'Web-Server',
  appserver: 'App-Server',
  iam: 'IAM',
  virtualization: 'Virtualisierung',
  container: 'Container',
  devops: 'DevOps',
  monitoring: 'Monitoring',
  backup: 'Backup',
  storage: 'Storage',
  network: 'Netzwerk',
  security: 'Sicherheit',
  office: 'Office / Kollaboration',
  erp: 'ERP',
  crm: 'CRM',
  ics: 'ICS / OT',
  iot: 'IoT',
  middleware: 'Middleware',
  hardware: 'Hardware',
  cloud: 'Cloud / Hyperscaler',
  ai: 'KI / AI',
  vdi: 'VDI',
};

const REL_LABEL: Record<string, string> = { de: 'DE', eu: 'EU', global: 'Global' };

const Card: React.FC<{ label: string; value: React.ReactNode; hint?: string; accent?: string }> = ({ label, value, hint, accent }) => (
  <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
    <p className={`text-2xl font-bold ${accent ?? 'text-hi-navy'}`}>{value}</p>
    {hint && <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>}
  </div>
);

export const KatalogUebersicht: React.FC = () => {
  const stats = useMemo(() => getCatalogStats(), []);
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<ComponentKind | 'all'>('all');

  const rows = useMemo(() => {
    const q = normalizeText(query);
    return COMPONENT_CATALOG
      .filter(e => kindFilter === 'all' || e.kind === kindFilter)
      .filter(e => {
        if (!q) return true;
        const hay = normalizeText([e.vendor, e.product, ...(e.aliases ?? []), ...(e.tags ?? [])].join(' '));
        return hay.includes(q);
      })
      .sort((a, b) => (a.kind + a.vendor + a.product).localeCompare(b.kind + b.vendor + b.product));
  }, [query, kindFilter]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Intro */}
      <div>
        <h1 className="text-2xl font-bold text-hi-navy mb-1">IT-Komponentenkatalog — Übersicht</h1>
        <p className="text-sm text-gray-500 max-w-3xl">
          Übergreifende Sicht auf den lokal hinterlegten Produktkatalog, der bei der Erfassung
          Formularfelder mit sinnvollen Standardwerten befüllt. Diese Seite erklärt, woher die
          Daten stammen, was bewusst nicht enthalten ist und wie der Katalog ergänzt wird.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card label="Einträge gesamt" value={stats.total} />
        <Card label="Produktklassen" value={stats.byKind.length} hint="ComponentKind" />
        <Card label="Open Source" value={stats.openSource} accent="text-emerald-600" />
        <Card label="Proprietär" value={stats.proprietary} accent="text-hi-slate" />
        <Card label="KI / AI" value={stats.ki} accent="text-violet-600" hint="Software & Hardware-Tags" />
        <Card label="Hardware" value={stats.hardware} accent="text-amber-600" />
        <Card label="Cloud-Dienste" value={stats.cloud} accent="text-sky-600" />
        <Card label="Öffentl. Sektor" value={stats.oeffentlicherSektor} accent="text-emerald-700" hint="für Behörden relevant" />
        <Card label="Souverän (DE/EU)" value={stats.souveraen} accent="text-emerald-700" />
        <Card label="Relevanz DE" value={stats.byRelevance.de} />
        <Card label="Relevanz EU" value={stats.byRelevance.eu} />
        <Card label="Relevanz Global" value={stats.byRelevance.global} />
      </div>

      {/* Breakdown by kind */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <h2 className="text-sm font-bold text-hi-navy mb-3">Verteilung nach Produktklasse</h2>
        <div className="flex flex-wrap gap-2">
          {stats.byKind.map(({ kind, count }) => (
            <button
              key={kind}
              onClick={() => setKindFilter(k => (k === kind ? 'all' : kind))}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                kindFilter === kind
                  ? 'bg-hi-accent text-white border-hi-accent'
                  : 'bg-gray-50 border-gray-200 text-hi-slate hover:border-hi-accent/50'
              }`}
            >
              {KIND_LABEL[kind]} <span className="opacity-60">· {count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Provenance + how-to (two columns) */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 space-y-2">
          <h2 className="text-sm font-bold text-sky-800">Woher kommen die Daten?</h2>
          <ul className="text-xs text-sky-900/90 space-y-1.5 list-disc pl-4">
            <li><strong>Kuratierte Offline-Liste:</strong> Alle Einträge sind redaktionell in
              <code className="mx-1 px-1 bg-white/60 rounded">src/data/componentCatalog.ts</code>
              gepflegt — kein Live-Abruf, keine externe API, voll offline.</li>
            <li><strong>Quellen:</strong> Hersteller-Produktseiten, Datenblätter und öffentlich
              bekannte Marktdaten zum jeweiligen Stand. Schwerpunkt auf im DACH-Raum und in
              der öffentlichen Verwaltung verbreiteten Produkten.</li>
            <li><strong>Lebenszyklus:</strong> Wo vorhanden, verweist <code className="px-1 bg-white/60 rounded">endoflifeSlug</code>
              auf das Schema von endoflife.date (zur manuellen Recherche, nicht automatisch abgefragt).</li>
            <li><strong>Preise sind indikativ:</strong> <code className="px-1 bg-white/60 rounded">priceInfo</code>
              enthält grobe Richtwerte mit Jahresstand — niemals verbindlich und nie ins Formular übernommen.</li>
            <li><strong>Nicht-destruktiv:</strong> Beim Befüllen werden nur leere Felder gesetzt und
              nur Werte, die zum jeweiligen Feld-Schema passen.</li>
          </ul>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-2">
          <h2 className="text-sm font-bold text-amber-800">Was fehlt — und wie ergänzen?</h2>
          <ul className="text-xs text-amber-900/90 space-y-1.5 list-disc pl-4">
            <li><strong>Kein Anspruch auf Vollständigkeit:</strong> Nischen-, Branchen- und
              Individualsoftware fehlen bewusst. Der Katalog ist ein Startpunkt, kein Register.</li>
            <li><strong>Preise & Versionen veralten:</strong> Da offline gepflegt, müssen
              <code className="mx-1 px-1 bg-white/60 rounded">priceInfo</code> und
              <code className="mx-1 px-1 bg-white/60 rounded">versions</code> regelmäßig aktualisiert werden.</li>
            <li><strong>Eigene Einträge:</strong> Neuen Eintrag am Ende des Arrays
              <code className="mx-1 px-1 bg-white/60 rounded">COMPONENT_CATALOG</code> anfügen — Pflichtfelder
              <code className="mx-1 px-1 bg-white/60 rounded">id</code>,
              <code className="mx-1 px-1 bg-white/60 rounded">kind</code>,
              <code className="mx-1 px-1 bg-white/60 rounded">vendor</code>,
              <code className="mx-1 px-1 bg-white/60 rounded">product</code>,
              <code className="mx-1 px-1 bg-white/60 rounded">categoryTargets</code>.</li>
            <li><strong>Fehlt ein Produkt im Termin?</strong> Felder einfach manuell ausfüllen —
              der Katalog ist optional, kein Pflichtweg.</li>
            <li>Details &amp; Beispiel-Eintrag: <code className="px-1 bg-white/60 rounded">docs/COMPONENT_CATALOG.md</code>.</li>
          </ul>
        </div>
      </div>

      {/* Browsable table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-hi-navy mr-auto">Alle Einträge durchsuchen</h2>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Suchen: z.B. Ollama, GPU, SAP, Firewall…"
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-hi-accent w-64"
          />
          <select
            value={kindFilter}
            onChange={e => setKindFilter(e.target.value as ComponentKind | 'all')}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-hi-accent"
          >
            <option value="all">Alle Klassen</option>
            {stats.byKind.map(({ kind }) => (
              <option key={kind} value={kind}>{KIND_LABEL[kind]}</option>
            ))}
          </select>
          <span className="text-xs text-gray-400">{rows.length} Treffer</span>
        </div>
        <div className="overflow-x-auto max-h-[28rem] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-50 text-gray-500">
              <tr className="text-left">
                <th className="px-4 py-2 font-semibold">Produkt</th>
                <th className="px-4 py-2 font-semibold">Hersteller</th>
                <th className="px-4 py-2 font-semibold">Klasse</th>
                <th className="px-4 py-2 font-semibold">Kategorien</th>
                <th className="px-4 py-2 font-semibold">Lizenz</th>
                <th className="px-4 py-2 font-semibold">Rel.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(e => (
                <tr key={e.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                  <td className="px-4 py-2 font-medium text-hi-navy">
                    {e.product}
                    {e.oeffentlicherSektor && (
                      <span className="ml-1.5 px-1 py-0.5 text-[9px] font-bold rounded bg-emerald-100 text-emerald-700 align-middle">ÖS</span>
                    )}
                    {e.spec && <div className="text-[10px] text-gray-400 font-normal">{e.spec}</div>}
                  </td>
                  <td className="px-4 py-2 text-hi-slate">{e.vendor}</td>
                  <td className="px-4 py-2"><span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{KIND_LABEL[e.kind]}</span></td>
                  <td className="px-4 py-2 text-gray-400">{e.categoryTargets.join(', ')}</td>
                  <td className="px-4 py-2 text-gray-500">{e.defaultFields.lizenzart ?? e.defaultFields.lizenztyp ?? '—'}</td>
                  <td className="px-4 py-2 text-gray-400">{e.relevance ? REL_LABEL[e.relevance] : '—'}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Keine Einträge gefunden.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 text-center">
        Der Katalog ist vollständig offline. Preisangaben sind indikativ und mit Jahresstand versehen.
      </p>
    </div>
  );
};
