import React, { useMemo, useState, useEffect } from 'react';
import type { AppState, CategoryKey, CloudFields } from '../types';
import { ASSESSABLE_CATEGORIES } from '../cloudReadiness';
import { findUnlinkedSuggestions } from '../utils/bidirectional';
import { findPlatformGaps } from '../utils/plattform';
import {
  CLOUD_FIELD_DEFS,
  CLOUD_FIELD_BY_KEY,
  CLOUD_THEMES,
  CLOUD_THEME_ICONS,
  isOpenField,
  isFieldRelevant,
  type CloudFieldKey,
  type CloudTheme,
} from '../cloudFields';

const CATEGORY_LABELS: Record<string, string> = {
  anwendungen: 'Anwendungen',
  betriebssysteme: 'Betriebssysteme',
  server: 'Server',
  clients: 'Clients',
  icsSysteme: 'ICS-Systeme',
  iotSysteme: 'IoT-Systeme',
};

const ALL_CATEGORY_LABELS: Record<string, string> = {
  ...CATEGORY_LABELS,
  netzverbindungen: 'Netzverbindungen',
  netzkomponenten: 'Netzkomponenten',
};

interface OpenField {
  fieldKey: CloudFieldKey;
  label: string;
  currentValue: string;
  isUnklar: boolean;
  question: string;
  theme: CloudTheme;
}

interface OpenItem {
  id: string;
  kuerzel: string;
  name: string;
  category: CategoryKey;
  categoryLabel: string;
  openFields: OpenField[];
}

const FIELD_BY_KEY = CLOUD_FIELD_BY_KEY;
const THEMES = CLOUD_THEMES;
const THEME_ICONS = CLOUD_THEME_ICONS;

