/**
 * db.ts — IndexedDB-Persistenz für IT-Strukturanalyse
 *
 * Warum IndexedDB statt reinem localStorage:
 * - IndexedDB ist persistent: wird nicht durch Browser-Cleanup, Private-Mode-Ende
 *   oder Cookie-Löschung automatisch entfernt (localStorage kann je nach
 *   Browser-Einstellung als "Site Data" gelöscht werden).
 * - Async-API: blockiert den UI-Thread nicht beim Schreiben großer Datensätze.
 * - Speicherlimit: localStorage ~5 MB; IndexedDB typisch mehrere hundert MB.
 *
 * Schema: Eine einzige ObjectStore "state" mit key "main" speichert den
 * serialisierten AppState als JSON-String.
 */

const DB_NAME = 'it-sa-db';
const DB_VERSION = 1;
const STORE_NAME = 'state';
const STATE_KEY = 'main';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbSave(json: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(json, STATE_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function idbLoad(): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(STATE_KEY);
    req.onsuccess = () => resolve((req.result as string) ?? null);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function idbClear(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
  });
}
