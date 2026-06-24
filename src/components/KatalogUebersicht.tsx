import React, { useMemo, useState } from 'react';
import type { ComponentKind, ComponentCatalogEntry } from '../data/componentCatalog';
import { COMPONENT_CATALOG } from '../data/componentCatalog';
import { getCatalogStats, normalizeText, isCustomComponent } from '../utils/componentCatalog';

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

const KIND_OPTIONS = Object.keys(KIND_LABEL) as ComponentKind[];
const REL_LABEL: Record<string, string> = { de: 'DE', eu: 'EU', global: 'Global' };

/** Mögliche Zielkategorien für Custom-Einträge (entspricht den CategoryKeys). */
const CATEGORY_TARGET_OPTIONS = [
  'anwendungen', 'betriebssysteme', 'server', 'clients', 'netzkomponenten',
  'sicherheitskomponenten', 'datentraeger', 'icsSysteme', 'iotSysteme',
];

const Card: React.FC<{ label: string; value: React.ReactNode; hint?: string; accent?: string }> = ({ label, value, hint, accent }) => (
  <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
    <p className={`text-2xl font-bold ${accent ?? 'text-hi-navy'}`}>{value}</p>
    {hint && <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>}
  </div>
);

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-50 last:border-0">
    <dt className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</dt>
    <dd className="col-span-2 text-xs text-hi-navy break-words">{children}</dd>
  </div>
);

