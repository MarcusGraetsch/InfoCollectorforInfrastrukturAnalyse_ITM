import React, { useMemo } from 'react';
import type { AppState } from '../types';
import { countItemsWithOpenFields } from '../cloudFields';

export type AppMode = 'wizard' | 'detail' | 'dashboard' | 'offene-punkte' | 'projekt';

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
  onClearData: () => void;
}

const TABS = [
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
  {
    key: 'offene-punkte',
    label: 'Offene Punkte',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'projekt',
    label: 'Projekt',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12l2 2 4-4" />
      </svg>
    ),
  },
] as const satisfies { key: AppMode; label: string; icon: React.ReactNode }[];

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
  onClearData,
}) => {
  const importRef = React.useRef<HTMLInputElement>(null);
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);
  const [showClearDone, setShowClearDone] = React.useState(false);
  const offeneCount = useMemo(() => countItemsWithOpenFields(state), [state]);
  const [consultantName, setConsultantName] = React.useState(
    () => localStorage.getItem('consultant-name') ?? ''
  );
  const handleConsultantChange = (v: string) => {
    setConsultantName(v);
    localStorage.setItem('consultant-name', v);
  };

  const handleClearConfirmed = () => {
    onClearData();
    setShowClearConfirm(false);
    setShowClearDone(true);
  };

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

        {/* Customer + Consultant inputs */}
        <div className="flex items-center gap-4 flex-1 ml-4">
          <div className="flex items-center gap-2 max-w-xs">
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
          <div className="flex items-center gap-2 max-w-xs">
            <label className="text-hi-light text-xs whitespace-nowrap font-medium uppercase tracking-wider">
              Berater
            </label>
            <input
              type="text"
              value={consultantName}
              onChange={(e) => handleConsultantChange(e.target.value)}
              placeholder="Ihr Name …"
              className="border border-white/20 bg-white/10 text-white placeholder-white/40 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-hi-teal focus:border-hi-teal min-w-0 flex-1 transition-colors"
            />
          </div>
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
          <div className="w-px h-6 bg-white/20 mx-1" />
          <button
            onClick={() => setShowClearConfirm(true)}
            title="Alle lokalen Daten unwiderruflich löschen (vor Deinstallation)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white border border-red-500/40 rounded text-xs font-semibold uppercase tracking-wider transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Daten löschen
          </button>
        </div>
      </div>

      {/* Confirm dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-center text-hi-navy mb-2">Alle Daten löschen?</h2>
            <p className="text-sm text-hi-slate text-center leading-relaxed mb-4">
              Alle erfassten Daten dieser IT Strukturanalyse werden unwiderruflich aus dem Browser-Speicher gelöscht. Sichern Sie Ihre Daten vorher per JSON-Backup oder Excel-Export.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 text-xs text-amber-800">
              <strong>Wichtig:</strong> Schließen Sie alle anderen Browser-Tabs mit dieser App bevor Sie löschen — sonst können offene Tabs die Daten neu schreiben.
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5 text-xs text-red-700">
              Diese Aktion ist <strong>nicht rückgängig</strong> zu machen. Alle Einträge, Cloud-Bewertungen und Notizen gehen verloren.
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 text-sm font-semibold text-hi-navy border border-gray-200 rounded-lg hover:bg-hi-gray transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleClearConfirmed}
                className="flex-1 px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Ja, alles löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success dialog */}
      {showClearDone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-hi-navy mb-2">Daten gelöscht</h2>
            <p className="text-sm text-hi-slate leading-relaxed mb-4">
              Alle lokalen Daten wurden aus dem Browser-Speicher entfernt und durch einen leeren Zustand ersetzt.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-5 text-xs text-gray-600 text-left">
              <div className="font-semibold mb-1">Nächste Schritte bei der Deinstallation:</div>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Dieses Fenster schließen</li>
                <li>Browser-Tab schließen</li>
                <li>Deinstallation im Terminal fortsetzen</li>
              </ol>
            </div>
            <button
              onClick={() => setShowClearDone(false)}
              className="px-6 py-2 bg-hi-accent text-white rounded-lg text-sm font-bold hover:bg-hi-blue transition-colors"
            >
              Verstanden
            </button>
          </div>
        </div>
      )}

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
            {t.key === 'offene-punkte' && offeneCount > 0 && (
              <span className="ml-1 bg-amber-400 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                {offeneCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </header>
  );
};
