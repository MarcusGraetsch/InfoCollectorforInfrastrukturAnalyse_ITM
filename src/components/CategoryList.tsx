import { useState } from 'react';
import type { CategoryDef } from '../categories';
import type { AppData } from '../types';
import { generateId, generateKuerzel } from '../store';
import CategoryForm from './CategoryForm';

interface Props {
  categoryDef: CategoryDef;
  data: AppData;
  onDataChange: (data: AppData) => void;
}

function emptyEntry(categoryDef: CategoryDef, entries: Record<string, unknown>[]): Record<string, unknown> {
  const base: Record<string, unknown> = { id: '', kuerzel: '' };
  for (const field of categoryDef.fields) {
    if (field.type === 'multiselect') base[field.key] = [];
    else base[field.key] = '';
  }
  base.kuerzel = generateKuerzel(categoryDef.prefix, entries as { kuerzel: string }[]);
  return base;
}

export default function CategoryList({ categoryDef, data, onDataChange }: Props) {
  const [editEntry, setEditEntry] = useState<Record<string, unknown> | null>(null);
  const [search, setSearch] = useState('');

  const key = categoryDef.key as keyof AppData;
  const entries = (data[key] as unknown as Record<string, unknown>[]) || [];

  const filtered = entries.filter(e => {
    const q = search.toLowerCase();
    return !q || String(e.kuerzel).toLowerCase().includes(q) || String(e.name).toLowerCase().includes(q) || String(e.tags || '').toLowerCase().includes(q);
  });

  const handleNew = () => {
    setEditEntry(emptyEntry(categoryDef, entries));
  };

  const handleEdit = (entry: Record<string, unknown>) => {
    setEditEntry({ ...entry });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Eintrag wirklich löschen?')) return;
    const updated = entries.filter(e => e.id !== id);
    onDataChange({ ...data, [key]: updated });
  };

  const handleSave = (entry: Record<string, unknown>) => {
    let updated: Record<string, unknown>[];
    if (entry.id) {
      updated = entries.map(e => e.id === entry.id ? entry : e);
    } else {
      updated = [...entries, { ...entry, id: generateId() }];
    }
    onDataChange({ ...data, [key]: updated });
    setEditEntry(null);
  };

  if (editEntry) {
    return (
      <CategoryForm
        categoryDef={categoryDef}
        entry={editEntry}
        data={data}
        onSave={handleSave}
        onCancel={() => setEditEntry(null)}
      />
    );
  }

  const statusColor: Record<string, string> = {
    'Aktiv': 'bg-green-100 text-green-800',
    'Inaktiv': 'bg-gray-100 text-gray-600',
    'In Planung': 'bg-yellow-100 text-yellow-800',
    'Außer Betrieb': 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{categoryDef.icon}</span>
          <h2 className="text-xl font-semibold text-gray-800">{categoryDef.label}</h2>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">{entries.length}</span>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
        >
          + Neuer Eintrag
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Suchen nach Kürzel, Name oder Tags..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">{categoryDef.icon}</div>
          <p className="text-sm">Noch keine Einträge. Klicke auf "Neuer Eintrag" um zu beginnen.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-32">Kürzel</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-32">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-24">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(entry => (
                <tr key={String(entry.id)} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-blue-700 font-medium">{String(entry.kuerzel)}</td>
                  <td className="px-4 py-3 text-gray-800">
                    <div>{String(entry.name)}</div>
                    {entry.erlaeuterung ? (
                      <div className="text-xs text-gray-400 truncate max-w-md">{String(entry.erlaeuterung)}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {entry.status ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[String(entry.status)] || 'bg-gray-100 text-gray-600'}`}>
                        {String(entry.status) as string}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => handleDelete(String(entry.id))}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        Löschen
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
