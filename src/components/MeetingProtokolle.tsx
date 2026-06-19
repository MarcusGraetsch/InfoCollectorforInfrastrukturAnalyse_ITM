import React, { useState } from 'react';
import type { AppState, Meeting, MeetingTOP, MeetingTyp } from '../types';
import { generateId } from '../store';
import { esc, openPrintWindow } from '../utils/safePrint';

interface Props {
  state: AppState;
  onUpdate: (meetings: Meeting[]) => void;
}

const TYP_COLORS: Record<MeetingTyp, string> = {
  'Jour Fixe':        'bg-blue-100 text-blue-800',
  'Lenkungsausschuss': 'bg-purple-100 text-purple-800',
  'Workshop':         'bg-amber-100 text-amber-800',
  'Sonstiges':        'bg-gray-100 text-gray-700',
};

function createMeeting(typ: MeetingTyp): Meeting {
  return {
    id: generateId(),
    typ,
    datum: new Date().toISOString().split('T')[0],
    beginn: '09:00',
    ende: '10:00',
    ort: '',
    teilnehmer: '',
    tops: [createTOP()],
    naechsteMeeting: '',
    protokolliert: false,
  };
}

function createTOP(): MeetingTOP {
  return { id: generateId(), titel: '', ergebnis: '', verantwortlich: '', faelligAm: '', status: 'Offen' };
}

export const MeetingProtokolle: React.FC<Props> = ({ state, onUpdate }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newTyp, setNewTyp] = useState<MeetingTyp>('Jour Fixe');

  const meetings = [...(state.meetings ?? [])].sort((a, b) => b.datum.localeCompare(a.datum));

  const handleAdd = () => {
    const m = createMeeting(newTyp);
    onUpdate([...state.meetings, m]);
    setOpenId(m.id);
    setShowNew(false);
  };

  const handleUpdateMeeting = (id: string, changes: Partial<Meeting>) => {
    onUpdate(state.meetings.map(m => m.id === id ? { ...m, ...changes } : m));
  };

  const handleDeleteMeeting = (id: string) => {
    onUpdate(state.meetings.filter(m => m.id !== id));
    if (openId === id) setOpenId(null);
  };

  const handleUpdateTOP = (meetingId: string, topId: string, changes: Partial<MeetingTOP>) => {
    handleUpdateMeeting(meetingId, {
      tops: (state.meetings.find(m => m.id === meetingId)?.tops ?? []).map(t =>
        t.id === topId ? { ...t, ...changes } : t
      ),
    });
  };

  const handleAddTOP = (meetingId: string) => {
    const m = state.meetings.find(m => m.id === meetingId);
    if (!m) return;
    handleUpdateMeeting(meetingId, { tops: [...m.tops, createTOP()] });
  };

  const handleDeleteTOP = (meetingId: string, topId: string) => {
    const m = state.meetings.find(m => m.id === meetingId);
    if (!m) return;
    handleUpdateMeeting(meetingId, { tops: m.tops.filter(t => t.id !== topId) });
  };

  const handlePrint = (meetingId: string) => {
    const m = state.meetings.find(m => m.id === meetingId);
    if (!m) return;
    const { title, body } = buildPrintContent(m, state.customerName);
    openPrintWindow(title, body);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-hi-navy mb-1">Meeting-Protokolle</h2>
          <p className="text-sm text-gray-500">Jour Fixe (LG 18), Lenkungsausschuss (LG 17), Workshops</p>
        </div>
        <div className="flex items-center gap-2">
          {showNew ? (
            <div className="flex items-center gap-2">
              <select
                value={newTyp}
                onChange={e => setNewTyp(e.target.value as MeetingTyp)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
              >
                <option>Jour Fixe</option>
                <option>Lenkungsausschuss</option>
                <option>Workshop</option>
                <option>Sonstiges</option>
              </select>
              <button onClick={handleAdd} className="px-4 py-2 bg-hi-accent text-white rounded-lg text-sm font-medium">Anlegen</button>
              <button onClick={() => setShowNew(false)} className="px-3 py-2 text-sm text-gray-500">Abbrechen</button>
            </div>
          ) : (
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-4 py-2 bg-hi-accent text-white rounded-lg text-sm font-medium hover:bg-hi-accent/90"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Neues Protokoll
            </button>
          )}
        </div>
      </div>

      {meetings.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">Noch keine Protokolle angelegt.</p>
          <p className="text-xs mt-1">Lege das erste Protokoll für einen Jour Fixe oder Lenkungsausschuss an.</p>
        </div>
      )}

      <div className="space-y-3">
        {meetings.map(m => (
          <MeetingCard
            key={m.id}
            meeting={m}
            expanded={openId === m.id}
            onToggle={() => setOpenId(openId === m.id ? null : m.id)}
            onUpdate={changes => handleUpdateMeeting(m.id, changes)}
            onDelete={() => handleDeleteMeeting(m.id)}
            onAddTOP={() => handleAddTOP(m.id)}
            onUpdateTOP={(tid, ch) => handleUpdateTOP(m.id, tid, ch)}
            onDeleteTOP={tid => handleDeleteTOP(m.id, tid)}
            onPrint={() => handlePrint(m.id)}
          />
        ))}
      </div>
    </div>
  );
};

