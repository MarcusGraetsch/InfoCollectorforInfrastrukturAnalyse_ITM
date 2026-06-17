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
}

const TABS: { key: AppMode; label: string; icon: string }[] = [
  { key: 'wizard', label: 'Assistent', icon: '🧭' },
  { key: 'detail', label: 'Detailansicht', icon: '🗂️' },
  { key: 'dashboard', label: 'Cloud-Readiness', icon: '☁️' },
];

export const AppHeader: React.FC<Props> = ({
  state,
  mode,
  onModeChange,
  onCustomerNameChange,
  onImport,
  onExport,
  onExportWorkshop,
}) => {
  const importRef = React.useRef<HTMLInputElement>(null);

  return (
    <header className="bg-blue-700 text-white shadow-md">
      <div className="px-6 py-3 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <span className="text-blue-700 font-bold text-sm">IT</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight whitespace-nowrap">IT Strukturanalyse</h1>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
          <label className="text-blue-200 text-sm whitespace-nowrap">Kunde:</label>
          <input
            type="text"
            value={state.customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            placeholder="Kundenname …"
            className="border border-blue-500 bg-blue-800 text-white placeholder-blue-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-0 flex-1 max-w-xs"
          />
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={onExportWorkshop}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-white rounded text-sm font-medium transition-colors"
            title="Strukturanalyse + Cloud-Readiness als Workshop-Paket exportieren"
          >
            📦 Workshop-Export
          </button>
          <button
            onClick={onExport}
            className="px-3 py-1.5 bg-green-500 hover:bg-green-400 text-white rounded text-sm font-medium transition-colors"
          >
            Excel Export
          </button>
          <button
            onClick={() => importRef.current?.click()}
            className="px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-50 rounded text-sm font-medium transition-colors"
          >
            Excel Import
          </button>
          <input ref={importRef} type="file" accept=".xlsx,.xls" onChange={onImport} className="hidden" />
        </div>
      </div>

      {/* Mode tabs */}
      <div className="px-6 flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => onModeChange(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              mode === t.key
                ? 'bg-gray-100 text-blue-700'
                : 'text-blue-100 hover:bg-blue-600'
            }`}
          >
            <span className="mr-1">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
    </header>
  );
};
