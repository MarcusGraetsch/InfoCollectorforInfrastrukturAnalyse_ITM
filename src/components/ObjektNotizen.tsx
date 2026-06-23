import React, { useState } from 'react';
import type { ObjektNotiz } from '../types';

interface Props {
  notizen: ObjektNotiz[];
  onChange: (notizen: ObjektNotiz[]) => void;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export const ObjektNotizen: React.FC<Props> = ({ notizen, onChange }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [autor, setAutor] = useState(() => localStorage.getItem('consultant-name') ?? '');

  const sorted = [...notizen].sort((a, b) => b.datum.localeCompare(a.datum));

  const handleAdd = () => {
    if (!text.trim()) return;
    const notiz: ObjektNotiz = {
      id: generateId(),
      text: text.trim(),
      datum: new Date().toISOString(),
      autor: autor.trim() || undefined,
    };
    onChange([...notizen, notiz]);
    setText('');
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Notiz wirklich löschen?')) return;
    onChange(notizen.filter(n => n.id !== id));
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('de-DE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white/60 mt-2">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-hi-slate uppercase tracking-wider hover:bg-gray-50 rounded-lg"
      >
        <span className="flex items-center gap-2">
          Notizen
          {notizen.length > 0 && (
            <span className="bg-hi-navy text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none">
              {notizen.length}
            </span>
          )}
        </span>
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-3">
          {/* Add form */}
          <div className="space-y-2">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={3}
              placeholder="Neue Notiz …"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hi-accent focus:border-hi-accent bg-white resize-y transition-colors"
            />
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={autor}
                onChange={e => setAutor(e.target.value)}
                placeholder="Ihr Name (optional)"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-hi-accent focus:border-hi-accent bg-white transition-colors"
              />
              <button
                type="button"
                onClick={handleAdd}
                disabled={!text.trim()}
                className="px-4 py-1.5 bg-hi-accent text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Notiz hinzufügen
              </button>
            </div>
          </div>

          {/* Note list */}
          {sorted.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">Noch keine Notizen.</p>
          )}
          <div className="space-y-2">
            {sorted.map(n => (
              <div key={n.id} className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 relative group">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-400 mb-1">
                      <span className="font-medium">{formatDate(n.datum)}</span>
                      {n.autor && (
                        <span className="ml-2 text-gray-400">· {n.autor}</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{n.text}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(n.id)}
                    className="flex-shrink-0 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 mt-0.5"
                    title="Notiz löschen"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
