import * as XLSX from 'xlsx';
import type { AppData } from '../types';

function arr(val: string[] | undefined): string {
  return (val || []).join(', ');
}

export function exportToExcel(data: AppData): void {
  const wb = XLSX.utils.book_new();

  // Startseite
  const startData = [
    [null, 'Strukturanalyse'],
    ['Kundenname', data.kundenname],
    ['Dokumenterläuterung', 'Die Strukturanalyse dokumentiert die im Informationsverbund enthaltenen Geschäftsprozesse, Anwendungen, IT-Systeme, Netzverbindungen, Räume und Gebäude.'],
    ['Datum der letzten Aktualisierung', data.letzteAktualisierung],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(startData), 'Startseite');

  // Geschäftsprozesse
  const gpHeader = [null, 'Kürzel', 'Name', 'Erläuterung', 'Status', 'Prozess-Art', 'Verantwortlicher / Fachabteilung', 'Beteiligte', 'Tags', 'Daten', 'Anwendungen'];
  const gpRows = data.geschaeftsprozesse.map(e => [null, e.kuerzel, e.name, e.erlaeuterung, e.status, e.prozessArt, e.verantwortlicher, e.beteiligte, e.tags, arr(e.daten), arr(e.anwendungen)]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([gpHeader, ...gpRows]), 'Geschäftsprozesse');

  // Daten
  const dHeader = [null, 'Kürzel', 'Name', 'Erläuterung', 'Status', 'Personenbezug', 'Verantwortlicher / Fachabteilung', 'Beteiligte', 'Tags', 'Anwendungen'];
  const dRows = data.daten.map(e => [null, e.kuerzel, e.name, e.erlaeuterung, e.status, e.personenbezug, e.verantwortlicher, e.beteiligte, e.tags, arr(e.anwendungen)]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([dHeader, ...dRows]), 'Daten');

  // Anwendungen
  const aHeader = [null, 'Kürzel', 'Name', 'Erläuterung', 'Status', 'Verantwortlich / Administrator', 'Benutzer', 'Tags', 'Anwendungen', 'IT-Systeme', 'Netzverbindungen'];
  const aRows = data.anwendungen.map(e => [null, e.kuerzel, e.name, e.erlaeuterung, e.status, e.verantwortlicher, e.benutzer, e.tags, arr(e.anwendungen), arr(e.itSysteme), arr(e.netzverbindungen)]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([aHeader, ...aRows]), 'Anwendungen');

  // Datenträger
  const dtHeader = [null, 'Kürzel', 'Name', 'Erläuterung', 'Status', 'Anzahl', 'Verantwortlich / Administrator', 'Benutzer', 'Tags', 'Daten', 'Anwendungen'];
  const dtRows = data.datentraeger.map(e => [null, e.kuerzel, e.name, e.erlaeuterung, e.status, e.anzahl, e.verantwortlicher, e.benutzer, e.tags, arr(e.daten), arr(e.anwendungen)]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([dtHeader, ...dtRows]), 'Datenträger');

  // Server
  const sHeader = [null, 'Kürzel', 'Name', 'Erläuterung', 'Status', 'Anzahl', 'Plattform', 'Verantwortlich / Administrator', 'Benutzer', 'Tags', 'Anwendungen', 'IT-Systeme', 'Netzverbindungen', 'Räume', 'Gebäude'];
  const sRows = data.server.map(e => [null, e.kuerzel, e.name, e.erlaeuterung, e.status, e.anzahl, e.plattform, e.verantwortlicher, e.benutzer, e.tags, arr(e.anwendungen), arr(e.itSysteme), arr(e.netzverbindungen), arr(e.raeume), arr(e.gebaeude)]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([sHeader, ...sRows]), 'Server');

  // Netzkomponenten
  const nkHeader = [null, 'Kürzel', 'Name', 'Erläuterung', 'Status', 'Anzahl', 'Plattform', 'Verantwortlich / Administrator', 'Tags', 'IT-Systeme', 'Netzverbindungen', 'Räume', 'Gebäude'];
  const nkRows = data.netzkomponenten.map(e => [null, e.kuerzel, e.name, e.erlaeuterung, e.status, e.anzahl, e.plattform, e.verantwortlicher, e.tags, arr(e.itSysteme), arr(e.netzverbindungen), arr(e.raeume), arr(e.gebaeude)]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([nkHeader, ...nkRows]), 'Netzkomponenten');

  // Netzverbindungen
  const nHeader = [null, 'Kürzel', 'Name', 'Erläuterung', 'Status', 'Protokolle', 'Extern. Netz', 'Tags', 'Anwendungen', 'Clients', 'Server', 'Netzverbindungen', 'Netzkomponenten', 'Räume', 'Gebäude'];
  const nRows = data.netzverbindungen.map(e => [null, e.kuerzel, e.name, e.erlaeuterung, e.status, e.protokolle, e.externNetz, e.tags, arr(e.anwendungen), arr(e.clients), arr(e.server), arr(e.netzverbindungen), arr(e.netzkomponenten), arr(e.raeume), arr(e.gebaeude)]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([nHeader, ...nRows]), 'Netzverbindungen');

  // Clients
  const cHeader = [null, 'Kürzel', 'Name', 'Erläuterung', 'Status', 'Anzahl', 'Plattform', 'Verantwortlich / Administrator', 'Benutzer', 'Tags', 'IT-Systeme', 'Netzverbindungen', 'Räume', 'Gebäude'];
  const cRows = data.clients.map(e => [null, e.kuerzel, e.name, e.erlaeuterung, e.status, e.anzahl, e.plattform, e.verantwortlicher, e.benutzer, e.tags, arr(e.itSysteme), arr(e.netzverbindungen), arr(e.raeume), arr(e.gebaeude)]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([cHeader, ...cRows]), 'Clients');

  // ICS-Systeme
  const icsHeader = [null, 'Kürzel', 'Name', 'Erläuterung', 'Status', 'Anzahl', 'Plattform', 'Verantwortlich / Administrator', 'Benutzer', 'Tags', 'IT-Systeme', 'Netzverbindungen', 'Räume', 'Gebäude'];
  const icsRows = data.icsSysteme.map(e => [null, e.kuerzel, e.name, e.erlaeuterung, e.status, e.anzahl, e.plattform, e.verantwortlicher, e.benutzer, e.tags, arr(e.itSysteme), arr(e.netzverbindungen), arr(e.raeume), arr(e.gebaeude)]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([icsHeader, ...icsRows]), 'ICS-Systeme');

  // IoT-Systeme
  const iotHeader = [null, 'Kürzel', 'Name', 'Erläuterung', 'Status', 'Anzahl', 'Plattform', 'Verantwortlich / Administrator', 'Benutzer', 'Tags', 'IT-Systeme', 'Netzverbindungen', 'Räume', 'Gebäude'];
  const iotRows = data.iotSysteme.map(e => [null, e.kuerzel, e.name, e.erlaeuterung, e.status, e.anzahl, e.plattform, e.verantwortlicher, e.benutzer, e.tags, arr(e.itSysteme), arr(e.netzverbindungen), arr(e.raeume), arr(e.gebaeude)]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([iotHeader, ...iotRows]), 'IoT-Systeme');

  // Räume
  const rHeader = [null, 'Kürzel', 'Name', 'Erläuterung', 'Anzahl', 'Verantwortlich', 'Benutzer', 'Tags', 'Gebäude'];
  const rRows = data.raeume.map(e => [null, e.kuerzel, e.name, e.erlaeuterung, e.anzahl, e.verantwortlicher, e.benutzer, e.tags, arr(e.gebaeude)]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([rHeader, ...rRows]), 'Räume');

  // Gebäude
  const gHeader = [null, 'Kürzel', 'Name', 'Erläuterung', 'Anzahl', 'Verantwortlich', 'Benutzer', 'Tags'];
  const gRows = data.gebaeude.map(e => [null, e.kuerzel, e.name, e.erlaeuterung, e.anzahl, e.verantwortlicher, e.benutzer, e.tags]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([gHeader, ...gRows]), 'Gebäude');

  const filename = `Strukturanalyse_${data.kundenname || 'Export'}_${data.letzteAktualisierung}.xlsx`;
  XLSX.writeFile(wb, filename);
}
