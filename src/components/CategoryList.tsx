import React from 'react';
import type { CategoryDef } from '../categories';
import type { AppState } from '../types';

interface Props {
  categoryDef: CategoryDef;
  state: AppState;
  onNew: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const CategoryList: React.FC<Props> = ({ categoryDef, state, onNew, onEdit, onDelete }) => {
  const items = state[categoryDef.key] as { id: string; kuerzel: string; name: string; status?: string }[];

  const statusColor = (status?: string) => {
    switch (status) {
      case 'Aktiv': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'Inaktiv': return 'bg-gray-100 text-gray-600 border border-gray-200';
      case 'In Planung': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'Außer Betrieb': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-500 border border-gray-200';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-hi-navy">{categoryDef.label}</h2>
          <p className="text-sm text-hi-slate mt-0.5">{items.length} Einträge</p>
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
          <p className="text-sm text-hi-slate mt-1">Klicken Sie auf "Neuer Eintrag" um zu beginnen.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-hi-gray border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-hi-slate text-xs uppercase tracking-wider w-32">Kürzel</th>
                <th className="text-left px-4 py-3 font-semibold text-hi-slate text-xs uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-hi-slate text-xs uppercase tracking-wider w-36">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-hi-slate text-xs uppercase tracking-wider w-36">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-hi-gray/60 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-hi-accent font-bold text-xs">{item.kuerzel}</span>
                  </td>
                  <td className="px-4 py-3 text-hi-navy font-medium">{item.name}</td>
                  <td className="px-4 py-3">
                    {item.status ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(item.status)}`}>
                        {item.status}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(item.id)}
                      className="text-xs px-3 py-1 rounded-lg bg-hi-gray text-hi-accent font-semibold hover:bg-hi-accent hover:text-white transition-colors"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`"${item.name}" wirklich löschen?`)) onDelete(item.id);
                      }}
                      className="text-xs px-3 py-1 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-600 hover:text-white transition-colors border border-red-100"
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
