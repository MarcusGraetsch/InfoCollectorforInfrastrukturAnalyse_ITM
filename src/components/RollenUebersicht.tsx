import React, { useMemo, useState } from 'react';
import type { RoleAssignment, RoleRelevance, RoleAssignmentStatus } from '../types';
import {
  ROLE_CATALOG, ROLE_RELEVANCE_LABEL, seedRoleAssignments, roleProgress, makeId,
} from '../utils/governance';

interface Props {
  roles: RoleAssignment[];
  onUpdate: (roles: RoleAssignment[]) => void;
}

const RELEVANCE_ORDER: RoleRelevance[] = ['isms', 'bcm', 'nis2', 'cloudGovernance', 'datenschutz', 'empfohlen'];

const STATUS_OPTIONS: RoleAssignmentStatus[] = ['Offen', 'Benannt', 'Vertretung offen', 'Vollständig', 'N/A'];

const STATUS_STYLE: Record<RoleAssignmentStatus, string> = {
  'Offen': 'bg-gray-100 text-gray-600',
  'Benannt': 'bg-sky-100 text-sky-700',
  'Vertretung offen': 'bg-amber-100 text-amber-700',
  'Vollständig': 'bg-emerald-100 text-emerald-700',
  'N/A': 'bg-gray-100 text-gray-400',
};

const RELEVANCE_STYLE: Record<RoleRelevance, string> = {
  isms: 'bg-indigo-100 text-indigo-700',
  bcm: 'bg-rose-100 text-rose-700',
  nis2: 'bg-amber-100 text-amber-700',
  cloudGovernance: 'bg-sky-100 text-sky-700',
  datenschutz: 'bg-emerald-100 text-emerald-700',
  empfohlen: 'bg-gray-100 text-gray-500',
};

const ProgressPill: React.FC<{ label: string; value: number; total: number; accent: string }> = ({ label, value, total, accent }) => (
  <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm flex-1 min-w-[8rem]">
    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
    <p className={`text-2xl font-bold ${accent}`}>{value}<span className="text-sm text-gray-400 font-normal"> / {total}</span></p>
  </div>
);

