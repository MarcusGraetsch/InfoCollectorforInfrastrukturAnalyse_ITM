import * as XLSX from 'xlsx';
import { CATEGORIES } from '../categories';
import type { CategoryKey } from '../types';

export type AnalysisSource = 'columns' | 'keywords' | 'filename';

export interface SheetAnalysis {
  sheetName: string;
  suggestedCategory: CategoryKey | null;
  confidence: number; // 0–100
  matchedFields: string[];
  rowCount: number;
  columns: string[];
  source: AnalysisSource;
}

export interface ImportAnalysis {
  sheets: SheetAnalysis[];
  fileType: 'excel' | 'csv' | 'txt' | 'docx' | 'pdf' | 'unknown';
  limitedAnalysis: boolean;
  mode: 'structured' | 'unstructured';
  classifiedRows?: RowClassification[];
}

export interface RowClassification {
  rowIndex: number;
  name: string;
  rawData: Record<string, unknown>;
  suggestedCategory: CategoryKey;
  confidence: number;
}

// ── Keyword-Wörterbuch je BSI-Kategorie ────────────────────────────────────
// Deckt deutsche und englische Fachbegriffe ab, wird für Text- und Dateinamen-
// basierte Erkennung genutzt (wenn keine Spaltenköpfe vorhanden sind).
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  geschaeftsprozesse: [
    'prozess', 'process', 'geschäftsprozess', 'ablauf', 'workflow',
    'kernprozess', 'unterstützungsprozess', 'wertschöpfung', 'fachbereich',
    'geschäftsablauf', 'verfahren', 'bpmn', 'sla',
  ],
  daten: [
    'daten', 'data', 'datenobjekt', 'personenbezug', 'dsgvo', 'gdpr',
    'datenschutz', 'klassifizierung', 'klassifikation', 'datensouveränität',
    'vertraulichkeit', 'informationsobjekt', 'datenkategorie',
  ],
  anwendungen: [
    'anwendung', 'application', 'applikation', 'software', 'fachverfahren',
    'programm', 'saas', 'erp', 'crm', 'cms', 'lizenz', 'app',
    'anwendungssystem', 'fachanwendung', 'it-anwendung',
  ],
  datentraeger: [
    'datenträger', 'speicher', 'usb', 'festplatte', 'nas', 'san', 'backup',
    'band', 'lto', 'medium', 'medien', 'wechseldatenträger', 'storage',
    'datenmedium', 'archiv',
  ],
  server: [
    'server', 'host', 'hostname', 'vm', 'virtual machine', 'virtuelle maschine',
    'betriebssystem', 'windows server', 'linux', 'ubuntu', 'rhel', 'esxi',
    'hypervisor', 'kubernetes', 'k8s', 'container', 'docker', 'node',
    'rechenzentrum', 'rz', 'datacenter', 'compute', 'tanzu', 'tkg',
  ],
  netzkomponenten: [
    'netzkomponente', 'switch', 'router', 'firewall', 'wlan', 'access point',
    'cisco', 'juniper', 'fortinet', 'palo alto', 'checkpoint', 'sophos',
    'gateway', 'proxy', 'load balancer', 'netzgerät', 'netzwerk-infrastruktur',
  ],
  netzverbindungen: [
    'netzverbindung', 'verbindung', 'connection', 'leitung', 'wan', 'lan',
    'mpls', 'vpn', 'internet', 'protokoll', 'bandbreite', 'anbindung',
    'tunnel', 'link', 'peering', 'strecke', 'netzstrecke',
  ],
  clients: [
    'client', 'arbeitsplatz', 'laptop', 'desktop', 'pc', 'workstation',
    'thin client', 'notebook', 'smartphone', 'tablet', 'mobilgerät',
    'windows 10', 'windows 11', 'macos', 'ios', 'android', 'endgerät',
    'endpunkt', 'endpoint',
  ],
  icsSysteme: [
    'ics', 'ot', 'scada', 'plc', 'sps', 'steuerung', 'simatic', 's7',
    'wincc', 'rockwell', 'beckhoff', 'schneider', 'prozessleittechnik',
    'industriell', 'anlage', 'automation', 'leittechnik', 'dcs',
  ],
  iotSysteme: [
    'iot', 'sensor', 'kamera', 'knx', 'dali', 'gebäudeautomation',
    'smart', 'raspberry', 'mqtt', 'zigbee', 'm2m', 'edge',
    'überwachung', 'monitoring', 'eingebettet', 'embedded',
  ],
  raeume: [
    'raum', 'räume', 'serverraum', 'technikraum', 'verteilerraum',
    'mdf', 'idf', 'stockwerk', 'etage', 'fläche', 'zugang', 'zutritt',
    'schrank', 'rack', 'co-location', 'colocation', 'serverraum',
  ],
  gebaeude: [
    'gebäude', 'gebaeude', 'standort', 'adresse', 'liegenschaft',
    'immobilie', 'filiale', 'niederlassung', 'werk', 'campus', 'site',
    'objekt', 'liegenschaften',
  ],
};

