import React, { useMemo, useState } from 'react';
import type { AppState, NIS2Assessment, NIS2MassnahmeStatus, NIS2MassnahmeDetail } from '../types';
import { esc, openPrintWindow, printHeader, printFooter } from '../utils/safePrint';
import {
  NIS2_SEKTOR_GRUPPEN,
  NIS2_MASSNAHMEN,
  berechneEinstufung,
  nis2GapAmpel,
  EINSTUFUNG_INFO,
} from '../compliance/nis2';
import { NIS2_MASSNAHMEN_INFO } from '../compliance/nis2Detail';
import { roleName } from '../utils/governance';

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
  const [detailKey, setDetailKey] = useState<string | null>(null);

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

  const setDetail = (key: string, changes: Partial<NIS2MassnahmeDetail>) => {
    const cur = assessment.massnahmenDetail ?? {};
    patch({ massnahmenDetail: { ...cur, [key]: { ...(cur[key] ?? {}), ...changes } } });
  };

  const handlePrint = () => {
    const body = `${printHeader('NIS2-/BSIG-Readiness-Check', state.customerName)}
      <div style="border:2px solid #ccc;border-radius:8px;padding:12px;margin:12px 0">
        <strong>Einstufung: ${esc(info.kurz)}</strong><br>
        Sektor: ${esc(assessment.sektor || '–')} &middot; Mitarbeiter: ${esc(assessment.mitarbeiter || '–')} &middot; Umsatz: ${esc(assessment.umsatzMio || '–')} Mio. € &middot; KRITIS: ${esc(assessment.kritis || '–')}<br>
        Pflichten: ${esc(info.pflichten)}<br>
        ${info.bussgeld !== '—' ? 'Sanktionsrahmen: ' + esc(info.bussgeld) : ''}
      </div>
      <h2>Gap-Analyse Mindestmaßnahmen (Art. 21 NIS2 / §30 BSIG) — Erfüllungsgrad: ${gap.erfuellungsgrad} %</h2>
      <table><thead><tr><th>Maßnahme</th><th>Status</th><th>Reifegrad</th><th>Verantwortlich</th><th>Nachweise</th><th>Follow-up</th></tr></thead><tbody>
      ${NIS2_MASSNAHMEN.map(m => {
        const d = assessment.massnahmenDetail?.[m.key];
        const ev = (d?.evidenceIds ?? []).map(id => (state.evidenceItems ?? []).find(e => e.id === id)?.title ?? id);
        return `<tr><td>${esc(m.label)}</td><td>${esc(assessment.massnahmen[m.key] || 'Fehlend')}</td>`
          + `<td>${d?.reifegrad !== undefined ? d.reifegrad + '/4' : '—'}</td>`
          + `<td>${esc(roleName(state.roleAssignments ?? [], d?.ownerRoleId) ?? '—')}</td>`
          + `<td>${esc(ev.join(', ') || '—')}</td>`
          + `<td>${esc(d?.dueDate ?? '—')}</td></tr>`;
      }).join('')}
      </tbody></table>
      ${assessment.notizen ? `<h2>Notizen</h2><p>${esc(assessment.notizen)}</p>` : ''}
      <p style="margin-top:20px;color:#888;font-size:9px">Vereinfachte Orientierungshilfe, keine rechtsverbindliche Einstufung. Grundlage: NIS2-Richtlinie (EU) 2022/2555, BSIG (in Kraft seit 06.12.2025).</p>
      ${printFooter()}`;
    openPrintWindow(`NIS2-Readiness-Check — ${state.customerName || 'Kunde'}`, body,
      'h2{font-size:13px;margin-top:18px}');
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
            const det = assessment.massnahmenDetail?.[m.key];
            const hasDetail = !!det && (det.reifegrad !== undefined || det.ownerRoleId || (det.evidenceIds?.length ?? 0) > 0 || det.notes || det.sourceUrl || det.fileReference);
            return (
              <div key={m.key} className="flex items-start justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
                <button onClick={() => setDetailKey(m.key)} className="flex-1 min-w-0 text-left group">
                  <p className="text-sm font-medium text-gray-800 group-hover:text-hi-accent transition-colors flex items-center gap-1.5">
                    {m.label}
                    <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-hi-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </p>
                  <p className="text-xs text-gray-400">{m.hilfe}</p>
                  <p className="text-[11px] mt-0.5 flex flex-wrap gap-2">
                    <span className="text-hi-accent font-medium">Details &amp; Nachweise bearbeiten</span>
                    {det?.reifegrad !== undefined && <span className="text-gray-400">Reifegrad {det.reifegrad}/4</span>}
                    {det?.ownerRoleId && <span className="text-gray-400">· {roleName(state.roleAssignments ?? [], det.ownerRoleId)}</span>}
                    {(det?.evidenceIds?.length ?? 0) > 0 && <span className="text-emerald-600">· {det!.evidenceIds!.length} Nachweis(e)</span>}
                    {hasDetail && !det?.evidenceIds?.length && det?.reifegrad === undefined && <span className="text-gray-400">· bearbeitet</span>}
                  </p>
                </button>
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

      {detailKey && (() => {
        const m = NIS2_MASSNAHMEN.find(x => x.key === detailKey);
        if (!m) return null;
        return (
          <NIS2MassnahmeDrawer
            state={state}
            mkey={detailKey}
            label={m.label}
            status={assessment.massnahmen[detailKey] || 'Fehlend'}
            detail={assessment.massnahmenDetail?.[detailKey] ?? {}}
            onStatus={(s) => setMassnahme(detailKey, s)}
            onPatch={(ch) => setDetail(detailKey, ch)}
            onClose={() => setDetailKey(null)}
          />
        );
      })()}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Geführter Detail-Wizard je NIS2-Maßnahme (Paket 8)
// ─────────────────────────────────────────────────────────────────────────────

const WizardSection: React.FC<{ n: number; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <div className="border-b border-gray-100 pb-3 last:border-0">
    <div className="flex items-center gap-2 mb-2">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-hi-navy text-white text-[10px] font-bold flex items-center justify-center">{n}</span>
      <h3 className="text-xs font-bold text-hi-navy uppercase tracking-wide">{title}</h3>
    </div>
    {children}
  </div>
);

const NIS2MassnahmeDrawer: React.FC<{
  state: AppState;
  mkey: string;
  label: string;
  status: NIS2MassnahmeStatus;
  detail: NIS2MassnahmeDetail;
  onStatus: (s: NIS2MassnahmeStatus) => void;
  onPatch: (ch: Partial<NIS2MassnahmeDetail>) => void;
  onClose: () => void;
}> = ({ state, mkey, label, status, detail, onStatus, onPatch, onClose }) => {
  const meta = NIS2_MASSNAHMEN_INFO[mkey];

  const roles = state.roleAssignments ?? [];
  const evidence = state.evidenceItems ?? [];
  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-hi-accent';

  const suggestedEvidence = meta ? evidence.filter(e => e.seedKey && meta.evidenceSeedKeys.includes(e.seedKey)) : [];
  const suggestedRoles = meta ? roles.filter(r => r.key && meta.roleKeys.includes(r.key)) : [];

  const toggleEvidence = (id: string) => {
    const cur = detail.evidenceIds ?? [];
    onPatch({ evidenceIds: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col">
        <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-hi-navy">{label}</h2>
            <p className="text-xs text-hi-slate">NIS2-Mindestmaßnahme — geführte Bearbeitung</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-hi-slate hover:bg-gray-100 transition-colors" aria-label="Schließen">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {meta && (
            <>
              <WizardSection n={1} title="Warum wichtig?">
                <p className="text-xs text-gray-600">{meta.whyImportant}</p>
              </WizardSection>
              <WizardSection n={2} title="Normative Einordnung">
                <p className="text-xs text-gray-600">{meta.normative}</p>
              </WizardSection>
              <WizardSection n={3} title="Was muss typischerweise vorhanden sein?">
                <ul className="text-xs text-gray-600 list-disc pl-4 space-y-0.5">{meta.mussVorhanden.map((x, i) => <li key={i}>{x}</li>)}</ul>
                <div className="mt-2 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2 text-[11px] text-sky-800">{meta.appDataHint}</div>
              </WizardSection>
            </>
          )}

          <WizardSection n={4} title="Ist-Zustand">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {STATUS_OPTIONS.map(opt => (
                <button key={opt} onClick={() => onStatus(opt)} className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${status === opt ? STATUS_STYLE[opt] : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}>{opt}</button>
              ))}
            </div>
            <label className="block"><span className="text-xs font-semibold text-hi-slate">Reifegrad (0–4, optional)</span>
              <div className="flex gap-1.5 mt-1">
                {[0, 1, 2, 3, 4].map(r => (
                  <button key={r} onClick={() => onPatch({ reifegrad: detail.reifegrad === r ? undefined : r })} className={`w-8 h-8 rounded-lg text-xs font-bold border transition-colors ${detail.reifegrad === r ? 'bg-hi-navy text-white border-hi-navy' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}>{r}</button>
                ))}
              </div>
            </label>
          </WizardSection>

          <WizardSection n={5} title="Nachweise (zentral referenziert)">
            {meta && meta.beispielNachweise.length > 0 && (
              <p className="text-[11px] text-gray-500 mb-2">Beispiele: {meta.beispielNachweise.join(', ')}.</p>
            )}
            {suggestedEvidence.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Passende Nachweise im Evidence-Katalog</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedEvidence.map(e => (
                    <button key={e.id} onClick={() => toggleEvidence(e.id)} className={`px-2 py-1 rounded-full text-[11px] border transition-colors ${(detail.evidenceIds ?? []).includes(e.id) ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-white border-gray-200 text-hi-slate hover:border-hi-accent/50'}`}>{e.title}</button>
                  ))}
                </div>
              </div>
            )}
            <label className="block"><span className="text-xs font-semibold text-hi-slate">Weiteren Nachweis verknüpfen</span>
              <select className={inputCls} value="" onChange={e => { if (e.target.value) toggleEvidence(e.target.value); }}>
                <option value="">— Nachweis aus Evidence-Katalog wählen —</option>
                {evidence.filter(e => !(detail.evidenceIds ?? []).includes(e.id)).map(e => <option key={e.id} value={e.id}>{e.title}{e.seedKey ? '' : ' (eigen)'}</option>)}
              </select>
            </label>
            {(detail.evidenceIds ?? []).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(detail.evidenceIds ?? []).map(id => {
                  const e = evidence.find(x => x.id === id);
                  return <span key={id} className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700 flex items-center gap-1">{e?.title ?? id}<button onClick={() => toggleEvidence(id)} className="hover:text-red-600">×</button></span>;
                })}
              </div>
            )}
            {evidence.length === 0 && <p className="text-[10px] text-amber-600 mt-1">Noch keine Nachweise — im Tab „Evidence-Katalog" erzeugen.</p>}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <label className="block"><span className="text-xs font-semibold text-hi-slate">Interne/externe URL</span>
                <input className={inputCls} type="url" value={detail.sourceUrl ?? ''} onChange={e => onPatch({ sourceUrl: e.target.value })} placeholder="https://intranet/…" /></label>
              <label className="block"><span className="text-xs font-semibold text-hi-slate">Datei-/Dokumentverweis</span>
                <input className={inputCls} value={detail.fileReference ?? ''} onChange={e => onPatch({ fileReference: e.target.value })} placeholder="z.B. Ablage/Konzept.pdf" /></label>
            </div>
          </WizardSection>

          <WizardSection n={6} title="Verantwortliche Rolle">
            <select className={inputCls} value={detail.ownerRoleId ?? ''} onChange={e => onPatch({ ownerRoleId: e.target.value || undefined })}>
              <option value="">— Rolle wählen —</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.roleName}</option>)}
            </select>
            {suggestedRoles.length > 0 && (
              <p className="text-[11px] text-gray-500 mt-1">Vorschlag: {suggestedRoles.map(r => r.roleName).join(', ')}.</p>
            )}
            {roles.length === 0 && <p className="text-[10px] text-amber-600 mt-1">Noch keine Rollen — im Tab „ISMS-/BCM-Rollen" anlegen.</p>}
          </WizardSection>

          <WizardSection n={7} title="Workshop-Fragen & nächste Schritte">
            {meta && (
              <div className="space-y-2 mb-2">
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Im Workshop fragen</p>
                  <ul className="text-xs text-gray-600 list-disc pl-4 space-y-0.5">{meta.workshopFragen.map((q, i) => <li key={i}>{q}</li>)}</ul>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Empfohlene nächste Schritte</p>
                  <ul className="text-xs text-gray-600 list-disc pl-4 space-y-0.5">{meta.naechsteSchritte.map((q, i) => <li key={i}>{q}</li>)}</ul>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="text-xs font-semibold text-hi-slate">Fälligkeit / Follow-up</span>
                <input className={inputCls} type="date" value={detail.dueDate ?? ''} onChange={e => onPatch({ dueDate: e.target.value })} /></label>
            </div>
            <label className="block mt-2"><span className="text-xs font-semibold text-hi-slate">Notizen</span>
              <textarea className={`${inputCls} min-h-[3.5rem]`} value={detail.notes ?? ''} onChange={e => onPatch({ notes: e.target.value })} /></label>
          </WizardSection>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 text-xs font-semibold text-white bg-hi-navy rounded-lg hover:bg-hi-blue transition-colors">Fertig</button>
        </div>
      </div>
    </div>
  );
};
