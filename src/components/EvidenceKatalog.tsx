import React, { useMemo, useState } from 'react';
import type { AppState, EvidenceItem, EvidenceStatus, ObjectRef, CategoryKey } from '../types';
import { seedEvidenceItems, makeBlankEvidence, missingSeedCount, EVIDENCE_THEMEN } from '../compliance/evidenceCatalog';
import { evidenceProgress, roleName } from '../utils/governance';
import { openPrintWindow, esc, printHeader, printFooter } from '../utils/safePrint';

interface Props {
  state: AppState;
  onUpdate: (items: EvidenceItem[]) => void;
}

const STATUS_OPTIONS: EvidenceStatus[] = ['Offen', 'Angefragt', 'Erhalten', 'Geprüft', 'Nicht anwendbar'];
const STATUS_STYLE: Record<EvidenceStatus, string> = {
  'Offen': 'bg-gray-100 text-gray-600',
  'Angefragt': 'bg-amber-100 text-amber-700',
  'Erhalten': 'bg-sky-100 text-sky-700',
  'Geprüft': 'bg-emerald-100 text-emerald-700',
  'Nicht anwendbar': 'bg-gray-100 text-gray-400',
};

/** Linkbare Objektkategorien für relatedObjectRefs. */
const LINKABLE: { key: CategoryKey; label: string }[] = [
  { key: 'anwendungen', label: 'Anwendungen' },
  { key: 'server', label: 'Server' },
  { key: 'iktDienstleister', label: 'Provider / IKT-Dienstleister' },
];

const Pill: React.FC<{ label: string; value: React.ReactNode; total?: number; accent: string }> = ({ label, value, total, accent }) => (
  <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm flex-1 min-w-[7rem]">
    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
    <p className={`text-2xl font-bold ${accent}`}>{value}{total !== undefined && <span className="text-sm text-gray-400 font-normal"> / {total}</span>}</p>
  </div>
);

