import React, { useState, useMemo } from 'react';
import type { AppState, CategoryKey } from '../types';
import type { CloudFields } from '../types';
import { assessAll } from '../cloudReadiness';
import { assess } from '../cloudReadiness';
import { OPEN_CLOUD_KEYS, CLOUD_FIELD_OPTIONS, CLOUD_EIGNUNG_OPTIONS, isOpenField } from '../cloudFields';

interface ItemToReview {
  id: string;
  kuerzel: string;
  name: string;
  category: CategoryKey;
  categoryLabel: string;
  fields: CloudFields;
}

interface EditableMeta {
  name: string;
  kuerzel: string;
  category: CategoryKey;
}

function hasOpenFields(item: CloudFields): boolean {
  return OPEN_CLOUD_KEYS.some(k => isOpenField(item[k]));
}

interface Props {
  state: AppState;
  onSave: (category: CategoryKey, id: string, fields: CloudFields, meta: EditableMeta) => void;
  onClose: () => void;
  startId?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  anwendungen: 'Anwendung',
  server: 'Server',
  clients: 'Client',
  icsSysteme: 'ICS-System',
  iotSysteme: 'IoT-System',
};

const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS) as CategoryKey[];

const SCHUTZBEDARF_OPTS = CLOUD_FIELD_OPTIONS.schutzbedarf;
const BEREITSTELLUNG_OPTS = CLOUD_FIELD_OPTIONS.bereitstellung;
const LIZENZ_OPTS = CLOUD_FIELD_OPTIONS.lizenzCloudfaehig;
const KOMPL_OPTS = CLOUD_FIELD_OPTIONS.migrationskomplexitaet;
const LEBENSZYKLUS_OPTS = CLOUD_FIELD_OPTIONS.lebenszyklus;
const INTERNET_OPTS = CLOUD_FIELD_OPTIONS.internetfaehig;
const SOUV_OPTS = CLOUD_FIELD_OPTIONS.datensouveraenitaet;
const EIGNUNG_OPTS = CLOUD_EIGNUNG_OPTIONS;

