import React, { useState, useEffect } from 'react';
import type { CategoryDef, FieldDef } from '../categories';
import { isFieldVisible } from '../categories';
import type { AppState, CategoryKey, CIASchutzbedarf, SchutzbedarfNiveau, ObjektNotiz, Beziehung } from '../types';
import { BeziehungenEditor } from './BeziehungenEditor';
import { generateId, generateKuerzel } from '../store';
import { MultiSelect } from './MultiSelect';
import { ObjektNotizen } from './ObjektNotizen';
import { TableField } from './TableField';
import { ComponentPicker } from './ComponentPicker';
import { buildCatalogAutofill } from '../utils/componentCatalog';
import { isPlatformUnassigned, RUNTIME_CATEGORIES } from '../utils/plattform';

const CATALOG_CATEGORIES = new Set([
  'anwendungen', 'server', 'clients', 'betriebssysteme',
  'netzkomponenten', 'sicherheitskomponenten', 'icsSysteme', 'iotSysteme', 'datentraeger',
]);

interface TableRow { [key: string]: string }

function parseTableValue(raw: unknown): TableRow[] {
  if (typeof raw !== 'string' || !raw) return [];
  try { return JSON.parse(raw) as TableRow[]; } catch { return []; }
}

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

/** Einklappbarer Unter-Block innerhalb einer Feldgruppe (z.B. "Technische Details"). */
const CollapsibleSection: React.FC<{ title: string; hidden?: boolean; children: React.ReactNode }> = ({ title, hidden, children }) => {
  const [open, setOpen] = useState(false);
  if (hidden) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white/60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-hi-slate uppercase tracking-wider hover:bg-gray-50 rounded-lg"
      >
        <span>{title}</span>
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-3 pb-3 pt-1 space-y-4">{children}</div>}
    </div>
  );
};

