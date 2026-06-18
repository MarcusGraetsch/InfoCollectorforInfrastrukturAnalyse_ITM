import React from 'react';
import type { AppState } from '../types';

export type AppMode = 'wizard' | 'detail' | 'dashboard';

interface Props {
  state: AppState;
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onCustomerNameChange: (name: string) => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onExportWorkshop: () => void;
  onExportJSON: () => void;
  onExportReport: () => void;
}

const TABS: { key: AppMode; label: string; icon: React.ReactNode }[] = [
  {
    key: 'wizard',
    label: 'Assistent',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    key: 'detail',
    label: 'Detailansicht',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    key: 'dashboard',
    label: 'Cloud-Readiness',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
  },
];

export const AppHeader: React.FC<Props> = ({
  state,
  mode,
  onModeChange,
  onCustomerNameChange,
  onImport,
  onExport,
  onExportWorkshop,
  onExportJSON,
  onExportReport,
}) => {
  const importRef = React.useRef<HTMLInputElement>(null);

  return (
    <header className="bg-hi-navy text-white shadow-2xl flex-shrink-0">
      {/* Top bar */}
      <div className="px-6 py-3 flex items-center gap-4 border-b border-white/10">
        {/* Logo / Brand */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1">
            {/* HiSolutions-style logo mark */}
            <div className="w-8 h-8 rounded bg-hi-accent flex items-center justify-center shadow-lg">
              <span className="font-bold text-white text-xs tracking-tight">Hi</span>
            </div>
            <div className="w-1 h-8 bg-hi-teal rounded-full mx-1" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-widest text-white uppercase leading-none">
              IT Strukturanalyse
            </div>
            <div className="text-[10px] text-hi-light tracking-wider uppercase mt-0.5">
              HiSolutions AG · Cloud-Readiness Suite
            </div>
          </div>
        </div>

        {/* Customer input */}
        <div className="flex items-center gap-2 flex-1 max-w-xs ml-4">
          <label className="text-hi-light text-xs whitespace-nowrap font-medium uppercase tracking-wider">
            Kunde
          </label>
          <input
            type="text"
            value={state.customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            placeholder="Kundenname …"
            className="border border-white/20 bg-white/10 text-white placeholder-white/40 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-hi-teal focus:border-hi-teal min-w-0 flex-1 transition-colors"
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 ml-auto items-center flex-wrap justify-end">
          <button
            onClick={onExportWorkshop}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-hi-teal hover:bg-teal-500 text-white rounded text-xs font-semibold uppercase tracking-wider transition-all shadow hover:shadow-lg"
            title="Strukturanalyse + Cloud-Readiness als Workshop-Paket exportieren"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Workshop-Export
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-semibold uppercase tracking-wider transition-all"
            title="Alle Daten als Excel-Datei exportieren"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Excel Export
          </button>
          <button
            onClick={onExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold uppercase tracking-wider transition-all"
            title="Vollständiges Backup als JSON (re-importierbar)"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M9 3h6M12 3v10m-3-3l3 3 3-3" />
            </svg>
            JSON-Backup
          </button>
          <button
            onClick={onExportReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded text-xs font-semibold uppercase tracking-wider transition-all"
            title="Consultant-Bericht als druckbares HTML exportieren"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Bericht (HTML)
          </button>
          <button
            onClick={() => importRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded text-xs font-semibold uppercase tracking-wider transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Import
          </button>
          <input ref={importRef} type="file" accept=".xlsx,.xls,.csv,.txt,.tsv,.docx,.pdf,.json" onChange={onImport} className="hidden" />
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="px-6 flex gap-0.5 pt-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => onModeChange(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
              mode === t.key
                ? 'bg-hi-gray text-hi-navy shadow-inner'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
    </header>
  );
};
