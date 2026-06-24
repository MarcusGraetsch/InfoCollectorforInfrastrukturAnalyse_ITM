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
  countOffeneKlaerung,
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
  const [openId, setOpenId] = useState<string | null>(null);
  const anwendungen = state.anwendungen;
  const openAnwendung = anwendungen.find(a => a.id === openId) ?? null;

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
                  const offeneKlaerung = a.istKISystem ? countOffeneKlaerung(a) : 0;
                  return (
                    <tr key={a.id} className={`hover:bg-gray-50 ${!a.istKISystem ? 'bg-amber-50/40' : ''}`}>
                      <td className="px-3 py-2">
                        <button onClick={() => setOpenId(a.id)} className="text-left group">
                          <div className="font-medium text-gray-800 group-hover:text-hi-accent transition-colors flex items-center gap-1">
                            {a.name}
                            <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-hi-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                          </div>
                          <div className="text-xs text-gray-400 font-mono">{a.kuerzel}{treffer && <span className="ml-1 text-amber-600">· Treffer: „{treffer}"</span>}</div>
                          <div className="text-[11px] mt-0.5 flex items-center gap-2">
                            <span className="text-hi-accent font-medium">Klärung öffnen</span>
                            {offeneKlaerung > 0 && <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">{offeneKlaerung} offen</span>}
                          </div>
                        </button>
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

      {openAnwendung && (
        <EuAiActDrawer
          a={openAnwendung}
          erkannt={shadowAITreffer(openAnwendung)}
          evidence={state.evidenceItems ?? []}
          onPatch={(changes) => onUpdateAnwendung(openAnwendung.id, changes)}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Geführter Klärungs-Wizard je KI-System / Shadow-AI-Kandidat (Paket 7)
// ─────────────────────────────────────────────────────────────────────────────

const Sect: React.FC<{ n: number; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <div className="border-b border-gray-100 pb-3 last:border-0">
    <div className="flex items-center gap-2 mb-2">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-hi-navy text-white text-[10px] font-bold flex items-center justify-center">{n}</span>
      <h3 className="text-xs font-bold text-hi-navy uppercase tracking-wide">{title}</h3>
    </div>
    {children}
  </div>
);

const EuAiActDrawer: React.FC<{
  a: Anwendung;
  erkannt: string | null;
  evidence: import('../types').EvidenceItem[];
  onPatch: (changes: Partial<Anwendung>) => void;
  onClose: () => void;
}> = ({ a, erkannt, evidence, onPatch, onClose }) => {
  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-hi-accent';
  const sel = (val: string | undefined, opts: readonly string[], onCh: (v: string) => void) => (
    <select className={inputCls} value={val ?? 'Unklar'} onChange={e => onCh(e.target.value)}>
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
  const toggleEvidence = (id: string) => {
    const cur = a.aiEvidenceIds ?? [];
    onPatch({ aiEvidenceIds: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col">
        <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-hi-navy">{a.name}</h2>
            <p className="text-xs text-hi-slate">EU AI Act — geführte Klärung · {a.kuerzel}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-hi-slate hover:bg-gray-100 transition-colors" aria-label="Schließen">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <Sect n={1} title="Warum als KI-relevant erkannt?">
            {erkannt
              ? <p className="text-xs text-amber-700">Automatischer Treffer auf Schlüsselwort: „{erkannt}" (in Name/Beschreibung/Tags). Bitte fachlich bestätigen.</p>
              : <p className="text-xs text-gray-600">Manuell als KI-System markiert.</p>}
            <label className="flex items-center gap-2 mt-2">
              <input type="checkbox" checked={!!a.istKISystem} onChange={e => onPatch({ istKISystem: e.target.checked })} className="rounded border-gray-300 text-hi-accent focus:ring-hi-accent" />
              <span className="text-xs font-semibold text-hi-slate">Ist ein KI-System (EU AI Act relevant)</span>
            </label>
          </Sect>

          <Sect n={2} title="Einstufung & Rolle der Organisation">
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="text-xs font-semibold text-hi-slate">Risikoklasse</span>
                {sel(a.aiRisikoklasse, AI_RISIKOKLASSEN, v => onPatch({ aiRisikoklasse: v as Anwendung['aiRisikoklasse'] }))}</label>
              <label className="block"><span className="text-xs font-semibold text-hi-slate">Rolle der Organisation</span>
                {sel(a.aiRolle, AI_ROLLEN, v => onPatch({ aiRolle: v as Anwendung['aiRolle'] }))}</label>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Rolle nach EU AI Act: Anbieter, Betreiber, Importeur, Händler, Nutzer (oder Beides/Unklar).</p>
          </Sect>

          <Sect n={3} title="Zweck & Daten">
            <label className="block"><span className="text-xs font-semibold text-hi-slate">Zweck des Systems</span>
              <textarea className={`${inputCls} min-h-[3rem]`} value={a.aiZweck ?? ''} onChange={e => onPatch({ aiZweck: e.target.value })} placeholder="Wozu wird das KI-System eingesetzt?" /></label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <label className="block"><span className="text-xs font-semibold text-hi-slate">Datenarten</span>
                <input className={inputCls} value={a.aiDatenarten ?? ''} onChange={e => onPatch({ aiDatenarten: e.target.value })} placeholder="z.B. Texte, Bilder, Logs" /></label>
              <label className="block"><span className="text-xs font-semibold text-hi-slate">Personenbezug</span>
                {sel(a.aiPersonenbezug, ['Ja', 'Nein', 'Unklar'], v => onPatch({ aiPersonenbezug: v as Anwendung['aiPersonenbezug'] }))}</label>
              <label className="block"><span className="text-xs font-semibold text-hi-slate">Trainingsdaten</span>
                {sel(a.aiTrainingsdaten, AI_TRAININGSDATEN, v => onPatch({ aiTrainingsdaten: v as Anwendung['aiTrainingsdaten'] }))}</label>
            </div>
          </Sect>

          <Sect n={4} title="Aufsicht, Logging & Dokumentation">
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="text-xs font-semibold text-hi-slate">Menschliche Aufsicht</span>
                {sel(a.aiMenschlicheAufsicht, AI_AUFSICHT, v => onPatch({ aiMenschlicheAufsicht: v as Anwendung['aiMenschlicheAufsicht'] }))}</label>
              <label className="block"><span className="text-xs font-semibold text-hi-slate">Logging vorhanden</span>
                {sel(a.aiLoggingVorhanden, AI_LOGGING, v => onPatch({ aiLoggingVorhanden: v as Anwendung['aiLoggingVorhanden'] }))}</label>
              <label className="block"><span className="text-xs font-semibold text-hi-slate">Technische Dokumentation</span>
                {sel(a.aiDokumentation, ['Vorhanden', 'Teilweise', 'Fehlt', 'Unklar'], v => onPatch({ aiDokumentation: v as Anwendung['aiDokumentation'] }))}</label>
            </div>
          </Sect>

          <Sect n={5} title="Modell, Anbieter & Betriebsort">
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="text-xs font-semibold text-hi-slate">Modell-/Versionsinfo</span>
                <input className={inputCls} value={a.aiModellInfo ?? ''} onChange={e => onPatch({ aiModellInfo: e.target.value })} placeholder="z.B. GPT-4o, Llama 3" /></label>
              <label className="block"><span className="text-xs font-semibold text-hi-slate">Drittanbieter / Provider</span>
                <input className={inputCls} value={a.aiDrittanbieter ?? ''} onChange={e => onPatch({ aiDrittanbieter: e.target.value })} placeholder="z.B. OpenAI, Aleph Alpha" /></label>
              <label className="block"><span className="text-xs font-semibold text-hi-slate">Hersteller/Anbieter</span>
                <input className={inputCls} value={a.hersteller ?? ''} onChange={e => onPatch({ hersteller: e.target.value })} placeholder="(gemeinsames Feld)" /></label>
              <label className="block"><span className="text-xs font-semibold text-hi-slate">Betriebsort / Cloud-Service</span>
                <input className={inputCls} value={a.cloudDienst ?? ''} onChange={e => onPatch({ cloudDienst: e.target.value })} placeholder="(gemeinsames Feld)" /></label>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Hersteller und Betriebsort nutzen die vorhandenen Anwendungsfelder — keine Doppelerfassung.</p>
          </Sect>

          <Sect n={6} title="Nachweise (Evidence)">
            {evidence.length > 0 ? (
              <>
                <select className={inputCls} value="" onChange={e => { if (e.target.value) toggleEvidence(e.target.value); }}>
                  <option value="">— Nachweis aus Evidence-Katalog verknüpfen —</option>
                  {evidence.filter(e => !(a.aiEvidenceIds ?? []).includes(e.id)).map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
                {(a.aiEvidenceIds ?? []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(a.aiEvidenceIds ?? []).map(id => {
                      const e = evidence.find(x => x.id === id);
                      return <span key={id} className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700 flex items-center gap-1">{e?.title ?? id}<button onClick={() => toggleEvidence(id)} className="hover:text-red-600">×</button></span>;
                    })}
                  </div>
                )}
              </>
            ) : <p className="text-[10px] text-amber-600">Noch keine Nachweise — im Tab „Evidence-Katalog" erzeugen (z.B. AIC4, ISO 42001, KI-Logging).</p>}
          </Sect>

          <Sect n={7} title="Offene Fragen & nächster Klärungsschritt">
            <label className="block"><span className="text-xs font-semibold text-hi-slate">Offene Fragen</span>
              <textarea className={`${inputCls} min-h-[3rem]`} value={a.aiOffeneFragen ?? ''} onChange={e => onPatch({ aiOffeneFragen: e.target.value })} /></label>
            <label className="block mt-2"><span className="text-xs font-semibold text-hi-slate">Nächster Klärungsschritt</span>
              <input className={inputCls} value={a.aiNaechsterSchritt ?? ''} onChange={e => onPatch({ aiNaechsterSchritt: e.target.value })} placeholder="z.B. Risikoklasse mit Fachbereich klären" /></label>
            <label className="block mt-2"><span className="text-xs font-semibold text-hi-slate">Notizen</span>
              <textarea className={`${inputCls} min-h-[3rem]`} value={a.aiNotizen ?? ''} onChange={e => onPatch({ aiNotizen: e.target.value })} /></label>
          </Sect>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 text-xs font-semibold text-white bg-hi-navy rounded-lg hover:bg-hi-blue transition-colors">Fertig</button>
        </div>
      </div>
    </div>
  );
};
