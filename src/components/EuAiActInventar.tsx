import React, { useMemo, useState } from 'react';
import type { AppState, Anwendung } from '../types';
import {
  erkenneShadowAI,
  shadowAITreffer,
  summarizeAiInventar,
  AI_RISIKOKLASSEN,
  AI_ROLLEN,
  AI_TRAININGSDATEN,
  AI_AUFSICHT,
  AI_LOGGING,
  AI_RISIKO_ERKLAERUNG,
  AI_HOCHRISIKO_BEISPIELE,
} from '../compliance/euAiAct';

interface Props {
  state: AppState;
  onUpdateAnwendung: (id: string, changes: Partial<Anwendung>) => void;
}

const RISIKO_STYLE: Record<string, string> = {
  'Verboten': 'bg-red-100 text-red-800 border-red-300',
  'Hoch': 'bg-orange-100 text-orange-800 border-orange-300',
  'Begrenzt': 'bg-amber-100 text-amber-800 border-amber-300',
  'Minimal': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'Kein KI': 'bg-gray-100 text-gray-500 border-gray-300',
  'Unklar': 'bg-gray-100 text-gray-500 border-gray-300',
};

export const EuAiActInventar: React.FC<Props> = ({ state, onUpdateAnwendung }) => {
  const [showErklaerung, setShowErklaerung] = useState(false);
  const anwendungen = state.anwendungen;

  const shadowIds = useMemo(() => erkenneShadowAI(anwendungen), [anwendungen]);
  const kiSysteme = useMemo(() => anwendungen.filter(a => a.istKISystem), [anwendungen]);
  const summary = useMemo(() => summarizeAiInventar(anwendungen), [anwendungen]);

  const markiereAlleShadow = () => {
    shadowIds.forEach(id => onUpdateAnwendung(id, { istKISystem: true, aiRisikoklasse: 'Unklar' }));
  };

  const exportCSV = () => {
    const header = ['Kürzel', 'Name', 'Zweck/Beschreibung', 'Risikoklasse', 'Rolle', 'Trainingsdaten', 'Menschliche Aufsicht', 'Logging vorhanden', 'Notizen'];
    const rows = kiSysteme.map(a => [
      a.kuerzel, a.name, a.erlaeuterung ?? '', a.aiRisikoklasse ?? 'Unklar',
      a.aiRolle ?? 'Unklar', a.aiTrainingsdaten ?? 'Unklar',
      a.aiMenschlicheAufsicht ?? 'Unklar', a.aiLoggingVorhanden ?? 'Unklar', a.aiNotizen ?? '',
    ]);
    const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map(r => r.map(esc).join(';')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EU-AI-Act-Register_${(state.customerName || 'Kunde').replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (anwendungen.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-hi-navy mb-1">EU AI Act — KI-Inventar</h2>
        <div className="mt-8 text-center text-gray-400 py-12 border-2 border-dashed border-gray-200 rounded-xl">
          Keine Anwendungen erfasst. Bitte zuerst Anwendungen in der Infrastruktur-Analyse anlegen.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-hi-navy mb-1">EU AI Act — KI-Inventar & Shadow-AI</h2>
          <p className="text-sm text-gray-500 max-w-2xl">
            Identifiziert und klassifiziert KI-Systeme im Anwendungsbestand nach EU AI Act
            (Verordnung (EU) 2024/1689). Ein vollständiges Inventar ist Vorbedingung für das
            Risikoregister und die Art.-12-Logging-Pflichten.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowErklaerung(s => !s)} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Risikoklassen erklären
          </button>
          <button onClick={exportCSV} disabled={kiSysteme.length === 0} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${kiSysteme.length > 0 ? 'bg-hi-navy text-white hover:bg-hi-navy/90' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Register (CSV)
          </button>
        </div>
      </div>

      {showErklaerung && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3 text-sm text-blue-900">
          <p className="font-semibold">Risikoklassen nach EU AI Act</p>
          <div className="space-y-2">
            {AI_RISIKO_ERKLAERUNG.map(r => (
              <div key={r.klasse} className="flex gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border h-fit whitespace-nowrap ${RISIKO_STYLE[r.klasse]}`}>{r.klasse}</span>
                <p className="text-xs">{r.text}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-blue-200 pt-2">
            <p className="text-xs font-semibold mb-1">Typische Hochrisiko-Anwendungsfälle (Anhang III):</p>
            <p className="text-xs">{AI_HOCHRISIKO_BEISPIELE.join(' · ')}</p>
          </div>
        </div>
      )}

      {/* Shadow-AI-Banner */}
      {shadowIds.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          <div className="flex-1">
            <p className="text-sm text-amber-800 font-medium">{shadowIds.length} mögliche KI-System{shadowIds.length !== 1 ? 'e' : ''} erkannt (Shadow-AI)</p>
            <p className="text-xs text-amber-700">Name, Beschreibung oder Tags enthalten KI-Schlüsselwörter. Bitte prüfen und klassifizieren.</p>
          </div>
          <button onClick={markiereAlleShadow} className="flex-shrink-0 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 self-center">
            Alle als KI markieren
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'KI-Systeme gesamt', value: summary.gesamtKI, sub: `${anwendungen.length} Anwendungen` },
          { label: 'Hochrisiko', value: summary.hochrisiko, sub: 'strenge Pflichten', color: summary.hochrisiko > 0 ? 'text-orange-600' : '' },
          { label: 'Betreiber-Rolle', value: summary.betreiberRolle, sub: 'Art.-26-Pflichten' },
          { label: 'Ohne Logging', value: summary.ohneLogging, sub: 'Art.-12-Lücke', color: summary.ohneLogging > 0 ? 'text-red-600' : '' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
            <div className={`text-xl font-bold text-hi-navy ${kpi.color || ''}`}>{kpi.value}</div>
            <div className="text-xs font-medium text-gray-700 mt-0.5">{kpi.label}</div>
            <div className="text-xs text-gray-400">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabelle: KI-Kandidaten + erfasste KI-Systeme */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-hi-navy text-white text-xs">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium">Anwendung</th>
                <th className="px-3 py-2.5 text-left font-medium w-16">KI?</th>
                <th className="px-3 py-2.5 text-left font-medium">Risikoklasse</th>
                <th className="px-3 py-2.5 text-left font-medium">Rolle</th>
                <th className="px-3 py-2.5 text-left font-medium">Trainingsdaten</th>
                <th className="px-3 py-2.5 text-left font-medium">Aufsicht</th>
                <th className="px-3 py-2.5 text-left font-medium">Logging</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {anwendungen
                .filter(a => a.istKISystem || shadowIds.includes(a.id))
                .map(a => {
                  const treffer = !a.istKISystem ? shadowAITreffer(a) : null;
                  return (
                    <tr key={a.id} className={`hover:bg-gray-50 ${!a.istKISystem ? 'bg-amber-50/40' : ''}`}>
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-800">{a.name}</div>
                        <div className="text-xs text-gray-400 font-mono">{a.kuerzel}{treffer && <span className="ml-1 text-amber-600">· Treffer: „{treffer}"</span>}</div>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => onUpdateAnwendung(a.id, { istKISystem: !a.istKISystem })}
                          className={`w-9 h-5 rounded-full relative transition-colors ${a.istKISystem ? 'bg-hi-teal' : 'bg-gray-300'}`}
                          title={a.istKISystem ? 'Als KI-System markiert' : 'Kein KI-System'}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${a.istKISystem ? 'left-4' : 'left-0.5'}`} />
                        </button>
                      </td>
                      {a.istKISystem ? (
                        <>
                          <td className="px-2 py-1.5">
                            <select value={a.aiRisikoklasse ?? 'Unklar'} onChange={e => onUpdateAnwendung(a.id, { aiRisikoklasse: e.target.value as Anwendung['aiRisikoklasse'] })}
                              className={`text-xs border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-hi-accent ${RISIKO_STYLE[a.aiRisikoklasse ?? 'Unklar']}`}>
                              {AI_RISIKOKLASSEN.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-1.5">
                            <select value={a.aiRolle ?? 'Unklar'} onChange={e => onUpdateAnwendung(a.id, { aiRolle: e.target.value as Anwendung['aiRolle'] })}
                              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white outline-none focus:ring-1 focus:ring-hi-accent">
                              {AI_ROLLEN.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-1.5">
                            <select value={a.aiTrainingsdaten ?? 'Unklar'} onChange={e => onUpdateAnwendung(a.id, { aiTrainingsdaten: e.target.value as Anwendung['aiTrainingsdaten'] })}
                              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white outline-none focus:ring-1 focus:ring-hi-accent">
                              {AI_TRAININGSDATEN.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-1.5">
                            <select value={a.aiMenschlicheAufsicht ?? 'Unklar'} onChange={e => onUpdateAnwendung(a.id, { aiMenschlicheAufsicht: e.target.value as Anwendung['aiMenschlicheAufsicht'] })}
                              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white outline-none focus:ring-1 focus:ring-hi-accent">
                              {AI_AUFSICHT.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-1.5">
                            <select value={a.aiLoggingVorhanden ?? 'Unklar'} onChange={e => onUpdateAnwendung(a.id, { aiLoggingVorhanden: e.target.value as Anwendung['aiLoggingVorhanden'] })}
                              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white outline-none focus:ring-1 focus:ring-hi-accent">
                              {AI_LOGGING.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </td>
                        </>
                      ) : (
                        <td colSpan={5} className="px-3 py-2 text-xs text-amber-600">Als KI markieren, um zu klassifizieren →</td>
                      )}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {kiSysteme.length === 0 && shadowIds.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-6">
          Keine KI-Systeme erkannt oder markiert. Markieren Sie KI-haltige Anwendungen über die Anwendungsliste
          oder erfassen Sie sie hier, sobald die automatische Erkennung Kandidaten findet.
        </p>
      )}

      <p className="text-xs text-gray-400">
        Shadow-AI-Erkennung basiert auf Schlüsselwörtern in Name, Beschreibung und Tags — sie ersetzt keine
        vollständige Erhebung. Risikoklassifizierung im Zweifel juristisch absichern.
      </p>
    </div>
  );
};