// ── Spaltenbasiertes Scoring (wie bisher, aber normalisiert) ────────────────
function scoreByColumns(
  columns: string[],
  categoryKey: CategoryKey
): { score: number; matchedFields: string[] } {
  const cat = CATEGORIES.find(c => c.key === categoryKey)!;
  const matchedFields: string[] = [];
  let score = 0;
  for (const field of cat.fields) {
    const matched = columns.some(col => {
      const c = col.toLowerCase().trim();
      const l = field.label.toLowerCase();
      const k = field.key.toLowerCase();
      return c === l || c === k || c.includes(l) || l.includes(c) || c.includes(k);
    });
    if (matched) {
      matchedFields.push(field.label);
      score += field.required ? 3 : 1;
    }
  }
  // Normalisierung: maximal erreichbarer Score je Kategorie
  const maxScore = cat.fields.reduce((s, f) => s + (f.required ? 3 : 1), 0);
  const normalized = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  return { score: normalized, matchedFields };
}

// ── Keyword-basiertes Scoring für Freitext (Dateiinhalt oder Dateiname) ────
function scoreByKeywords(text: string): { best: CategoryKey | null; confidence: number } {
  const lower = text.toLowerCase();
  let bestKey: CategoryKey | null = null;
  let bestScore = 0;
  for (const [key, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let hits = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) hits++;
    }
    const score = Math.round((hits / keywords.length) * 100);
    if (score > bestScore) {
      bestScore = score;
      bestKey = key as CategoryKey;
    }
  }
  return { best: bestKey, confidence: Math.min(bestScore * 3, 80) }; // max 80% für Keyword-Matching
}

// ── Sheet-Name-Bonus ────────────────────────────────────────────────────────
function sheetNameBonus(sheetName: string, categoryKey: CategoryKey): number {
  const sn = sheetName.toLowerCase().replace(/[_\-\s]/g, '');
  const cat = CATEGORIES.find(c => c.key === categoryKey)!;
  const cl = cat.label.toLowerCase().replace(/[_\-\s]/g, '');
  const prefix = cat.prefix.toLowerCase();
  if (sn === cl || sn === prefix) return 20;
  if (sn.includes(cl.substring(0, 5)) || cl.includes(sn.substring(0, 4))) return 10;
  if (sn.includes(prefix)) return 8;
  return 0;
}

