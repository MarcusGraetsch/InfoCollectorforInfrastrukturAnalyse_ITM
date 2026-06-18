import type { AppState } from '../types';

const BACKUP_VERSION = '1.0';

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
  return backup.state;
}
