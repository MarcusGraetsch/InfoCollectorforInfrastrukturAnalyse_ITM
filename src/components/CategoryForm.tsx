import React, { useState, useEffect } from 'react';
import type { CategoryDef } from '../categories';
import type { AppState, CategoryKey } from '../types';
import { generateId, generateKuerzel } from '../store';
import { MultiSelect } from './MultiSelect';

interface Props {
  categoryDef: CategoryDef;
  state: AppState;
  editId: string | null;
  onSave: (item: Record<string, unknown>) => void;
  onCancel: () => void;
}

function getRefItems(state: AppState, refCategory: CategoryKey): { kuerzel: string; name: string }[] {
  const arr = state[refCategory] as { kuerzel: string; name: string }[];
  return arr || [];
}

function buildDefaultItem(def: CategoryDef, state: AppState): Record<string, unknown> {
  const obj: Record<string, unknown> = { id: generateId() };
  for (const f of def.fields) {
    if (f.type === 'multiref') obj[f.key] = [];
    else obj[f.key] = '';
  }
  obj['kuerzel'] = generateKuerzel(def.prefix, state[def.key] as { kuerzel: string }[]);
  return obj;
}

export const CategoryForm: React.FC<Props> = ({ categoryDef, state, editId, onSave, onCancel }) => {
  const [form, setForm] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (editId) {
      const existing = (state[categoryDef.key] as { id: string }[]).find((i) => i.id === editId);
      if (existing) {
        setForm({ ...(existing as Record<string, unknown>) });
        return;
      }
    }
    setForm(buildDefaultItem(categoryDef, state));
  }, [editId, categoryDef.key]);

  const handleChange = (key: string, val: unknown) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        {editId ? 'Eintrag bearbeiten' : 'Neuer Eintrag'} – {categoryDef.label}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {categoryDef.fields.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1 group relative">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
              {field.tooltip && (
                <span className="ml-2 inline-block w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-xs text-center leading-4 cursor-help relative group-hover:z-10">
                  ?
                  <span className="hidden group-hover:block absolute left-6 top-0 w-64 bg-gray-800 text-white text-xs rounded p-2 shadow-lg z-50 font-normal">
                    {field.tooltip}
                  </span>
                </span>
              )}
            </label>
            {field.type === 'text' && (
              <input
                type="text"
                value={(form[field.key] as string) || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                required={field.required}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
            {field.type === 'textarea' && (
              <textarea
                value={(form[field.key] as string) || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
            )}
            {field.type === 'select' && (
              <select
                value={(form[field.key] as string) || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- bitte wählen --</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}
            {field.type === 'multiref' && field.refCategory && (
              <MultiSelect
                value={(form[field.key] as string[]) || []}
                onChange={(val) => handleChange(field.key, val)}
                items={getRefItems(state, field.refCategory)}
                label={field.label}
              />
            )}
          </div>
        ))}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors"
          >
            Speichern
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
};
