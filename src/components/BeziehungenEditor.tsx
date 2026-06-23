import React, { useMemo, useState } from 'react';
import type { AppState, CategoryKey, Beziehung, BeziehungsTyp, BeziehungsRichtung } from '../types';
import { CATEGORIES } from '../categories';
import { generateId } from '../store';
import {
  BEZIEHUNGS_TYPEN,
  TYP_LABEL,
  objektLabel,
  kategorieLabel,
  beziehungenFuerObjekt,
  pruneOrphanBeziehungen,
  addBeziehung,
  removeBeziehung,
} from '../utils/beziehungen';

interface Props {
  state: AppState;
  beziehungen: Beziehung[];
  onChange: (next: Beziehung[]) => void;
  /** Inline-Modus: auf ein einzelnes Objekt beschränkt; global = undefined. */
  fokus?: { kategorie: CategoryKey; id: string };
}

function objektOptionen(state: AppState, kat: CategoryKey): { id: string; label: string }[] {
  const arr = (state[kat] as unknown as { id: string; kuerzel?: string; name?: string }[]) ?? [];
  return arr.map(o => ({
    id: o.id,
    label: o.kuerzel ? `${o.kuerzel} · ${o.name ?? ''}`.trim() : (o.name ?? o.id),
  }));
}

const inputCls = 'border border-gray-200 rounded-md px-2 py-1.5 text-sm text-hi-slate focus:outline-none focus:ring-2 focus:ring-hi-accent/40';

