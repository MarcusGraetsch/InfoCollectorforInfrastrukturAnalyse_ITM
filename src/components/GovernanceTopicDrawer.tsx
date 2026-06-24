import React from 'react';
import type { GovernanceTopic, GovernanceStatus, RoleAssignment, EvidenceItem } from '../types';
import type { GovernanceTopicInfo } from '../utils/governance';

const STATUS_OPTIONS: GovernanceStatus[] = ['Offen', 'In Arbeit', 'Teilweise', 'Erfüllt', 'N/A'];
const STATUS_STYLE: Record<GovernanceStatus, string> = {
  'Offen': 'bg-gray-100 text-gray-600 border-gray-300',
  'In Arbeit': 'bg-sky-100 text-sky-700 border-sky-300',
  'Teilweise': 'bg-amber-100 text-amber-700 border-amber-300',
  'Erfüllt': 'bg-emerald-100 text-emerald-700 border-emerald-300',
  'N/A': 'bg-gray-100 text-gray-400 border-gray-300',
};

const Section: React.FC<{ n: number; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <div className="border-b border-gray-100 pb-3 last:border-0">
    <div className="flex items-center gap-2 mb-2">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-hi-navy text-white text-[10px] font-bold flex items-center justify-center">{n}</span>
      <h3 className="text-xs font-bold text-hi-navy uppercase tracking-wide">{title}</h3>
    </div>
    {children}
  </div>
);

interface Props {
  title: string;
  subtitle?: string;
  info: GovernanceTopicInfo;
  topic: GovernanceTopic;
  roles: RoleAssignment[];
  evidence: EvidenceItem[];
  /** Optionale Live-Bewertung (z.B. Dimensions-Score), zeigt, welche Daten den Score beeinflussen. */
  liveScore?: { score: number; level: string; begruendung: string[] };
  onPatch: (changes: Partial<GovernanceTopic>) => void;
  onClose: () => void;
}

