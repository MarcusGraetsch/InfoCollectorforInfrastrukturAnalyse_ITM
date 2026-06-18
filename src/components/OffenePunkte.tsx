import React, { useMemo, useState } from 'react';
import type { AppState, CategoryKey, CloudFields } from '../types';
import { ASSESSABLE_CATEGORIES } from '../cloudReadiness';
import { findUnlinkedSuggestions } from '../utils/bidirectional';

const CATEGORY_LABELS: Record<string, string> = {
  anwendungen: 'Anwendungen',
  server: 'Server',
  clients: 'Clients',
  icsSysteme: 'ICS-Systeme',
  iotSysteme: 'IoT-Systeme',
};

const ALL_CATEGORY_LABELS: Record<string, string> = {
  ...CATEGORY_LABELS,
  netzverbindungen: 'Netzverbindungen',
  netzkomponenten: 'Netzkomponenten',
  geschaeftsprozesse: 'Geschäftsprozesse',
  daten: 'Daten',
  datentraeger: 'Datenträger',
  clients: 'Clients',
  icsSysteme: 'ICS-Systeme',
  iotSysteme: 'IoT-Systeme',
  raeume: 'Räume',
  gebaeude: 'Gebäude',
};

interface OpenField {
  fieldKey: keyof CloudFields;
  label: string;
  currentValue: string;
  isUnklar: boolean;
  question: string;
  theme: 'Betrieb & Bereitstellung' | 'Lizenz & Kosten' | 'Lebenszyklus & Technik' | 'Sicherheit & Compliance';
}

interface OpenItem {
  id: string;
  kuerzel: string;
  name: string;
  category: CategoryKey;
  categoryLabel: string;
  openFields: OpenField[];
}

const FIELD_DEFS: {
  key: keyof CloudFields;
  label: string;
  theme: OpenField['theme'];
  question: (name: string) => string;
  opts: string[];
}[] = [
  {
    key: 'schutzbedarf',
    label: 'Schutzbedarf',
    theme: 'Sicherheit & Compliance',
    question: (n) => `Wie hoch ist der Schutzbedarf von „${n}"? (Normal / Hoch / Sehr hoch)`,
    opts: ['Normal', 'Hoch', 'Sehr hoch', 'Unklar'],
  },
  {
    key: 'bereitstellung',
    label: 'Bereitstellung',
    theme: 'Betrieb & Bereitstellung',
    question: (n) => `Wo läuft „${n}" aktuell? On-Premises, Hybrid, Private Cloud oder SaaS/Public Cloud?`,
    opts: ['On-Premises (physisch)', 'On-Premises (virtualisiert)', 'Hybrid', 'Private Cloud', 'SaaS / Public Cloud', 'Container (Docker/Podman)', 'Kubernetes (On-Prem)', 'Managed Kubernetes (Cloud)', 'Unklar'],
  },
  {
    key: 'lizenzCloudfaehig',
    label: 'Lizenz cloudfähig',
    theme: 'Lizenz & Kosten',
    question: (n) => `Erlaubt die Lizenz von „${n}" einen Cloud- oder Hosting-Betrieb?`,
    opts: ['Ja', 'Nein', 'Unklar'],
  },
  {
    key: 'migrationskomplexitaet',
    label: 'Migrationskomplexität',
    theme: 'Betrieb & Bereitstellung',
    question: (n) => `Wie komplex wäre eine Migration von „${n}"?`,
    opts: ['Niedrig', 'Mittel', 'Hoch', 'Unklar'],
  },
  {
    key: 'lebenszyklus',
    label: 'Lebenszyklus-Status',
    theme: 'Lebenszyklus & Technik',
    question: (n) => `Wie ist der Wartungs- und Supportstatus von „${n}"?`,
    opts: ['Aktuell', 'Wartung läuft aus', 'End-of-Life', 'Unklar'],
  },
  {
    key: 'internetfaehig',
    label: 'Internet-/Cloudfähigkeit',
    theme: 'Betrieb & Bereitstellung',
    question: (n) => `Kann „${n}" über das Internet oder aus der Cloud betrieben werden?`,
    opts: ['Ja', 'Nein', 'Eingeschränkt', 'Unklar'],
  },
  {
    key: 'datensouveraenitaet',
    label: 'Datensouveränität',
    theme: 'Sicherheit & Compliance',
    question: (n) => `Welche regulatorischen Anforderungen gelten für die Daten von „${n}"?`,
    opts: ['Keine spezielle Anforderung', 'EU / DSGVO', 'Deutschland', 'Streng souverän (C5 / Gaia-X)', 'Confidential Computing (TEE / Enclave)', 'Unklar'],
  },
];