function buildOpenItems(state: AppState): OpenItem[] {
  const result: OpenItem[] = [];
  for (const cat of ASSESSABLE_CATEGORIES) {
    const items = state[cat] as unknown as (CloudFields & { id: string; kuerzel: string; name: string })[];
    for (const item of items) {
      const openFields: OpenField[] = [];
      for (const def of CLOUD_FIELD_DEFS) {
        if (!isFieldRelevant(def, cat)) continue;
        const val = (item as unknown as Record<string, unknown>)[def.key] as string | undefined;
        if (isOpenField(val)) {
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

interface Props {
  state: AppState;
  onEditItem: (id: string) => void;
  onBatchCloudUpdate: (updates: { category: CategoryKey; id: string; field: string; value: string }[]) => void;
  onApplyLinks: (links: { sourceCategory: CategoryKey; sourceId: string; sourceField: string; targetIds: string[] }[]) => void;
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
  const stateAsRecord = state as unknown as Record<string, unknown>;
  const allCats = Object.keys(stateAsRecord).filter(k =>
    Array.isArray(stateAsRecord[k])
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
          Basierend auf Namensähnlichkeiten wurden mögliche Verknüpfungen gefunden. Wählen Sie aus und klicken Sie „Anlegen".
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
                <span className="text-xs text-gray-400 ml-1">→ <strong>{sugg.sourceField}</strong></span>
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
  const [tab, setTab] = useState<'liste' | 'interview' | 'links'>('liste');
  const [filterCategory, setFilterCategory] = useState<CategoryKey | 'alle'>('alle');

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchField, setBatchField] = useState<CloudFieldKey>('schutzbedarf');
  const [batchValue, setBatchValue] = useState('');
  const [batchDone, setBatchDone] = useState(false);

  const allOpen = useMemo(() => buildOpenItems(state), [state]);
  const platformGaps = useMemo(() => findPlatformGaps(state), [state]);

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

  // Determine which fields are open across selected items
  const selectedItems = useMemo(
    () => filtered.filter(i => selectedIds.has(i.id)),
    [filtered, selectedIds]
  );
  const openFieldsInSelection = useMemo(() => {
    const fieldCounts = new Map<CloudFieldKey, number>();
    for (const item of selectedItems) {
      for (const f of item.openFields) {
        fieldCounts.set(f.fieldKey, (fieldCounts.get(f.fieldKey) ?? 0) + 1);
      }
    }
    return [...fieldCounts.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
  }, [selectedItems]);

  // Auto-sync batchField to first open field in selection when selection changes
  useEffect(() => {
    if (openFieldsInSelection.length > 0 && !openFieldsInSelection.includes(batchField)) {
      setBatchField(openFieldsInSelection[0]);
      setBatchValue('');
    }
  }, [openFieldsInSelection]);

  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setBatchDone(false);
  };

  const selectAll = () => {
    setSelectedIds(new Set(filtered.map(i => i.id)));
    setBatchDone(false);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBatchDone(false);
  };

  const applyBatch = () => {
    if (!batchValue) return;
    const updates = selectedItems
      .filter(item => item.openFields.some(f => f.fieldKey === batchField))
      .map(item => ({ category: item.category, id: item.id, field: batchField as string, value: batchValue }));
    if (updates.length > 0) {
      onBatchCloudUpdate(updates);
      setBatchDone(true);
      setSelectedIds(new Set());
      setBatchValue('');
    }
  };

  const batchFieldDef = FIELD_BY_KEY[batchField];
  const batchOpts = batchFieldDef?.options ?? [];
  const batchAffectedCount = selectedItems.filter(i => i.openFields.some(f => f.fieldKey === batchField)).length;

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
              Cloud-Felder klären, Verknüpfungen prüfen, Batch-Aktionen durchführen.
            </p>
          </div>
          {showKpis && (
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
              <div className="text-xs text-gray-400 mt-0.5">Felder bewusst offen gelassen</div>
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
                onChange={e => { setFilterCategory(e.target.value as CategoryKey | 'alle'); clearSelection(); }}
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
          <>
            {/* Selection controls */}
            <div className="flex items-center gap-3 print:hidden">
              <button
                onClick={selectedIds.size === filtered.length ? clearSelection : selectAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-hi-slate border border-gray-200 rounded-lg hover:border-hi-accent hover:text-hi-navy bg-white transition-all"
              >
                <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center ${selectedIds.size === filtered.length && filtered.length > 0 ? 'bg-hi-accent border-hi-accent' : 'border-gray-400'}`}>
                  {selectedIds.size === filtered.length && filtered.length > 0 && (
                    <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                {selectedIds.size === filtered.length && filtered.length > 0 ? 'Alle abwählen' : 'Alle markieren'}
              </button>
              {selectedIds.size > 0 && (
                <span className="text-xs text-hi-navy font-semibold">
                  {selectedIds.size} von {filtered.length} ausgewählt
                </span>
              )}
              {batchDone && (
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  ✓ Batch-Aktion angewendet
                </span>
              )}
            </div>

            {/* Item list */}
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
                    {byCategory[cat]!.map(item => {
                      const isSelected = selectedIds.has(item.id);
                      return (
                        <div
                          key={item.id}
                          className={`px-5 py-3 flex items-start gap-3 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                        >
                          {/* Checkbox */}
                          <button
                            onClick={() => toggleSelectItem(item.id)}
                            className={`mt-1 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all print:hidden ${isSelected ? 'bg-hi-accent border-hi-accent' : 'border-gray-300 hover:border-hi-accent'}`}
                          >
                            {isSelected && (
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>

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
                          <div className="flex items-center gap-2 flex-shrink-0 print:hidden">
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
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* ── FLOATING BATCH ACTION BAR ── */}
            {selectedIds.size > 0 && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 print:hidden">
                <div className="bg-hi-navy rounded-2xl shadow-2xl border border-white/10 p-4">
                  <div className="flex items-center gap-1 mb-3 flex-wrap">
                    <span className="text-xs font-bold text-white/60 uppercase tracking-wider mr-1">
                      {selectedIds.size} Objekte ausgewählt — Feld setzen:
                    </span>
                    <button
                      onClick={clearSelection}
                      className="ml-auto text-xs text-white/40 hover:text-white/70 transition-colors"
                    >
                      × Auswahl aufheben
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Field selector */}
                    <select
                      value={batchField}
                      onChange={e => { setBatchField(e.target.value as CloudFieldKey); setBatchValue(''); setBatchDone(false); }}
                      className="text-xs border border-white/20 rounded-lg px-3 py-2 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-hi-teal"
                    >
                      {openFieldsInSelection.length > 0
                        ? openFieldsInSelection.map(k => (
                            <option key={k} value={k}>{FIELD_BY_KEY[k]?.label ?? k}</option>
                          ))
                        : CLOUD_FIELD_DEFS.map(f => (
                            <option key={f.key} value={f.key}>{f.label}</option>
                          ))
                      }
                    </select>

                    <span className="text-white/40 text-sm">→</span>

                    {/* Value selector */}
                    <select
                      value={batchValue}
                      onChange={e => { setBatchValue(e.target.value); setBatchDone(false); }}
                      className="flex-1 text-xs border border-white/20 rounded-lg px-3 py-2 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-hi-teal"
                    >
                      <option value="">— Wert wählen —</option>
                      {batchOpts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>

                    {/* Apply */}
                    <button
                      onClick={applyBatch}
                      disabled={!batchValue || batchAffectedCount === 0}
                      className="px-4 py-2 text-sm font-bold bg-hi-teal text-white rounded-lg hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      Auf {batchAffectedCount} setzen
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )
      )}

      {/* ── PLATTFORM-ZUORDNUNGEN (additiv, separat von Cloud-Feldern) ── */}
      {tab === 'liste' && platformGaps.length > 0 && (
        <div className="bg-white rounded-xl border border-violet-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-violet-50 border-b border-violet-200 flex items-center gap-3">
            <span className="text-base">🖥️</span>
            <h3 className="text-sm font-bold text-violet-900 uppercase tracking-wider">
              Offene Plattform-Zuordnungen (Worauf läuft das?)
            </h3>
            <span className="text-xs bg-violet-100 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 font-bold ml-auto">
              {platformGaps.length} Objekte
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {platformGaps.map(gap => (
              <div key={`${gap.category}-${gap.id}`} className="px-5 py-3 flex items-center gap-3">
                <div className="w-32 flex-shrink-0">
                  <div className="font-mono text-violet-600 text-xs font-bold">{gap.kuerzel}</div>
                  <div className="text-sm font-semibold text-hi-navy mt-0.5 leading-snug">{gap.name}</div>
                </div>
                <span className="text-[10px] text-hi-slate bg-hi-gray rounded px-1.5 py-0.5">
                  {CATEGORY_LABELS[gap.category] ?? gap.category}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                  gap.explicitUnklar
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-red-50 text-red-600 border-red-200'
                }`}>
                  {gap.explicitUnklar ? 'explizit Unklar' : 'noch nicht zugeordnet'}
                </span>
                <button
                  onClick={() => onEditItem(gap.id)}
                  title="Im Wizard bearbeiten"
                  className="ml-auto flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-violet-600 border border-violet-300 rounded-lg hover:bg-violet-600 hover:text-white transition-all print:hidden"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Bearbeiten
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: INTERVIEW-VORBEREITUNG ── */}
      {tab === 'interview' && (
        <div className="space-y-5 print:space-y-8">
          <div className="hidden print:block">
            <p className="text-sm text-gray-600 mb-4">Strukturierte Fragenliste zur Klärung offener Punkte.</p>
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

      {/* ── TAB: VERKNÜPFUNGEN ── */}
      {tab === 'links' && (
        <LinksTab state={state} onApplyLinks={onApplyLinks} />
      )}
    </div>
  );
};
