/**
 * Block 8 — DORA IKT-Drittparteien-Register (Art. 28 DORA)
 *
 * Register aller IKT-Dienstleister mit Risikoeinstufung nach DORA.
 */
import React, { useState } from 'react';
import type { AppState, IKTDienstleister } from '../types';

interface Props {
  state: AppState;
  onUpdate: (dienstleister: IKTDienstleister[]) => void;
}

const EMPTY_DIENSTLEISTER: Omit<IKTDienstleister, 'id'> = {
  name: '',
  art: 'Software',
  leistung: '',
  kritiisch: 'Unklar',
  land: '',
  vertragsende: '',
  sla: '',
  exitStrategie: '',
  doraKategorie: 'Standard',
  konzentrationsrisiko: 'Unklar',
  notizen: '',
};

const DORA_FARBE: Record<string, string> = {
  'Kritisch': 'bg-red-100 text-red-800 border-red-200',
  'Wichtig':  'bg-amber-100 text-amber-800 border-amber-200',
  'Standard': 'bg-gray-100 text-gray-600 border-gray-200',
};

const KONZENTRATION_FARBE: Record<string, string> = {
  'Hoch':    'text-red-700',
  'Mittel':  'text-amber-700',
  'Niedrig': 'text-green-700',
  'Unklar':  'text-gray-400',
};

