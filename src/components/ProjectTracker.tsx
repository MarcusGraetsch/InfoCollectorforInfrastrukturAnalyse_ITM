import React, { useState, useMemo, useRef } from 'react';
import type { AppState, LGAnhang, Liefergegenstand, LiefergegenstandStatus } from '../types';
import { saveFile, loadFile, deleteFile, downloadBlob, formatBytes } from '../fileStore';
import { generateId } from '../store';

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
      <div>
        <h2 className="text-2xl font-bold text-hi-navy mb-1">Projekt-Tracker</h2>
        <p className="text-sm text-gray-500">Liefergegenstände Cloud-Strategie (Los 1)</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Gesamtfortschritt</span>
          <span className="text-sm font-bold text-hi-navy">{stats.abgenommen} / {stats.gesamt} abgenommen</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div className="bg-green-500 h-3 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="flex gap-6 mt-3 text-xs text-gray-600">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />{stats.offen} Offen</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />{stats.inArbeit} In Arbeit</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{stats.abgenommen} Abgenommen</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Phase:</label>
          <select value={filterPhase} onChange={e => setFilterPhase(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-hi-accent focus:border-transparent outline-none">
            <option>Alle</option>
            {PHASES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600">Status:</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-hi-accent focus:border-transparent outline-none">
            <option>Alle</option>
            <option>Offen</option>
            <option>In Arbeit</option>
            <option>Abgenommen</option>
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {Array.from(grouped.entries()).map(([phase, items]) => (
          <div key={phase}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">{phase}</h3>
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
          <div className="text-center py-12 text-gray-400">Keine Liefergegenstände für den gewählten Filter.</div>
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
  const [editDate,  setEditDate]  = useState(lg.faelligAm);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleBlurNotes = () => { if (editNotes !== lg.notizen) onUpdate({ notizen: editNotes }); };
  const handleBlurDate  = () => { if (editDate  !== lg.faelligAm) onUpdate({ faelligAm: editDate  }); };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newAnhaenge: LGAnhang[] = [...(lg.anhaenge ?? [])];
    for (const file of Array.from(files)) {
      const id = generateId();
      await saveFile(id, file);
      newAnhaenge.push({ id, name: file.name, size: file.size, type: file.type, addedAt: new Date().toISOString() });
    }
    onUpdate({ anhaenge: newAnhaenge });
    setUploading(false);
  };

  const handleDownload = async (anhang: LGAnhang) => {
    const buf = await loadFile(anhang.id);
    if (buf) downloadBlob(anhang.name, anhang.type, buf);
  };

  const handleDelete = async (anhang: LGAnhang) => {
    await deleteFile(anhang.id);
    onUpdate({ anhaenge: (lg.anhaenge ?? []).filter(a => a.id !== anhang.id) });
  };

  const anhaenge = lg.anhaenge ?? [];
  const totalCount = anhaenge.length;

  return (
    <div className={`bg-white rounded-xl border shadow-sm transition-all ${expanded ? 'border-hi-accent/40 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none" onClick={onToggle}>
        <span className="text-xs font-bold text-gray-400 w-6 text-right flex-shrink-0">{lg.id}</span>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[lg.status]}`} />
        <span className="flex-1 text-sm font-medium text-gray-800 leading-snug">{lg.titel}</span>
        {totalCount > 0 && (
          <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 flex items-center gap-0.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
            {totalCount}
          </span>
        )}
        <StatusBadge status={lg.status} onChange={s => onUpdate({ status: s })} />
        {lg.faelligAm && (
          <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:block">
            {new Date(lg.faelligAm).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
          </span>
        )}
        <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">{lg.beschreibung}</p>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <span><span className="font-medium text-gray-700">Aufwand Kunde:</span> {lg.aufwandAuftraggeber}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fällig am</label>
              <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} onBlur={handleBlurDate} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-hi-accent focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={lg.status} onChange={e => onUpdate({ status: e.target.value as LiefergegenstandStatus })} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-hi-accent focus:border-transparent outline-none bg-white">
                <option>Offen</option>
                <option>In Arbeit</option>
                <option>Abgenommen</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notizen / Hinweise</label>
            <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} onBlur={handleBlurNotes} rows={3} placeholder="Offene Punkte, Ansprechpartner, Links zu Dokumenten…" className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-hi-accent focus:border-transparent outline-none resize-none" />
          </div>

          {/* Anhänge */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">Anhänge</label>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1 text-xs px-2.5 py-1 bg-hi-navy text-white rounded-lg hover:bg-hi-navy/90 disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                {uploading ? 'Lädt…' : 'Datei hochladen'}
              </button>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
            </div>

            {anhaenge.length === 0 ? (
              <div
                className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center text-xs text-gray-400 cursor-pointer hover:border-gray-300 hover:text-gray-500 transition-colors"
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                onClick={() => fileRef.current?.click()}
              >
                Dateien hierher ziehen oder klicken — Agenden, Präsentationen, Protokolle, Konzepte …
              </div>
            ) : (
              <div
                className="space-y-1.5"
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
              >
                {anhaenge.map(a => (
                  <div key={a.id} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <FileIcon mime={a.type} />
                    <span className="flex-1 text-xs text-gray-700 truncate">{a.name}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatBytes(a.size)}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
                      {new Date(a.addedAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </span>
                    <button onClick={() => handleDownload(a)} className="text-blue-500 hover:text-blue-700 flex-shrink-0" title="Herunterladen">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                    <button onClick={() => handleDelete(a)} className="text-gray-400 hover:text-red-500 flex-shrink-0" title="Löschen">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
                <div className="text-xs text-gray-400 text-center pt-1 cursor-pointer hover:text-gray-500" onClick={() => fileRef.current?.click()}>
                  + weitere Datei hochladen
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const FileIcon: React.FC<{ mime: string }> = ({ mime }) => {
  let color = 'text-gray-400';
  let label = 'DOC';
  if (mime.includes('pdf'))        { color = 'text-red-400';    label = 'PDF'; }
  else if (mime.includes('word') || mime.includes('docx')) { color = 'text-blue-400'; label = 'DOC'; }
  else if (mime.includes('sheet') || mime.includes('xlsx')) { color = 'text-green-500'; label = 'XLS'; }
  else if (mime.includes('presentation') || mime.includes('pptx')) { color = 'text-orange-400'; label = 'PPT'; }
  else if (mime.includes('image')) { color = 'text-purple-400'; label = 'IMG'; }
  else if (mime.includes('text'))  { color = 'text-gray-500';   label = 'TXT'; }
  return <span className={`text-[9px] font-bold w-6 text-center flex-shrink-0 ${color}`}>{label}</span>;
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
      <button onClick={() => setOpen(!open)} className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_COLORS[status]} flex items-center gap-1`}>
        {status}
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[130px]">
          {OPTIONS.map(opt => (
            <button key={opt} className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${opt === status ? 'font-semibold text-hi-navy' : 'text-gray-700'}`} onClick={() => { onChange(opt); setOpen(false); }}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
