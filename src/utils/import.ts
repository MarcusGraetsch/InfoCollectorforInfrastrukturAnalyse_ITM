import * as XLSX from 'xlsx';
import type { AppData } from '../types';
import { generateId } from '../store';

function parseRef(val: string | undefined): string[] {
  if (!val) return [];
  return val.split(',').map(s => s.trim()).filter(Boolean);
}

function str(val: unknown): string {
  return val != null ? String(val) : '';
}

export function importFromExcel(file: File, current: AppData): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const updated = { ...current };

        const readSheet = (sheetName: string) => {
          const ws = wb.Sheets[sheetName];
          if (!ws) return [];
          return XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
        };

        const gpRows = readSheet('Geschäftsprozesse');
        if (gpRows.length > 0) {
          updated.geschaeftsprozesse = gpRows.map(r => ({
            id: generateId(),
            kuerzel: str(r['Kürzel']),
            name: str(r['Name']),
            erlaeuterung: str(r['Erläuterung']),
            status: str(r['Status']),
            prozessArt: str(r['Prozess-Art']),
            verantwortlicher: str(r['Verantwortlicher / Fachabteilung']),
            beteiligte: str(r['Beteiligte']),
            tags: str(r['Tags']),
            daten: parseRef(str(r['Daten'])),
            anwendungen: parseRef(str(r['Anwendungen'])),
          })).filter(r => r.kuerzel || r.name);
        }

        const dRows = readSheet('Daten');
        if (dRows.length > 0) {
          updated.daten = dRows.map(r => ({
            id: generateId(),
            kuerzel: str(r['Kürzel']),
            name: str(r['Name']),
            erlaeuterung: str(r['Erläuterung']),
            status: str(r['Status']),
            personenbezug: str(r['Personenbezug']),
            verantwortlicher: str(r['Verantwortlicher / Fachabteilung']),
            beteiligte: str(r['Beteiligte']),
            tags: str(r['Tags']),
            anwendungen: parseRef(str(r['Anwendungen'])),
          })).filter(r => r.kuerzel || r.name);
        }

        const aRows = readSheet('Anwendungen');
        if (aRows.length > 0) {
          updated.anwendungen = aRows.map(r => ({
            id: generateId(),
            kuerzel: str(r['Kürzel']),
            name: str(r['Name']),
            erlaeuterung: str(r['Erläuterung']),
            status: str(r['Status']),
            verantwortlicher: str(r['Verantwortlich / Administrator']),
            benutzer: str(r['Benutzer']),
            tags: str(r['Tags']),
            anwendungen: parseRef(str(r['Anwendungen'])),
            itSysteme: parseRef(str(r['IT-Systeme'])),
            netzverbindungen: parseRef(str(r['Netzverbindungen'])),
          })).filter(r => r.kuerzel || r.name);
        }

        const sRows = readSheet('Server');
        if (sRows.length > 0) {
          updated.server = sRows.map(r => ({
            id: generateId(),
            kuerzel: str(r['Kürzel']),
            name: str(r['Name']),
            erlaeuterung: str(r['Erläuterung']),
            status: str(r['Status']),
            anzahl: str(r['Anzahl']),
            plattform: str(r['Plattform']),
            verantwortlicher: str(r['Verantwortlich / Administrator']),
            benutzer: str(r['Benutzer']),
            tags: str(r['Tags']),
            anwendungen: parseRef(str(r['Anwendungen'])),
            itSysteme: parseRef(str(r['IT-Systeme'])),
            netzverbindungen: parseRef(str(r['Netzverbindungen'])),
            raeume: parseRef(str(r['Räume'])),
            gebaeude: parseRef(str(r['Gebäude'])),
          })).filter(r => r.kuerzel || r.name);
        }

        const nkRows = readSheet('Netzkomponenten');
        if (nkRows.length > 0) {
          updated.netzkomponenten = nkRows.map(r => ({
            id: generateId(),
            kuerzel: str(r['Kürzel']),
            name: str(r['Name']),
            erlaeuterung: str(r['Erläuterung']),
            status: str(r['Status']),
            anzahl: str(r['Anzahl']),
            plattform: str(r['Plattform']),
            verantwortlicher: str(r['Verantwortlich / Administrator']),
            tags: str(r['Tags']),
            itSysteme: parseRef(str(r['IT-Systeme'])),
            netzverbindungen: parseRef(str(r['Netzverbindungen'])),
            raeume: parseRef(str(r['Räume'])),
            gebaeude: parseRef(str(r['Gebäude'])),
          })).filter(r => r.kuerzel || r.name);
        }

        const nRows = readSheet('Netzverbindungen');
        if (nRows.length > 0) {
          updated.netzverbindungen = nRows.map(r => ({
            id: generateId(),
            kuerzel: str(r['Kürzel']),
            name: str(r['Name']),
            erlaeuterung: str(r['Erläuterung']),
            status: str(r['Status']),
            protokolle: str(r['Protokolle']),
            externNetz: str(r['Extern. Netz']),
            tags: str(r['Tags']),
            anwendungen: parseRef(str(r['Anwendungen'])),
            clients: parseRef(str(r['Clients'])),
            server: parseRef(str(r['Server'])),
            netzverbindungen: parseRef(str(r['Netzverbindungen'])),
            netzkomponenten: parseRef(str(r['Netzkomponenten'])),
            raeume: parseRef(str(r['Räume'])),
            gebaeude: parseRef(str(r['Gebäude'])),
          })).filter(r => r.kuerzel || r.name);
        }

        const cRows = readSheet('Clients');
        if (cRows.length > 0) {
          updated.clients = cRows.map(r => ({
            id: generateId(),
            kuerzel: str(r['Kürzel']),
            name: str(r['Name']),
            erlaeuterung: str(r['Erläuterung']),
            status: str(r['Status']),
            anzahl: str(r['Anzahl']),
            plattform: str(r['Plattform']),
            verantwortlicher: str(r['Verantwortlich / Administrator']),
            benutzer: str(r['Benutzer']),
            tags: str(r['Tags']),
            itSysteme: parseRef(str(r['IT-Systeme'])),
            netzverbindungen: parseRef(str(r['Netzverbindungen'])),
            raeume: parseRef(str(r['Räume'])),
            gebaeude: parseRef(str(r['Gebäude'])),
          })).filter(r => r.kuerzel || r.name);
        }

        const icsRows = readSheet('ICS-Systeme');
        if (icsRows.length > 0) {
          updated.icsSysteme = icsRows.map(r => ({
            id: generateId(),
            kuerzel: str(r['Kürzel']),
            name: str(r['Name']),
            erlaeuterung: str(r['Erläuterung']),
            status: str(r['Status']),
            anzahl: str(r['Anzahl']),
            plattform: str(r['Plattform']),
            verantwortlicher: str(r['Verantwortlich / Administrator']),
            benutzer: str(r['Benutzer']),
            tags: str(r['Tags']),
            itSysteme: parseRef(str(r['IT-Systeme'])),
            netzverbindungen: parseRef(str(r['Netzverbindungen'])),
            raeume: parseRef(str(r['Räume'])),
            gebaeude: parseRef(str(r['Gebäude'])),
          })).filter(r => r.kuerzel || r.name);
        }

        const iotRows = readSheet('IoT-Systeme');
        if (iotRows.length > 0) {
          updated.iotSysteme = iotRows.map(r => ({
            id: generateId(),
            kuerzel: str(r['Kürzel']),
            name: str(r['Name']),
            erlaeuterung: str(r['Erläuterung']),
            status: str(r['Status']),
            anzahl: str(r['Anzahl']),
            plattform: str(r['Plattform']),
            verantwortlicher: str(r['Verantwortlich / Administrator']),
            benutzer: str(r['Benutzer']),
            tags: str(r['Tags']),
            itSysteme: parseRef(str(r['IT-Systeme'])),
            netzverbindungen: parseRef(str(r['Netzverbindungen'])),
            raeume: parseRef(str(r['Räume'])),
            gebaeude: parseRef(str(r['Gebäude'])),
          })).filter(r => r.kuerzel || r.name);
        }

        const rRows = readSheet('Räume');
        if (rRows.length > 0) {
          updated.raeume = rRows.map(r => ({
            id: generateId(),
            kuerzel: str(r['Kürzel']),
            name: str(r['Name']),
            erlaeuterung: str(r['Erläuterung']),
            anzahl: str(r['Anzahl']),
            verantwortlicher: str(r['Verantwortlich']),
            benutzer: str(r['Benutzer']),
            tags: str(r['Tags']),
            gebaeude: parseRef(str(r['Gebäude'])),
          })).filter(r => r.kuerzel || r.name);
        }

        const gRows = readSheet('Gebäude');
        if (gRows.length > 0) {
          updated.gebaeude = gRows.map(r => ({
            id: generateId(),
            kuerzel: str(r['Kürzel']),
            name: str(r['Name']),
            erlaeuterung: str(r['Erläuterung']),
            anzahl: str(r['Anzahl']),
            verantwortlicher: str(r['Verantwortlich']),
            benutzer: str(r['Benutzer']),
            tags: str(r['Tags']),
          })).filter(r => r.kuerzel || r.name);
        }

        resolve(updated);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
