import { useState, useEffect, useRef } from 'react';
import type { AppData } from './types';
import { loadData, saveData } from './store';
import { CATEGORIES } from './categories';
import CategoryList from './components/CategoryList';
import { exportToExcel } from './utils/export';
import { importFromExcel } from './utils/import';

export default function App() {
  const [data, setData] = useState<AppData>(loadData);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].key);
  const [saveStatus, setSaveStatus] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveData(data);
    setSaveStatus('Gespeichert');
    const t = setTimeout(() => setSaveStatus(''), 1500);
    return () => clearTimeout(t);
  }, [data]);

  const handleDataChange = (newData: AppData) => {
    setData({ ...newData, letzteAktualisierung: new Date().toISOString().split('T')[0] });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importFromExcel(file, data);
      handleDataChange(imported);
      alert('Import erfolgreich!');
    } catch {
      alert('Fehler beim Import. Bitte prüfen Sie die Datei.');
    }
    e.target.value = '';
  };

  const activeDef = CATEGORIES.find(c => c.key === activeCategory)!;

  const getCount = (key: string) => {
    const entries = (data as unknown as Record<string, unknown[]>)[key];
    return Array.isArray(entries) ? entries.length : 0;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header className="bg-blue-700 text-white shadow-md">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔒</span>
            <span className="text-lg font-bold tracking-tight">IT Strukturanalyse</span>
            <span className="text-blue-200 text-sm">BSI IT-Grundschutz</span>
          </div>
          <div className="flex-1 flex items-center gap-3 ml-4">
            <label className="text-sm text-blue-200 whitespace-nowrap">Kunde:</label>
            <input
              type="text"
              value={data.kundenname}
              onChange={e => handleDataChange({ ...data, kundenname: e.target.value })}
              placeholder="Kundenname eingeben..."
              className="border border-blue-500 rounded px-2 py-1 text-sm bg-blue-800 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 w-48"
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {saveStatus && (
              <span className="text-xs text-green-300">{saveStatus}</span>
            )}
            <span className="text-xs text-blue-300">{data.letzteAktualisierung}</span>
            <button
              onClick={() => importRef.current?.click()}
              className="px-3 py-1.5 bg-blue-600 border border-blue-400 text-white rounded text-sm hover:bg-blue-500"
            >
              📥 Import
            </button>
            <input ref={importRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
            <button
              onClick={() => exportToExcel(data)}
              className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-500 font-medium"
            >
              📤 Export XLSX
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-screen-xl mx-auto w-full">
        {/* Sidebar */}
        <nav className="w-56 bg-white shadow-sm border-r border-gray-200 shrink-0">
          <div className="py-4">
            <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Kategorien</div>
            {CATEGORIES.map(cat => {
              const count = getCount(cat.key);
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors ${
                    activeCategory === cat.key
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="flex-1 truncate">{cat.label}</span>
                  {count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeCategory === cat.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Summary */}
          <div className="px-4 py-3 border-t border-gray-200 mt-2">
            <div className="text-xs text-gray-400 mb-2">Gesamtübersicht</div>
            <div className="text-2xl font-bold text-blue-700">
              {CATEGORIES.reduce((s, c) => s + getCount(c.key), 0)}
            </div>
            <div className="text-xs text-gray-500">Zielobjekte gesamt</div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <CategoryList
            key={activeCategory}
            categoryDef={activeDef}
            data={data}
            onDataChange={handleDataChange}
          />
        </main>
      </div>
    </div>
  );
}