// ── Bestes Kategorie-Ergebnis aus Spaltenscore + Name-Bonus ────────────────
function bestCategoryForColumns(
  columns: string[],
  sheetName: string
): { category: CategoryKey | null; confidence: number; matchedFields: string[] } {
  let bestCategory: CategoryKey | null = null;
  let bestConfidence = 0;
  let bestFields: string[] = [];

  for (const cat of CATEGORIES) {
    const { score, matchedFields } = scoreByColumns(columns, cat.key);
    const bonus = sheetNameBonus(sheetName, cat.key);
    const total = Math.min(100, score + bonus);
    if (total > bestConfidence) {
      bestConfidence = total;
      bestCategory = cat.key;
      bestFields = matchedFields;
    }
  }

  // Mindest-Konfidenz 20% damit ein Vorschlag gemacht wird
  if (bestConfidence < 20) return { category: null, confidence: bestConfidence, matchedFields: [] };
  return { category: bestCategory, confidence: bestConfidence, matchedFields: bestFields };
}

// ── Row-by-row classification rules ─────────────────────────────────────────
const ROW_RULES: Array<{ pattern: RegExp; category: CategoryKey; score: number }> = [
  // Storage (before server — NetApp etc.)
  { pattern: /storage|netapp|tape[\s-]?librar|dxi\b|lto\b|nas\b(?!.*server)|san\b(?!.*server)|archivierung|wechseldatenträger|quantum|bandlaufwerk|netzwerkspeicher/i, category: 'datentraeger', score: 85 },
  // Network hardware
  { pattern: /\bswitch(?!.*software)\b|router(?!.*software)|firewall|gateway(?!.*software)|access[\s-]?point|\bwlan\b(?!.*controller)|medienconverter|patch[\s-]?panel|proxy[\s-]?server|load[\s-]?balancer|palo[\s-]?alto|checkpoint|fortinet|sophos|juniper\b|cisco\b/i, category: 'netzkomponenten', score: 90 },
  // ICS / OT
  { pattern: /\bscada\b|plc\b|sps\b|simatic|wincc|prozessleittechnik|leittechnik|steuerung|s7[\s-]\d|beckhoff|rockwell|dcs\b|automation[\s-]?server/i, category: 'icsSysteme', score: 90 },
  // IoT / Building
  { pattern: /\busv\b|unterbrechungsfreie|alarmanlage|alarm[\s-]?(zentrale|panel)|kamera|cctv|zutrittskontrolle|knx\b|dali\b|gebäudeautomation|smart[\s-]?home|raspberry|mqtt|sensor|kopierer|drucker|mfp\b|netzwerkdrucker/i, category: 'iotSysteme', score: 85 },
  // Server / VMs / Hypervisor
  { pattern: /\besx[i]?\b|hypervisor|blade[\s-]?server|rack[\s-]?server|tower[\s-]?server|windows[\s-]?server|linux[\s-]?server|dhcp[\s-]?server|dns[\s-]?server|domain[\s-]?controller|dc[\s-]?\d|mail[\s-]?server|exchange[\s-]?server|backup[\s-]?server|print[\s-]?server|proxy\b|application[\s-]?server|app[\s-]?server|datenbank[\s-]?server|db[\s-]?server/i, category: 'server', score: 85 },
  // Clients / Endpoints
  { pattern: /laptop|notebook|desktop[\s-]?pc|\bpc\b(?!.*server)|\bworkstation\b|thin[\s-]?client|smartphone|tablet|mobilgerät|endgerät|windows[\s-]?10|windows[\s-]?11|macbook|mac[\s-]?pro(?!.*server)/i, category: 'clients', score: 85 },
  // Applications / Software
  { pattern: /\bsap\b|oracle\b(?!.*server)|microsoft[\s-]?(365|office|teams|sharepoint)|domino|lotus|erp\b|crm\b|cms\b|wiki\b|intranet|buchhaltung|faktura|warenwirtschaft|dms\b|dokumentenmanagement|helpdesk|ticketsystem|antivirus|monitoring[\s-]?software/i, category: 'anwendungen', score: 85 },
  // Network connections
  { pattern: /\bwan[\s-]|mpls\b|vpn[\s-]?tunnel|ipsec|leitung\b|glasfaser|dsl\b|sdwan|peering|expressroute|direct[\s-]?connect|anbindung/i, category: 'netzverbindungen', score: 80 },
  // Rooms
  { pattern: /serverraum|technikraum|verteilerraum|\brechenzentrum\b|\brz\b(?!.*server)|\bdatacenter\b|rechenzentrum|mdf\b|idf\b|rack[\s-]?raum|netzwerkraum/i, category: 'raeume', score: 85 },
  // Buildings / Locations
  { pattern: /gebäude|standort(?!.*server)|liegenschaft|filiale|niederlassung|campus|werk[\s-]?\w|bürogebäude/i, category: 'gebaeude', score: 75 },
  // Data objects
  { pattern: /personenbezogen|dsgvo|datenschutz|gdpr|klassifizierung|vertraulich|datenkategorie|informationsobjekt/i, category: 'daten', score: 80 },
  // Business processes
  { pattern: /geschäftsprozess|kernprozess|workflow|fachbereich|verfahren\b(?!.*server)/i, category: 'geschaeftsprozesse', score: 80 },
];

