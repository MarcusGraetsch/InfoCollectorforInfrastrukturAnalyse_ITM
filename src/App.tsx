import React, { useState, useCallback } from 'react';
import type { AppState, CategoryKey } from './types';
import { loadState, saveState } from './store';
import { CATEGORY_MAP } from './categories';
import { Layout } from './components/Layout';
import { CategoryList } from './components/CategoryList';
import { CategoryForm } from './components/CategoryForm';
import { exportToExcel } from './utils/export';
import { importFromExcel } from './utils/import';

type View = 'list' | 'form';

function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('geschaeftsprozesse');
  const [view, setView] = useState<View>('list');
  const [editId, setEditId] = useState<string | null>(null);

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

  const handleNew = () => {
    setEditId(null);
    setView('form');
  };

  const handleEdit = (id: string) => {
    setEditId(id);
    setView('form');
  };

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
      } else {
        return { ...prev, [activeCategory]: [...arr, item] };
      }
    });
    setView('list');
    setEditId(null);
  };

  const handleCancel = () => {
    setView('list');
    setEditId(null);
  };

  const handleCustomerNameChange = (name: string) => {
    updateState((prev) => ({ ...prev, customerName: name }));
  };

  const handleExport = () => {
    exportToExcel(state);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const newState = await importFromExcel(file, state);
      setState(newState);
      saveState(newState);
      alert('Import erfolgreich!');
    } catch (err) {
      alert('Import fehlgeschlagen: ' + String(err));
    }
    e.target.value = '';
  };

  const categoryDef = CATEGORY_MAP[activeCategory];

  return (
    <Layout
      state={state}
      activeCategory={activeCategory}
      onCategoryChange={handleCategoryChange}
      onCustomerNameChange={handleCustomerNameChange}
      onExport={handleExport}
      onImport={handleImport}
    >
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
    </Layout>
  );
}

export default App;
