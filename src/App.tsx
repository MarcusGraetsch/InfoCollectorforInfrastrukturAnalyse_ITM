import React, { useState, useCallback } from 'react';
import type { AppState, CategoryKey } from './types';
import { loadState, saveState } from './store';
import { CATEGORIES, CATEGORY_MAP } from './categories';
import { AppHeader } from './components/AppHeader';
import type { AppMode } from './components/AppHeader';
import { CategoryList } from './components/CategoryList';
import { CategoryForm } from './components/CategoryForm';
import { Wizard } from './components/Wizard';
import { CloudDashboard } from './components/CloudDashboard';
import { exportToExcel, exportWorkshopPackage } from './utils/export';
import { exportToJSON, importFromJSON } from './utils/exportJSON';
import { exportConsultantReport } from './utils/exportReport';
import { importFromExcelWithMapping, importClassifiedRows } from './utils/import';
import { ImportWizard } from './components/ImportWizard';
import { EmailTemplate } from './components/EmailTemplate';
import { CloudReadinessWizard } from './components/CloudReadinessWizard';
import type { RowClassification } from './utils/importAnalyzer';
import type { CloudFields } from './types';

function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [mode, setMode] = useState<AppMode>('wizard');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('geschaeftsprozesse');
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editId, setEditId] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showEmailTemplate, setShowEmailTemplate] = useState(false);
  const [showCloudWizard, setShowCloudWizard] = useState(false);

  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  const handleCategoryChange = (key: CategoryKey) => {
    setActiveCategory(key);
    setView('list');
    setEditId(null);
  };
  const handleNew = () => { setEditId(null); setView('form'); };
  const handleEdit = (id: string) => { setEditId(id); setView('form'); };
  const handleDelete = (id: string) => {
    updateState((prev) => ({
      ...prev,
      [activeCategory]: (prev[activeCategory] as { id: string }[]).filter((i) => i.id !== id),
    }));
  };
  const handleSave = (item: Record<string, unknown>) => {
    updateState((prev) => {
      const arr = prev[activeCategory] as unknown as Record<string, unknown>[];
      if (editId) {
        return { ...prev, [activeCategory]: arr.map((i) => (i['id'] === editId ? item : i)) };
      }
      return { ...prev, [activeCategory]: [...arr, item] };
    });
    setView('list');
    setEditId(null);
  };
  const handleCancel = () => { setView('list'); setEditId(null); };

  const handleCustomerNameChange = (name: string) =>
    updateState((prev) => ({ ...prev, customerName: name }));
  const handleExport = () => exportToExcel(state);
  const handleExportWorkshop = () => exportWorkshopPackage(state);
  const handleExportJSON = () => exportToJSON(state);
  const handleExportReport = () => exportConsultantReport(state);
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.name.endsWith('.json')) {
      try {
        const text = await file.text();
        const newState = importFromJSON(text);
        setState(newState);
        saveState(newState);
        alert('JSON-Backup erfolgreich importiert!');
      } catch (err) {
        alert('JSON-Import fehlgeschlagen: ' + String(err));
      }
      e.target.value = '';
      return;
    }
    setImportFile(file);
    e.target.value = '';
  };
  const handleImportConfirm = async (mapping: Record<string, CategoryKey | null>) => {
    if (!importFile) return;
    try {
      const newState = await importFromExcelWithMapping(importFile, mapping, state);
      setState(newState);
      saveState(newState);
      setImportFile(null);
      alert('Import erfolgreich!');
    } catch (err) {
      alert('Import fehlgeschlagen: ' + String(err));
      setImportFile(null);
    }
  };

  const handleCloudFieldSave = (category: CategoryKey, id: string, fields: CloudFields) => {
    updateState(prev => {
      const arr = prev[category] as unknown as (Record<string, unknown>)[];
      return {
        ...prev,
        [category]: arr.map(item => item['id'] === id ? { ...item, ...fields } : item),
      };
    });
  };

  const handleImportRowsConfirm = (rows: RowClassification[]) => {
    if (!importFile) return;
    try {
      const newState = importClassifiedRows(rows, state);
      setState(newState);
      saveState(newState);
      setImportFile(null);
      alert(`Import erfolgreich! ${rows.length} Einträge importiert.`);
    } catch (err) {
      alert('Import fehlgeschlagen: ' + String(err));
      setImportFile(null);
    }
  };

  const categoryDef = CATEGORY_MAP[activeCategory];

  return (
    <div className="h-screen flex flex-col bg-hi-gray">
      <AppHeader
        state={state}
        mode={mode}
        onModeChange={setMode}
        onCustomerNameChange={handleCustomerNameChange}
        onImport={handleImport}
        onExport={handleExport}
        onExportWorkshop={handleExportWorkshop}
        onExportJSON={handleExportJSON}
        onExportReport={handleExportReport}
      />

      <div className="flex-1 overflow-hidden">
        {mode === 'wizard' && (
          <Wizard
            state={state}
            updateState={updateState}
            onImport={handleImport}
            onGoToDashboard={() => setMode('dashboard')}
            onShowEmailTemplate={() => setShowEmailTemplate(true)}
          />
        )}

        {mode === 'dashboard' && (
          <div className="h-full overflow-y-auto">
            <CloudDashboard
            state={state}
            onGoToWizard={() => setMode('wizard')}
            onOpenCloudWizard={() => setShowCloudWizard(true)}
          />
          </div>
        )}

        {mode === 'detail' && (
          <div className="flex h-full overflow-hidden">
            <aside className="w-64 bg-hi-navy flex-shrink-0 overflow-y-auto">
              <nav className="p-3">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-3 py-2">
                  Kategorien
                </p>
                {CATEGORIES.map((cat) => {
                  const count = (state[cat.key] as unknown[]).length;
                  const isActive = cat.key === activeCategory;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => handleCategoryChange(cat.key)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5 ${
                        isActive
                          ? 'bg-hi-accent text-white shadow-lg'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </aside>
            <main className="flex-1 p-6 overflow-y-auto bg-hi-gray">
              {view === 'list' ? (
                <CategoryList
                  categoryDef={categoryDef}
                  state={state}
                  onNew={handleNew}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ) : (
                <CategoryForm
                  categoryDef={categoryDef}
                  state={state}
                  editId={editId}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              )}
            </main>
          </div>
        )}
      </div>

      {importFile && (
        <ImportWizard
          file={importFile}
          onConfirm={handleImportConfirm}
          onConfirmRows={handleImportRowsConfirm}
          onCancel={() => setImportFile(null)}
        />
      )}
      {showCloudWizard && (
        <CloudReadinessWizard
          state={state}
          onSave={handleCloudFieldSave}
          onClose={() => setShowCloudWizard(false)}
        />
      )}
      {showEmailTemplate && (
        <EmailTemplate
          customerName={state.customerName}
          onClose={() => setShowEmailTemplate(false)}
        />
      )}
    </div>
  );
}

export default App;