interface Props {
  categoryDef: CategoryDef;
  state: AppState;
  editId: string | null;
  onSave: (item: Record<string, unknown>) => void;
  onCancel: () => void;
  beziehungen?: Beziehung[];
  onUpdateBeziehungen?: (next: Beziehung[]) => void;
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

export const CategoryForm: React.FC<Props> = ({ categoryDef, state, editId, onSave, onCancel, beziehungen, onUpdateBeziehungen }) => {
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [showPicker, setShowPicker] = useState(false);
  const [autofillToast, setAutofillToast] = useState<string | null>(null);

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
    // Conditional visibility (showIf) — hidden fields keep their value.
    if (!isFieldVisible(field, form)) return null;
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
      {field.type === 'number' && (
        <div className="relative">
          <input
            type="number"
            value={(form[field.key] as string) || ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
            required={field.required}
            min={field.min}
            step={field.step}
            placeholder={field.placeholder}
            className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hi-accent focus:border-hi-accent bg-white transition-colors ${field.unit ? 'pr-12' : ''}`}
          />
          {field.unit && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-hi-slate pointer-events-none">{field.unit}</span>
          )}
        </div>
      )}
      {field.type === 'date' && (
        <input
          type="date"
          value={(form[field.key] as string) || ''}
          onChange={(e) => handleChange(field.key, e.target.value)}
          required={field.required}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hi-accent focus:border-hi-accent bg-white transition-colors"
        />
      )}
      {field.type === 'url' && (
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={(form[field.key] as string) || ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
            required={field.required}
            placeholder={field.placeholder || 'https://…'}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hi-accent focus:border-hi-accent bg-white transition-colors"
          />
          {(() => {
            const v = String(form[field.key] ?? '').trim();
            return /^https?:\/\//i.test(v) ? (
              <a href={v} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-xs font-semibold text-hi-accent hover:underline whitespace-nowrap">↗ öffnen</a>
            ) : null;
          })()}
        </div>
      )}
      {field.type === 'table' && (
        <TableField
          columns={field.tableColumns ?? []}
          label={field.label}
          value={parseTableValue(form[field.key])}
          onChange={(rows) => handleChange(field.key, JSON.stringify(rows))}
        />
      )}
    </div>
  );
  };

  const basisFields = categoryDef.fields.filter((f) => !f.group || f.group === 'basis');
  const plattformFields = categoryDef.fields.filter((f) => f.group === 'plattform');
  const cloudFields = categoryDef.fields.filter((f) => f.group === 'cloud');
  const hardwareFields = categoryDef.fields.filter((f) => f.group === 'hardware');
  const wirtschaftFields = categoryDef.fields.filter((f) => f.group === 'wirtschaft');

  /**
   * Rendert eine Feldgruppe und gruppiert dabei Felder mit `section` in
   * einklappbare Unterblöcke (z.B. "Technische Details"). Felder ohne section
   * werden direkt gerendert.
   */
  const renderFieldGroup = (fields: FieldDef[]): React.ReactNode => {
    const out: React.ReactNode[] = [];
    let i = 0;
    while (i < fields.length) {
      const f = fields[i];
      if (f.section) {
        const sectionName = f.section;
        const block: FieldDef[] = [];
        while (i < fields.length && fields[i].section === sectionName) {
          block.push(fields[i]);
          i++;
        }
        // Nur rendern, wenn mindestens ein Feld der Sektion aktuell sichtbar ist.
        const anyVisible = block.some((bf) => isFieldVisible(bf, form));
        out.push(
          <CollapsibleSection key={`sec-${sectionName}`} title={sectionName} hidden={!anyVisible}>
            {block.map(renderField)}
          </CollapsibleSection>
        );
      } else {
        out.push(renderField(f));
        i++;
      }
    }
    return out;
  };

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

      {CATALOG_CATEGORIES.has(categoryDef.key) && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-hi-accent/40 text-hi-accent rounded-lg text-sm font-semibold hover:bg-hi-accent/5 hover:border-hi-accent transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Aus Komponentenkatalog befüllen
          </button>
          {autofillToast && (
            <p className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
              {autofillToast}
            </p>
          )}
        </div>
      )}

      {showPicker && (
        <ComponentPicker
          categoryKey={categoryDef.key}
          onSelect={(entry, version) => {
            const { merged, filled } = buildCatalogAutofill(entry, version, categoryDef, form);
            setForm(merged);
            setShowPicker(false);
            if (filled.length > 0) {
              setAutofillToast(`${filled.length} Feld(er) befüllt: ${filled.join(', ')}`);
            } else {
              setAutofillToast('Keine passenden Felder zum Befüllen in dieser Kategorie gefunden.');
            }
            setTimeout(() => setAutofillToast(null), 6000);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">{renderFieldGroup(basisFields)}</div>

        {plattformFields.length > 0 && RUNTIME_CATEGORIES.includes(categoryDef.key) && (() => {
          const isUnklar = form.plattformTyp === 'Unklar — beim Kunden erfragen';
          const unassigned = isPlatformUnassigned(form, categoryDef.key);
          return (
            <fieldset className="border border-violet-200 bg-gradient-to-b from-violet-50/80 to-white rounded-xl p-5 space-y-4 mt-6">
              <legend className="px-2 text-xs font-bold text-violet-800 flex items-center gap-1.5 uppercase tracking-wider">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
                Plattform — Worauf läuft das?
              </legend>
              {renderFieldGroup(plattformFields)}
              {isUnklar ? (
                <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Als offener Punkt markiert — erscheint in der Offene-Punkte-Liste.
                </div>
              ) : unassigned ? (
                <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  💡 Worauf läuft dieses Objekt? Verknüpfe ein System/Betriebssystem oder wähle eine Bereitstellungsart. Unklar? → „Unklar — beim Kunden erfragen" wählen.
                </div>
              ) : null}
            </fieldset>
          );
        })()}

        {hardwareFields.length > 0 && (
          <fieldset className="border border-slate-200 bg-gradient-to-b from-slate-50/80 to-white rounded-xl p-5 space-y-4 mt-6">
            <legend className="px-2 text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
              Technik &amp; Hardware
            </legend>
            {renderFieldGroup(hardwareFields)}
          </fieldset>
        )}

        {wirtschaftFields.length > 0 && (
          <fieldset className="border border-emerald-200 bg-gradient-to-b from-emerald-50/80 to-white rounded-xl p-5 space-y-4 mt-6">
            <legend className="px-2 text-xs font-bold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Wirtschaftlichkeit &amp; Vertrag
            </legend>
            {renderFieldGroup(wirtschaftFields)}
          </fieldset>
        )}

        {cloudFields.length > 0 && (
          <fieldset className="border border-sky-200 bg-gradient-to-b from-sky-50/80 to-white rounded-xl p-5 space-y-4 mt-6">
            <legend className="px-2 text-xs font-bold text-sky-800 flex items-center gap-1.5 uppercase tracking-wider">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              Cloud-Readiness — Workshop-Vorbereitung
            </legend>
            {renderFieldGroup(cloudFields)}
          </fieldset>
        )}

        <ObjektNotizen
          notizen={(form.notizen as ObjektNotiz[]) ?? []}
          onChange={(notizen) => setForm(f => ({ ...f, notizen }))}
        />

        <fieldset className="border border-gray-200 rounded-lg p-4">
          <legend className="px-2 text-sm font-semibold text-hi-navy">Beziehungen / Abhängigkeiten</legend>
          {editId && onUpdateBeziehungen ? (
            <BeziehungenEditor
              state={state}
              beziehungen={beziehungen ?? []}
              onChange={onUpdateBeziehungen}
              fokus={{ kategorie: categoryDef.key, id: editId }}
            />
          ) : (
            <p className="text-sm text-hi-slate/60 italic">
              Verbindungen zu anderen Objekten können nach dem ersten Speichern hinzugefügt werden.
            </p>
          )}
        </fieldset>

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