const FIELD_LABEL_MAP = Object.fromEntries(FIELD_DEFS.map(f => [f.key, f.label]));
const FIELD_OPTS_MAP = Object.fromEntries(FIELD_DEFS.map(f => [f.key, f.opts]));

function isOpen(val: string | undefined): boolean {
  return !val || val === '' || val === 'Unklar';
}

function buildOpenItems(state: AppState): OpenItem[] {
  const result: OpenItem[] = [];
  for (const cat of ASSESSABLE_CATEGORIES) {
    const items = state[cat] as unknown as (CloudFields & { id: string; kuerzel: string; name: string })[];
    for (const item of items) {
      const openFields: OpenField[] = [];
      for (const def of FIELD_DEFS) {
        const val = item[def.key] as string | undefined;
        if (isOpen(val)) {
          openFields.push({
            fieldKey: def.key,
            label: def.label,
            currentValue: val ?? '',
            isUnklar: val === 'Unklar',
            question: def.question(item.name),
            theme: def.theme,
          });
        }
      }
      if (openFields.length > 0) {
        result.push({
          id: item.id,
          kuerzel: item.kuerzel,
          name: item.name,
          category: cat,
          categoryLabel: CATEGORY_LABELS[cat] ?? cat,
          openFields,
        });
      }
    }
  }
  return result;
}

const THEMES: OpenField['theme'][] = [
  'Betrieb & Bereitstellung',
  'Lizenz & Kosten',
  'Lebenszyklus & Technik',
  'Sicherheit & Compliance',
];

const THEME_ICONS: Record<string, string> = {
  'Betrieb & Bereitstellung': '🖥',
  'Lizenz & Kosten': '📄',
  'Lebenszyklus & Technik': '🔄',
  'Sicherheit & Compliance': '🔒',
};

interface Props {
  state: AppState;
  onEditItem: (id: string) => void;
  onBatchCloudUpdate: (updates: { category: CategoryKey; id: string; field: string; value: string }[]) => void;
  onApplyLinks: (links: { sourceCategory: CategoryKey; sourceId: string; sourceField: string; targetIds: string[] }[]) => void;
}

// ── Batch-Aktionen ─────────────────────────────────────────────────────────

type BatchScope = 'leer' | 'unklar' | 'alle';

