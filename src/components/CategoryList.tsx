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
      case 'Aktiv': return 'bg-green-100 text-green-800';
      case 'Inaktiv': return 'bg-gray-100 text-gray-600';
      case 'In Planung': return 'bg-yellow-100 text-yellow-800';
      case 'Außer Betrieb': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">{categoryDef.label}</h2>
        <button
          onClick={onNew}
          className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>+</span> Neuer Eintrag
        </button>
      </div>
      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-lg">Noch keine Einträge vorhanden.</p>
          <p className="text-sm mt-2">Klicken Sie auf "Neuer Eintrag" um zu beginnen.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 w-32">Kürzel</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 w-36">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 w-32">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-blue-700 font-medium">{item.kuerzel}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-800">{item.name}</td>
                  <td className="px-4 py-3">
                    {item.status && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(item.status)}`}>
                        {item.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onEdit(item.id)}
                      className="text-blue-600 hover:text-blue-800 font-medium mr-3"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`"${item.name}" wirklich löschen?`)) onDelete(item.id);
                      }}
                      className="text-red-500 hover:text-red-700 font-medium"
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