interface CardProps {
  meeting: Meeting;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (changes: Partial<Meeting>) => void;
  onDelete: () => void;
  onAddTOP: () => void;
  onUpdateTOP: (topId: string, changes: Partial<MeetingTOP>) => void;
  onDeleteTOP: (topId: string) => void;
  onPrint: () => void;
}

const MeetingCard: React.FC<CardProps> = ({
  meeting, expanded, onToggle, onUpdate, onDelete, onAddTOP, onUpdateTOP, onDeleteTOP, onPrint,
}) => {
  const openTops = meeting.tops.filter(t => t.status === 'Offen').length;

  return (
    <div className={`bg-white rounded-xl border shadow-sm transition-all ${expanded ? 'border-hi-accent/40 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none" onClick={onToggle}>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${TYP_COLORS[meeting.typ]}`}>
          {meeting.typ}
        </span>
        <span className="text-sm font-medium text-gray-800 flex-1">
          {meeting.datum
            ? new Date(meeting.datum + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
            : 'Datum ausstehend'}
        </span>
        {openTops > 0 && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
            {openTops} offen
          </span>
        )}
        {meeting.protokolliert && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium hidden sm:inline">
            Protokolliert
          </span>
        )}
        <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
          {/* Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Datum</label>
              <input type="date" value={meeting.datum} onChange={e => onUpdate({ datum: e.target.value })}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-hi-accent" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Typ</label>
              <select value={meeting.typ} onChange={e => onUpdate({ typ: e.target.value as MeetingTyp })}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-hi-accent bg-white">
                <option>Jour Fixe</option>
                <option>Lenkungsausschuss</option>
                <option>Workshop</option>
                <option>Sonstiges</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Beginn</label>
              <input type="time" value={meeting.beginn} onChange={e => onUpdate({ beginn: e.target.value })}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-hi-accent" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ende</label>
              <input type="time" value={meeting.ende} onChange={e => onUpdate({ ende: e.target.value })}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-hi-accent" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ort / Link</label>
              <input type="text" value={meeting.ort} onChange={e => onUpdate({ ort: e.target.value })}
                placeholder="z.B. Teams-Meeting oder Besprechungsraum A"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-hi-accent" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Teilnehmer</label>
              <input type="text" value={meeting.teilnehmer} onChange={e => onUpdate({ teilnehmer: e.target.value })}
                placeholder="Namen kommagetrennt"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-hi-accent" />
            </div>
          </div>

          {/* TOPs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Tagesordnungspunkte</label>
              <button onClick={onAddTOP} className="text-xs text-hi-accent hover:text-hi-accent/80 flex items-center gap-1 font-medium">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                TOP hinzufügen
              </button>
            </div>
            <div className="space-y-3">
              {meeting.tops.map((top, idx) => (
                <TOPRow
                  key={top.id}
                  top={top}
                  nr={idx + 1}
                  onChange={ch => onUpdateTOP(top.id, ch)}
                  onDelete={() => onDeleteTOP(top.id)}
                />
              ))}
            </div>
          </div>

          {/* Nächstes Meeting */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nächstes Meeting</label>
            <input type="date" value={meeting.naechsteMeeting} onChange={e => onUpdate({ naechsteMeeting: e.target.value })}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-hi-accent" />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <button onClick={onDelete} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Löschen
            </button>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input type="checkbox" checked={meeting.protokolliert} onChange={e => onUpdate({ protokolliert: e.target.checked })}
                  className="rounded" />
                Protokoll versandt
              </label>
              <button
                onClick={onPrint}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-hi-navy text-white rounded-lg font-medium hover:bg-hi-navy/90"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Drucken / PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface TOPRowProps {
  top: MeetingTOP;
  nr: number;
  onChange: (ch: Partial<MeetingTOP>) => void;
  onDelete: () => void;
}

const TOPRow: React.FC<TOPRowProps> = ({ top, nr, onChange, onDelete }) => (
  <div className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50">
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-gray-400 w-5 text-right flex-shrink-0">{nr}.</span>
      <input
        type="text"
        value={top.titel}
        onChange={e => onChange({ titel: e.target.value })}
        placeholder="Tagesordnungspunkt"
        className="flex-1 text-sm font-medium border border-gray-300 rounded px-2.5 py-1 outline-none focus:ring-2 focus:ring-hi-accent bg-white"
      />
      <select
        value={top.status}
        onChange={e => onChange({ status: e.target.value as MeetingTOP['status'] })}
        className={`text-xs border rounded px-2 py-1 outline-none font-medium bg-white ${top.status === 'Erledigt' ? 'border-green-300 text-green-700' : 'border-amber-300 text-amber-700'}`}
      >
        <option>Offen</option>
        <option>Erledigt</option>
      </select>
      <button onClick={onDelete} className="text-gray-300 hover:text-red-400 flex-shrink-0">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pl-7">
      <textarea
        value={top.ergebnis}
        onChange={e => onChange({ ergebnis: e.target.value })}
        rows={2}
        placeholder="Ergebnis / Beschluss"
        className="sm:col-span-2 text-xs border border-gray-300 rounded px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-hi-accent resize-none"
      />
      <div className="space-y-1.5">
        <input
          type="text"
          value={top.verantwortlich}
          onChange={e => onChange({ verantwortlich: e.target.value })}
          placeholder="Verantwortlich"
          className="w-full text-xs border border-gray-300 rounded px-2.5 py-1 outline-none focus:ring-2 focus:ring-hi-accent"
        />
        <input
          type="date"
          value={top.faelligAm}
          onChange={e => onChange({ faelligAm: e.target.value })}
          className="w-full text-xs border border-gray-300 rounded px-2.5 py-1 outline-none focus:ring-2 focus:ring-hi-accent"
        />
      </div>
    </div>
  </div>
);

function buildPrintContent(m: Meeting, customerName: string): { title: string; body: string } {
  const formatDate = (d: string) => d
    ? new Date(d + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    : '–';
  const tops = m.tops.map((t, i) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;vertical-align:top;white-space:nowrap;">${i + 1}.</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;vertical-align:top;font-weight:600;">${esc(t.titel || '–')}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;vertical-align:top;color:#444;">${esc(t.ergebnis || '–')}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;vertical-align:top;white-space:nowrap;">${esc(t.verantwortlich || '–')}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;vertical-align:top;white-space:nowrap;">${t.faelligAm ? new Date(t.faelligAm + 'T12:00:00').toLocaleDateString('de-DE') : '–'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;vertical-align:top;white-space:nowrap;color:${t.status === 'Erledigt' ? '#16a34a' : '#d97706'};">${esc(t.status)}</td>
    </tr>
  `).join('');

  const title = `Protokoll ${m.typ} – ${m.datum}`;
  const body = `
  <h1>${esc(m.typ)} – Protokoll</h1>
  <p style="color:#666;margin:0 0 16px;">Projekt: Cloud-Strategie${customerName ? ' | ' + esc(customerName) : ''}</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;margin:16px 0 24px;font-size:12px;color:#444">
    <div><strong>Datum:</strong> ${esc(formatDate(m.datum))}</div>
    <div><strong>Zeit:</strong> ${esc(m.beginn || '–')} – ${esc(m.ende || '–')} Uhr</div>
    <div><strong>Ort / Medium:</strong> ${esc(m.ort || '–')}</div>
    <div><strong>Teilnehmer:</strong> ${esc(m.teilnehmer || '–')}</div>
    ${m.naechsteMeeting ? `<div><strong>Nächstes Meeting:</strong> ${esc(formatDate(m.naechsteMeeting))}</div>` : ''}
  </div>
  <table>
    <thead><tr>
      <th>#</th><th>Tagesordnungspunkt</th><th>Ergebnis / Beschluss</th><th>Verantwortlich</th><th>Fällig</th><th>Status</th>
    </tr></thead>
    <tbody>${tops}</tbody>
  </table>
  <div style="margin-top:32px;font-size:11px;color:#888;border-top:1px solid #eee;padding-top:8px">Erstellt mit HiSolutions IT-Strukturanalyse</div>`;

  return { title, body };
}
