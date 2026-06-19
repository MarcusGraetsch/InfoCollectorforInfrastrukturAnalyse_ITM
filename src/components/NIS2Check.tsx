import React, { useMemo } from 'react';
import type { AppState, NIS2Assessment, NIS2MassnahmeStatus } from '../types';
import {
  NIS2_SEKTOR_GRUPPEN,
  NIS2_MASSNAHMEN,
  berechneEinstufung,
  nis2GapAmpel,
  EINSTUFUNG_INFO,
} from '../compliance/nis2';

interface Props {
  state: AppState;
  assessment: NIS2Assessment;
  onUpdate: (a: NIS2Assessment) => void;
}

const FARBE_KARTE: Record<string, string> = {
  red: 'bg-red-50 border-red-300 text-red-800',
  amber: 'bg-amber-50 border-amber-300 text-amber-800',
  emerald: 'bg-emerald-50 border-emerald-300 text-emerald-800',
  gray: 'bg-gray-50 border-gray-300 text-gray-600',
};

const STATUS_OPTIONS: NIS2MassnahmeStatus[] = ['Vorhanden', 'Teilweise', 'Fehlend', 'N/A'];
const STATUS_STYLE: Record<NIS2MassnahmeStatus, string> = {
  'Vorhanden': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'Teilweise': 'bg-amber-100 text-amber-800 border-amber-300',
  'Fehlend': 'bg-red-100 text-red-700 border-red-300',
  'N/A': 'bg-gray-100 text-gray-500 border-gray-300',
};

const StepHeader: React.FC<{ n: number; title: string; hint?: string }> = ({ n, title, hint }) => (
  <div className="flex items-start gap-3 mb-3">
    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-hi-navy text-white text-xs font-bold flex items-center justify-center">{n}</span>
    <div>
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  </div>
);

