import type { AppState } from '../types';
import { mergeWithDefault } from '../store';

/**
 * Leichtgewichtige Laufzeit-Validierung des importierten AppState.
 * Verhindert, dass manipulierte Backups mit falschen Typen in die App gelangen.
 */
export function validateImport(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (typeof data !== 'object' || data === null) {
    errors.push('Kein gültiges JSON-Objekt');
    return { valid: false, errors };
  }
  const d = data as Record<string, unknown>;
  // Required top-level arrays
  const arrayFields = [
    'anwendungen', 'server', 'clients', 'geschaeftsprozesse', 'meetings',
    'liefergegenstaende', 'stakeholder', 'daten', 'datentraeger',
    'netzkomponenten', 'netzverbindungen', 'icsSysteme', 'iotSysteme',
    'raeume', 'gebaeude', 'quelldokumente',
  ];
  for (const f of arrayFields) {
    if (d[f] !== undefined && !Array.isArray(d[f])) {
      errors.push(`Feld "${f}" muss ein Array sein, ist aber ${typeof d[f]}`);
    }
  }
  // Required string fields
  const stringFields = ['customerName', 'lastUpdated'];
  for (const f of stringFields) {
    if (d[f] !== undefined && typeof d[f] !== 'string') {
      errors.push(`Feld "${f}" muss ein String sein`);
    }
  }
  return { valid: errors.length === 0, errors };
}

const BACKUP_VERSION = '1.0';
/** Höchste Major-Version, die diese App-Version lesen kann. */
const SUPPORTED_MAJOR = 1;

interface BackupFile {
  version: string;
  exportDate: string;
  customerName: string;
  state: AppState;
}

export function exportToJSON(state: AppState): void {
  const backup: BackupFile = {
    version: BACKUP_VERSION,
    exportDate: new Date().toISOString(),
    customerName: state.customerName,
    state,
  };
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `IT-Strukturanalyse-Backup_${state.customerName || 'Export'}_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importFromJSON(json: string): AppState {
  const parsed: unknown = JSON.parse(json);
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('version' in parsed) ||
    !('state' in parsed)
  ) {
    throw new Error('Ungültiges Backup-Format');
  }
  const backup = parsed as BackupFile;
  if (!backup.state || typeof backup.state !== 'object') {
    throw new Error('Backup enthält keinen gültigen Zustand');
  }

  // Version prüfen: neuere Major-Versionen können nicht zuverlässig gelesen werden
  const major = parseInt(String(backup.version).split('.')[0], 10);
  if (!isNaN(major) && major > SUPPORTED_MAJOR) {
    throw new Error(
      `Dieses Backup (Version ${backup.version}) wurde mit einer neueren App-Version erstellt ` +
      `und kann hier nicht sicher importiert werden. Bitte aktualisieren Sie die Anwendung.`
    );
  }

  // Laufzeit-Schema-Validierung
  const validation = validateImport(backup.state);
  if (!validation.valid) {
    throw new Error(`Backup-Validierung fehlgeschlagen:\n${validation.errors.join('\n')}`);
  }

  // Tiefer Merge mit Default → fehlende/partielle Strukturen werden aufgefüllt
  return mergeWithDefault(backup.state);
}
