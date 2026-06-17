import React from 'react';
import { CATEGORIES } from '../categories';
import type { AppState, CategoryKey } from '../types';

interface Props {
  state: AppState;
  activeCategory: CategoryKey;
  onCategoryChange: (key: CategoryKey) => void;
  onCustomerNameChange: (name: string) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<Props> = ({
  state,
  activeCategory,
  onCategoryChange,
  onCustomerNameChange,
  onExport,
  onImport,
  children,
}) => {
  const importRef = React.useRef<HTMLInputElement>(null);

  const lastUpdated = state.lastUpdated
    ? new Date(state.lastUpdated).toLocaleString('de-DE')
    : '';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-blue-700 text-white shadow-md">
        <div className="px-6 py-4 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <span className="text-blue-700 font-bold text-sm">IT</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">IT Strukturanalyse</h1>
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <label className="text-blue-200 text-sm whitespace-nowrap">Kunde:</label>
            <input
              type="text"
              value={state.customerName}
              onChange={(e) => onCustomerNameChange(e.target.value)}
              placeholder="Kundenname eingeben..."
              className="border border-blue-500 bg-blue-800 text-white placeholder-blue-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-0 flex-1 max-w-xs"
            />
          </div>
          {lastUpdated && (
            <span className="text-blue-200 text-xs whitespace-nowrap">
              Letzte Änderung: {lastUpdated}
            </span>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={onExport}
              className="px-4 py-1.5 bg-green-500 hover:bg-green-400 text-white rounded text-sm font-medium transition-colors"
            >
              Excel Export
            </button>
            <button
              onClick={() => importRef.current?.click()}
              className="px-4 py-1.5 bg-white text-blue-700 hover:bg-blue-50 rounded text-sm font-medium transition-colors"
            >
              Excel Import
            </button>
            <input
              ref={importRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={onImport}
              className="hidden"
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md flex-shrink-0 overflow-y-auto">
          <nav className="p-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
              Kategorien
            </p>
            {CATEGORIES.map((cat) => {
              const count = (state[cat.key] as unknown[]).length;
              const isActive = cat.key === activeCategory;
              return (
                <button
                  key={cat.key}
                  onClick={() => onCategoryChange(cat.key)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
