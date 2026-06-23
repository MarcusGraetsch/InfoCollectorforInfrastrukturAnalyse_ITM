import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { AppState, CategoryKey } from '../types';

interface SearchResult {
  categoryKey: CategoryKey;
  categoryLabel: string;
  itemId: string;
  itemName: string;
  itemKuerzel: string;
  matchField: string;
  matchSnippet: string;
  matchStart: number;
  matchEnd: number;
}

interface Props {
  state: AppState;
  onNavigate: (categoryKey: CategoryKey, itemId: string) => void;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  anwendungen: 'Anwendung',
  server: 'Server',
  clients: 'Client',
  netzkomponenten: 'Netzwerk',
  sicherheitskomponenten: 'Sicherheit',
  datentraeger: 'Datenträger',
  icsSysteme: 'ICS/OT',
  iotSysteme: 'IoT',
  betriebssysteme: 'Betriebssystem',
  schnittstellen: 'Schnittstelle',
  standorte: 'Standort',
  raeume: 'Raum',
  personen: 'Person',
  geschaeftsprozesse: 'Geschäftsprozess',
  netzverbindungen: 'Netzverbindung',
  gebaeude: 'Gebäude',
  daten: 'Daten',
};

const CATEGORY_BADGE_COLOR: Record<string, string> = {
  anwendungen: '#0d7377',
  server: '#0d7377',
  clients: '#0d7377',
  netzkomponenten: '#0d7377',
  icsSysteme: '#0d7377',
  iotSysteme: '#0d7377',
  betriebssysteme: '#0d7377',
  datentraeger: '#4a5568',
  sicherheitskomponenten: '#e84c1e',
  schnittstellen: '#4a5568',
  standorte: '#4a5568',
  raeume: '#4a5568',
  personen: '#4a5568',
  geschaeftsprozesse: '#4a5568',
  netzverbindungen: '#4a5568',
  gebaeude: '#4a5568',
  daten: '#4a5568',
};

const SEARCHABLE_CATEGORIES: CategoryKey[] = [
  'anwendungen', 'server', 'clients', 'netzkomponenten', 'datentraeger',
  'icsSysteme', 'iotSysteme', 'betriebssysteme', 'schnittstellen',
  'raeume', 'gebaeude', 'geschaeftsprozesse', 'netzverbindungen', 'daten',
];

const FIELD_LABELS: Record<string, string> = {
  name: 'Name', kuerzel: 'Kürzel', erlaeuterung: 'Erläuterung',
  tags: 'Tags', verantwortlicher: 'Verantwortlicher', status: 'Status',
  typ: 'Typ', benutzer: 'Benutzer', hersteller: 'Hersteller',
  modell: 'Modell', version: 'Version', plattform: 'Plattform',
  seriennummer: 'Seriennummer', inventarnummer: 'Inventarnummer',
  protokoll: 'Protokoll', ports: 'Ports',
};

function getLabelForField(key: string): string {
  return FIELD_LABELS[key] ?? key;
}

function searchState(state: AppState, query: string): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  for (const catKey of SEARCHABLE_CATEGORIES) {
    const items = state[catKey] as Record<string, unknown>[] | undefined;
    if (!Array.isArray(items)) continue;
    const catLabel = CATEGORY_LABELS[catKey] ?? catKey;

    for (const item of items) {
      if (results.length >= 50) break;
      const itemId = String(item['id'] ?? '');
      const itemName = String(item['name'] ?? '');
      const itemKuerzel = String(item['kuerzel'] ?? '');

      for (const [fieldKey, fieldVal] of Object.entries(item)) {
        if (typeof fieldVal !== 'string' || !fieldVal) continue;
        const idx = fieldVal.toLowerCase().indexOf(q);
        if (idx === -1) continue;
        results.push({
          categoryKey: catKey,
          categoryLabel: catLabel,
          itemId,
          itemName,
          itemKuerzel,
          matchField: getLabelForField(fieldKey),
          matchSnippet: fieldVal,
          matchStart: idx,
          matchEnd: idx + q.length,
        });
        break; // one match per item is enough
      }
      if (results.length >= 50) break;
    }
  }

  return results;
}

function HighlightedSnippet({ text, start, end }: { text: string; start: number; end: number }) {
  const maxLen = 80;
  let snippet = text;
  let adjStart = start;
  let adjEnd = end;

  if (text.length > maxLen) {
    const contextBefore = 20;
    const from = Math.max(0, start - contextBefore);
    snippet = (from > 0 ? '…' : '') + text.slice(from, from + maxLen);
    adjStart = start - from + (from > 0 ? 1 : 0);
    adjEnd = end - from + (from > 0 ? 1 : 0);
  }

  return (
    <span className="text-xs text-gray-500">
      {snippet.slice(0, adjStart)}
      <mark className="bg-yellow-200 text-yellow-900 font-semibold rounded px-0.5">
        {snippet.slice(adjStart, adjEnd)}
      </mark>
      {snippet.slice(adjEnd)}
    </span>
  );
}

export const GlobalSearch: React.FC<Props> = ({ state, onNavigate, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const results = React.useMemo(() => searchState(state, query), [state, query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      const r = results[selectedIndex];
      onNavigate(r.categoryKey, r.itemId);
      onClose();
    }
  }, [results, selectedIndex, onNavigate, onClose]);

  // Group results by category
  const grouped = React.useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    for (const r of results) {
      const existing = map.get(r.categoryLabel) ?? [];
      existing.push(r);
      map.set(r.categoryLabel, existing);
    }
    return map;
  }, [results]);

  let globalIdx = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-24 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[70vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Suche in allen Kategorien …"
            className="flex-1 text-sm outline-none text-gray-800 placeholder-gray-400 bg-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {!query && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <svg className="w-10 h-10 mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-sm">Suchbegriff eingeben …</p>
            </div>
          )}
          {query && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <p className="text-sm font-medium">Keine Ergebnisse</p>
              <p className="text-xs mt-1">Keine Einträge für „{query}" gefunden</p>
            </div>
          )}
          {query && results.length > 0 && (
            <div className="py-2">
              {Array.from(grouped.entries()).map(([catLabel, catResults]) => (
                <div key={catLabel}>
                  <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 sticky top-0">
                    {catLabel}
                  </div>
                  {catResults.map(result => {
                    const idx = globalIdx++;
                    const isSelected = idx === selectedIndex;
                    return (
                      <button
                        key={`${result.itemId}-${result.matchField}`}
                        className={`w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                        onClick={() => {
                          onNavigate(result.categoryKey, result.itemId);
                          onClose();
                        }}
                      >
                        <span
                          className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded text-white mt-0.5"
                          style={{ backgroundColor: CATEGORY_BADGE_COLOR[result.categoryKey] ?? '#4a5568' }}
                        >
                          {result.categoryLabel}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-800 truncate">{result.itemName}</span>
                            {result.itemKuerzel && (
                              <span className="text-xs text-gray-400 font-mono">{result.itemKuerzel}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[10px] text-gray-400 font-medium">{result.matchField}:</span>
                            <HighlightedSnippet
                              text={result.matchSnippet}
                              start={result.matchStart}
                              end={result.matchEnd}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
              {results.length >= 50 && (
                <p className="text-center text-xs text-gray-400 py-3">
                  Maximal 50 Ergebnisse angezeigt — Suche verfeinern
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {results.length > 0 ? `${results.length} Ergebnis${results.length !== 1 ? 'se' : ''}` : ''}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">↵</kbd>
            Öffnen
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">Esc</kbd>
            Schließen
          </span>
        </div>
      </div>
    </div>
  );
};