export const BeziehungenEditor: React.FC<Props> = ({ state, beziehungen, onChange, fokus }) => {
  const inline = !!fokus;

  // Add-Form-State
  const [quelleKat, setQuelleKat] = useState<CategoryKey>(fokus?.kategorie ?? CATEGORIES[0].key);
  const [quelleId, setQuelleId] = useState<string>(fokus?.id ?? '');
  const [zielKat, setZielKat] = useState<CategoryKey>(CATEGORIES[0].key);
  const [zielId, setZielId] = useState<string>('');
  const [typ, setTyp] = useState<BeziehungsTyp>('kommuniziert');
  const [richtung, setRichtung] = useState<BeziehungsRichtung>('bi');
  const [protokoll, setProtokoll] = useState('');
  const [notiz, setNotiz] = useState('');

  const sichtbar: Beziehung[] = useMemo(() => {
    if (fokus) return beziehungenFuerObjekt(state, fokus.kategorie, fokus.id);
    return [...beziehungen].sort((a, b) =>
      `${a.quelleKategorie}${a.quelleId}`.localeCompare(`${b.quelleKategorie}${b.quelleId}`));
  }, [state, beziehungen, fokus]);

  const orphans = useMemo(
    () => beziehungen.length - pruneOrphanBeziehungen(state).length,
    [state, beziehungen]
  );

  const quelleOpts = useMemo(() => objektOptionen(state, quelleKat), [state, quelleKat]);
  const zielOpts = useMemo(() => objektOptionen(state, zielKat), [state, zielKat]);

  function handleTypChange(t: BeziehungsTyp) {
    setTyp(t);
    const def = BEZIEHUNGS_TYPEN.find(x => x.typ === t);
    if (def) setRichtung(def.defaultRichtung);
  }

  function handleAdd() {
    const qKat = fokus?.kategorie ?? quelleKat;
    const qId = fokus?.id ?? quelleId;
    if (!qId || !zielId) return;
    if (qKat === zielKat && qId === zielId) return; // Selbstbezug vermeiden
    const neu: Beziehung = {
      id: generateId(),
      quelleKategorie: qKat,
      quelleId: qId,
      zielKategorie: zielKat,
      zielId,
      typ,
      richtung,
      ...(typ === 'kommuniziert' && protokoll.trim() ? { protokoll: protokoll.trim() } : {}),
      ...(notiz.trim() ? { notiz: notiz.trim() } : {}),
    };
    onChange(addBeziehung(beziehungen, neu));
    // Reset (Quelle im Inline-Modus beibehalten)
    setZielId('');
    setProtokoll('');
    setNotiz('');
  }

  function endpointLabel(kat: CategoryKey, id: string): string {
    const lbl = objektLabel(state, kat, id);
    return lbl ? `${kategorieLabel(kat)}: ${lbl}` : `${kategorieLabel(kat)}: (gelöscht)`;
  }

  return (
    <div className="space-y-3">
      {sichtbar.length === 0 ? (
        <p className="text-sm text-hi-slate/60 italic">Noch keine Beziehungen erfasst.</p>
      ) : (
        <ul className="space-y-1.5">
          {sichtbar.map(b => {
            const pfeil = b.richtung === 'bi' ? '↔' : '→';
            const farbe = BEZIEHUNGS_TYPEN.find(t => t.typ === b.typ)?.farbe ?? '#64748b';
            return (
              <li key={b.id} className="flex items-center gap-2 text-sm bg-hi-gray/50 rounded-md px-3 py-2">
                <span className="flex-1 text-hi-slate">
                  <span className="font-medium">{endpointLabel(b.quelleKategorie, b.quelleId)}</span>
                  {' '}
                  <span
                    className="inline-block px-1.5 rounded text-white text-xs align-middle"
                    style={{ backgroundColor: farbe }}
                  >
                    {pfeil} {TYP_LABEL[b.typ]}
                  </span>
                  {' '}
                  <span className="font-medium">{endpointLabel(b.zielKategorie, b.zielId)}</span>
                  {b.protokoll ? <span className="text-hi-slate/60"> · {b.protokoll}</span> : null}
                  {b.notiz ? <span className="text-hi-slate/60 italic"> — {b.notiz}</span> : null}
                </span>
                <button
                  type="button"
                  onClick={() => onChange(removeBeziehung(beziehungen, b.id))}
                  className="text-hi-slate/50 hover:text-red-600 px-1"
                  title="Beziehung entfernen"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!inline && orphans > 0 && (
        <button
          type="button"
          onClick={() => onChange(pruneOrphanBeziehungen(state))}
          className="text-xs px-3 py-1.5 border border-amber-300 text-amber-700 rounded-md hover:bg-amber-50"
        >
          {orphans} verwaiste Beziehung{orphans > 1 ? 'en' : ''} entfernen
        </button>
      )}

      {/* Add-Formular */}
      <div className="border border-dashed border-gray-300 rounded-lg p-3 space-y-2 bg-white">
        <div className="flex flex-wrap items-center gap-2">
          {!inline && (
            <>
              <select className={inputCls} value={quelleKat} onChange={e => { setQuelleKat(e.target.value as CategoryKey); setQuelleId(''); }}>
                {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
              <select className={inputCls} value={quelleId} onChange={e => setQuelleId(e.target.value)}>
                <option value="">— Quelle wählen —</option>
                {quelleOpts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </>
          )}

          <select className={inputCls} value={typ} onChange={e => handleTypChange(e.target.value as BeziehungsTyp)}>
            {BEZIEHUNGS_TYPEN.map(t => <option key={t.typ} value={t.typ}>{t.label}</option>)}
          </select>

          <select className={inputCls} value={zielKat} onChange={e => { setZielKat(e.target.value as CategoryKey); setZielId(''); }}>
            {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <select className={inputCls} value={zielId} onChange={e => setZielId(e.target.value)}>
            <option value="">— Ziel wählen —</option>
            {zielOpts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>

          <select className={inputCls} value={richtung} onChange={e => setRichtung(e.target.value as BeziehungsRichtung)}>
            <option value="uni">→ gerichtet (uni)</option>
            <option value="bi">↔ beidseitig (bi)</option>
          </select>

          {typ === 'kommuniziert' && (
            <input
              className={inputCls}
              placeholder="Protokoll (optional)"
              value={protokoll}
              onChange={e => setProtokoll(e.target.value)}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            className={`${inputCls} flex-1 min-w-[12rem]`}
            placeholder="Notiz (optional)"
            value={notiz}
            onChange={e => setNotiz(e.target.value)}
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={(!fokus && !quelleId) || !zielId}
            className="px-4 py-1.5 bg-hi-accent text-white rounded-md text-sm font-semibold hover:bg-hi-blue disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
};