function QuickButton({
  label,
  active,
  onClick,
  color = 'blue',
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: 'blue' | 'amber' | 'red' | 'green' | 'purple' | 'gray';
}) {
  const colors = {
    blue: active
      ? 'bg-hi-accent text-white border-hi-accent'
      : 'bg-white text-hi-navy border-gray-200 hover:border-hi-accent hover:text-hi-accent',
    amber: active
      ? 'bg-amber-500 text-white border-amber-500'
      : 'bg-white text-amber-700 border-amber-200 hover:border-amber-400',
    red: active
      ? 'bg-red-500 text-white border-red-500'
      : 'bg-white text-red-600 border-red-200 hover:border-red-400',
    green: active
      ? 'bg-emerald-600 text-white border-emerald-600'
      : 'bg-white text-emerald-700 border-emerald-200 hover:border-emerald-500',
    purple: active
      ? 'bg-purple-600 text-white border-purple-600'
      : 'bg-white text-purple-700 border-purple-200 hover:border-purple-500',
    gray: active
      ? 'bg-gray-500 text-white border-gray-500'
      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400',
  };
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${colors[color]}`}
    >
      {label}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-hi-slate uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function ScorePreview({ fields, category }: { fields: CloudFields; category: CategoryKey }) {
  const result = assess(fields, category);
  if (result.level === 'Unbewertet') return null;
  const color =
    result.level === 'Hoch'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : result.level === 'Mittel'
      ? 'bg-amber-100 text-amber-800 border-amber-200'
      : 'bg-red-100 text-red-700 border-red-200';
  const barColor =
    result.level === 'Hoch' ? 'bg-emerald-500' : result.level === 'Mittel' ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${result.score}%` }} />
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${color}`}>
          {result.score} · {result.level}
        </span>
      </div>
      <div className="text-xs font-semibold text-hi-navy">→ {result.empfehlung}</div>
      {result.begruendung.length > 0 && (
        <ul className="text-xs text-hi-slate space-y-0.5">
          {result.begruendung.map((b, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="text-hi-accent mt-0.5">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const CloudReadinessWizard: React.FC<Props> = ({ state, onSave, onClose, startId }) => {
  // Snapshot items ONCE on mount — do not re-derive from state while the wizard
  // is open, otherwise saved items drop out of the list and the index breaks.
  const [items] = useState<ItemToReview[]>(() => {
    const allAssessed = assessAll(state);
    const list = allAssessed
      .filter(i => hasOpenFields(i))
      .map(i => ({
        id: i.id,
        kuerzel: i.kuerzel,
        name: i.name,
        category: i.category,
        categoryLabel: CATEGORY_LABELS[i.category] ?? i.category,
        fields: {
          schutzbedarf: i.schutzbedarf || 'Unklar',
          datensouveraenitaet: i.datensouveraenitaet || 'Unklar',
          bereitstellung: i.bereitstellung || 'Unklar',
          cloudDienst: i.cloudDienst,
          lizenzCloudfaehig: i.lizenzCloudfaehig || 'Unklar',
          migrationskomplexitaet: i.migrationskomplexitaet || 'Unklar',
          lebenszyklus: i.lebenszyklus || 'Unklar',
          lebenszyklusDatum: i.lebenszyklusDatum,
          internetfaehig: i.internetfaehig || 'Unklar',
          cloudEignung: i.cloudEignung,
          cloudNotiz: i.cloudNotiz,
        },
      }));
    if (startId) {
      const idx = list.findIndex(i => i.id === startId);
      if (idx > 0) {
        // Move the target item to the front so it's shown first
        const [target] = list.splice(idx, 1);
        list.unshift(target);
      }
    }
    return list;
  });

  const consultantName = localStorage.getItem('consultant-name') ?? '';

  const [index, setIndex] = useState(0);
  const [fields, setFields] = useState<CloudFields>(() => items[0]?.fields ?? {});
  const [meta, setMeta] = useState<EditableMeta>(() => ({
    name: items[0]?.name ?? '',
    kuerzel: items[0]?.kuerzel ?? '',
    category: items[0]?.category ?? 'anwendungen',
  }));
  const [newNote, setNewNote] = useState('');
  const [vierAugenName, setVierAugenName] = useState('');
  const [copySourceId, setCopySourceId] = useState('');

  const total = items.length;
  const item = items[index];

  // Same-category items with at least one filled (non-Unklar) cloud field
  const copySourceCandidates = useMemo(() => {
    const cat = item?.category;
    if (!cat) return [];
    const arr = state[cat] as unknown as (CloudFields & { id: string; name: string; kuerzel: string })[];
    return arr.filter(i => {
      if (i.id === item?.id) return false;
      return OPEN_CLOUD_KEYS.some(k => i[k] && i[k] !== 'Unklar');
    });
  }, [state, item]);

  if (!item) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-hi-navy mb-2">Alle Objekte bewertet!</h2>
          <p className="text-sm text-hi-slate mb-6">
            Die Cloud-Readiness-Auswertung ist jetzt vollständig.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-hi-accent text-white rounded-lg text-sm font-bold hover:bg-hi-blue transition-colors"
          >
            Zur Auswertung
          </button>
        </div>
      </div>
    );
  }

  const set = (key: keyof CloudFields, val: string) =>
    setFields(prev => ({ ...prev, [key]: prev[key] === val ? '' : val }));

  const advanceTo = (next: number) => {
    setIndex(next);
    setFields(items[next]?.fields ?? {});
    setMeta({
      name: items[next]?.name ?? '',
      kuerzel: items[next]?.kuerzel ?? '',
      category: items[next]?.category ?? 'anwendungen',
    });
    setNewNote('');
    setVierAugenName('');
    setCopySourceId('');
  };

  const buildTaggedNote = (base: string): string => {
    const now = new Date();
    const datum = now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const autor = consultantName || 'Unbekannt';
    const parts: string[] = [];
    if (newNote.trim()) {
      parts.push(`[${autor} · ${datum}]\n${newNote.trim()}`);
    }
    if (vierAugenName.trim()) {
      parts.push(`[4-Augen-Bestätigung: ${vierAugenName.trim()} · ${datum}]\nSchutzbedarf, Cloudfähigkeit und Migrationsstrategie geprüft und bestätigt.`);
    }
    if (parts.length === 0) return base;
    return [...parts, ...(base ? [base] : [])].join('\n\n');
  };

  const handleCopyFrom = (sourceId: string) => {
    if (!sourceId) return;
    const cat = item?.category;
    if (!cat) return;
    const arr = state[cat] as unknown as (CloudFields & { id: string })[];
    const source = arr.find(i => i.id === sourceId);
    if (!source) return;
    setFields(prev => {
      const next = { ...prev };
      for (const k of OPEN_CLOUD_KEYS) {
        const v = source[k] as string | undefined;
        if (v && v !== 'Unklar') next[k] = v as never;
      }
      return next;
    });
    setCopySourceId('');
  };

  const handleSaveNext = () => {
    const finalFields = { ...fields, cloudNotiz: buildTaggedNote(fields.cloudNotiz ?? '') };
    onSave(item.category, item.id, finalFields, meta);
    advanceTo(index + 1);
  };

  const handleSkip = () => {
    advanceTo(index + 1);
  };

  const progress = Math.round((index / total) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-hi-navy px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-white font-bold text-base">Cloud-Readiness erfassen</h2>
              <p className="text-white/60 text-xs mt-0.5">
                {index + 1} von {total} Objekten · {total - index - 1} verbleibend
              </p>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="bg-white/20 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-hi-teal h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Editable item header */}
        <div className="px-6 py-3 bg-hi-gray border-b border-gray-200 flex-shrink-0">
          <div className="flex items-start gap-3 flex-wrap">
            {/* Kürzel */}
            <div className="flex-shrink-0">
              <label className="block text-[10px] font-semibold text-hi-slate uppercase tracking-wide mb-0.5">Kürzel</label>
              <input
                type="text"
                value={meta.kuerzel}
                onChange={e => setMeta(prev => ({ ...prev, kuerzel: e.target.value }))}
                className="font-mono text-hi-accent text-sm font-bold bg-white border border-gray-200 rounded px-2 py-1 w-24 focus:outline-none focus:ring-2 focus:ring-hi-accent"
              />
            </div>
            {/* Name */}
            <div className="flex-1 min-w-[160px]">
              <label className="block text-[10px] font-semibold text-hi-slate uppercase tracking-wide mb-0.5">Name</label>
              <input
                type="text"
                value={meta.name}
                onChange={e => setMeta(prev => ({ ...prev, name: e.target.value }))}
                className="w-full text-sm font-semibold text-hi-navy bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-hi-accent"
              />
            </div>
            {/* Kategorie */}
            <div className="flex-shrink-0">
              <label className="block text-[10px] font-semibold text-hi-slate uppercase tracking-wide mb-0.5">Kategorie</label>
              <select
                value={meta.category}
                onChange={e => setMeta(prev => ({ ...prev, category: e.target.value as CategoryKey }))}
                className="text-xs text-hi-navy bg-white border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-hi-accent"
              >
                {CATEGORY_KEYS.map(k => (
                  <option key={k} value={k}>{CATEGORY_LABELS[k]}</option>
                ))}
              </select>
            </div>
          </div>
          {(meta.name !== item.name || meta.kuerzel !== item.kuerzel || meta.category !== item.category) && (
            <p className="text-[10px] text-amber-600 mt-1.5 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Änderungen werden mit gespeichert · Original: {item.kuerzel} · {item.name} · {CATEGORY_LABELS[item.category] ?? item.category}
            </p>
          )}
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          <Field label="Schutzbedarf">
            <div className="flex gap-2 flex-wrap">
              {SCHUTZBEDARF_OPTS.map(o => (
                <QuickButton
                  key={o}
                  label={o}
                  active={fields.schutzbedarf === o}
                  onClick={() => set('schutzbedarf', o)}
                  color={o === 'Normal' ? 'green' : o === 'Hoch' ? 'amber' : o === 'Sehr hoch' ? 'red' : 'gray'}
                />
              ))}
            </div>
          </Field>

          <Field label="Aktuelle Bereitstellung">
            <div className="flex gap-2 flex-wrap">
              {BEREITSTELLUNG_OPTS.map(o => (
                <QuickButton key={o} label={o} active={fields.bereitstellung === o} onClick={() => set('bereitstellung', o)} />
              ))}
            </div>
          </Field>

          {meta.category === 'anwendungen' && (
            <Field label="Lizenz cloudfähig?">
              <div className="flex gap-2">
                {LIZENZ_OPTS.map(o => (
                  <QuickButton
                    key={o}
                    label={o}
                    active={fields.lizenzCloudfaehig === o}
                    onClick={() => set('lizenzCloudfaehig', o)}
                    color={o === 'Ja' ? 'green' : o === 'Nein' ? 'red' : 'amber'}
                  />
                ))}
              </div>
            </Field>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Migrationskomplexität">
              <div className="flex gap-2 flex-wrap">
                {KOMPL_OPTS.map(o => (
                  <QuickButton
                    key={o}
                    label={o}
                    active={fields.migrationskomplexitaet === o}
                    onClick={() => set('migrationskomplexitaet', o)}
                    color={o === 'Niedrig' ? 'green' : o === 'Hoch' ? 'red' : o === 'Unklar' ? 'gray' : 'amber'}
                  />
                ))}
              </div>
            </Field>

            <Field label="Lebenszyklus-Status">
              <div className="flex gap-2 flex-wrap">
                {LEBENSZYKLUS_OPTS.map(o => (
                  <QuickButton
                    key={o}
                    label={o}
                    active={fields.lebenszyklus === o}
                    onClick={() => set('lebenszyklus', o)}
                    color={o === 'Aktuell' ? 'green' : o === 'End-of-Life' ? 'red' : o === 'Unklar' ? 'gray' : 'amber'}
                  />
                ))}
              </div>
              {(fields.lebenszyklus === 'Wartung läuft aus' || fields.lebenszyklus === 'End-of-Life') && (
                <div className="mt-2 flex items-center gap-2">
                  <label className="text-xs text-hi-slate whitespace-nowrap">Datum:</label>
                  <input
                    type="date"
                    value={fields.lebenszyklusDatum || ''}
                    onChange={e => set('lebenszyklusDatum', e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-hi-accent"
                  />
                </div>
              )}
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Internet-/Cloudfähig?">
              <div className="flex gap-2 flex-wrap">
                {INTERNET_OPTS.map(o => (
                  <QuickButton
                    key={o}
                    label={o}
                    active={fields.internetfaehig === o}
                    onClick={() => set('internetfaehig', o)}
                    color={o === 'Ja' ? 'green' : o === 'Nein' ? 'red' : o === 'Unklar' ? 'gray' : 'amber'}
                  />
                ))}
              </div>
            </Field>

            <Field label="Datensouveränität">
              <div className="flex gap-2 flex-wrap">
                {SOUV_OPTS.map(o => (
                  <QuickButton
                    key={o}
                    label={o}
                    active={fields.datensouveraenitaet === o}
                    onClick={() => set('datensouveraenitaet', o)}
                    color={o === 'Unklar' ? 'gray' : o === 'Keine spezielle Anforderung' ? 'green' : o === 'Streng souverän (C5 / Gaia-X)' || o === 'Confidential Computing (TEE / Enclave)' ? 'purple' : 'amber'}
                  />
                ))}
              </div>
            </Field>
          </div>

          <Field label="Migrationsstrategie">
            <div className="flex gap-2 flex-wrap">
              {EIGNUNG_OPTS.map(o => (
                <QuickButton key={o} label={o} active={fields.cloudEignung === o} onClick={() => set('cloudEignung', o)} color="purple" />
              ))}
            </div>
          </Field>

          {fields.cloudNotiz && (
            <Field label="Bisherige Notizen">
              <div className="text-xs text-hi-slate bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 whitespace-pre-wrap max-h-28 overflow-y-auto">
                {fields.cloudNotiz}
              </div>
            </Field>
          )}

          <Field label={`Neue Notiz${consultantName ? ` (${consultantName})` : ''}`}>
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              rows={2}
              placeholder="Besonderheiten, offene Fragen, nächste Schritte…"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-hi-navy focus:outline-none focus:ring-2 focus:ring-hi-accent resize-none"
            />
            {!consultantName && (
              <p className="text-[11px] text-amber-600 mt-1">
                Tipp: Geben Sie Ihren Namen im Header-Feld „Berater" ein, damit Notizen automatisch signiert werden.
              </p>
            )}
          </Field>

          <Field label="Vier-Augen-Bestätigung (optional)">
            <input
              type="text"
              value={vierAugenName}
              onChange={e => setVierAugenName(e.target.value)}
              placeholder="Name des prüfenden Beraters…"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-hi-accent"
            />
            <p className="text-[11px] text-hi-slate mt-1">
              Bestätigt Schutzbedarf, Cloudfähigkeit und Migrationsstrategie — wird als signierte Notiz gespeichert.
            </p>
          </Field>

          {copySourceCandidates.length > 0 && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 flex items-center gap-3">
              <svg className="w-4 h-4 text-hi-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-semibold text-hi-navy mb-1">Von ähnlichem Item übernehmen</label>
                <select
                  value={copySourceId}
                  onChange={e => setCopySourceId(e.target.value)}
                  className="text-xs border border-blue-200 rounded-lg px-2 py-1.5 bg-white text-hi-navy focus:outline-none focus:ring-2 focus:ring-hi-accent w-full"
                >
                  <option value="">— Quelle wählen —</option>
                  {copySourceCandidates.map(c => (
                    <option key={c.id} value={c.id}>{c.kuerzel} · {c.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => handleCopyFrom(copySourceId)}
                disabled={!copySourceId}
                className="flex-shrink-0 px-3 py-1.5 text-xs font-bold bg-hi-accent text-white rounded-lg hover:bg-hi-blue transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Übernehmen
              </button>
            </div>
          )}

          <ScorePreview fields={fields} category={meta.category} />

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleSkip}
            className="text-xs text-hi-slate hover:text-hi-navy transition-colors"
          >
            Überspringen
          </button>
          <div className="ml-auto flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-hi-slate hover:text-hi-navy transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSaveNext}
              className="px-5 py-2 text-sm font-bold bg-hi-accent text-white rounded-lg hover:bg-hi-blue transition-colors flex items-center gap-2"
            >
              Speichern
              {index + 1 < total && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
