import React, { useState } from 'react';
import type { AppState, CategoryKey, Quelldokument } from '../types';
import { CATEGORIES } from '../categories';
import { generateId } from '../store';
import { CategoryList } from './CategoryList';
import { CategoryForm } from './CategoryForm';
import { HelpPanel } from './HelpPanel';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGoToDashboard: () => void;
  onShowEmailTemplate: () => void;
}

type Step =
  | { kind: 'intro' }
  | { kind: 'documents' }
  | { kind: 'category'; category: CategoryKey }
  | { kind: 'summary' };

const STEPS: Step[] = [
  { kind: 'intro' },
  { kind: 'documents' },
  ...CATEGORIES.map((c) => ({ kind: 'category', category: c.key } as Step)),
  { kind: 'summary' },
];

const TREIBER_OPTIONS = [
  'Kostenoptimierung',
  'Skalierbarkeit / Flexibilität',
  'Ausfallsicherheit / Verfügbarkeit',
  'Modernisierung / Innovation',
  'Standort-/RZ-Konsolidierung',
  'Betrieb / Fachkräftemangel',
  'Compliance / Sicherheit',
  'Remote Work / Modern Workplace',
];

const ZIELUMGEBUNG_OPTIONS = [
  'Souverän / BSI-konform (C5, Gaia-X, DE)',
  'Microsoft Azure',
  'AWS',
  'Google Cloud',
  'Private / Hosted Cloud',
  'Provider-neutral / noch offen',
];

const ZEITHORIZONT_OPTIONS = ['< 6 Monate', '6–12 Monate', '1–2 Jahre', '> 2 Jahre', 'Noch unklar'];

