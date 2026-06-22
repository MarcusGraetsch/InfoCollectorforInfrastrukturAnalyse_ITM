import { useState, useEffect } from 'react';
import type { AppState, Snapshot } from '../types';
import type { DeltaResult } from '../snapshotStore';
import {
  loadSnapshots,
  saveSnapshot,
  deleteSnapshot,
  computeDelta,
} from '../snapshotStore';

interface Props {
  state: AppState;
  onRestore: (state: AppState) => void;
}

const STATUS_COLORS: Record<string, string> = {
  added: 'bg-green-100 text-green-800',
  removed: 'bg-red-100 text-red-800',
  changed: 'bg-yellow-100 text-yellow-800',
};

const STATUS_LABELS: Record<string, string> = {
  added: 'Neu',
  removed: 'Entfernt',
  changed: 'Geändert',
};

export function VersionControl({ state, onRestore }: Props) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [compareA, setCompareA] = useState<string>('');
  const [compareB, setCompareB] = useState<string>('');
  const [delta, setDelta] = useState<DeltaResult | null>(null);
  const [showDelta, setShowDelta] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

  useEffect(() => {
    setSnapshots(loadSnapshots());
  }, []);

  function refresh() {
    const s = loadSnapshots();
    setSnapshots(s);
    if (s.length >= 2 && !compareA) setCompareA(s[1].id);
    if (s.length >= 1 && !compareB) setCompareB(s[0].id);
  }

  function handleCreate() {
    const label = newLabel.trim() || `Snapshot ${new Date().toLocaleString('de-DE')}`;
    saveSnapshot(state, label);
    setNewLabel('');
    refresh();
  }

  function handleDelete(id: string) {
    deleteSnapshot(id);
    refresh();
    if (compareA === id) setCompareA('');
    if (compareB === id) setCompareB('');
    setDelta(null);
  }

  function handleCompare() {
    const sA = snapshots.find((s) => s.id === compareA);
    const sB = snapshots.find((s) => s.id === compareB);
    if (!sA || !sB || sA.id === sB.id) return;
    setDelta(computeDelta(sA, sB));
    setShowDelta(true);
  }

  function handleRestore(id: string) {
    const snap = snapshots.find((s) => s.id === id);
    if (!snap) return;
    onRestore(snap.state);
    setConfirmRestore(null);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-hi-slate/20 p-6">
        <h2 className="text-lg font-bold text-hi-navy mb-4">Snapshot erstellen</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder={`Snapshot ${new Date().toLocaleString('de-DE')}`}
            className="flex-1 border border-hi-slate/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hi-accent"
          />
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-hi-accent text-white rounded-lg text-sm font-medium hover:bg-hi-accent/90"
          >
            Snapshot speichern
          </button>
        </div>
        <p className="text-xs text-hi-slate mt-2">
          Speichert den aktuellen Zustand aller Daten als wiederherstellbaren Versionspunkt (max. 20).
        </p>
      </div>

      {snapshots.length >= 2 && (
        <div className="bg-white rounded-xl shadow-sm border border-hi-slate/20 p-6">
          <h2 className="text-lg font-bold text-hi-navy mb-4">Delta-Vergleich</h2>
          <div className="flex gap-3 flex-wrap items-end">
            <div>
              <label className="block text-xs text-hi-slate mb-1">Basis (älter)</label>
              <select
                value={compareA}
                onChange={(e) => setCompareA(e.target.value)}
                className="border border-hi-slate/30 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">— wählen —</option>
                {snapshots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({new Date(s.createdAt).toLocaleString('de-DE')})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-hi-slate mb-1">Vergleich (neuer)</label>
              <select
                value={compareB}
                onChange={(e) => setCompareB(e.target.value)}
                className="border border-hi-slate/30 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">— wählen —</option>
                {snapshots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({new Date(s.createdAt).toLocaleString('de-DE')})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleCompare}
              disabled={!compareA || !compareB || compareA === compareB}
              className="px-4 py-2 bg-hi-teal text-white rounded-lg text-sm font-medium hover:bg-hi-teal/90 disabled:opacity-40"
            >
              Vergleichen
            </button>
          </div>

          {showDelta && delta && (
            <div className="mt-5 space-y-4">
              <div className="flex gap-4 flex-wrap">
                {([['added', 'Neu'], ['removed', 'Entfernt'], ['changed', 'Geändert'], ['unchanged', 'Unverändert']] as const).map(([k, label]) => (
                  <div key={k} className="text-center">
                    <div className="text-2xl font-bold text-hi-navy">{delta.summary[k]}</div>
                    <div className="text-xs text-hi-slate">{label}</div>
                  </div>
                ))}
              </div>
              {delta.items.length === 0 ? (
                <p className="text-sm text-hi-slate italic">Keine Unterschiede gefunden.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-hi-slate/20 text-left text-xs text-hi-slate uppercase">
                        <th className="pb-2 pr-3">Kategorie</th>
                        <th className="pb-2 pr-3">Name</th>
                        <th className="pb-2 pr-3">Status</th>
                        <th className="pb-2">Geänderte Felder</th>
                      </tr>
                    </thead>
                    <tbody>
                      {delta.items.map((d, i) => (
                        <tr key={i} className="border-b border-hi-slate/10">
                          <td className="py-1.5 pr-3 text-hi-slate">{d.category}</td>
                          <td className="py-1.5 pr-3 font-medium text-hi-navy">{d.name}</td>
                          <td className="py-1.5 pr-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[d.status] ?? ''}`}>
                              {STATUS_LABELS[d.status] ?? d.status}
                            </span>
                          </td>
                          <td className="py-1.5 text-xs text-hi-slate">
                            {d.changedFields?.join(', ') ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-hi-slate/20 p-6">
        <h2 className="text-lg font-bold text-hi-navy mb-4">
          Gespeicherte Snapshots ({snapshots.length})
        </h2>
        {snapshots.length === 0 ? (
          <p className="text-sm text-hi-slate italic">Noch keine Snapshots vorhanden.</p>
        ) : (
          <ul className="divide-y divide-hi-slate/10">
            {snapshots.map((s) => (
              <li key={s.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-hi-navy text-sm">{s.label}</p>
                  <p className="text-xs text-hi-slate">
                    {new Date(s.createdAt).toLocaleString('de-DE')}
                  </p>
                </div>
                <div className="flex gap-2">
                  {confirmRestore === s.id ? (
                    <>
                      <span className="text-xs text-red-600 self-center">Aktuellen Stand überschreiben?</span>
                      <button
                        onClick={() => handleRestore(s.id)}
                        className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium"
                      >
                        Ja, wiederherstellen
                      </button>
                      <button
                        onClick={() => setConfirmRestore(null)}
                        className="px-3 py-1.5 border border-hi-slate/30 rounded text-xs"
                      >
                        Abbrechen
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setConfirmRestore(s.id)}
                        className="px-3 py-1.5 bg-hi-accent/10 text-hi-accent rounded text-xs font-medium hover:bg-hi-accent/20"
                      >
                        Wiederherstellen
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded text-xs font-medium hover:bg-red-100"
                      >
                        Löschen
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