export const EvidenceKatalog: React.FC<Props> = ({ state, onUpdate }) => {
  const items = useMemo(() => state.evidenceItems ?? [], [state.evidenceItems]);
  const roles = state.roleAssignments ?? [];
  const [themaFilter, setThemaFilter] = useState<string | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<EvidenceStatus | 'all'>('all');
  const [editId, setEditId] = useState<string | null>(null);

  const progress = useMemo(() => evidenceProgress(items), [items]);
  const missing = useMemo(() => missingSeedCount(items), [items]);

  const themen = useMemo(() => {
    const set = new Set<string>(EVIDENCE_THEMEN as readonly string[]);
    items.forEach(e => (e.themen ?? []).forEach(t => set.add(t)));
    return [...set];
  }, [items]);

  const visible = useMemo(() => items.filter(e =>
    (themaFilter === 'all' || (e.themen ?? []).includes(themaFilter)) &&
    (statusFilter === 'all' || e.status === statusFilter)
  ), [items, themaFilter, statusFilter]);

  const editing = items.find(e => e.id === editId) ?? null;

  const handleSeed = () => onUpdate(seedEvidenceItems(items, state.nachweisStatus ?? {}));
  const handleAdd = () => { const n = makeBlankEvidence(); onUpdate([...items, n]); setEditId(n.id); };
  const handlePatch = (id: string, ch: Partial<EvidenceItem>) => onUpdate(items.map(e => (e.id === id ? { ...e, ...ch } : e)));
  const handleDelete = (id: string) => { onUpdate(items.filter(e => e.id !== id)); setEditId(null); };

  const emailOffene = async () => {
    const offen = items.filter(e => e.status === 'Offen' || e.status === 'Angefragt');
    const lines = [
      'Sehr geehrte Damen und Herren,', '',
      'für die Compliance-/Cloud-Bewertung benötigen wir folgende Nachweise:', '',
      ...offen.map((e, i) => `${i + 1}. ${e.title}${e.beispielNachweise ? `\n   (z.B. ${e.beispielNachweise})` : ''}${e.normativeReferences?.length ? `\n   (Bezug: ${e.normativeReferences.join(', ')})` : ''}`),
      '', 'Vielen Dank.', '', 'Mit freundlichen Grüßen',
    ];
    try { await navigator.clipboard.writeText(lines.join('\n')); alert(`E-Mail-Text mit ${offen.length} offenen Nachweisen kopiert.`); }
    catch { alert('Kopieren fehlgeschlagen.'); }
  };

  const drucken = () => {
    const objLabel = (r: ObjectRef) => {
      const arr = (state[r.kategorie] as { id: string; name?: string }[] | undefined) ?? [];
      return arr.find(o => o.id === r.id)?.name ?? r.id;
    };
    const body = items.map(e => `<tr>
      <td>${esc(e.title)}</td>
      <td>${esc(e.status)}</td>
      <td>${esc((e.themen ?? []).join(', '))}</td>
      <td>${esc(roleName(roles, e.ownerRoleId) ?? '—')}</td>
      <td>${esc((e.relatedObjectRefs ?? []).map(objLabel).join(', '))}</td>
      <td>${esc(e.normativeReferences?.join(', ') ?? '')}</td>
      <td>${esc(e.fileReference ?? e.sourceUrl ?? '')}</td>
    </tr>`).join('');
    openPrintWindow('Evidence-Mapping',
      `${printHeader('Evidence-/Nachweis-Mapping', state.customerName)}
       <table><thead><tr><th>Nachweis</th><th>Status</th><th>Themen</th><th>Verantwortlich</th><th>Objekte</th><th>Norm</th><th>Fundstelle</th></tr></thead><tbody>${body}</tbody></table>
       ${printFooter()}`);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-hi-navy mb-1">Evidence-/Nachweis-Katalog</h1>
          <p className="text-sm text-gray-500 max-w-3xl">
            Zentrale Nachweisverwaltung: Jeder Nachweis ist ein bearbeitbares Objekt, das mehreren
            Themen (DSGVO, NIS2, BSI, DORA, AI Act, C5 …), einer verantwortlichen Rolle und
            Objekten (Anwendungen, Server, Provider) zugeordnet werden kann — <strong>ein</strong>
            AVV-Nachweis deckt so z. B. Datenschutz, Lieferkette und Souveränität ab, ohne doppelt
            erfasst zu werden.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {missing > 0 && (
            <button onClick={handleSeed} className="flex items-center gap-2 px-4 py-2 bg-hi-navy text-white rounded-lg text-sm font-semibold hover:bg-hi-blue transition-colors shadow">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              {items.length === 0 ? 'Aus Standardkatalog erzeugen' : `${missing} fehlende ergänzen`}
            </button>
          )}
          <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-hi-accent text-white rounded-lg text-sm font-semibold hover:bg-hi-blue transition-colors shadow">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Eigener Nachweis
          </button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Pill label="Nachweise" value={progress.total} accent="text-hi-navy" />
        <Pill label="Offen" value={progress.offen} total={progress.total} accent="text-gray-500" />
        <Pill label="In Arbeit" value={progress.inArbeit} total={progress.total} accent="text-amber-600" />
        <Pill label="Geprüft" value={progress.geprueft} total={progress.total} accent="text-emerald-600" />
        <Pill label="N/A" value={progress.na} total={progress.total} accent="text-gray-400" />
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
          <p className="text-hi-slate font-medium">Noch keine Nachweise erfasst.</p>
          <p className="text-sm text-gray-400 mt-1">Erzeuge die Nachweise aus dem Standardkatalog (inkl. Übernahme bereits markierter Nachweise) oder lege eigene an.</p>
          <button onClick={handleSeed} className="mt-4 px-5 py-2 bg-hi-navy text-white rounded-lg text-sm font-semibold hover:bg-hi-blue transition-colors">Aus Standardkatalog erzeugen</button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1.5 mr-auto">
              <button onClick={() => setThemaFilter('all')} className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${themaFilter === 'all' ? 'bg-hi-accent text-white border-hi-accent' : 'bg-gray-50 border-gray-200 text-hi-slate hover:border-hi-accent/50'}`}>Alle Themen</button>
              {themen.map(t => {
                const count = items.filter(e => (e.themen ?? []).includes(t)).length;
                if (count === 0) return null;
                return <button key={t} onClick={() => setThemaFilter(f => (f === t ? 'all' : t))} className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${themaFilter === t ? 'bg-hi-accent text-white border-hi-accent' : 'bg-gray-50 border-gray-200 text-hi-slate hover:border-hi-accent/50'}`}>{t} · {count}</button>;
              })}
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as EvidenceStatus | 'all')} className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-hi-accent">
              <option value="all">Alle Status</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={emailOffene} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-hi-accent text-white hover:opacity-90">Offene als E-Mail</button>
            <button onClick={drucken} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 text-hi-navy hover:border-hi-navy">Mapping drucken</button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500">
                <tr className="text-left">
                  <th className="px-4 py-2 font-semibold">Nachweis</th>
                  <th className="px-4 py-2 font-semibold">Themen</th>
                  <th className="px-4 py-2 font-semibold">Verantwortlich</th>
                  <th className="px-4 py-2 font-semibold">Objekte</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(e => (
                  <tr key={e.id} onClick={() => setEditId(e.id)} className="border-t border-gray-50 hover:bg-hi-accent/5 cursor-pointer transition-colors">
                    <td className="px-4 py-2 font-medium text-hi-navy">{e.title}{!e.seedKey && <span className="ml-1.5 px-1 py-0.5 text-[9px] font-bold rounded bg-hi-accent/15 text-hi-accent align-middle">EIGEN</span>}</td>
                    <td className="px-4 py-2"><span className="flex flex-wrap gap-1">{(e.themen ?? []).map(t => <span key={t} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px]">{t}</span>)}</span></td>
                    <td className="px-4 py-2 text-hi-slate">{roleName(roles, e.ownerRoleId) ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-2 text-gray-400">{e.relatedObjectRefs?.length ? `${e.relatedObjectRefs.length} verknüpft` : '—'}</td>
                    <td className="px-4 py-2"><span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLE[e.status]}`}>{e.status}</span></td>
                  </tr>
                ))}
                {visible.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Keine Nachweise für diesen Filter.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="text-[11px] text-gray-400">
        Hinweis: Dieser interaktive Katalog ersetzt die einfache Checkboxen-Ansicht. Beim „Aus
        Standardkatalog erzeugen" werden bereits als vorhanden markierte Nachweise (Alt-Status)
        übernommen. Das JSON-Backup enthält das vollständige Evidence-Mapping.
      </p>

      {editing && (
        <EvidenceDrawer
          state={state}
          item={editing}
          onClose={() => setEditId(null)}
          onPatch={ch => handlePatch(editing.id, ch)}
          onDelete={() => handleDelete(editing.id)}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Detail-/Edit-Drawer mit Beziehungen
// ─────────────────────────────────────────────────────────────────────────────

const EvidenceDrawer: React.FC<{
  state: AppState;
  item: EvidenceItem;
  onClose: () => void;
  onPatch: (ch: Partial<EvidenceItem>) => void;
  onDelete: () => void;
}> = ({ state, item, onClose, onPatch, onDelete }) => {
  const roles = state.roleAssignments ?? [];
  const topics = state.governanceTopics ?? [];
  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-hi-accent';

  const toggleThema = (t: string) => {
    const cur = item.themen ?? [];
    onPatch({ themen: cur.includes(t) ? cur.filter(x => x !== t) : [...cur, t] });
  };
  const toggleObjRef = (kategorie: CategoryKey, id: string) => {
    const cur = item.relatedObjectRefs ?? [];
    const exists = cur.some(r => r.kategorie === kategorie && r.id === id);
    onPatch({ relatedObjectRefs: exists ? cur.filter(r => !(r.kategorie === kategorie && r.id === id)) : [...cur, { kategorie, id }] });
  };
  const toggleTopic = (id: string) => {
    const cur = item.relatedTopicIds ?? [];
    onPatch({ relatedTopicIds: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] });
  };
  const setList = (key: 'normativeReferences', raw: string) =>
    onPatch({ [key]: raw.split(',').map(s => s.trim()).filter(Boolean) } as Partial<EvidenceItem>);

  const themaPool = [...new Set([...(EVIDENCE_THEMEN as readonly string[]), ...(item.themen ?? [])])];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col">
        <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <input value={item.title} onChange={e => onPatch({ title: e.target.value })} className="w-full text-base font-bold text-hi-navy bg-transparent border-b border-transparent hover:border-gray-200 focus:border-hi-accent focus:outline-none" />
            <p className="text-xs text-hi-slate mt-0.5">{item.seedKey ? 'aus Standardkatalog' : 'eigener Nachweis'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-hi-slate hover:bg-gray-100 transition-colors" aria-label="Schließen">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <label className="block"><span className="text-xs font-semibold text-hi-slate">Warum wichtig?</span>
            <textarea className={`${inputCls} min-h-[3.5rem]`} value={item.whyImportant ?? ''} onChange={e => onPatch({ whyImportant: e.target.value })} /></label>

          <div>
            <span className="text-xs font-semibold text-hi-slate">Norm-/Themenbezug</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {themaPool.map(t => (
                <button key={t} type="button" onClick={() => toggleThema(t)} className={`px-2 py-1 rounded-full text-[11px] font-medium border transition-colors ${(item.themen ?? []).includes(t) ? 'bg-hi-accent text-white border-hi-accent' : 'bg-white border-gray-200 text-hi-slate hover:border-hi-accent/50'}`}>{t}</button>
              ))}
            </div>
          </div>

          <label className="block"><span className="text-xs font-semibold text-hi-slate">Normative Referenzen <span className="text-gray-400 font-normal">(Komma)</span></span>
            <input className={inputCls} value={(item.normativeReferences ?? []).join(', ')} onChange={e => setList('normativeReferences', e.target.value)} placeholder="DSGVO Art. 28, BSI C5" /></label>

          <label className="block"><span className="text-xs font-semibold text-hi-slate">Welche Informationen werden benötigt?</span>
            <textarea className={`${inputCls} min-h-[3rem]`} value={item.benoetigteInfos ?? ''} onChange={e => onPatch({ benoetigteInfos: e.target.value })} /></label>

          <label className="block"><span className="text-xs font-semibold text-hi-slate">Beispiel-Nachweise</span>
            <textarea className={`${inputCls} min-h-[3rem]`} value={item.beispielNachweise ?? ''} onChange={e => onPatch({ beispielNachweise: e.target.value })} /></label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-xs font-semibold text-hi-slate">Typische Quelle</span>
              <input className={inputCls} value={item.typischeQuelle ?? ''} onChange={e => onPatch({ typischeQuelle: e.target.value })} placeholder="z.B. Einkauf, DSB, Provider" /></label>
            <label className="block"><span className="text-xs font-semibold text-hi-slate">Art</span>
              <input className={inputCls} value={item.evidenceType ?? ''} onChange={e => onPatch({ evidenceType: e.target.value })} placeholder="Vertrag, Zertifikat …" /></label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-xs font-semibold text-hi-slate">Status</span>
              <select className={inputCls} value={item.status} onChange={e => onPatch({ status: e.target.value as EvidenceStatus })}>{STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select></label>
            <label className="block"><span className="text-xs font-semibold text-hi-slate">Verantwortliche Rolle</span>
              <select className={inputCls} value={item.ownerRoleId ?? ''} onChange={e => onPatch({ ownerRoleId: e.target.value || undefined })}>
                <option value="">— keine —</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.roleName}</option>)}
              </select></label>
          </div>
          {roles.length === 0 && <p className="text-[10px] text-amber-600">Noch keine Rollen erfasst — im Tab „ISMS-/BCM-Rollen" anlegen, dann hier zuweisbar.</p>}

          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-xs font-semibold text-hi-slate">Link / Intranet-URL</span>
              <input className={inputCls} type="url" value={item.sourceUrl ?? ''} onChange={e => onPatch({ sourceUrl: e.target.value })} placeholder="https://…" /></label>
            <label className="block"><span className="text-xs font-semibold text-hi-slate">Datei-/Fundstellen-Verweis</span>
              <input className={inputCls} value={item.fileReference ?? ''} onChange={e => onPatch({ fileReference: e.target.value })} placeholder="z.B. \\Ablage\AVV.pdf" /></label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-xs font-semibold text-hi-slate">Review-Datum</span>
              <input className={inputCls} type="date" value={item.reviewDate ?? ''} onChange={e => onPatch({ reviewDate: e.target.value })} /></label>
            <label className="block"><span className="text-xs font-semibold text-hi-slate">Gültig bis</span>
              <input className={inputCls} type="date" value={item.validUntil ?? ''} onChange={e => onPatch({ validUntil: e.target.value })} /></label>
          </div>

          {/* Verknüpfte Objekte */}
          <div>
            <span className="text-xs font-semibold text-hi-slate">Verknüpfte Objekte <span className="text-gray-400 font-normal">(Anwendungen / Server / Provider)</span></span>
            <div className="mt-1 space-y-2 max-h-44 overflow-y-auto rounded-lg border border-gray-100 p-2">
              {LINKABLE.map(({ key, label }) => {
                const arr = (state[key] as { id: string; name?: string }[] | undefined) ?? [];
                if (arr.length === 0) return null;
                return (
                  <div key={key}>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                    <div className="flex flex-wrap gap-1">
                      {arr.map(o => {
                        const active = (item.relatedObjectRefs ?? []).some(r => r.kategorie === key && r.id === o.id);
                        return <button key={o.id} type="button" onClick={() => toggleObjRef(key, o.id)} className={`px-1.5 py-0.5 rounded text-[11px] border transition-colors ${active ? 'bg-hi-accent text-white border-hi-accent' : 'bg-white border-gray-200 text-hi-slate hover:border-hi-accent/50'}`}>{o.name || o.id}</button>;
                      })}
                    </div>
                  </div>
                );
              })}
              {LINKABLE.every(({ key }) => ((state[key] as unknown[] | undefined) ?? []).length === 0) && (
                <p className="text-[11px] text-gray-400">Keine Anwendungen/Server/Provider erfasst.</p>
              )}
            </div>
          </div>

          {/* Verknüpfte Governance-Themen */}
          {topics.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-hi-slate">Verknüpfte Governance-Themen</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {topics.map(t => (
                  <button key={t.id} type="button" onClick={() => toggleTopic(t.id)} className={`px-2 py-1 rounded-full text-[11px] font-medium border transition-colors ${(item.relatedTopicIds ?? []).includes(t.id) ? 'bg-hi-accent text-white border-hi-accent' : 'bg-white border-gray-200 text-hi-slate hover:border-hi-accent/50'}`}>{t.title}</button>
                ))}
              </div>
            </div>
          )}

          <label className="block"><span className="text-xs font-semibold text-hi-slate">Notizen</span>
            <textarea className={`${inputCls} min-h-[3rem]`} value={item.notes ?? ''} onChange={e => onPatch({ notes: e.target.value })} /></label>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <button onClick={() => { if (confirm(`Nachweis „${item.title}" löschen?`)) onDelete(); }} className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">Löschen</button>
          <button onClick={onClose} className="px-4 py-1.5 text-xs font-semibold text-white bg-hi-navy rounded-lg hover:bg-hi-blue transition-colors">Fertig</button>
        </div>
      </div>
    </div>
  );
};