export const Wizard: React.FC<Props> = ({ state, updateState, onImport, onGoToDashboard, onShowEmailTemplate }) => {
  const [stepIdx, setStepIdx] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const importRef = React.useRef<HTMLInputElement>(null);

  const step = STEPS[stepIdx];
  const progress = Math.round(((stepIdx + 1) / STEPS.length) * 100);

  const goNext = () => {
    setShowForm(false);
    setEditId(null);
    setStepIdx((i) => Math.min(STEPS.length - 1, i + 1));
  };
  const goPrev = () => {
    setShowForm(false);
    setEditId(null);
    setStepIdx((i) => Math.max(0, i - 1));
  };

  // --- Category step handlers ---
  const saveItem = (category: CategoryKey, item: Record<string, unknown>) => {
    updateState((prev) => {
      const arr = prev[category] as unknown as Record<string, unknown>[];
      const idx = arr.findIndex((i) => i['id'] === item['id']);
      const next = idx >= 0 ? arr.map((i) => (i['id'] === item['id'] ? item : i)) : [...arr, item];
      return { ...prev, [category]: next };
    });
    setShowForm(false);
    setEditId(null);
  };
  const deleteItem = (category: CategoryKey, id: string) => {
    updateState((prev) => ({
      ...prev,
      [category]: (prev[category] as { id: string }[]).filter((i) => i.id !== id),
    }));
  };

  // --- Cloud strategy (intro) ---
  const cs = state.cloudStrategy;
  const setCs = (patch: Partial<typeof cs>) =>
    updateState((prev) => ({ ...prev, cloudStrategy: { ...prev.cloudStrategy, ...patch } }));
  const toggleArr = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  // --- Documents ---
  const [docDraft, setDocDraft] = useState<Partial<Quelldokument>>({});
  const addDoc = () => {
    if (!docDraft.name) return;
    const doc: Quelldokument = {
      id: generateId(),
      name: docDraft.name || '',
      art: docDraft.art || '',
      erhaltenAm: docDraft.erhaltenAm || '',
      ausgewertet: false,
      notiz: docDraft.notiz || '',
    };
    updateState((prev) => ({ ...prev, quelldokumente: [...prev.quelldokumente, doc] }));
    setDocDraft({});
  };
  const toggleDoc = (id: string) =>
    updateState((prev) => ({
      ...prev,
      quelldokumente: prev.quelldokumente.map((d) =>
        d.id === id ? { ...d, ausgewertet: !d.ausgewertet } : d
      ),
    }));
  const removeDoc = (id: string) =>
    updateState((prev) => ({
      ...prev,
      quelldokumente: prev.quelldokumente.filter((d) => d.id !== id),
    }));

  return (
    <div className="flex flex-col h-full">
      {/* Progress */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>
            Schritt {stepIdx + 1} von {STEPS.length}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-2 bg-blue-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-5">
          {/* INTRO */}
          {step.kind === 'intro' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Willkommen zur IT-Strukturanalyse</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Dieser Assistent führt Sie systematisch durch die Erhebung vor Ort. Sie erfassen den
                  Informationsverbund nach BSI IT-Grundschutz – und legen gleichzeitig die Grundlage
                  für den späteren Cloud-Readiness-Workshop.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
                <p className="font-semibold text-blue-800 mb-1">So läuft die Erhebung ab:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    <b>Phase A – Vorhandene Unterlagen:</b> Bereits vom Kunden gelieferte Dateien
                    (Excel, Listen) importieren bzw. erfassen.
                  </li>
                  <li>
                    <b>Phase B – Interview:</b> Kategorie für Kategorie mit den zuständigen
                    Ansprechpartnern durchgehen. Zu jeder Kategorie gibt es Erklärungen und mögliche
                    Fragen.
                  </li>
                  <li>
                    <b>Auswertung:</b> Automatisches Cloud-Readiness-Scoring als Workshop-Grundlage.
                  </li>
                </ol>
              </div>

              <div className="bg-white rounded-lg shadow p-5 space-y-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  ☁️ Rahmen der späteren Cloud-Strategie
                </h3>
                <p className="text-xs text-gray-500">
                  Diese Angaben helfen, die Erhebung auf die Ziele des Kunden auszurichten. Sie können
                  später ergänzt werden.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Geschäftliches Ziel / Motivation
                  </label>
                  <textarea
                    value={cs.ziel}
                    onChange={(e) => setCs({ ziel: e.target.value })}
                    rows={2}
                    placeholder="z.B. Auflösung des eigenen Serverraums, mehr Flexibilität, DSGVO-konforme Modernisierung …"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Treiber</label>
                  <div className="flex flex-wrap gap-2">
                    {TREIBER_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setCs({ treiber: toggleArr(cs.treiber, opt) })}
                        className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                          cs.treiber.includes(opt)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bevorzugte Zielumgebung
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ZIELUMGEBUNG_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setCs({ zielumgebung: toggleArr(cs.zielumgebung, opt) })}
                        className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                          cs.zielumgebung.includes(opt)
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-sky-400'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zeithorizont</label>
                  <select
                    value={cs.zeithorizont}
                    onChange={(e) => setCs({ zeithorizont: e.target.value })}
                    className="border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- bitte wählen --</option>
                    {ZEITHORIZONT_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={onShowEmailTemplate}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-hi-accent/30 text-hi-accent text-sm font-medium hover:bg-hi-accent/5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                E-Mail-Vorlage: Unterlagen beim Kunden anfordern
              </button>
            </div>
          )}

          {/* DOCUMENTS (Phase A) */}
          {step.kind === 'documents' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Phase A – Vorhandene Unterlagen</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Hat der Kunde bereits Informationen geliefert? Importieren Sie vorhandene Excel-Daten
                  und dokumentieren Sie alle erhaltenen Unterlagen, damit nichts verloren geht.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <h3 className="font-semibold text-gray-800 mb-2">Excel-Daten importieren</h3>
                <p className="text-xs text-gray-500 mb-3">
                  Eine bestehende Strukturanalyse oder kompatible Excel-Datei (gleiche Tabellennamen)
                  kann direkt eingelesen werden. Vorhandene Einträge werden anhand des Kürzels
                  zusammengeführt.
                </p>
                <button
                  onClick={() => importRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                >
                  📥 Excel-Datei auswählen
                </button>
                <input
                  ref={importRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={onImport}
                  className="hidden"
                />
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <h3 className="font-semibold text-gray-800 mb-3">Gelieferte Unterlagen erfassen</h3>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-3">
                  <input
                    className="md:col-span-4 border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="Bezeichnung (z.B. Netzplan.pdf)"
                    value={docDraft.name || ''}
                    onChange={(e) => setDocDraft({ ...docDraft, name: e.target.value })}
                  />
                  <input
                    className="md:col-span-3 border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="Art (Excel, PDF, Visio …)"
                    value={docDraft.art || ''}
                    onChange={(e) => setDocDraft({ ...docDraft, art: e.target.value })}
                  />
                  <input
                    type="date"
                    className="md:col-span-2 border border-gray-300 rounded px-3 py-2 text-sm"
                    value={docDraft.erhaltenAm || ''}
                    onChange={(e) => setDocDraft({ ...docDraft, erhaltenAm: e.target.value })}
                  />
                  <input
                    className="md:col-span-2 border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="Notiz"
                    value={docDraft.notiz || ''}
                    onChange={(e) => setDocDraft({ ...docDraft, notiz: e.target.value })}
                  />
                  <button
                    onClick={addDoc}
                    className="md:col-span-1 px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                  >
                    +
                  </button>
                </div>

                {state.quelldokumente.length === 0 ? (
                  <p className="text-sm text-gray-400">Noch keine Unterlagen erfasst.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-y border-gray-200">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold text-gray-600">Bezeichnung</th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-600">Art</th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-600">Erhalten</th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-600">Ausgewertet</th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-600">Notiz</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {state.quelldokumente.map((d) => (
                        <tr key={d.id}>
                          <td className="px-3 py-2 text-gray-800">{d.name}</td>
                          <td className="px-3 py-2 text-gray-500">{d.art}</td>
                          <td className="px-3 py-2 text-gray-500">{d.erhaltenAm}</td>
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={d.ausgewertet}
                              onChange={() => toggleDoc(d.id)}
                              className="accent-blue-600"
                            />
                          </td>
                          <td className="px-3 py-2 text-gray-500">{d.notiz}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => removeDoc(d.id)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              Löschen
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* CATEGORY (Phase B) */}
          {step.kind === 'category' && (
            <CategoryStep
              category={step.category}
              state={state}
              showForm={showForm}
              editId={editId}
              onNew={() => {
                setEditId(null);
                setShowForm(true);
              }}
              onEdit={(id) => {
                setEditId(id);
                setShowForm(true);
              }}
              onDelete={(id) => deleteItem(step.category, id)}
              onSave={(item) => saveItem(step.category, item)}
              onCancel={() => {
                setShowForm(false);
                setEditId(null);
              }}
            />
          )}

          {/* SUMMARY */}
          {step.kind === 'summary' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Erhebung abgeschlossen 🎉</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Sie haben alle Kategorien durchlaufen. Hier ein Überblick – und der direkte Sprung in
                  die Cloud-Readiness-Auswertung.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {CATEGORIES.map((c) => {
                  const count = (state[c.key] as unknown[]).length;
                  return (
                    <div key={c.key} className="bg-white rounded-lg shadow p-3">
                      <div className="text-xs text-gray-500">{c.label}</div>
                      <div className="text-2xl font-bold text-blue-700">{count}</div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-sky-50 border border-sky-200 rounded-lg p-5 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold text-sky-800">Nächster Schritt: Cloud-Readiness</p>
                  <p className="text-sm text-gray-600">
                    Auswertung der erfassten Systeme als Grundlage für den Workshop.
                  </p>
                </div>
                <button
                  onClick={onGoToDashboard}
                  className="px-5 py-2 bg-sky-600 text-white rounded font-medium hover:bg-sky-700"
                >
                  ☁️ Zur Cloud-Readiness-Auswertung
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between">
        <button
          onClick={goPrev}
          disabled={stepIdx === 0}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Zurück
        </button>
        <span className="text-sm text-gray-400">{stepTitle(step)}</span>
        <button
          onClick={goNext}
          disabled={stepIdx === STEPS.length - 1}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Weiter →
        </button>
      </div>
    </div>
  );
};

function stepTitle(step: Step): string {
  if (step.kind === 'intro') return 'Start';
  if (step.kind === 'documents') return 'Phase A – Unterlagen';
  if (step.kind === 'summary') return 'Abschluss';
  const cat = CATEGORIES.find((c) => c.key === step.category);
  return `Phase B – ${cat?.label ?? ''}`;
}

// --- Category step sub-component ---
interface CategoryStepProps {
  category: CategoryKey;
  state: AppState;
  showForm: boolean;
  editId: string | null;
  onNew: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSave: (item: Record<string, unknown>) => void;
  onCancel: () => void;
}

const CategoryStep: React.FC<CategoryStepProps> = ({
  category,
  state,
  showForm,
  editId,
  onNew,
  onEdit,
  onDelete,
  onSave,
  onCancel,
}) => {
  const def = CATEGORIES.find((c) => c.key === category)!;
  const [helpOpen, setHelpOpen] = useState(true);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-2xl font-bold text-gray-800">{def.label}</h2>
        <button
          onClick={() => setHelpOpen((v) => !v)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {helpOpen ? 'Hilfe ausblenden' : '❓ Warum frage ich das?'}
        </button>
      </div>

      {helpOpen && <HelpPanel help={def.help} />}

      {showForm ? (
        <CategoryForm categoryDef={def} state={state} editId={editId} onSave={onSave} onCancel={onCancel} />
      ) : (
        <CategoryList
          categoryDef={def}
          state={state}
          onNew={onNew}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </div>
  );
};