export const NIS2Check: React.FC<Props> = ({ state, assessment, onUpdate }) => {
  const einstufung = useMemo(() => berechneEinstufung(assessment), [assessment]);
  const gap = useMemo(() => nis2GapAmpel(assessment.massnahmen), [assessment.massnahmen]);
  const info = EINSTUFUNG_INFO[einstufung];

  // Einstufung immer synchron halten + erstelltAm setzen
  const patch = (changes: Partial<NIS2Assessment>) => {
    const next = { ...assessment, ...changes };
    next.einstufung = berechneEinstufung(next);
    if (!next.erstelltAm) next.erstelltAm = new Date().toISOString();
    onUpdate(next);
  };

  const setMassnahme = (key: string, status: NIS2MassnahmeStatus) => {
    patch({ massnahmen: { ...assessment.massnahmen, [key]: status } });
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
    win.document.write(`<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">
      <title>NIS2-Readiness-Check — ${state.customerName || 'Kunde'}</title>
      <style>body{font-family:Arial,sans-serif;margin:32px;font-size:11px;color:#1a1a2e}h1{font-size:18px}h2{font-size:13px;margin-top:18px}table{width:100%;border-collapse:collapse}th{background:#1a1a2e;color:white;padding:6px 8px;text-align:left;font-size:10px}td{padding:6px 8px;border-bottom:1px solid #f0f0f0}.box{border:2px solid #ccc;border-radius:8px;padding:12px;margin:12px 0}</style>
      </head><body>
      <h1>NIS2-/BSIG-Readiness-Check</h1>
      <p>Kunde: <strong>${state.customerName || '–'}</strong> · Stand: ${today}</p>
      <div class="box">
        <strong>Einstufung: ${info.kurz}</strong><br>
        Sektor: ${assessment.sektor || '–'} · Mitarbeiter: ${assessment.mitarbeiter || '–'} · Umsatz: ${assessment.umsatzMio || '–'} Mio. € · KRITIS: ${assessment.kritis || '–'}<br>
        Pflichten: ${info.pflichten}<br>
        ${info.bussgeld !== '—' ? 'Sanktionsrahmen: ' + info.bussgeld : ''}
      </div>
      <h2>Gap-Analyse Mindestmaßnahmen (Art. 21 NIS2 / §30 BSIG) — Erfüllungsgrad: ${gap.erfuellungsgrad} %</h2>
      <table><thead><tr><th>Maßnahme</th><th>Status</th></tr></thead><tbody>
      ${NIS2_MASSNAHMEN.map(m => `<tr><td>${m.label}</td><td>${assessment.massnahmen[m.key] || 'Fehlend'}</td></tr>`).join('')}
      </tbody></table>
      ${assessment.notizen ? `<h2>Notizen</h2><p>${assessment.notizen}</p>` : ''}
      <p style="margin-top:20px;color:#888;font-size:9px">Vereinfachte Orientierungshilfe, keine rechtsverbindliche Einstufung. Grundlage: NIS2-Richtlinie (EU) 2022/2555, BSIG (in Kraft seit 06.12.2025).</p>
      </body></html>`);
    win.document.close();
    win.print();
  };

  const RadioGroup: React.FC<{ value: string; options: { v: string; l: string }[]; onChange: (v: string) => void }> = ({ value, options, onChange }) => (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${value === o.v ? 'bg-hi-navy text-white border-hi-navy' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-hi-navy mb-1">NIS2-/BSIG-Readiness-Check</h2>
          <p className="text-sm text-gray-500 max-w-2xl">
            Klärt in wenigen Schritten, ob das Unternehmen unter die NIS2-Pflichten fällt und welche
            Mindestmaßnahmen noch fehlen. Grundlage: NIS2-Richtlinie (EU) 2022/2555 und das deutsche
            NIS2-Umsetzungsgesetz (BSIG, in Kraft seit 06.12.2025).
          </p>
        </div>
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-hi-navy text-white rounded-lg text-sm font-medium hover:bg-hi-navy/90 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Bericht drucken
        </button>
      </div>

      {/* Schritt 1 — Sektor */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <StepHeader n={1} title="In welchem Sektor ist das Unternehmen tätig?" hint="Quelle: NIS2-Richtlinie Anhang I & II, BSIG §28" />
        <select
          value={assessment.sektor}
          onChange={e => patch({ sektor: e.target.value })}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-hi-accent outline-none"
        >
          <option value="">— Sektor wählen —</option>
          {NIS2_SEKTOR_GRUPPEN.map(g => (
            <optgroup key={g.anhang} label={g.label}>
              {g.sektoren.map(s => <option key={s} value={s}>{s}</option>)}
            </optgroup>
          ))}
          <option value="__none">Kein geregelter Sektor</option>
        </select>
      </div>

      {/* Schritt 2 — Größe */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
        <StepHeader n={2} title="Wie groß ist das Unternehmen?" hint="NIS2 gilt grundsätzlich ab mittleren Unternehmen (≥50 Mitarbeiter oder ≥10 Mio. € Umsatz)." />
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Mitarbeiterzahl</label>
          <RadioGroup value={assessment.mitarbeiter} onChange={v => patch({ mitarbeiter: v })}
            options={[{ v: '<50', l: 'unter 50' }, { v: '50-249', l: '50–249' }, { v: '≥250', l: '250 und mehr' }]} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Jahresumsatz</label>
          <RadioGroup value={assessment.umsatzMio} onChange={v => patch({ umsatzMio: v })}
            options={[{ v: '<10', l: 'unter 10 Mio. €' }, { v: '10-49', l: '10–49 Mio. €' }, { v: '≥50', l: '50 Mio. € und mehr' }]} />
        </div>
      </div>

      {/* Schritt 3 — KRITIS */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <StepHeader n={3} title="Ist das Unternehmen als kritische Anlage (KRITIS) eingestuft?" hint="Betreiber kritischer Anlagen gelten immer als besonders wichtige Einrichtung." />
        <RadioGroup value={assessment.kritis} onChange={v => patch({ kritis: v })}
          options={[{ v: 'Ja', l: 'Ja' }, { v: 'Nein', l: 'Nein' }, { v: 'Unklar', l: 'Unklar' }]} />
      </div>

      {/* Schritt 4 — Einstufung */}
      <div className={`border-2 rounded-xl p-5 ${FARBE_KARTE[info.farbe]}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-wide opacity-70">Ergebnis der Betroffenheitsprüfung</span>
        </div>
        <p className="text-xl font-bold mb-2">{info.kurz}</p>
        <p className="text-sm mb-1">{info.pflichten}</p>
        {info.bussgeld !== '—' && <p className="text-sm font-medium">{info.bussgeld}</p>}
      </div>

      {/* Schritt 5 — Gap-Analyse */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <StepHeader n={5} title="Gap-Analyse: Mindestmaßnahmen nach Art. 21 NIS2 / §30 BSIG" hint="Status je Maßnahme erfassen — daraus ergibt sich der Erfüllungsgrad." />

        {/* Ampel-Zusammenfassung */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Erfüllungsgrad</span>
              <span className="text-sm font-bold text-hi-navy">{gap.erfuellungsgrad} %</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${gap.erfuellungsgrad >= 80 ? 'bg-emerald-500' : gap.erfuellungsgrad >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${gap.erfuellungsgrad}%` }} />
            </div>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium">{gap.vorhanden} vorhanden</span>
            <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 font-medium">{gap.teilweise} teilw.</span>
            <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">{gap.fehlend} fehlend</span>
          </div>
        </div>

        <div className="space-y-2">
          {NIS2_MASSNAHMEN.map(m => {
            const status = assessment.massnahmen[m.key] || 'Fehlend';
            return (
              <div key={m.key} className="flex items-start justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{m.label}</p>
                  <p className="text-xs text-gray-400">{m.hilfe}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setMassnahme(m.key, opt)}
                      className={`px-2 py-1 rounded-md text-xs font-medium border transition-colors ${status === opt ? STATUS_STYLE[opt] : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {gap.offen > 0 && (
          <div className="mt-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <p className="text-xs text-amber-800">
              <strong>{gap.offen} Maßnahme{gap.offen !== 1 ? 'n' : ''}</strong> noch offen oder nur teilweise umgesetzt — Handlungsempfehlung: als Agenda-Punkte für das nächste Sicherheits-Meeting setzen.
            </p>
          </div>
        )}
      </div>

      {/* Notizen */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <label className="block text-xs font-medium text-gray-600 mb-2">Notizen / Annahmen zur Einstufung</label>
        <textarea
          value={assessment.notizen}
          onChange={e => patch({ notizen: e.target.value })}
          rows={3}
          placeholder="z.B. Tochtergesellschaften, Sonderfälle, offene rechtliche Fragen zur Einstufung …"
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-hi-accent outline-none resize-none"
        />
      </div>

      <p className="text-xs text-gray-400">
        ⚠️ Vereinfachte Orientierungshilfe für das Erstgespräch — keine rechtsverbindliche Einstufung. Die finale Bewertung
        sollte im Mandat unter Einbezug juristischer Expertise erfolgen.
      </p>
    </div>
  );
};
