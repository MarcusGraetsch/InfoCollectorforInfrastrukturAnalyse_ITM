import React, { useState, useMemo } from 'react';
import type { AppState, Liefergegenstand, LiefergegenstandStatus } from '../types';

interface Props {
  state: AppState;
  onUpdateLG: (id: number, changes: Partial<Liefergegenstand>) => void;
}

const STATUS_COLORS: Record<LiefergegenstandStatus, string> = {
  'Offen':      'bg-gray-100 text-gray-700 border-gray-300',
  'In Arbeit':  'bg-blue-100 text-blue-800 border-blue-300',
  'Abgenommen': 'bg-green-100 text-green-800 border-green-300',
};

const STATUS_DOT: Record<LiefergegenstandStatus, string> = {
  'Offen':      'bg-gray-400',
  'In Arbeit':  'bg-blue-500',
  'Abgenommen': 'bg-green-500',
};

const PHASES = [
  'Projekt-Kick-off',
  'Analyse technische Infrastruktur',
  'Cloud-Readiness-Analyse',
  'Cloud-Strategie',
  'Projektgovernance & Change-Begleitung',
];

export const ProjectTracker: React.FC<Props> = ({ state, onUpdateLG }) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterPhase, setFilterPhase] = useState<string>('Alle');
  const [filterStatus, setFilterStatus] = useState<string>('Alle');

  const lgs = state.liefergegenstaende;

  const stats = useMemo(() => ({
    offen:      lgs.filter(l => l.status === 'Offen').length,
    inArbeit:   lgs.filter(l => l.status === 'In Arbeit').length,
    abgenommen: lgs.filter(l => l.status === 'Abgenommen').length,
    gesamt:     lgs.length,
  }), [lgs]);

  const filtered = useMemo(() => lgs.filter(lg => {
    if (filterPhase !== 'Alle' && lg.phase !== filterPhase) return false;
    if (filterStatus !== 'Alle' && lg.status !== filterStatus) return false;
    return true;
  }), [lgs, filterPhase, filterStatus]);

  const grouped = useMemo(() => {
    const map = new Map<string, Liefergegenstand[]>();
    for (const phase of PHASES) {
      const items = filtered.filter(l => l.phase === phase);
      if (items.length > 0) map.set(phase, items);
    }
    return map;
  }, [filtered]);

  const progressPct = Math.round((stats.abgenommen / stats.gesamt) * 100);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header & KPIs */}
      <div>
        <h2 className="text-2xl font-bold text-hi-navy mb-1">Projekt-Tracker</h2>
        <p className="text-sm text-gray-500">Liefergegenstände Cloud-Strategie (Los 1)</p>
      </div>

      {/* Fortschrittsbalken */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Gesamtfortschritt</span>
          <span className="text-sm font-bold text-hi-navy">{stats.abgenommen} / {stats.gesamt} abgenommen</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex gap-6 mt-3 text-xs text-gray-600">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />{stats.offen} Offen</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />{stats.inArbeit} In Arbeit</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{stats.abgenommen} Abgenommen</span>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Phase:</label>
          <select
            value={filterPhase}
            onChange={e => setFilterPhase(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-hi-accent focus:border-transparent outline-none"
          >
            <option>Alle</option>
            {PHASES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600">Status:</label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-hi-accent focus:border-transparent outline-none"
          >
            <option>Alle</option>
            <option>Offen</option>
            <option>In Arbeit</option>
            <option>Abgenommen</option>
          </select>
        </div>
      </div>

      {/* LG-Liste gruppiert nach Phase */}
      <div className="space-y-6">
        {Array.from(grouped.entries()).map(([phase, items]) => (
          <div key={phase}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
              {phase}
            </h3>
            <div className="space-y-2">
              {items.map(lg => (
                <LGCard
                  key={lg.id}
                  lg={lg}
                  expanded={expandedId === lg.id}
                  onToggle={() => setExpandedId(expandedId === lg.id ? null : lg.id)}
                  onUpdate={changes => onUpdateLG(lg.id, changes)}
                />
              ))}
            </div>
          </div>
        ))}
        {grouped.size === 0 && (
          <div className="text-center py-12 text-gray-400">
            Keine Liefergegenstände für den gewählten Filter.
          </div>
        )}
      </div>
    </div>
  );
};

interface CardProps {
  lg: Liefergegenstand;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (changes: Partial<Liefergegenstand>) => void;
}

const LGCard: React.FC<CardProps> = ({ lg, expanded, onToggle, onUpdate }) => {
  const [editNotes, setEditNotes] = useState(lg.notizen);
  const [editDate, setEditDate] = useState(lg.faelligAm);

  const handleBlurNotes = () => {
    if (editNotes !== lg.notizen) onUpdate({ notizen: editNotes });
  };
  const handleBlurDate = () => {
    if (editDate !== lg.faelligAm) onUpdate({ faelligAm: editDate });
  };

  return (
    <div className={`bg-white rounded-xl border shadow-sm transition-all ${expanded ? 'border-hi-accent/40 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
      {/* Collapsed row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={onToggle}
      >
        <span className="text-xs font-bold text-gray-400 w-6 text-right flex-shrink-0">
          {lg.id}
        </span>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[lg.status]}`} />
        <span className="flex-1 text-sm font-medium text-gray-800 leading-snug">{lg.titel}</span>
        <StatusBadge status={lg.status} onChange={s => onUpdate({ status: s })} />
        {lg.faelligAm && (
          <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:block">
            {new Date(lg.faelligAm).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
          </span>
        )}
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          <p className="text-sm text-gray-600 leading-relaxed">{lg.beschreibung}</p>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <span><span className="font-medium text-gray-700">Aufwand Kunde:</span> {lg.aufwandAuftraggeber}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fällig am</label>
              <input
                type="date"
                value={editDate}
                onChange={e => setEditDate(e.target.value)}
                onBlur={handleBlurDate}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-hi-accent focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={lg.status}
                onChange={e => onUpdate({ status: e.target.value as LiefergegenstandStatus })}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-hi-accent focus:border-transparent outline-none bg-white"
              >
                <option>Offen</option>
                <option>In Arbeit</option>
                <option>Abgenommen</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notizen / Hinweise</label>
            <textarea
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              onBlur={handleBlurNotes}
              rows={3}
              placeholder="Offene Punkte, Ansprechpartner, Links zu Dokumenten…"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-hi-accent focus:border-transparent outline-none resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface StatusBadgeProps {
  status: LiefergegenstandStatus;
  onChange: (s: LiefergegenstandStatus) => void;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, onChange }) => {
  const [open, setOpen] = useState(false);
  const OPTIONS: LiefergegenstandStatus[] = ['Offen', 'In Arbeit', 'Abgenommen'];

  return (
    <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_COLORS[status]} flex items-center gap-1`}
      >
        {status}
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[130px]">
          {OPTIONS.map(opt => (
            <button
              key={opt}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${opt === status ? 'font-semibold text-hi-navy' : 'text-gray-700'}`}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