function detectColumnRoles(columns: string[]): { nameCol: string | null; anzahlCol: string | null; herstellerCol: string | null; modellCol: string | null; standortCol: string | null } {
  const find = (patterns: RegExp[]) => columns.find(c => patterns.some(p => p.test(c))) ?? null;
  return {
    nameCol: find([/^(name|bezeichnung|kurzbeschreibung|description|komponent|gerät|system|analyse)/i, /^[^_]/]),
    anzahlCol: find([/^(anzahl|count|qty|menge|stück)/i]),
    herstellerCol: find([/^(hersteller|vendor|manufacturer|marke)/i]),
    modellCol: find([/^(modell|model|typ|type|version)/i]),
    standortCol: find([/^(standort|location|ort|raum|site)/i]),
  };
}

export function classifyRows(
  allRows: Record<string, unknown>[],
  columns: string[]
): RowClassification[] {
  const roles = detectColumnRoles(columns);

  // First row might be a sub-header (e.g. "Kurzbeschreibung | Anzahl | …") — skip if so
  const firstRowText = Object.values(allRows[0] ?? {}).join(' ').toLowerCase();
  const isSubHeader = ['kurzbeschreibung', 'description', 'anzahl', 'hersteller'].filter(k => firstRowText.includes(k)).length >= 2;
  const dataRows = isSubHeader ? allRows.slice(1) : allRows;

  const results: RowClassification[] = [];
  let lastCategory: CategoryKey = 'server';

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const name = String(
      (roles.nameCol ? row[roles.nameCol] : Object.values(row)[0]) ?? ''
    ).trim();

    if (!name) continue;

    const hersteller = String(roles.herstellerCol ? row[roles.herstellerCol] ?? '' : '');
    const modell = String(roles.modellCol ? row[roles.modellCol] ?? '' : '');
    const searchText = [name, hersteller, modell].join(' ');

    let bestCategory: CategoryKey = lastCategory;
    let bestScore = 0;

    for (const rule of ROW_RULES) {
      if (rule.pattern.test(searchText) && rule.score > bestScore) {
        bestScore = rule.score;
        bestCategory = rule.category;
      }
    }

    lastCategory = bestCategory;
    results.push({
      rowIndex: i,
      name,
      rawData: row,
      suggestedCategory: bestCategory,
      confidence: bestScore > 0 ? bestScore : 40,
    });
  }

  return results;
}

