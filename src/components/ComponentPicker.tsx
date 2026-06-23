import React, { useState, useEffect, useRef } from 'react';
import type { ComponentCatalogEntry, ComponentKind } from '../data/componentCatalog';
import { searchComponents, getComponentSuggestionsForCategory } from '../utils/componentCatalog';
import { COMPONENT_CATALOG } from '../data/componentCatalog';

interface ComponentPickerProps {
  categoryKey: string;
  onSelect: (entry: ComponentCatalogEntry, version: string) => void;
  onClose: () => void;
}

const KIND_LABELS: { kind: ComponentKind | 'all'; label: string }[] = [
  { kind: 'all', label: 'Alle' },
  { kind: 'os', label: 'OS' },
  { kind: 'database', label: 'Datenbank' },
  { kind: 'webserver', label: 'Web-Server' },
  { kind: 'appserver', label: 'App-Server' },
  { kind: 'iam', label: 'IAM' },
  { kind: 'virtualization', label: 'Virtualisierung' },
  { kind: 'container', label: 'Container' },
  { kind: 'monitoring', label: 'Monitoring' },
  { kind: 'backup', label: 'Backup' },
  { kind: 'storage', label: 'Storage' },
  { kind: 'network', label: 'Netzwerk' },
  { kind: 'security', label: 'Sicherheit' },
  { kind: 'office', label: 'Office' },
  { kind: 'erp', label: 'ERP' },
  { kind: 'crm', label: 'CRM' },
  { kind: 'ics', label: 'ICS' },
  { kind: 'iot', label: 'IoT' },
  { kind: 'middleware', label: 'Middleware' },
  { kind: 'devops', label: 'DevOps' },
  { kind: 'ai', label: 'KI / AI' },
  { kind: 'vdi', label: 'VDI' },
  { kind: 'hardware', label: 'Hardware' },
  { kind: 'cloud', label: 'Cloud/Hyperscaler' },
];

const CATEGORY_CONTEXT: Record<string, { layer: string; hint: string }> = {
  server:              { layer: 'Infrastruktur', hint: 'Server-Objekte: Hardware-Einträge und Hypervisoren. Software (Datenbanken, Web-Server usw.) gehört in die Kategorie „Anwendungen".' },
  clients:             { layer: 'Infrastruktur', hint: 'Endgeräte: Notebooks, Desktops, Mobilgeräte.' },
  betriebssysteme:     { layer: 'Plattform', hint: 'Betriebssysteme, die auf Servern oder Clients installiert sind.' },
  anwendungen:         { layer: 'Software', hint: 'Alle Software-Anwendungen: Datenbanken, Web-Server, ERP, Monitoring, Office-Suites, Cloud-Dienste usw.' },
  netzkomponenten:     { layer: 'Netzwerk', hint: 'Netzwerkgeräte: Switches, Router, Firewalls, VPN-Gateways.' },
  sicherheitskomponenten: { layer: 'Sicherheit', hint: 'Sicherheitskomponenten: Firewalls, EDR, SIEM, IAM, Scanner.' },
  datentraeger:        { layer: 'Speicher', hint: 'Speichermedien und -systeme: NAS, SAN, Storage Arrays.' },
  icsSysteme:          { layer: 'OT/ICS', hint: 'Industrielle Steuerungssysteme: SPSen, SCADA, HMI.' },
  iotSysteme:          { layer: 'IoT', hint: 'IoT-Systeme: Gateways, Sensoren, Broker, eingebettete Systeme.' },
};

const CATEGORY_RELEVANT_KINDS: Record<string, ComponentKind[]> = {
  server:           ['hardware', 'virtualization'],
  clients:          ['hardware', 'os'],
  betriebssysteme:  ['os'],
  anwendungen:      ['database', 'webserver', 'appserver', 'iam', 'container', 'monitoring', 'backup', 'middleware', 'devops', 'security', 'office', 'erp', 'crm', 'ai', 'vdi', 'cloud'],
  netzkomponenten:  ['network', 'security'],
  sicherheitskomponenten: ['security', 'iam', 'network'],
  datentraeger:     ['storage', 'backup'],
  icsSysteme:       ['ics'],
  iotSysteme:       ['iot', 'os', 'hardware'],
};

