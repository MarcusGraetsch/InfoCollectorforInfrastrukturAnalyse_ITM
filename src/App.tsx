import React, { useState, useCallback, useEffect } from 'react';
import type { AppState, CategoryKey } from './types';
import { loadState, saveState, loadStateFromIDB, createDefaultState, clearState, generateId, mergeWithDefault } from './store';
import { idbSave } from './db';
import { isEncrypted, decryptData, encryptData } from './crypto';
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
import { AIAssistantSettings } from './components/AIAssistantSettings';
import type { Liefergegenstand, Meeting, Stakeholder, Anwendung, TCODaten } from './types';
import type { RowClassification } from './utils/importAnalyzer';
import type { CloudFields } from './types';
import { syncBidirectionalLinks } from './utils/bidirectional';

function UnlockScreen({ onUnlocked }: { onUnlocked: (state: AppState, password: string) => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const id = localStorage.getItem('it-strukturanalyse-install-id');
  const dataKey = id ? `it-strukturanalyse-data-${id}` : null;

  const handleUnlock = async () => {
    if (!dataKey) { setError('Kein Datenschlüssel gefunden.'); return; }
    const raw = localStorage.getItem(dataKey);
    if (!raw) { setError('Keine verschlüsselten Daten gefunden.'); return; }
    setBusy(true);
    setError(null);
    try {
      const plaintext = await decryptData(raw, pw);
      const parsed = JSON.parse(plaintext) as AppState;
      onUnlocked(mergeWithDefault(parsed), pw);
    } catch {
      setError('Falsches Passwort oder beschädigte Daten.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-hi-gray">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full space-y-5">
        <div className="text-center">
          <div className="text-4xl mb-2">🔒</div>
          <h1 className="text-xl font-bold text-hi-navy">IT-Strukturanalyse</h1>
          <p className="text-sm text-hi-slate mt-1">Daten sind verschlüsselt. Bitte Passwort eingeben.</p>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">{error}</div>
        )}
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void handleUnlock(); }}
          placeholder="Passwort"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hi-navy"
          autoFocus
          autoComplete="current-password"
        />
        <button
          onClick={() => void handleUnlock()}
          disabled={busy || !pw}
          className="w-full py-2 bg-hi-navy text-white rounded-lg text-sm font-medium hover:bg-hi-navy/90 disabled:opacity-50"
        >
          {busy ? 'Entschlüsseln…' : 'Entsperren'}
        </button>
      </div>
    </div>
  );
}

const SESSION_PW_KEY = 'it-sa-session-pw';

function App() {
  const [locked, setLocked] = useState(() => isEncrypted());
  const [state, setState] = useState<AppState>(() => locked ? createDefaultState() : loadState());
  const [mode, setMode] = useState<AppMode>('wizard');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('geschaeftsprozesse');
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editId, setEditId] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showEmailTemplate, setShowEmailTemplate] = useState(false);
  const [cloudWizardTargetId, setCloudWizardTargetId] = useState<string | null>(null);
  const [showAISettings, setShowAISettings] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [idbRecoveryUsed, setIdbRecoveryUsed] = useState(false);

  // IDB hydration: on mount, check if IndexedDB has newer data than localStorage
  useEffect(() => {
    if (locked) return;
    loadStateFromIDB().then(idbState => {
      if (!idbState) return;
      setState(prev => {
        const localTs = prev.lastUpdated ?? '';
        const idbTs = idbState.lastUpdated ?? '';
        if (idbTs > localTs) {
          setIdbRecoveryUsed(true);
          return idbState;
        }
        return prev;
      });
    });
  }, []); // runs once on mount

  // beforeunload warning when a save is in flight
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'saving') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [saveStatus]);

  const saveWithStatus = useCallback((newState: AppState) => {
    setSaveStatus('saving');
    const json = JSON.stringify({ ...newState, lastUpdated: new Date().toISOString() });
    // synchronous localStorage write (fast read cache)
    try {
      const id = localStorage.getItem('it-strukturanalyse-install-id');
      if (id) localStorage.setItem(`it-strukturanalyse-data-${id}`, json);
    } catch {
      // ignore quota errors here; saveState handles alerting
    }
    idbSave(json)
      .then(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      })
      .catch(() => setSaveStatus('error'));
  }, []);

  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      const next = updater(prev);
      saveState(next);
      saveWithStatus(next);
      // If encryption is active, re-encrypt after writing plaintext
      if (isEncrypted()) {
        const sessionPw = sessionStorage.getItem(SESSION_PW_KEY);
        if (sessionPw) {
          const id = localStorage.getItem('it-strukturanalyse-install-id');
          if (id) {
            const key = `it-strukturanalyse-data-${id}`;
            const plain = localStorage.getItem(key);
            if (plain) {
              encryptData(plain, sessionPw).then((cipher) => {
                localStorage.setItem(key, cipher);
              }).catch(console.error);
            }
          }
        }
      }
      return next;
    });
  }, [saveWithStatus]);

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

  if (locked) {
    return (
      <UnlockScreen
        onUnlocked={(decryptedState, password) => {
          sessionStorage.setItem(SESSION_PW_KEY, password);
          setState(decryptedState);
          setLocked(false);
        }}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-hi-gray">
      {showAISettings && <AIAssistantSettings onClose={() => setShowAISettings(false)} />}
      {idbRecoveryUsed && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-sm text-amber-800">
          <span>ℹ️ Daten wurden aus dem persistenten Speicher (IndexedDB) wiederhergestellt — möglicherweise neuer als der zuletzt angezeigte Stand.</span>
          <button onClick={() => setIdbRecoveryUsed(false)} className="ml-4 text-amber-600 hover:text-amber-900">✕</button>
        </div>
      )}
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
        onAISettings={() => setShowAISettings(true)}
        saveStatus={saveStatus}
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
              onUpdateAnwendung={(id, changes) => updateState(prev => ({
                ...prev,
                anwendungen: prev.anwendungen.map(a =>
                  a.id === id ? { ...a, ...changes } as Anwendung : a
                ),
              }))}
              onUpdateTCO={(tco: TCODaten) => updateState(prev => ({ ...prev, tcoData: tco }))}
              onUpdateNIS2={(a) => updateState(prev => ({ ...prev, nis2Assessment: a }))}
              onUpdateIKT={(d) => updateState(prev => ({ ...prev, iktDienstleister: d }))}
              onOpenCloudWizard={id => setCloudWizardTargetId(id)}
              onRestore={(s) => updateState(() => s)}
              onReload={() => {
                setState(loadState());
              }}
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