interface Props {
  custom: ComponentCatalogEntry[];
  onUpdateCustom: (entries: ComponentCatalogEntry[]) => void;
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export const KatalogUebersicht: React.FC<Props> = ({ custom, onUpdateCustom }) => {
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<ComponentKind | 'all'>('all');
  const [detail, setDetail] = useState<ComponentCatalogEntry | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Statischer Basiskatalog + Custom-Einträge (reaktiv gegenüber Props).
  const merged = useMemo(() => [...COMPONENT_CATALOG, ...custom], [custom]);
  const stats = useMemo(() => getCatalogStats(merged), [merged]);

  const rows = useMemo(() => {
    const q = normalizeText(query);
    return merged
      .filter(e => kindFilter === 'all' || e.kind === kindFilter)
      .filter(e => {
        if (!q) return true;
        const hay = normalizeText([e.vendor, e.product, ...(e.aliases ?? []), ...(e.tags ?? [])].join(' '));
        return hay.includes(q);
      })
      .sort((a, b) => (a.kind + a.vendor + a.product).localeCompare(b.kind + b.vendor + b.product));
  }, [query, kindFilter, merged]);

  const handleAddCustom = (entry: ComponentCatalogEntry) => {
    onUpdateCustom([...custom, entry]);
    setShowForm(false);
    setDetail(entry);
  };

  const handleDeleteCustom = (id: string) => {
    onUpdateCustom(custom.filter(e => e.id !== id));
    setDetail(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Intro */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-hi-navy mb-1">IT-Komponentenkatalog — Übersicht</h1>
          <p className="text-sm text-gray-500 max-w-3xl">
            Übergreifende Sicht auf den lokal hinterlegten Produktkatalog, der bei der Erfassung
            Formularfelder mit sinnvollen Standardwerten befüllt. Einträge sind anklickbar
            (Details, Preisinfo, Tags, Zielkategorien). Eigene, kundenspezifische Komponenten
            können direkt über die Schaltfläche ergänzt werden — kein Code nötig.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-hi-accent text-white rounded-lg text-sm font-semibold hover:bg-hi-blue transition-colors shadow flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Eigene Komponente hinzufügen
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card label="Einträge gesamt" value={stats.total} hint={custom.length ? `inkl. ${custom.length} eigene` : undefined} />
        <Card label="Eigene Einträge" value={custom.length} accent="text-hi-accent" hint="kundenspezifisch" />
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
            <li><strong>Kuratierte Offline-Liste:</strong> Der Basiskatalog ist redaktionell in
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
          <h2 className="text-sm font-bold text-amber-800">Eigene Komponenten ergänzen</h2>
          <ul className="text-xs text-amber-900/90 space-y-1.5 list-disc pl-4">
            <li><strong>Direkt in der App:</strong> Über die Schaltfläche
              <span className="mx-1 px-1.5 py-0.5 bg-white/70 rounded font-semibold">+ Eigene Komponente hinzufügen</span>
              wird ein kundenspezifischer Eintrag angelegt — kein Code, keine Datei-Bearbeitung.</li>
            <li><strong>Bleibt gespeichert:</strong> Eigene Einträge liegen im Projekt-Datenbestand
              (<code className="px-1 bg-white/60 rounded">customComponentCatalog</code>) und werden mit
              JSON-Export/-Import mitgenommen.</li>
            <li><strong>Überall verfügbar:</strong> Sie erscheinen in Suche, Filter und im
              Komponenten-Picker der Erfassung gleichberechtigt neben dem Basiskatalog
              (Markierung <span className="px-1 py-0.5 text-[10px] font-bold rounded bg-hi-accent/15 text-hi-accent">EIGEN</span>).</li>
            <li><strong>Kein Anspruch auf Vollständigkeit:</strong> Der Basiskatalog ist ein Startpunkt,
              kein Register — Nischen- und Individualsoftware ergänzt man als eigene Komponente.</li>
            <li><strong>Entwicklerhinweis:</strong> Der statische Basiskatalog bleibt in
              <code className="mx-1 px-1 bg-white/60 rounded">src/data/componentCatalog.ts</code> pflegbar
              (Details: <code className="px-1 bg-white/60 rounded">docs/COMPONENT_CATALOG.md</code>).</li>
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
                <tr
                  key={e.id}
                  onClick={() => setDetail(e)}
                  className="border-t border-gray-50 hover:bg-hi-accent/5 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-2 font-medium text-hi-navy">
                    {e.product}
                    {isCustomComponent(e.id) && (
                      <span className="ml-1.5 px-1 py-0.5 text-[9px] font-bold rounded bg-hi-accent/15 text-hi-accent align-middle">EIGEN</span>
                    )}
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

      {detail && (
        <ComponentDetailDrawer
          entry={detail}
          isCustom={isCustomComponent(detail.id)}
          onClose={() => setDetail(null)}
          onDelete={handleDeleteCustom}
          kindLabel={KIND_LABEL[detail.kind]}
        />
      )}

      {showForm && (
        <CustomComponentForm
          existingIds={merged.map(e => e.id)}
          onCancel={() => setShowForm(false)}
          onSave={handleAddCustom}
          slugify={slugify}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Detail-Drawer (Slide-over)
// ─────────────────────────────────────────────────────────────────────────────

const ComponentDetailDrawer: React.FC<{
  entry: ComponentCatalogEntry;
  isCustom: boolean;
  kindLabel: string;
  onClose: () => void;
  onDelete: (id: string) => void;
}> = ({ entry, isCustom, kindLabel, onClose, onDelete }) => {
  const defaultFieldEntries = Object.entries(entry.defaultFields).filter(([, v]) => v);
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col">
        <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-hi-navy">{entry.product}</h2>
              {isCustom && <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-hi-accent/15 text-hi-accent">EIGEN</span>}
              {entry.oeffentlicherSektor && <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-700">ÖS</span>}
            </div>
            <p className="text-xs text-hi-slate">{entry.vendor} · {kindLabel}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-hi-slate hover:bg-gray-100 transition-colors" aria-label="Schließen">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <dl>
            <DetailRow label="Hersteller">{entry.vendor}</DetailRow>
            <DetailRow label="Produkt">{entry.product}</DetailRow>
            <DetailRow label="Klasse">{kindLabel} <span className="text-gray-400">({entry.kind})</span></DetailRow>
            <DetailRow label="Zielkategorien">{entry.categoryTargets.length ? entry.categoryTargets.join(', ') : '—'}</DetailRow>
            {entry.aliases?.length ? <DetailRow label="Aliases">{entry.aliases.join(', ')}</DetailRow> : null}
            {entry.versions?.length ? <DetailRow label="Versionen">{entry.versions.join(', ')}</DetailRow> : null}
            {entry.tags?.length ? (
              <DetailRow label="Tags">
                <span className="flex flex-wrap gap-1">
                  {entry.tags.map(t => <span key={t} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px]">{t}</span>)}
                </span>
              </DetailRow>
            ) : null}
            <DetailRow label="Relevanz">{entry.relevance ? REL_LABEL[entry.relevance] : '—'}</DetailRow>
            <DetailRow label="Öffentl. Sektor">{entry.oeffentlicherSektor ? 'Ja' : 'Nein / nicht markiert'}</DetailRow>
            {entry.spec ? <DetailRow label="Spec">{entry.spec}</DetailRow> : null}
            {entry.priceInfo ? <DetailRow label="Preisinfo">💶 {entry.priceInfo} <span className="block text-[10px] text-gray-400 mt-0.5">indikativ — keine verbindliche Kalkulation</span></DetailRow> : null}
            {entry.endoflifeSlug ? <DetailRow label="EoL-Slug">{entry.endoflifeSlug}</DetailRow> : null}
            {entry.cpePrefix ? <DetailRow label="CPE">{entry.cpePrefix}</DetailRow> : null}
            {entry.purlType ? <DetailRow label="purl-Typ">{entry.purlType}</DetailRow> : null}
          </dl>

          {defaultFieldEntries.length > 0 && (
            <div className="mt-4">
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Default-Felder (Autofill)</h3>
              <div className="rounded-lg border border-gray-100 overflow-hidden">
                {defaultFieldEntries.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-2 gap-2 px-3 py-1.5 odd:bg-gray-50 text-xs">
                    <span className="text-gray-500">{k}</span>
                    <span className="text-hi-navy break-words">{v}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">Beim Übernehmen in der Erfassung werden nur leere, schema-konforme Felder gesetzt (nicht-destruktiv).</p>
            </div>
          )}

          <div className="mt-4 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2 text-[11px] text-sky-800">
            <strong>In Erfassung übernehmen:</strong> Lege ein Objekt in einer der Zielkategorien
            ({entry.categoryTargets.join(', ') || '—'}) an und wähle dieses Produkt im
            Komponenten-Picker (<em>„Aus Katalog übernehmen"</em>) — der Eintrag füllt dann die leeren Felder.
          </div>
        </div>

        {isCustom && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <button
              onClick={() => { if (confirm(`Eigenen Katalogeintrag „${entry.product}" löschen?`)) onDelete(entry.id); }}
              className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              Eigenen Eintrag löschen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Custom-Komponenten-Formular
// ─────────────────────────────────────────────────────────────────────────────

const CustomComponentForm: React.FC<{
  existingIds: string[];
  onCancel: () => void;
  onSave: (entry: ComponentCatalogEntry) => void;
  slugify: (s: string) => string;
}> = ({ existingIds, onCancel, onSave, slugify }) => {
  const [vendor, setVendor] = useState('');
  const [product, setProduct] = useState('');
  const [kind, setKind] = useState<ComponentKind>('database');
  const [targets, setTargets] = useState<string[]>(['anwendungen']);
  const [aliases, setAliases] = useState('');
  const [versions, setVersions] = useState('');
  const [tags, setTags] = useState('');
  const [relevance, setRelevance] = useState<'' | 'de' | 'eu' | 'global'>('');
  const [oeS, setOeS] = useState(false);
  const [spec, setSpec] = useState('');
  const [priceInfo, setPriceInfo] = useState('');
  const [lizenzart, setLizenzart] = useState('');

  const splitList = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean);

  const canSave = vendor.trim() && product.trim() && targets.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const slug = `${slugify(vendor)}-${slugify(product)}`.replace(/^-+|-+$/g, '');
    let id = slug ? `custom-${slug}` : `custom-${Date.now()}`;
    if (existingIds.includes(id)) id = `${id}-${Date.now()}`;
    const defaultFields: Record<string, string> = { hersteller: vendor.trim() };
    if (lizenzart.trim()) defaultFields.lizenzart = lizenzart.trim();
    const entry: ComponentCatalogEntry = {
      id,
      kind,
      vendor: vendor.trim(),
      product: product.trim(),
      categoryTargets: targets,
      defaultFields,
      ...(aliases.trim() ? { aliases: splitList(aliases) } : {}),
      ...(versions.trim() ? { versions: splitList(versions) } : {}),
      ...(tags.trim() ? { tags: splitList(tags) } : {}),
      ...(relevance ? { relevance } : {}),
      ...(oeS ? { oeffentlicherSektor: true } : {}),
      ...(spec.trim() ? { spec: spec.trim() } : {}),
      ...(priceInfo.trim() ? { priceInfo: priceInfo.trim() } : {}),
    };
    onSave(entry);
  };

  const toggleTarget = (t: string) =>
    setTargets(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-hi-accent';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="flex-1">
            <h2 className="text-base font-bold text-hi-navy">Eigene Komponente hinzufügen</h2>
            <p className="text-xs text-hi-slate">Kundenspezifischer Katalogeintrag — bleibt im Projekt gespeichert</p>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg text-hi-slate hover:bg-gray-100 transition-colors" aria-label="Schließen">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-hi-slate">Hersteller / Anbieter *</span>
              <input className={inputCls} value={vendor} onChange={e => setVendor(e.target.value)} placeholder="z.B. ACME GmbH" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-hi-slate">Produkt *</span>
              <input className={inputCls} value={product} onChange={e => setProduct(e.target.value)} placeholder="z.B. ACME ERP 2024" />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-hi-slate">Produktklasse</span>
            <select className={inputCls} value={kind} onChange={e => setKind(e.target.value as ComponentKind)}>
              {KIND_OPTIONS.map(k => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
            </select>
          </label>

          <div>
            <span className="text-xs font-semibold text-hi-slate">Zielkategorien * <span className="text-gray-400 font-normal">(mind. eine)</span></span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {CATEGORY_TARGET_OPTIONS.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTarget(t)}
                  className={`px-2 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                    targets.includes(t) ? 'bg-hi-accent text-white border-hi-accent' : 'bg-white border-gray-200 text-hi-slate hover:border-hi-accent/50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-hi-slate">Lizenzart <span className="text-gray-400 font-normal">(z.B. „Proprietär", „Open Source")</span></span>
            <input className={inputCls} value={lizenzart} onChange={e => setLizenzart(e.target.value)} placeholder="Proprietär" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-hi-slate">Aliases <span className="text-gray-400 font-normal">(Komma)</span></span>
              <input className={inputCls} value={aliases} onChange={e => setAliases(e.target.value)} placeholder="ACME, ERP24" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-hi-slate">Versionen <span className="text-gray-400 font-normal">(Komma)</span></span>
              <input className={inputCls} value={versions} onChange={e => setVersions(e.target.value)} placeholder="2024, 2023" />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-hi-slate">Tags <span className="text-gray-400 font-normal">(Komma)</span></span>
            <input className={inputCls} value={tags} onChange={e => setTags(e.target.value)} placeholder="erp, finanzen" />
          </label>

          <div className="grid grid-cols-2 gap-3 items-end">
            <label className="block">
              <span className="text-xs font-semibold text-hi-slate">Relevanz</span>
              <select className={inputCls} value={relevance} onChange={e => setRelevance(e.target.value as '' | 'de' | 'eu' | 'global')}>
                <option value="">— keine —</option>
                <option value="de">DE</option>
                <option value="eu">EU</option>
                <option value="global">Global</option>
              </select>
            </label>
            <label className="flex items-center gap-2 pb-1.5">
              <input type="checkbox" checked={oeS} onChange={e => setOeS(e.target.checked)} className="rounded border-gray-300 text-hi-accent focus:ring-hi-accent" />
              <span className="text-xs font-semibold text-hi-slate">Öffentlicher Sektor relevant</span>
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-hi-slate">Spec <span className="text-gray-400 font-normal">(Kurzbeschreibung, nur Anzeige)</span></span>
            <input className={inputCls} value={spec} onChange={e => setSpec(e.target.value)} placeholder="z.B. 3-Tier, Java, PostgreSQL" />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-hi-slate">Preisinfo <span className="text-gray-400 font-normal">(indikativ, nur Anzeige)</span></span>
            <input className={inputCls} value={priceInfo} onChange={e => setPriceInfo(e.target.value)} placeholder="z.B. ~5.000 €/Jahr (2026)" />
          </label>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="px-5 py-2 bg-hi-accent text-white rounded-lg font-semibold text-sm hover:bg-hi-blue transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Hinzufügen
          </button>
          <button onClick={onCancel} className="px-4 py-2 border border-gray-200 text-hi-slate rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors">
            Abbrechen
          </button>
          {!canSave && <span className="text-[11px] text-gray-400 ml-1">Hersteller, Produkt und mind. eine Zielkategorie erforderlich</span>}
        </div>
      </div>
    </div>
  );
};