function newId(): string {
  return `ikt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export const DORARegister: React.FC<Props> = ({ state, onUpdate }) => {
  const dienstleister = state.iktDienstleister ?? [];
  const [form, setForm] = useState<IKTDienstleister | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const kritischCount = dienstleister.filter(d => d.doraKategorie === 'Kritisch').length;
  const wichtigCount  = dienstleister.filter(d => d.doraKategorie === 'Wichtig').length;
  const hochKonz      = dienstleister.filter(d => d.konzentrationsrisiko === 'Hoch').length;

  const startNew = () => {
    setEditId(null);
    setForm({ id: newId(), ...EMPTY_DIENSTLEISTER });
  };

  const startEdit = (d: IKTDienstleister) => {
    setEditId(d.id);
    setForm({ ...d });
  };

  const handleSave = () => {
    if (!form) return;
    if (editId) {
      onUpdate(dienstleister.map(d => d.id === editId ? form : d));
    } else {
      onUpdate([...dienstleister, form]);
    }
    setForm(null);
    setEditId(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Eintrag wirklich löschen?')) return;
    onUpdate(dienstleister.filter(d => d.id !== id));
  };

  const set = <K extends keyof IKTDienstleister>(key: K, val: IKTDienstleister[K]) => {
    setForm(prev => prev ? { ...prev, [key]: val } : prev);
  };

  const inputCls = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-hi-accent bg-white';
  const selectCls = inputCls;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-hi-navy mb-1">DORA IKT-Drittparteien-Register (Art. 28)</h2>
          <p className="text-sm text-hi-slate">
            Register aller IKT-Dienstleister nach EU DORA (Digital Operational Resilience Act).
            Kritische Drittparteien müssen von der BaFin beaufsichtigt werden.
          </p>
        </div>
        <button
          onClick={startNew}
          className="flex items-center gap-2 px-4 py-2 bg-hi-accent text-white rounded-lg text-sm font-semibold hover:bg-hi-blue transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Dienstleister hinzufügen
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Gesamt', value: dienstleister.length, accent: 'text-hi-accent' },
          { label: 'Kritisch (DORA)', value: kritischCount, accent: 'text-red-700' },
          { label: 'Wichtig', value: wichtigCount, accent: 'text-amber-700' },
          { label: 'Konzentrationsrisiko Hoch', value: hochKonz, accent: 'text-orange-700' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="text-xs font-semibold text-hi-slate uppercase tracking-wider mb-1">{kpi.label}</div>
            <div className={`text-3xl font-bold ${kpi.accent}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-hi-navy px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-white font-bold">{editId ? 'Dienstleister bearbeiten' : 'Neuer IKT-Dienstleister'}</h3>
              <button onClick={() => setForm(null)} className="text-white/60 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-hi-slate mb-1">Name *</label>
                  <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="z.B. Microsoft Azure" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-hi-slate mb-1">Art</label>
                  <select value={form.art} onChange={e => set('art', e.target.value as IKTDienstleister['art'])} className={selectCls}>
                    {['Cloud', 'Software', 'Hardware', 'Managed Service', 'Rechenzentrum', 'Sonstiges'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-hi-slate mb-1">Leistung / Beschreibung</label>
                <input type="text" value={form.leistung} onChange={e => set('leistung', e.target.value)} className={inputCls} placeholder="z.B. Public Cloud Infrastruktur (IaaS)" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-hi-slate mb-1">DORA-Kategorie</label>
                  <select value={form.doraKategorie ?? 'Standard'} onChange={e => set('doraKategorie', e.target.value as IKTDienstleister['doraKategorie'])} className={selectCls}>
                    <option>Kritisch</option><option>Wichtig</option><option>Standard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-hi-slate mb-1">Kritisch für Betrieb</label>
                  <select value={form.kritiisch} onChange={e => set('kritiisch', e.target.value as IKTDienstleister['kritiisch'])} className={selectCls}>
                    <option>Ja</option><option>Nein</option><option>Unklar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-hi-slate mb-1">Konzentrationsrisiko</label>
                  <select value={form.konzentrationsrisiko ?? 'Unklar'} onChange={e => set('konzentrationsrisiko', e.target.value as IKTDienstleister['konzentrationsrisiko'])} className={selectCls}>
                    <option>Hoch</option><option>Mittel</option><option>Niedrig</option><option>Unklar</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-hi-slate mb-1">Land / Jurisdiktion</label>
                  <input type="text" value={form.land} onChange={e => set('land', e.target.value)} className={inputCls} placeholder="z.B. USA (Delaware)" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-hi-slate mb-1">Vertragsende</label>
                  <input type="date" value={form.vertragsende ?? ''} onChange={e => set('vertragsende', e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-hi-slate mb-1">SLA / Verfügbarkeit</label>
                  <input type="text" value={form.sla ?? ''} onChange={e => set('sla', e.target.value)} className={inputCls} placeholder="z.B. 99,9% / SLA-Tier 2" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-hi-slate mb-1">Exit-Strategie</label>
                  <input type="text" value={form.exitStrategie ?? ''} onChange={e => set('exitStrategie', e.target.value)} className={inputCls} placeholder="z.B. Migration auf Alternative in 12 Monaten" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-hi-slate mb-1">Notizen</label>
                <textarea value={form.notizen ?? ''} onChange={e => set('notizen', e.target.value)} rows={2} className={inputCls + ' resize-none'} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} className="px-5 py-2 bg-hi-accent text-white rounded-lg text-sm font-bold hover:bg-hi-blue transition-colors">Speichern</button>
                <button onClick={() => setForm(null)} className="px-5 py-2 border border-gray-200 text-hi-slate rounded-lg text-sm hover:bg-gray-50">Abbrechen</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register Table */}
      {dienstleister.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-16 text-center">
          <p className="text-gray-400">Noch keine IKT-Dienstleister erfasst.</p>
          <button onClick={startNew} className="mt-4 px-4 py-2 bg-hi-accent text-white rounded-lg text-sm font-semibold hover:bg-hi-blue">
            Ersten Dienstleister hinzufügen
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-hi-navy text-white">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-xs">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-xs">Art</th>
                  <th className="px-4 py-3 text-left font-medium text-xs">Leistung</th>
                  <th className="px-4 py-3 text-left font-medium text-xs">DORA</th>
                  <th className="px-4 py-3 text-left font-medium text-xs">Land</th>
                  <th className="px-4 py-3 text-left font-medium text-xs">Konz.-Risiko</th>
                  <th className="px-4 py-3 text-left font-medium text-xs">Vertragsende</th>
                  <th className="px-4 py-3 text-left font-medium text-xs">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dienstleister.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-hi-navy">{d.name || '–'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{d.art}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{d.leistung || '–'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${DORA_FARBE[d.doraKategorie ?? 'Standard']}`}>
                        {d.doraKategorie ?? 'Standard'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{d.land || '–'}</td>
                    <td className={`px-4 py-3 text-xs font-semibold ${KONZENTRATION_FARBE[d.konzentrationsrisiko ?? 'Unklar']}`}>
                      {d.konzentrationsrisiko ?? 'Unklar'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {d.vertragsende ? new Date(d.vertragsende).toLocaleDateString('de-DE') : '–'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(d)} className="text-xs text-hi-accent hover:text-hi-blue font-medium">Bearbeiten</button>
                        <button onClick={() => handleDelete(d.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">Löschen</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DORA Hinweis */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-blue-800 mb-1">DORA Art. 28 — Pflichten bei kritischen IKT-Drittdienstleistern</p>
        <ul className="text-xs text-blue-700 space-y-0.5 list-disc list-inside">
          <li>Vertragliche Mindestanforderungen (SLA, Prüfrechte, Datensicherheit)</li>
          <li>Konzentrationsrisiken identifizieren und bewerten</li>
          <li>Exit-Strategien für kritische Dienstleister dokumentieren</li>
          <li>Kritische Dienstleister werden von ESAs (BaFin/EBA/ESMA) direkt beaufsichtigt</li>
          <li>Anwendbar auf Finanzunternehmen ab Januar 2025</li>
        </ul>
      </div>
    </div>
  );
};
