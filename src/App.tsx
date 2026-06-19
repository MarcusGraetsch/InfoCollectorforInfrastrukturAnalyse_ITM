import React, { useState, useCallback } from 'react';
import type { AppState, CategoryKey } from './types';
import { loadState, saveState, createDefaultState, clearState, generateId } from './store';
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
import { OffenePunkte } from './components/OffenePunkte';
import { ProjectView } from './components/ProjectView';
import type { Liefergegenstand, Meeting, Stakeholder } from './types';
import type { RowClassification } from './utils/importAnalyzer';
import type { CloudFields } from './types';
import { syncBidirectionalLinks } from './utils/bidirectional';

function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [mode, setMode] = useState<AppMode>('wizard');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('geschaeftsprozesse');
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editId, setEditId] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showEmailTemplate, setShowEmailTemplate] = useState(false);
  const [cloudWizardTargetId, setCloudWizardTargetId] = useState<string | null>(null);

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
      const base = editId
        ? { ...prev, [activeCategory]: arr.map((i) => (i['id'] === editId ? item : i)) }
        : { ...prev, [activeCategory]: [...arr, item] };
      return syncBidirectionalLinks(base, activeCategory, item);
    });
    setView('list');
    setEditId(null);
  };

  const handleBatchCloudUpdate = (updates: { category: CategoryKey; id: string; field: string; value: string }[]) => {
    updateState((prev) => {
      let next = { ...prev };
      for (const { category, id, field, value } of updates) {
        const arr = next[category] as unknown as Record<string, unknown>[];
        next = { ...next, [category]: arr.map(item => item['id'] === id ? { ...item, [field]: value } : item) };
      }
      return next;
    });
  };

  const handleApplyLinks = (links: { sourceCategory: CategoryKey; sourceId: string; sourceField: string; targetIds: string[] }[]) => {
    updateState((prev) => {
      // Rein akkumulativ: jeder Link wird nacheinander auf den jeweils
      // aktuellsten Zustand angewandt — keine Seiteneffekte in .map.
      return links.reduce<AppState>((acc, { sourceCategory, sourceId, sourceField, targetIds }) => {
        const arr = acc[sourceCategory] as unknown as Record<string, unknown>[];
        const sourceItem = arr.find(i => i['id'] === sourceId);
        if (!sourceItem) return acc;

        const current = (sourceItem[sourceField] as string[] | undefined) ?? [];
        const merged = [...new Set([...current, ...targetIds])];
        const updatedItem = { ...sourceItem, [sourceField]: merged };

        const withSource: AppState = {
          ...acc,
          [sourceCategory]: arr.map(i => (i['id'] === sourceId ? updatedItem : i)),
        };
        // Gegen-Links in den Ziel-Kategorien synchronisieren
        return syncBidirectionalLinks(withSource, sourceCategory, updatedItem);
      }, prev);
    });
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
      const withDoc = addQuelldokument(newState, importFile.name, 'Excel');
      setState(withDoc);
      saveState(withDoc);
      setImportFile(null);
      alert('Import erfolgreich!');
    } catch (err) {
      alert('Import fehlgeschlagen: ' + String(err));
      setImportFile(null);
    }
  };

  const handleCloudFieldSave = (
    originalCategory: CategoryKey,
    id: string,
    fields: CloudFields,
    meta: { name: string; kuerzel: string; category: CategoryKey }
  ) => {
    updateState(prev => {
      const newState = { ...prev };
      // Update cloud fields (and optionally name/kuerzel) on the original category
      const arr = prev[originalCategory] as unknown as (Record<string, unknown>)[];
      const updated = arr.map(item =>
        item['id'] === id ? { ...item, ...fields, name: meta.name, kuerzel: meta.kuerzel } : item
      );

      if (meta.category === originalCategory) {
        // Same category: just update in place
        return { ...newState, [originalCategory]: updated };
      }

      // Category changed: remove from original, add to new category
      const movedItem = updated.find(item => item['id'] === id);
      if (!movedItem) return newState;

      const withoutMoved = updated.filter(item => item['id'] !== id);
      const targetArr = prev[meta.category] as unknown as (Record<string, unknown>)[];

      return {
        ...newState,
        [originalCategory]: withoutMoved,
        [meta.category]: [...targetArr, movedItem],
      };
    });
  };

  const handleImportRowsConfirm = (rows: RowClassification[]) => {
    if (!importFile) return;
    try {
      const newState = importClassifiedRows(rows, state);
      const withDoc = addQuelldokument(newState, importFile.name, 'Excel');
      setState(withDoc);
      saveState(withDoc);
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
        onClearData={() => {
          clearState();           // entfernt Installations-ID + Daten-Key
          setState(createDefaultState()); // frisches Default-Objekt setzen
          setMode('wizard');
          // Nächster saveState-Aufruf generiert neue ID → neuer Key → sauber
        }}
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

        {mode === 'offene-punkte' && (
          <div className="h-full overflow-y-auto">
            <OffenePunkte
              state={state}
              onEditItem={id => setCloudWizardTargetId(id)}
              onBatchCloudUpdate={handleBatchCloudUpdate}
              onApplyLinks={handleApplyLinks}
            />
          </div>
        )}

        {mode === 'projekt' && (
          <div className="h-full overflow-hidden flex flex-col">
            <ProjectView
              state={state}
              onUpdateLG={(id, changes) => updateState(prev => ({
                ...prev,
                liefergegenstaende: prev.liefergegenstaende.map(lg =>
                  lg.id === id ? { ...lg, ...changes } as Liefergegenstand : lg
                ),
              }))}
              onUpdateStakeholder={stakeholder => updateState(prev => ({ ...prev, stakeholder } as AppState & { stakeholder: Stakeholder[] }))}
              onUpdateMeetings={meetings => updateState(prev => ({ ...prev, meetings } as AppState & { meetings: Meeting[] }))}
            />
          </div>
        )}

        {mode === 'dashboard' && (
          <div className="h-full overflow-y-auto">
            <CloudDashboard
            state={state}
            onGoToWizard={() => setMode('wizard')}
            onOpenCloudWizard={() => setCloudWizardTargetId('')}
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
      {cloudWizardTargetId !== null && (
        <CloudReadinessWizard
          state={state}
          onSave={handleCloudFieldSave}
          onClose={() => setCloudWizardTargetId(null)}
          startId={cloudWizardTargetId || undefined}
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

function addQuelldokument(s: import('./types').AppState, name: string, art: string): import('./types').AppState {
  const today = new Date().toISOString().slice(0, 10);
  const alreadyExists = s.quelldokumente.some(d => d.name === name);
  if (alreadyExists) return s;
  const doc: import('./types').Quelldokument = {
    id: generateId(),
    name,
    art,
    erhaltenAm: today,
    ausgewertet: false,
    notiz: '',
  };
  return { ...s, quelldokumente: [...s.quelldokumente, doc] };
}

export default App;
