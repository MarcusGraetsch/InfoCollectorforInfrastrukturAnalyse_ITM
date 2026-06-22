import React from 'react';
import type { CategoryDef } from '../categories';
import { isFieldVisible } from '../categories';
import type { AppState, CategoryKey } from '../types';
import { ASSESSABLE_CATEGORIES } from '../cloudReadiness';
import { getOpenCloudFieldDefs } from '../cloudFields';

interface Props {
  categoryDef: CategoryDef;
  state: AppState;
  onNew: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function getOpenCloudFields(item: Record<string, unknown>, category: CategoryKey): string[] {
  return getOpenCloudFieldDefs(item, category).map(d => d.label);
}

function getGeneralCompleteness(item: Record<string, unknown>, def: CategoryDef): { filled: number; total: number } {
  // Versteckte (showIf=false) Felder zählen nicht als "fehlend".
  const keyFields = def.fields
    .filter(f => f.type !== 'multiref' && f.key !== 'id' && f.key !== 'kuerzel' && isFieldVisible(f, item))
    .map(f => f.key);
  const filled = keyFields.filter(k => {
    const v = item[k];
    return v !== undefined && v !== '' && v !== null;
  }).length;
  return { filled, total: keyFields.length };
}

const statusColor = (status?: string) => {
  switch (status) {
    case 'Aktiv': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    case 'Inaktiv': return 'bg-gray-100 text-gray-600 border border-gray-200';
    case 'In Planung': return 'bg-amber-100 text-amber-800 border border-amber-200';
    case 'Außer Betrieb': return 'bg-red-100 text-red-800 border border-red-200';
    default: return 'bg-gray-100 text-gray-500 border border-gray-200';
  }
};

export const CategoryList: React.FC<Props> = ({ categoryDef, state, onNew, onEdit, onDelete }) => {
  const items = state[categoryDef.key] as unknown as Record<string, unknown>[];
  const isCloudCategory = (ASSESSABLE_CATEGORIES as CategoryKey[]).includes(categoryDef.key);

  const totalOpen = isCloudCategory
    ? items.reduce((sum, item) => sum + getOpenCloudFields(item, categoryDef.key).length, 0)
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-hi-navy">{categoryDef.label}</h2>
          <p className="text-sm text-hi-slate mt-0.5">
            {items.length} Einträge
            {isCloudCategory && totalOpen > 0 && (
              <span className="ml-2 text-amber-600 font-semibold">
                · {totalOpen} offene Cloud-Felder
              </span>
            )}
          </p>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2 bg-hi-accent text-white rounded-lg font-semibold text-sm hover:bg-hi-blue transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Neuer Eintrag
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-16">
          <div className="w-12 h-12 rounded-full bg-hi-gray mx-auto mb-4 flex items-center justify-center">
            <svg className="w-6 h-6 text-hi-slate" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-hi-navy font-semibold">Noch keine Einträge vorhanden.</p>
          <p className="text-sm text-hi-slate mt-1">Klicken Sie auf „Neuer Eintrag" um zu beginnen.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-hi-gray border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-hi-slate text-xs uppercase tracking-wider w-28">Kürzel</th>
                <th className="text-left px-4 py-3 font-semibold text-hi-slate text-xs uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-hi-slate text-xs uppercase tracking-wider w-28">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-hi-slate text-xs uppercase tracking-wider w-44">Vollständigkeit</th>
                <th className="text-right px-4 py-3 font-semibold text-hi-slate text-xs uppercase tracking-wider w-36">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item) => {
                const openCloud = isCloudCategory ? getOpenCloudFields(item, categoryDef.key) : [];
                const gen = getGeneralCompleteness(item, categoryDef);
                const pct = gen.total > 0 ? Math.round((gen.filled / gen.total) * 100) : 100;

                return (
                  <tr key={item['id'] as string} className="hover:bg-hi-gray/60 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-hi-accent font-bold text-xs">{item['kuerzel'] as string}</span>
                    </td>
                    <td className="px-4 py-3 text-hi-navy font-medium">{item['name'] as string}</td>
                    <td className="px-4 py-3">
                      {item['status'] ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(item['status'] as string)}`}>
                          {item['status'] as string}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {isCloudCategory ? (
                        openCloud.length === 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Vollständig
                          </span>
                        ) : (
                          <span
                            title={openCloud.join(', ')}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full cursor-help"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                            {openCloud.length} Feld{openCloud.length !== 1 ? 'er' : ''} offen
                          </span>
                        )
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[80px] bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${pct === 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-hi-slate">{pct}%</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEdit(item['id'] as string)}
                          className="text-xs px-3 py-1 rounded-lg bg-hi-gray text-hi-accent font-semibold hover:bg-hi-accent hover:text-white transition-colors"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`„${item['name']}" wirklich löschen?`)) onDelete(item['id'] as string);
                          }}
                          className="text-xs px-3 py-1 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-600 hover:text-white transition-colors border border-red-100"
                        >
                          Löschen
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