export const ComponentPicker: React.FC<ComponentPickerProps> = ({ categoryKey, onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedKind, setSelectedKind] = useState<ComponentKind | 'all'>('all');
  const [selectedEntry, setSelectedEntry] = useState<ComponentCatalogEntry | null>(null);
  const [selectedVersion, setSelectedVersion] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results: ComponentCatalogEntry[] = query.length >= 2
    ? searchComponents(query, selectedKind === 'all' ? undefined : selectedKind, 30)
    : getComponentSuggestionsForCategory(categoryKey, 50).filter(
        e => selectedKind === 'all' || e.kind === selectedKind
      );

  const kindHasEntriesForCategory = (kind: ComponentKind) =>
    COMPONENT_CATALOG.some(e => e.kind === kind && e.categoryTargets.includes(categoryKey));

  const relevantKinds = new Set<ComponentKind>(CATEGORY_RELEVANT_KINDS[categoryKey] ?? []);
  const primaryKinds = KIND_LABELS.filter(k => k.kind !== 'all' && relevantKinds.has(k.kind as ComponentKind));
  const otherKinds = KIND_LABELS.filter(k => k.kind !== 'all' && !relevantKinds.has(k.kind as ComponentKind));

  const handleApply = () => {
    if (!selectedEntry) return;
    onSelect(selectedEntry, selectedVersion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-hi-accent flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-hi-navy">IT-Komponentenkatalog</h2>
            <p className="text-xs text-hi-slate">Produkt auswählen — nur leere Felder werden befüllt</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-lg text-hi-slate hover:bg-gray-100 transition-colors"
            aria-label="Schließen"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Category context banner */}
        {CATEGORY_CONTEXT[categoryKey] && (
          <div className="px-6 pt-3 pb-0">
            <div className="bg-sky-50 border border-sky-100 rounded-lg px-3 py-2">
              <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wide mr-2">{CATEGORY_CONTEXT[categoryKey].layer}</span>
              <span className="text-xs text-sky-800">{CATEGORY_CONTEXT[categoryKey].hint}</span>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="px-6 pt-4 pb-2">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedEntry(null); setSelectedVersion(''); }}
            placeholder="Suchen: z.B. PostgreSQL, Windows Server, Zabbix…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hi-accent focus:border-hi-accent bg-white"
          />
        </div>

        {/* Kind filter — primary kinds first, then divider, then secondary */}
        <div className="px-6 pb-2 flex gap-1.5 flex-wrap items-center">
          {/* All button */}
          <button
            key="all"
            type="button"
            onClick={() => { setSelectedKind('all'); setSelectedEntry(null); }}
            className={`px-2.5 py-1 text-xs rounded-full border transition-colors font-medium ${
              selectedKind === 'all'
                ? 'bg-hi-accent text-white border-hi-accent'
                : 'bg-white border-gray-200 text-hi-slate hover:border-hi-accent/50 hover:text-hi-accent'
            }`}
          >
            Alle
          </button>
          {/* Primary (relevant) kinds */}
          {primaryKinds.map(({ kind, label }) => {
            const disabled = !kindHasEntriesForCategory(kind as ComponentKind);
            return (
              <button
                key={kind}
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (disabled) return;
                  setSelectedKind(kind as ComponentKind | 'all');
                  setSelectedEntry(null);
                }}
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors font-medium ${
                  disabled
                    ? 'bg-white border-gray-100 text-gray-400 opacity-40 cursor-not-allowed'
                    : selectedKind === kind
                    ? 'bg-hi-accent text-white border-hi-accent'
                    : 'bg-white border-gray-200 text-hi-slate hover:border-hi-accent/50 hover:text-hi-accent'
                }`}
              >
                {label}
              </button>
            );
          })}
          {/* Divider between primary and secondary */}
          {primaryKinds.length > 0 && otherKinds.length > 0 && (
            <span className="text-gray-300 text-sm select-none">|</span>
          )}
          {/* Secondary (less relevant) kinds — dimmed */}
          {otherKinds.map(({ kind, label }) => {
            const disabled = !kindHasEntriesForCategory(kind as ComponentKind);
            return (
              <button
                key={kind}
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (disabled) return;
                  setSelectedKind(kind as ComponentKind | 'all');
                  setSelectedEntry(null);
                }}
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors font-medium opacity-50 ${
                  disabled
                    ? 'bg-white border-gray-100 text-gray-400 cursor-not-allowed'
                    : selectedKind === kind
                    ? 'bg-hi-accent text-white border-hi-accent opacity-100'
                    : 'bg-white border-gray-200 text-hi-slate hover:border-hi-accent/50 hover:text-hi-accent hover:opacity-100'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-1 min-h-0">
          {results.length === 0 && (
            <div className="py-6 text-center">
              {query.length >= 2 ? (
                <p className="text-sm text-hi-slate">Keine Einträge für „{query}" gefunden.</p>
              ) : selectedKind !== 'all' ? (
                <p className="text-sm text-hi-slate">
                  Keine {KIND_LABELS.find(k => k.kind === selectedKind)?.label}-Einträge für diese Kategorie.<br/>
                  <span className="text-xs">Tipp: Suchbegriff eingeben um den gesamten Katalog zu durchsuchen.</span>
                </p>
              ) : (
                <p className="text-sm text-hi-slate">Keine Einträge für diese Kategorie.</p>
              )}
            </div>
          )}
          {results.map(entry => (
            <button
              key={entry.id}
              type="button"
              onClick={() => { setSelectedEntry(entry); setSelectedVersion(''); }}
              className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                selectedEntry?.id === entry.id
                  ? 'bg-hi-accent/10 border-hi-accent text-hi-navy'
                  : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200 text-hi-navy'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-sm font-semibold">{entry.product}</span>
                  <span className="text-xs text-hi-slate ml-2">{entry.vendor}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {entry.oeffentlicherSektor && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-700">ÖS</span>
                  )}
                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-600">{entry.kind}</span>
                </div>
              </div>
              {entry.defaultFields.lizenzart && (
                <p className="text-[11px] text-hi-slate mt-0.5">{entry.defaultFields.lizenzart}</p>
              )}
            </button>
          ))}
          {query.length < 2 && results.length > 0 && (
            <p className="text-[11px] text-hi-slate pt-1 pb-2">Vorschläge für Kategorie „{categoryKey}" — Suchbegriff eingeben für mehr Ergebnisse</p>
          )}
        </div>

        {/* Version selector + Apply */}
        {selectedEntry && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-hi-navy">{selectedEntry.product}</p>
                <p className="text-xs text-hi-slate">{selectedEntry.vendor}</p>
                {selectedEntry.spec && (
                  <p className="text-[11px] text-gray-500 mt-1">{selectedEntry.spec}</p>
                )}
                {selectedEntry.priceInfo && (
                  <p className="text-[11px] text-gray-500 mt-0.5">💶 indikativ: {selectedEntry.priceInfo}</p>
                )}
              </div>
              {selectedEntry.versions && selectedEntry.versions.length > 0 && (
                <div className="flex-shrink-0">
                  <label className="block text-xs text-hi-slate mb-1">Version</label>
                  <select
                    value={selectedVersion}
                    onChange={e => setSelectedVersion(e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-hi-accent"
                  >
                    <option value="">— keine —</option>
                    {selectedEntry.versions.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={handleApply}
                className="px-5 py-2 bg-hi-accent text-white rounded-lg font-semibold text-sm hover:bg-hi-blue transition-colors shadow-sm"
              >
                Übernehmen
              </button>
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 border border-gray-200 text-hi-slate rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <p className="text-[11px] text-hi-slate ml-1">Nur leere Felder werden befüllt</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
