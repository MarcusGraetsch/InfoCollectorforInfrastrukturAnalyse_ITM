import { useState } from 'react';
import type { CategoryDef, FieldDef } from '../categories';
import type { AppData } from '../types';
import MultiSelect from './MultiSelect';

interface Props {
  categoryDef: CategoryDef;
  entry: Record<string, unknown>;
  data: AppData;
  onSave: (entry: Record<string, unknown>) => void;
  onCancel: () => void;
}

function getRefOptions(refCategory: string, data: AppData): { value: string; label: string }[] {
  if (refCategory === 'all_it') {
    const all = [
      ...data.server.map(e => ({ value: e.kuerzel, label: e.name })),
      ...data.clients.map(e => ({ value: e.kuerzel, label: e.name })),
      ...data.icsSysteme.map(e => ({ value: e.kuerzel, label: e.name })),
      ...data.iotSysteme.map(e => ({ value: e.kuerzel, label: e.name })),
    ];
    return all.filter(o => o.value);
  }
  const map: Record<string, { kuerzel: string; name: string }[]> = {
    geschaeftsprozesse: data.geschaeftsprozesse,
    daten: data.daten,
    anwendungen: data.anwendungen,
    datentraeger: data.datentraeger,
    server: data.server,
    netzkomponenten: data.netzkomponenten,
    netzverbindungen: data.netzverbindungen,
    clients: data.clients,
    icsSysteme: data.icsSysteme,
    iotSysteme: data.iotSysteme,
    raeume: data.raeume,
    gebaeude: data.gebaeude,
  };
  return (map[refCategory] || [])
    .filter(e => e.kuerzel)
    .map(e => ({ value: e.kuerzel, label: e.name }));
}

export default function CategoryForm({ categoryDef, entry, data, onSave, onCancel }: Props) {
  const [form, setForm] = useState<Record<string, unknown>>({ ...entry });

  const setField = (key: string, value: unknown) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const renderField = (field: FieldDef) => {
    const val = form[field.key];

    return (
      <div key={field.key} className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 group relative">
          {field.label}
          {field.tooltip && (
            <span className="ml-1 text-gray-400 cursor-help" title={field.tooltip}>ⓘ</span>
          )}
        </label>
        {field.type === 'text' && (
          <input
            type="text"
            value={String(val ?? '')}
            onChange={e => setField(field.key, e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
        {field.type === 'textarea' && (
          <textarea
            value={String(val ?? '')}
            onChange={e => setField(field.key, e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
        {field.type === 'select' && (
          <select
            value={String(val ?? '')}
            onChange={e => setField(field.key, e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">-- Bitte wählen --</option>
            {(field.options || []).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )}
        {field.type === 'multiselect' && field.refCategory && (
          <MultiSelect
            options={getRefOptions(field.refCategory, data)}
            value={Array.isArray(val) ? val as string[] : []}
            onChange={v => setField(field.key, v)}
            placeholder={`${field.label} auswählen...`}
          />
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">
        {entry.id ? 'Eintrag bearbeiten' : 'Neuer Eintrag'} — {categoryDef.label}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categoryDef.fields.map(renderField)}
      </div>
      <div className="flex gap-3 mt-6 pt-4 border-t">
        <button
          onClick={() => onSave(form)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Speichern
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}