export const RollenUebersicht: React.FC<Props> = ({ roles, onUpdate }) => {
  const [filter, setFilter] = useState<RoleRelevance | 'all'>('all');
  const [editId, setEditId] = useState<string | null>(null);

  const progress = useMemo(() => roleProgress(roles), [roles]);
  const missingFromCatalog = useMemo(() => {
    const haveKeys = new Set(roles.map(r => r.key).filter(Boolean));
    return ROLE_CATALOG.filter(c => !haveKeys.has(c.key)).length;
  }, [roles]);

  const visible = useMemo(
    () => filter === 'all' ? roles : roles.filter(r => r.relevanz.includes(filter)),
    [roles, filter]
  );

  const editing = roles.find(r => r.id === editId) ?? null;

  const handleSeed = () => onUpdate(seedRoleAssignments(roles));

  const handleAddCustom = () => {
    const neu: RoleAssignment = { id: makeId('role'), roleName: 'Neue Rolle', relevanz: ['empfohlen'], status: 'Offen' };
    onUpdate([...roles, neu]);
    setEditId(neu.id);
  };

  const handlePatch = (id: string, changes: Partial<RoleAssignment>) =>
    onUpdate(roles.map(r => (r.id === id ? { ...r, ...changes } : r)));

  const handleDelete = (id: string) => {
    onUpdate(roles.filter(r => r.id !== id));
    setEditId(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-hi-navy mb-1">ISMS-/BCM-Rollen & Verantwortlichkeiten</h1>
          <p className="text-sm text-gray-500 max-w-3xl">
            Klar benannte Rollen sind Grundlage für IT-Grundschutz-/ISO-27001-Zertifizierungsfähigkeit
            und NIS2. Diese Übersicht hält fest, welche Rolle erforderlich/empfohlen ist, wer benannt
            wurde, Stellvertretung, Organisationseinheit und Nachweis (Bestellungsdokument). Die
            <span className="font-semibold"> relevanz</span>-Marker zeigen, für welchen Rahmen eine
            Rolle typischerweise relevant ist — nicht jede Rolle ist in jeder Organisation formal
            identisch vorgeschrieben.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {missingFromCatalog > 0 && (
            <button
              onClick={handleSeed}
              className="flex items-center gap-2 px-4 py-2 bg-hi-navy text-white rounded-lg text-sm font-semibold hover:bg-hi-blue transition-colors shadow"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              {roles.length === 0 ? '20 Standardrollen anlegen' : `${missingFromCatalog} fehlende Rollen ergänzen`}
            </button>
          )}
          <button
            onClick={handleAddCustom}
            className="flex items-center gap-2 px-4 py-2 bg-hi-accent text-white rounded-lg text-sm font-semibold hover:bg-hi-blue transition-colors shadow"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Eigene Rolle
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-3 flex-wrap">
        <ProgressPill label="Rollen erfasst" value={progress.total} total={ROLE_CATALOG.length} accent="text-hi-navy" />
        <ProgressPill label="Benannt" value={progress.benannt} total={progress.total} accent="text-sky-600" />
        <ProgressPill label="Mit Stellvertretung" value={progress.mitVertretung} total={progress.total} accent="text-amber-600" />
        <ProgressPill label="Mit Nachweis" value={progress.mitNachweis} total={progress.total} accent="text-emerald-600" />
      </div>

      {roles.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
          <p className="text-hi-slate font-medium">Noch keine Rollen erfasst.</p>
          <p className="text-sm text-gray-400 mt-1">
            Lege die <strong>20 Standardrollen</strong> aus dem ISMS-/BCM-/NIS2-Katalog an und
            ergänze sie um Personen, Stellvertretung und Nachweise.
          </p>
          <button onClick={handleSeed} className="mt-4 px-5 py-2 bg-hi-navy text-white rounded-lg text-sm font-semibold hover:bg-hi-blue transition-colors">
            20 Standardrollen anlegen
          </button>
        </div>
      ) : (
        <>
          {/* Filter */}
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${filter === 'all' ? 'bg-hi-accent text-white border-hi-accent' : 'bg-gray-50 border-gray-200 text-hi-slate hover:border-hi-accent/50'}`}
            >
              Alle · {roles.length}
            </button>
            {RELEVANCE_ORDER.map(rel => {
              const count = roles.filter(r => r.relevanz.includes(rel)).length;
              if (count === 0) return null;
              return (
                <button
                  key={rel}
                  onClick={() => setFilter(f => (f === rel ? 'all' : rel))}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${filter === rel ? 'bg-hi-accent text-white border-hi-accent' : 'bg-gray-50 border-gray-200 text-hi-slate hover:border-hi-accent/50'}`}
                >
                  {ROLE_RELEVANCE_LABEL[rel]} · {count}
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500">
                  <tr className="text-left">
                    <th className="px-4 py-2 font-semibold">Rolle</th>
                    <th className="px-4 py-2 font-semibold">Benannt (Person)</th>
                    <th className="px-4 py-2 font-semibold">Stellvertretung</th>
                    <th className="px-4 py-2 font-semibold">Org.-Einheit</th>
                    <th className="px-4 py-2 font-semibold">Relevanz</th>
                    <th className="px-4 py-2 font-semibold">Status</th>
                    <th className="px-4 py-2 font-semibold">Nachweis</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(r => (
                    <tr key={r.id} onClick={() => setEditId(r.id)} className="border-t border-gray-50 hover:bg-hi-accent/5 cursor-pointer transition-colors">
                      <td className="px-4 py-2 font-medium text-hi-navy">{r.roleName}{!r.key && <span className="ml-1.5 px-1 py-0.5 text-[9px] font-bold rounded bg-hi-accent/15 text-hi-accent align-middle">EIGEN</span>}</td>
                      <td className="px-4 py-2 text-hi-slate">{r.personName || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-2 text-hi-slate">{r.deputy || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-2 text-hi-slate">{r.orgUnit || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-2">
                        <span className="flex flex-wrap gap-1">
                          {r.relevanz.map(rel => <span key={rel} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${RELEVANCE_STYLE[rel]}`}>{ROLE_RELEVANCE_LABEL[rel]}</span>)}
                        </span>
                      </td>
                      <td className="px-4 py-2"><span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLE[r.status ?? 'Offen']}`}>{r.status ?? 'Offen'}</span></td>
                      <td className="px-4 py-2 text-center">{(r.bestellungsdokument?.trim() || (r.evidenceIds && r.evidenceIds.length > 0)) ? '✓' : <span className="text-gray-300">—</span>}</td>
                    </tr>
                  ))}
                  {visible.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Keine Rollen für diesen Filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <p className="text-[11px] text-gray-400">
        Normativer Bezug: BSI-Standard 200-2 (ISMS-Rollen), 200-4 (BCM/Krisenstab), Art. 20/21 NIS2
        bzw. §§30/38 BSIG, ISO/IEC 27001. Die Angaben sind orientierend; die konkrete Ausgestaltung
        hängt von Größe und Struktur der Organisation ab.
      </p>

      {editing && (
        <RoleDetailDrawer
          role={editing}
          onClose={() => setEditId(null)}
          onPatch={(changes) => handlePatch(editing.id, changes)}
          onDelete={() => handleDelete(editing.id)}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Detail-/Edit-Drawer
// ─────────────────────────────────────────────────────────────────────────────

const RoleDetailDrawer: React.FC<{
  role: RoleAssignment;
  onClose: () => void;
  onPatch: (changes: Partial<RoleAssignment>) => void;
  onDelete: () => void;
}> = ({ role, onClose, onPatch, onDelete }) => {
  const catalogEntry = ROLE_CATALOG.find(c => c.key === role.key);
  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-hi-accent';
  const toggleRel = (rel: RoleRelevance) => {
    const has = role.relevanz.includes(rel);
    onPatch({ relevanz: has ? role.relevanz.filter(x => x !== rel) : [...role.relevanz, rel] });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col">
        <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <input
              value={role.roleName}
              onChange={e => onPatch({ roleName: e.target.value })}
              className="w-full text-base font-bold text-hi-navy bg-transparent border-b border-transparent hover:border-gray-200 focus:border-hi-accent focus:outline-none"
            />
            <p className="text-xs text-hi-slate mt-0.5">{role.key ? 'Standardrolle' : 'Eigene Rolle'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-hi-slate hover:bg-gray-100 transition-colors" aria-label="Schließen">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {catalogEntry?.normativeHint && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 text-[11px] text-indigo-800">
              <strong>Normative Einordnung:</strong> {catalogEntry.normativeHint}
            </div>
          )}

          <div>
            <span className="text-xs font-semibold text-hi-slate">Relevanz</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {RELEVANCE_ORDER.map(rel => (
                <button
                  key={rel}
                  type="button"
                  onClick={() => toggleRel(rel)}
                  className={`px-2 py-1 rounded-full text-[11px] font-medium border transition-colors ${role.relevanz.includes(rel) ? `${RELEVANCE_STYLE[rel]} border-transparent` : 'bg-white border-gray-200 text-hi-slate hover:border-hi-accent/50'}`}
                >
                  {ROLE_RELEVANCE_LABEL[rel]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-xs font-semibold text-hi-slate">Benannte Person</span>
              <input className={inputCls} value={role.personName ?? ''} onChange={e => onPatch({ personName: e.target.value })} placeholder="Vorname Nachname" /></label>
            <label className="block"><span className="text-xs font-semibold text-hi-slate">Stellvertretung</span>
              <input className={inputCls} value={role.deputy ?? ''} onChange={e => onPatch({ deputy: e.target.value })} placeholder="Vertretung" /></label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-xs font-semibold text-hi-slate">Organisationseinheit</span>
              <input className={inputCls} value={role.orgUnit ?? ''} onChange={e => onPatch({ orgUnit: e.target.value })} placeholder="z.B. IT / Recht" /></label>
            <label className="block"><span className="text-xs font-semibold text-hi-slate">Kontakt (E-Mail)</span>
              <input className={inputCls} type="email" value={role.email ?? ''} onChange={e => onPatch({ email: e.target.value })} placeholder="name@org.de" /></label>
          </div>

          <label className="block"><span className="text-xs font-semibold text-hi-slate">Verantwortung / Aufgaben</span>
            <textarea className={`${inputCls} min-h-[4.5rem]`} value={role.responsibility ?? ''} onChange={e => onPatch({ responsibility: e.target.value })} /></label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-xs font-semibold text-hi-slate">Status</span>
              <select className={inputCls} value={role.status ?? 'Offen'} onChange={e => onPatch({ status: e.target.value as RoleAssignmentStatus })}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select></label>
            <label className="block"><span className="text-xs font-semibold text-hi-slate">Bestellungsdokument <span className="text-gray-400 font-normal">(URL/Datei)</span></span>
              <input className={inputCls} value={role.bestellungsdokument ?? ''} onChange={e => onPatch({ bestellungsdokument: e.target.value })} placeholder="Verweis auf Bestellung" /></label>
          </div>

          <label className="block"><span className="text-xs font-semibold text-hi-slate">Kommentar / Notizen</span>
            <textarea className={`${inputCls} min-h-[3.5rem]`} value={role.notes ?? ''} onChange={e => onPatch({ notes: e.target.value })} /></label>

          <p className="text-[10px] text-gray-400">
            Evidence-Verknüpfung: Sobald der Evidence-Katalog (Paket 9) Nachweise als Objekte führt,
            lassen sich hier mehrere Nachweise referenzieren. Bis dahin dient das Feld
            „Bestellungsdokument" als direkter Verweis.
          </p>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <button onClick={() => { if (confirm(`Rolle „${role.roleName}" löschen?`)) onDelete(); }} className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
            Rolle löschen
          </button>
          <button onClick={onClose} className="px-4 py-1.5 text-xs font-semibold text-white bg-hi-navy rounded-lg hover:bg-hi-blue transition-colors">Fertig</button>
        </div>
      </div>
    </div>
  );
};