// ── Excel / XLSX / XLS ──────────────────────────────────────────────────────
function analyzeSpreadsheet(data: Uint8Array): ImportAnalysis {
  const wb = XLSX.read(data, { type: 'array' });
  const sheets: SheetAnalysis[] = wb.SheetNames.map(sheetName => {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    const { category, confidence, matchedFields } = bestCategoryForColumns(columns, sheetName);
    return {
      sheetName,
      suggestedCategory: category,
      confidence,
      matchedFields,
      rowCount: rows.length,
      columns,
      source: 'columns' as AnalysisSource,
    };
  });

  const maxConf = Math.max(...sheets.map(s => s.confidence), 0);
  if (maxConf < 30 && sheets.length > 0) {
    const firstSheet = sheets[0];
    const ws = wb.Sheets[firstSheet.sheetName];
    const allRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
    const classifiedRows = classifyRows(allRows, firstSheet.columns);
    return { sheets, fileType: 'excel', limitedAnalysis: false, mode: 'unstructured', classifiedRows };
  }

  return { sheets, fileType: 'excel', limitedAnalysis: false, mode: 'structured' };
}

// ── CSV / TXT ───────────────────────────────────────────────────────────────
function analyzeText(text: string, fileName: string): ImportAnalysis {
  // Trennzeichen ermitteln
  const firstLine = text.split('\n')[0] ?? '';
  const sep = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) {
    return { sheets: [], fileType: 'csv', limitedAnalysis: false, mode: 'structured' };
  }
  const columns = lines[0].split(sep).map(c => c.trim().replace(/^["']|["']$/g, ''));
  const rowCount = Math.max(0, lines.length - 1);
  const baseName = fileName.replace(/\.[^.]+$/, '');
  const { category, confidence, matchedFields } = bestCategoryForColumns(columns, baseName);

  // Falls Spalten keinen guten Treffer liefern, Keyword-Matching auf gesamten Text
  let finalCategory = category;
  let finalConfidence = confidence;
  let source: AnalysisSource = 'columns';
  if (confidence < 25) {
    const kw = scoreByKeywords(text + ' ' + fileName);
    if (kw.confidence > confidence) {
      finalCategory = kw.best;
      finalConfidence = kw.confidence;
      source = 'keywords';
    }
  }

  return {
    sheets: [{
      sheetName: baseName,
      suggestedCategory: finalCategory,
      confidence: finalConfidence,
      matchedFields,
      rowCount,
      columns,
      source,
    }],
    fileType: fileName.endsWith('.csv') ? 'csv' : 'txt',
    limitedAnalysis: false,
    mode: 'structured',
  };
}

// ── DOCX / PDF — Dateiname als Haupt-Signal ─────────────────────────────────
// Dateiinhalte von DOCX/PDF sind ohne externe Libraries nicht zuverlässig
// lesbar. Der Dateiname ist aber oft sehr aussagekräftig (z.B. "Server_Liste.docx").
function analyzeByFilename(fileName: string, fileType: 'docx' | 'pdf'): ImportAnalysis {
  const baseName = fileName.replace(/\.[^.]+$/, '').replace(/[_\-]/g, ' ');
  const kw = scoreByKeywords(baseName);
  return {
    sheets: [{
      sheetName: fileName,
      suggestedCategory: kw.confidence >= 15 ? kw.best : null,
      confidence: kw.confidence,
      matchedFields: [],
      rowCount: 0,
      columns: [],
      source: 'filename',
    }],
    fileType,
    limitedAnalysis: true,
    mode: 'structured',
  };
}

// ── Haupt-Entry-Point ────────────────────────────────────────────────────────
export function analyzeFile(file: File): Promise<ImportAnalysis> {
  const name = file.name.toLowerCase();

  if (name.endsWith('.docx')) {
    return Promise.resolve(analyzeByFilename(file.name, 'docx'));
  }
  if (name.endsWith('.pdf')) {
    return Promise.resolve(analyzeByFilename(file.name, 'pdf'));
  }
  if (name.endsWith('.csv') || name.endsWith('.txt') || name.endsWith('.tsv')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          resolve(analyzeText(e.target!.result as string, file.name));
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsText(file, 'UTF-8');
    });
  }
  // xlsx / xls und alles andere als Tabelle versuchen
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        resolve(analyzeSpreadsheet(data));
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Rückwärtskompatibilität für bestehende Aufrufe
export const analyzeExcel = analyzeFile;