export const GovernanceTopicDrawer: React.FC<Props> = ({ title, subtitle, info, topic, roles, evidence, liveScore, onPatch, onClose }) => {
  const suggestedRoles = roles.filter(r => r.key && info.roleKeys.includes(r.key));
  const suggestedEvidence = evidence.filter(e => e.seedKey && info.evidenceSeedKeys.includes(e.seedKey));
  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-hi-accent';

  const toggleRole = (id: string) => {
    const cur = topic.relatedRoleIds ?? [];
    onPatch({ relatedRoleIds: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] });
  };
  const toggleEvidence = (id: string) => {
    const cur = topic.relatedEvidenceIds ?? [];
    onPatch({ relatedEvidenceIds: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] });
  };

  const scoreColor = liveScore ? (liveScore.score >= 70 ? 'text-emerald-600' : liveScore.score >= 45 ? 'text-amber-600' : 'text-red-600') : '';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col">
        <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-hi-navy">{title}</h2>
            {subtitle && <p className="text-xs text-hi-slate">{subtitle}</p>}
          </div>
          {liveScore && (
            <div className="text-right flex-shrink-0">
              <div className={`text-2xl font-bold ${scoreColor}`}>{liveScore.score}</div>
              <div className="text-[10px] text-gray-400 uppercase">{liveScore.level}</div>
            </div>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg text-hi-slate hover:bg-gray-100 transition-colors" aria-label="Schließen">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <Section n={1} title="Warum wichtig?"><p className="text-xs text-gray-600">{info.whyImportant}</p></Section>
          <Section n={2} title="Normative / referenzielle Einordnung"><p className="text-xs text-gray-600">{info.normative}</p></Section>

          <Section n={3} title="Welche Daten beeinflussen die Bewertung?">
            {liveScore && liveScore.begruendung.length > 0 && (
              <ul className="text-xs text-gray-600 list-disc pl-4 space-y-0.5 mb-2">{liveScore.begruendung.map((b, i) => <li key={i}>{b}</li>)}</ul>
            )}
            {info.dataInfluences && info.dataInfluences.length > 0 && (
              <ul className="text-xs text-gray-500 list-disc pl-4 space-y-0.5">{info.dataInfluences.map((x, i) => <li key={i}>{x}</li>)}</ul>
            )}
            {info.appDataHint && <div className="mt-2 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2 text-[11px] text-sky-800">{info.appDataHint}</div>}
          </Section>

          {info.missingInfos && info.missingInfos.length > 0 && (
            <Section n={4} title="Welche Informationen fehlen typischerweise?">
              <ul className="text-xs text-gray-600 list-disc pl-4 space-y-0.5">{info.missingInfos.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </Section>
          )}

          {info.improvements && info.improvements.length > 0 && (
            <Section n={5} title="Welche Entscheidungen verbessern den Score?">
              <ul className="text-xs text-gray-600 list-disc pl-4 space-y-0.5">{info.improvements.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </Section>
          )}

          <Section n={6} title="Bearbeitungsstatus">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {STATUS_OPTIONS.map(opt => (
                <button key={opt} onClick={() => onPatch({ status: opt })} className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${topic.status === opt ? STATUS_STYLE[opt] : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}>{opt}</button>
              ))}
            </div>
            <span className="text-xs font-semibold text-hi-slate">Reifegrad (0–4, optional)</span>
            <div className="flex gap-1.5 mt-1">
              {[0, 1, 2, 3, 4].map(r => (
                <button key={r} onClick={() => onPatch({ maturity: topic.maturity === r ? undefined : r })} className={`w-8 h-8 rounded-lg text-xs font-bold border transition-colors ${topic.maturity === r ? 'bg-hi-navy text-white border-hi-navy' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}>{r}</button>
              ))}
            </div>
          </Section>

          <Section n={7} title="Erforderliche Nachweise (Evidence)">
            {suggestedEvidence.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Passende Nachweise</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedEvidence.map(e => (
                    <button key={e.id} onClick={() => toggleEvidence(e.id)} className={`px-2 py-1 rounded-full text-[11px] border transition-colors ${(topic.relatedEvidenceIds ?? []).includes(e.id) ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-white border-gray-200 text-hi-slate hover:border-hi-accent/50'}`}>{e.title}</button>
                  ))}
                </div>
              </div>
            )}
            <select className={inputCls} value="" onChange={e => { if (e.target.value) toggleEvidence(e.target.value); }}>
              <option value="">— Nachweis aus Evidence-Katalog verknüpfen —</option>
              {evidence.filter(e => !(topic.relatedEvidenceIds ?? []).includes(e.id)).map(e => <option key={e.id} value={e.id}>{e.title}{e.seedKey ? '' : ' (eigen)'}</option>)}
            </select>
            {(topic.relatedEvidenceIds ?? []).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(topic.relatedEvidenceIds ?? []).map(id => {
                  const e = evidence.find(x => x.id === id);
                  return <span key={id} className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700 flex items-center gap-1">{e?.title ?? id}<button onClick={() => toggleEvidence(id)} className="hover:text-red-600">×</button></span>;
                })}
              </div>
            )}
            {evidence.length === 0 && <p className="text-[10px] text-amber-600 mt-1">Noch keine Nachweise — im Tab „Evidence-Katalog" erzeugen.</p>}
          </Section>

          <Section n={8} title="Beteiligte Rollen">
            {suggestedRoles.length > 0 && <p className="text-[11px] text-gray-500 mb-1">Vorschlag: {suggestedRoles.map(r => r.roleName).join(', ')}.</p>}
            {roles.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {roles.map(r => (
                  <button key={r.id} onClick={() => toggleRole(r.id)} className={`px-2 py-1 rounded-full text-[11px] border transition-colors ${(topic.relatedRoleIds ?? []).includes(r.id) ? 'bg-hi-accent text-white border-hi-accent' : 'bg-white border-gray-200 text-hi-slate hover:border-hi-accent/50'}`}>{r.roleName}</button>
                ))}
              </div>
            ) : <p className="text-[10px] text-amber-600">Noch keine Rollen — im Tab „ISMS-/BCM-Rollen" anlegen.</p>}
          </Section>

          <Section n={9} title="Workshops / Interviews & nächste Schritte">
            <div className="space-y-2 mb-2">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Im Workshop fragen</p>
                <ul className="text-xs text-gray-600 list-disc pl-4 space-y-0.5">{info.workshopFragen.map((q, i) => <li key={i}>{q}</li>)}</ul>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Empfohlene nächste Schritte</p>
                <ul className="text-xs text-gray-600 list-disc pl-4 space-y-0.5">{info.naechsteSchritte.map((q, i) => <li key={i}>{q}</li>)}</ul>
              </div>
            </div>
            <label className="block"><span className="text-xs font-semibold text-hi-slate">Notizen</span>
              <textarea className={`${inputCls} min-h-[3.5rem]`} value={topic.notes ?? ''} onChange={e => onPatch({ notes: e.target.value })} /></label>
          </Section>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 text-xs font-semibold text-white bg-hi-navy rounded-lg hover:bg-hi-blue transition-colors">Fertig</button>
        </div>
      </div>
    </div>
  );
};
