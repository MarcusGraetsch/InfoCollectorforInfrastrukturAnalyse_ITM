import React, { useState, useEffect } from 'react';
import type { CategoryDef, FieldDef } from '../categories';
import type { AppState, CategoryKey, CIASchutzbedarf, SchutzbedarfNiveau } from '../types';
import { generateId, generateKuerzel } from '../store';
import { MultiSelect } from './MultiSelect';

const SCHUTZBEDARF_OPTS: SchutzbedarfNiveau[] = ['Normal', 'Hoch', 'Sehr hoch', 'Unklar'];

function CIATripletEditor({
  value,
  onChange,
}: {
  value: CIASchutzbedarf | SchutzbedarfNiveau | undefined;
  onChange: (v: CIASchutzbedarf) => void;
}) {
  const current: CIASchutzbedarf = (value && typeof value === 'object')
    ? value as CIASchutzbedarf
    : {
        vertraulichkeit: (value as SchutzbedarfNiveau) || '',
        integritaet: (value as SchutzbedarfNiveau) || '',
        verfuegbarkeit: (value as SchutzbedarfNiveau) || '',
      };

  const btnClass = (opt: SchutzbedarfNiveau, active: boolean) => {
    const base = 'px-2.5 py-1 text-xs font-semibold rounded border transition-all ';
    if (!active) return base + 'bg-white border-gray-200 text-gray-500 hover:border-blue-300';
    if (opt === 'Sehr hoch') return base + 'bg-red-500 text-white border-red-500';
    if (opt === 'Hoch') return base + 'bg-amber-500 text-white border-amber-500';
    if (opt === 'Normal') return base + 'bg-emerald-500 text-white border-emerald-500';
    return base + 'bg-gray-400 text-white border-gray-400';
  };

  const update = (dim: keyof Pick<CIASchutzbedarf, 'vertraulichkeit' | 'integritaet' | 'verfuegbarkeit'>, val: SchutzbedarfNiveau) => {
    onChange({ ...current, [dim]: current[dim] === val ? '' : val });
  };

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 space-y-2.5">
      <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide">CIA-Triade (BSI IT-Grundschutz)</p>
      {([
        { key: 'vertraulichkeit', label: 'Vertraulichkeit' },
        { key: 'integritaet', label: 'Integrität' },
        { key: 'verfuegbarkeit', label: 'Verfügbarkeit' },
      ] as const).map(({ key, label }) => (
        <div key={key} className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-indigo-800 w-28 font-medium">{label}</span>
          <div className="flex gap-1.5 flex-wrap">
            {SCHUTZBEDARF_OPTS.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => update(key, opt)}
                className={btnClass(opt, current[key] === opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
      {current.vererbt && (
        <p className="text-[10px] text-indigo-600 italic">Vererbt von abhängigen Anwendungen (Maximumprinzip)</p>
      )}
      <div>
        <label className="block text-[10px] text-indigo-700 mb-0.5">Begründung (optional)</label>
        <input
          type="text"
          value={current.begruendung || ''}
          onChange={e => onChange({ ...current, begruendung: e.target.value })}
          placeholder="z.B. personenbezogene Daten, Betriebsdaten, ..."
          className="w-full text-xs border border-indigo-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
      </div>
    </div>
  );
}

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

  const renderField = (field: FieldDef) => {
    // Block 4 — CIA triplet for schutzbedarf fields
    if (field.key === 'schutzbedarf' && field.group === 'cloud') {
      return (
        <div key={field.key}>
          <label className="block text-sm font-semibold text-hi-navy mb-1.5">{field.label}</label>
          <CIATripletEditor
            value={form[field.key] as CIASchutzbedarf | SchutzbedarfNiveau | undefined}
            onChange={val => handleChange(field.key, val)}
          />
        </div>
      );
    }
    return (
    <div key={field.key}>
      <label className="block text-sm font-semibold text-hi-navy mb-1.5 group relative">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
        {field.tooltip && (
          <span className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-hi-light/20 text-hi-accent text-xs cursor-help relative group-hover:z-10 font-normal border border-hi-light/30">
            ?
            <span className="hidden group-hover:block absolute left-6 top-0 w-72 bg-hi-navy text-white text-xs rounded-lg p-3 shadow-xl z-50 font-normal leading-relaxed">
              {field.tooltip}
            </span>
          </span>
        )}
      </label>
      {field.type === 'text' && field.suggestions && field.suggestions.length > 0 && (
        <>
          <input
            type="text"
            list={`dl-${field.key}`}
            value={(form[field.key] as string) || ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
            required={field.required}
            placeholder="Eingeben oder aus Liste wählen …"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hi-accent focus:border-hi-accent bg-white transition-colors"
          />
          <datalist id={`dl-${field.key}`}>
            {field.suggestions.map((s) => <option key={s} value={s} />)}
          </datalist>
        </>
      )}
      {field.type === 'text' && !field.suggestions && (
        <input
          type="text"
          value={(form[field.key] as string) || ''}
          onChange={(e) => handleChange(field.key, e.target.value)}
          required={field.required}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hi-accent focus:border-hi-accent bg-white transition-colors"
        />
      )}
      {field.type === 'textarea' && (
        <div className="space-y-2">
          {field.suggestions && field.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {field.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleChange(field.key, s)}
                  className="px-2.5 py-1 text-xs rounded-full border border-hi-accent/30 text-hi-accent bg-hi-accent/5 hover:bg-hi-accent/10 hover:border-hi-accent/60 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <textarea
            value={(form[field.key] as string) || ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hi-accent focus:border-hi-accent bg-white resize-y transition-colors"
          />
        </div>
      )}
      {field.type === 'select' && (
        <select
          value={(form[field.key] as string) || ''}
          onChange={(e) => handleChange(field.key, e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hi-accent focus:border-hi-accent bg-white transition-colors"
        >
          <option value="">— bitte wählen —</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
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
  );
  };

  const basisFields = categoryDef.fields.filter((f) => f.group !== 'cloud');
  const cloudFields = categoryDef.fields.filter((f) => f.group === 'cloud');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-hi-accent flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-hi-navy">
            {editId ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
          </h2>
          <p className="text-xs text-hi-slate">{categoryDef.label}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">{basisFields.map(renderField)}</div>

        {cloudFields.length > 0 && (
          <fieldset className="border border-sky-200 bg-gradient-to-b from-sky-50/80 to-white rounded-xl p-5 space-y-4 mt-6">
            <legend className="px-2 text-xs font-bold text-sky-800 flex items-center gap-1.5 uppercase tracking-wider">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              Cloud-Readiness — Workshop-Vorbereitung
            </legend>
            {cloudFields.map(renderField)}
          </fieldset>
        )}

        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button
            type="submit"
            className="px-6 py-2 bg-hi-accent text-white rounded-lg font-semibold text-sm hover:bg-hi-blue transition-colors shadow-sm"
          >
            Speichern
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-200 text-hi-slate rounded-lg font-semibold text-sm hover:bg-hi-gray transition-colors"
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
};