function BatchTab({ state, onBatchCloudUpdate }: { state: AppState; onBatchCloudUpdate: Props['onBatchCloudUpdate'] }) {
  const [fieldKey, setFieldKey] = useState<keyof CloudFields>('schutzbedarf');
  const [value, setValue] = useState('');
  const [scope, setScope] = useState<BatchScope>('unklar');
  const [filterCat, setFilterCat] = useState<CategoryKey | 'alle'>('alle');
  const [preview, setPreview] = useState<{ category: CategoryKey; id: string; name: string; kuerzel: string; current: string }[]>([]);
  const [done, setDone] = useState(false);

  const opts = FIELD_OPTS_MAP[fieldKey] ?? [];

  const computePreview = () => {
    const results: typeof preview = [];
    for (const cat of ASSESSABLE_CATEGORIES) {
      if (filterCat !== 'alle' && filterCat !== cat) continue;
      const items = state[cat] as unknown as (Record<string, unknown> & { id: string; name: string; kuerzel: string })[];
      for (const item of items) {
        const current = (item[fieldKey as string] as string | undefined) ?? '';
        const matches =
          scope === 'alle' ||
          (scope === 'leer' && (!current || current === '')) ||
          (scope === 'unklar' && (current === 'Unklar' || !current));
        if (matches) results.push({ category: cat, id: item.id, name: item.name, kuerzel: item.kuerzel, current });
      }
    }
    setPreview(results);
    setDone(false);
  };

  const applyBatch = () => {
    const updates = preview.map(p => ({ category: p.category, id: p.id, field: fieldKey as string, value }));
    onBatchCloudUpdate(updates);
    setDone(true);
    setPreview([]);
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-bold text-hi-navy">Feld auswählen</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-hi-slate uppercase tracking-wide mb-1">Feld</label>
            <select
              value={fieldKey}
              onChange={e => { setFieldKey(e.target.value as keyof CloudFields); setValue(''); setPreview([]); setDone(false); }}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-hi-accent"
            >
              {FIELD_DEFS.map(f => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-hi-slate uppercase tracking-wide mb-1">Wert setzen auf</label>
            <select
              value={value}
              onChange={e => { setValue(e.target.value); setPreview([]); setDone(false); }}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-hi-accent"
            >
              <option value="">— bitte wählen —</option>
              {opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-hi-slate uppercase tracking-wide mb-1">Betroffene Einträge</label>
            <div className="flex gap-2">
              {([['leer', 'Leer'], ['unklar', 'Unklar'], ['alle', 'Alle']] as [BatchScope, string][]).map(([s, l]) => (
                <button
                  key={s}
                  onClick={() => { setScope(s); setPreview([]); setDone(false); }}
                  className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${scope === s ? 'bg-hi-accent text-white border-hi-accent' : 'bg-white text-hi-navy border-gray-200 hover:border-hi-accent'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-hi-slate uppercase tracking-wide mb-1">Kategorie</label>
            <select
              value={filterCat}
              onChange={e => { setFilterCat(e.target.value as CategoryKey | 'alle'); setPreview([]); setDone(false); }}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-hi-accent"
            >
              <option value="alle">Alle Kategorien</option>
              {ASSESSABLE_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={computePreview}
          disabled={!value}
          className="px-4 py-2 text-sm font-semibold bg-hi-gray text-hi-navy border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Vorschau berechnen
        </button>
      </div>

      {done && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800 font-semibold">
          ✓ Batch-Aktion erfolgreich angewendet.
        </div>
      )}

      {preview.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-hi-gray border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-hi-navy">{preview.length} Einträge betroffen</h3>
            <button
              onClick={applyBatch}
              className="px-4 py-1.5 text-xs font-bold bg-hi-accent text-white rounded-lg hover:bg-hi-blue transition-colors"
            >
              Jetzt anwenden · „{FIELD_LABEL_MAP[fieldKey]}" → {value}
            </button>
          </div>
          <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
            {preview.map(p => (
              <div key={p.id} className="px-5 py-2.5 flex items-center gap-4 text-sm">
                <span className="font-mono text-hi-accent text-xs font-bold w-24 flex-shrink-0">{p.kuerzel}</span>
                <span className="text-hi-navy flex-1">{p.name}</span>
                <span className="text-xs text-hi-slate">{CATEGORY_LABELS[p.category]}</span>
                <span className="text-xs text-gray-400">{p.current || '—'} → <strong className="text-hi-navy">{value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {preview.length === 0 && !done && (
        <p className="text-xs text-hi-slate px-1">
          Wählen Sie ein Feld und einen Zielwert, dann klicken Sie „Vorschau berechnen". Die Vorschau zeigt alle betroffenen Einträge bevor die Änderung gespeichert wird.
        </p>
      )}
    </div>
  );
}

// ── Verknüpfungs-Wizard ────────────────────────────────────────────────────

interface LinkSuggestion {
  sourceCategory: CategoryKey;
  sourceId: string;
  sourceName: string;
  sourceKuerzel: string;
  sourceField: string;
  targetCategory: CategoryKey;
  suggestions: { id: string; kuerzel: string; name: string; score: number }[];
}

function buildLinkSuggestions(state: AppState): LinkSuggestion[] {
  const results: LinkSuggestion[] = [];
  const allCats = Object.keys(state).filter(k =>
    Array.isArray(state[k as CategoryKey])
  ) as CategoryKey[];

  for (const cat of allCats) {
    const items = state[cat] as unknown as Record<string, unknown>[];
    for (const item of items) {
      const suggs = findUnlinkedSuggestions(state, cat, item);
      for (const { targetCategory, targetField, suggestions } of suggs) {
        if (suggestions.length > 0) {
          results.push({
            sourceCategory: cat,
            sourceId: item['id'] as string,
            sourceName: item['name'] as string,
            sourceKuerzel: item['kuerzel'] as string,
            sourceField: targetField,
            targetCategory,
            suggestions,
          });
        }
      }
    }
  }
  return results;
}

function LinksTab({ state, onApplyLinks }: { state: AppState; onApplyLinks: Props['onApplyLinks'] }) {
  const suggestions = useMemo(() => buildLinkSuggestions(state), [state]);
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const [applied, setApplied] = useState(false);

  const toggleLink = (key: string, targetId: string) => {
    setSelected(prev => {
      const s = new Set(prev[key] ?? []);
      if (s.has(targetId)) s.delete(targetId); else s.add(targetId);
      return { ...prev, [key]: s };
    });
    setApplied(false);
  };

  const totalSelected = Object.values(selected).reduce((n, s) => n + s.size, 0);

  const applyLinks = () => {
    const links: Parameters<Props['onApplyLinks']>[0] = [];
    for (const sugg of suggestions) {
      const key = `${sugg.sourceId}__${sugg.sourceField}`;
      const ids = [...(selected[key] ?? [])];
      if (ids.length > 0) {
        links.push({
          sourceCategory: sugg.sourceCategory,
          sourceId: sugg.sourceId,
          sourceField: sugg.sourceField,
          targetIds: ids,
        });
      }
    }
    if (links.length > 0) {
      onApplyLinks(links);
      setApplied(true);
      setSelected({});
    }
  };

  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center max-w-2xl">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">🔗</div>
        <h3 className="text-base font-bold text-hi-navy mb-1">Keine Verknüpfungs-Vorschläge</h3>
        <p className="text-sm text-hi-slate">Alle Items mit namentlichen Überschneidungen sind bereits verknüpft.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-hi-slate">
          Basierend auf Namensähnlichkeiten wurden mögliche Verknüpfungen gefunden. Wählen Sie die gewünschten aus und klicken Sie „Verknüpfungen anlegen".
        </p>
        <button
          onClick={applyLinks}
          disabled={totalSelected === 0}
          className="ml-4 flex-shrink-0 px-4 py-2 text-sm font-bold bg-hi-accent text-white rounded-lg hover:bg-hi-blue transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {totalSelected} Verknüpfung{totalSelected !== 1 ? 'en' : ''} anlegen
        </button>
      </div>

      {applied && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800 font-semibold">
          ✓ Verknüpfungen wurden bidirektional gespeichert.
        </div>
      )}

      {suggestions.map(sugg => {
        const key = `${sugg.sourceId}__${sugg.sourceField}`;
        const sel = selected[key] ?? new Set();
        return (
          <div key={key} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-hi-gray border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="font-mono text-hi-accent text-xs font-bold">{sugg.sourceKuerzel}</span>
                <span className="text-sm font-semibold text-hi-navy">{sugg.sourceName}</span>
                <span className="text-xs text-hi-slate bg-white border border-gray-200 rounded px-1.5 py-0.5">{ALL_CATEGORY_LABELS[sugg.sourceCategory] ?? sugg.sourceCategory}</span>
                <span className="text-xs text-gray-400">→ Feld: <strong>{sugg.sourceField}</strong></span>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {sugg.suggestions.map(s => {
                const isSelected = sel.has(s.id);
                const pct = Math.round(s.score * 100);
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleLink(key, s.id)}
                    className={`px-5 py-3 flex items-center gap-4 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${isSelected ? 'bg-hi-accent border-hi-accent' : 'border-gray-300'}`}>
                      {isSelected && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="font-mono text-hi-accent text-xs font-bold w-20 flex-shrink-0">{s.kuerzel}</span>
                    <span className="text-sm text-hi-navy flex-1">{s.name}</span>
                    <span className="text-xs text-hi-slate">{ALL_CATEGORY_LABELS[sugg.targetCategory] ?? sugg.targetCategory}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pct >= 60 ? 'bg-emerald-100 text-emerald-700' : pct >= 30 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                      {pct}% Match
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export const OffenePunkte: React.FC<Props> = ({ state, onEditItem, onBatchCloudUpdate, onApplyLinks }) => {
  const [tab, setTab] = useState<'liste' | 'interview' | 'batch' | 'links'>('liste');
  const [filterCategory, setFilterCategory] = useState<CategoryKey | 'alle'>('alle');

  const allOpen = useMemo(() => buildOpenItems(state), [state]);

  const filtered = useMemo(
    () => filterCategory === 'alle' ? allOpen : allOpen.filter(i => i.category === filterCategory),
    [allOpen, filterCategory]
  );

  const byCategory = useMemo(() => {
    const map: Partial<Record<CategoryKey, OpenItem[]>> = {};
    for (const item of filtered) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category]!.push(item);
    }
    return map;
  }, [filtered]);

  const totalFields = filtered.reduce((s, i) => s + i.openFields.length, 0);
  const unklarCount = filtered.reduce((s, i) => s + i.openFields.filter(f => f.isUnklar).length, 0);
  const leerCount = totalFields - unklarCount;

  const byTheme = useMemo(() => {
    const map: Partial<Record<OpenField['theme'], { item: OpenItem; field: OpenField }[]>> = {};
    for (const item of filtered) {
      for (const field of item.openFields) {
        if (!map[field.theme]) map[field.theme] = [];
        map[field.theme]!.push({ item, field });
      }
    }
    return map;
  }, [filtered]);

  const handlePrint = () => window.print();

  const showKpis = tab === 'liste' || tab === 'interview';

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      {/* Print-only header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold">Offene Punkte · Interview-Vorbereitung</h1>
        <p className="text-sm text-gray-500 mt-1">
          {state.customerName ? `Kunde: ${state.customerName} · ` : ''}Erstellt: {new Date().toLocaleDateString('de-DE')}
        </p>
        <hr className="mt-3" />
      </div>

      {/* Header */}
      <div className="print:hidden">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-hi-navy">Offene Punkte</h2>
            <p className="text-sm text-hi-slate mt-1">
              Cloud-Felder klären, Verknüpfungen prüfen und Batch-Aktionen durchführen.
            </p>
          </div>
          {(tab === 'liste' || tab === 'interview') && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-hi-navy text-white rounded-lg text-sm font-semibold hover:bg-hi-blue transition-colors shadow print:hidden"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Drucken / PDF
            </button>
          )}
        </div>

        {/* KPI Row — nur bei liste/interview-Tab */}
        {showKpis && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="text-xs font-semibold text-hi-slate uppercase tracking-wider mb-1">Betroffene Objekte</div>
              <div className="text-3xl font-bold text-hi-accent">{filtered.length}</div>
              <div className="text-xs text-gray-400 mt-0.5">von {allOpen.length} insgesamt</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="text-xs font-semibold text-hi-slate uppercase tracking-wider mb-1">Explizit „Unklar"</div>
              <div className="text-3xl font-bold text-amber-500">{unklarCount}</div>
              <div className="text-xs text-gray-400 mt-0.5">Felder die bewusst offen gelassen wurden</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="text-xs font-semibold text-hi-slate uppercase tracking-wider mb-1">Noch nicht erfasst</div>
              <div className="text-3xl font-bold text-red-400">{leerCount}</div>
              <div className="text-xs text-gray-400 mt-0.5">Felder ohne jede Angabe</div>
            </div>
          </div>
        )}

        {/* Tabs + Filter */}
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <div className="flex gap-1 bg-hi-gray rounded-lg p-1">
            {([
              ['liste', 'Offene Punkte'],
              ['interview', 'Interview-Vorbereitung'],
              ['batch', 'Batch-Aktionen'],
              ['links', 'Verknüpfungen'],
            ] as [typeof tab, string][]).map(([t, l]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${tab === t ? 'bg-white text-hi-navy shadow-sm' : 'text-hi-slate hover:text-hi-navy'}`}
              >
                {l}
              </button>
            ))}
          </div>

          {showKpis && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-hi-slate font-medium">Kategorie:</span>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value as CategoryKey | 'alle')}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-hi-navy focus:outline-none focus:ring-2 focus:ring-hi-accent"
              >
                <option value="alle">Alle ({allOpen.length})</option>
                {ASSESSABLE_CATEGORIES.filter(c => byCategory[c]).map(c => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]} ({byCategory[c]?.length})</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── TAB: OFFENE PUNKTE ── */}
      {tab === 'liste' && (
        allOpen.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-hi-navy mb-2">Keine offenen Punkte</h2>
            <p className="text-sm text-hi-slate">Alle cloud-relevanten Felder sind vollständig erfasst.</p>
          </div>
        ) : (
          <div className="space-y-4 print:space-y-6">
            {ASSESSABLE_CATEGORIES.filter(c => byCategory[c]).map(cat => (
              <div key={cat} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-hi-gray border-b border-gray-200 flex items-center gap-3">
                  <h3 className="text-sm font-bold text-hi-navy uppercase tracking-wider">{CATEGORY_LABELS[cat]}</h3>
                  <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 font-bold">
                    {byCategory[cat]!.length} Objekte
                  </span>
                </div>
                <div className="divide-y divide-gray-50">
                  {byCategory[cat]!.map(item => (
                    <div key={item.id} className="px-5 py-3 flex items-start gap-4">
                      <div className="w-32 flex-shrink-0">
                        <div className="font-mono text-hi-accent text-xs font-bold">{item.kuerzel}</div>
                        <div className="text-sm font-semibold text-hi-navy mt-0.5 leading-snug">{item.name}</div>
                      </div>
                      <div className="flex-1 flex flex-wrap gap-2">
                        {item.openFields.map(f => (
                          <span
                            key={f.fieldKey}
                            className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                              f.isUnklar
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-red-50 text-red-600 border-red-200'
                            }`}
                          >
                            {f.label}{f.isUnklar ? ' · Unklar' : ' · fehlt'}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                          {item.openFields.length}
                        </div>
                        <button
                          onClick={() => onEditItem(item.id)}
                          title="Im Wizard bearbeiten"
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-hi-accent border border-hi-accent/30 rounded-lg hover:bg-hi-accent hover:text-white transition-all"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Bearbeiten
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── TAB: INTERVIEW-VORBEREITUNG ── */}
      {tab === 'interview' && (
        <div className="space-y-5 print:space-y-8">
          <div className="hidden print:block">
            <p className="text-sm text-gray-600 mb-4">
              Strukturierte Fragenliste zur Klärung offener Punkte.
            </p>
          </div>
          {THEMES.filter(t => byTheme[t]).map(theme => (
            <div key={theme} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden print:border print:shadow-none print:rounded-none">
              <div className="px-5 py-3 bg-hi-gray border-b border-gray-200 flex items-center gap-3">
                <span className="text-base print:text-lg">{THEME_ICONS[theme]}</span>
                <h3 className="text-sm font-bold text-hi-navy uppercase tracking-wider">{theme}</h3>
                <span className="text-xs text-hi-slate ml-auto">{byTheme[theme]!.length} Fragen</span>
              </div>
              <div className="divide-y divide-gray-50">
                {byTheme[theme]!.map(({ item, field }, idx) => (
                  <div key={`${item.id}-${field.fieldKey}`} className="px-5 py-4 print:py-5">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-hi-accent text-white text-xs font-bold flex items-center justify-center mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-hi-accent text-xs font-bold">{item.kuerzel}</span>
                          <span className="text-xs font-semibold text-hi-navy">{item.name}</span>
                          <span className="text-[10px] text-hi-slate bg-hi-gray rounded px-1.5 py-0.5">{item.categoryLabel}</span>
                          {field.isUnklar && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5 font-semibold">Unklar</span>
                          )}
                        </div>
                        <p className="text-sm text-hi-navy leading-relaxed">{field.question}</p>
                        <div className="mt-3 border border-dashed border-gray-300 rounded-lg p-3 min-h-[40px] print:min-h-[56px] print:mt-4">
                          <span className="text-xs text-gray-300 print:hidden">Antwort …</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-hi-slate print:hidden">
            Tipp: „Drucken / PDF" oben rechts erzeugt eine vollständige Fragenliste mit Antwortfeldern.
          </p>
        </div>
      )}

      {/* ── TAB: BATCH-AKTIONEN ── */}
      {tab === 'batch' && (
        <BatchTab state={state} onBatchCloudUpdate={onBatchCloudUpdate} />
      )}

      {/* ── TAB: VERKNÜPFUNGEN ── */}
      {tab === 'links' && (
        <LinksTab state={state} onApplyLinks={onApplyLinks} />
      )}
    </div>
  );
};
