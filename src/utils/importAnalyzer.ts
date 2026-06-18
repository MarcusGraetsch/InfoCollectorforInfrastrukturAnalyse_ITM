import { CATEGORIES } from '../categories';
import type { CategoryKey } from '../types';

type XLSXModule = typeof import('xlsx');

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
  limitedAnalysis: boolean; // true wenn Inhalt nicht vollständig lesbar war
  mode: 'structured' | 'unstructured';
  classifiedRows?: RowClassification[];
}

// ── Row-by-row classification for unstructured files ─────────────────────

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

// Priority-ordered rules. First matching rule wins if score >= threshold.
// Pattern matched against: name + hersteller + modell (all lowercased, joined)
const ROW_RULES: Array<{ pattern: RegExp; category: CategoryKey; score: number }> = [
  // Storage first (before server, since "NetApp Storage" etc.)
  { pattern: /storage|netapp|tape.?librar|tap.?librar|dxi\b|lto\b|nas\b(?!.*server)|san\b(?!.*server)|archivierung|wechseldatenträger|quantum/i, category: 'datentraeger', score: 85 },
  // Network hardware
  { pattern: /switch(?!.*software)|router|firewall|gateway(?!.*software)|proxy|access[\s-]?point|wlan(?!.*controller)|medienconverter|patch[\s-]?panel|eduroam|radius[\s-]?server|telefon[\s-]?(anlage|router|alarm|plus)|telefonalage|radsec/i, category: 'netzkomponenten', score: 90 },
  // Server infrastructure (physical/virtual)
  { pattern: /\besx\b|hypervisor|\bvm\b(?!ware\s+workstation)|server(?!\s*farm\s*software)|domain[\s-]?controller|\bdc\b(?!\s*comics)|\bdhcp\b|\bdns\b|file[\s-]?server|backup[\s-]?server|kms\b|key[\s-]?management|windows[\s-]?(imager|update[\s-]?server|deployment)|active[\s-]?directory|\bad\b(?!\s*hoc)|readonlydc|readonly[\s-]?dc|\bvdi\b|radius[\s-]?server|ad[\s-]?server|interne[\s.]*zertifizierungsstell/i, category: 'server', score: 85 },
  // Applications / Software
  { pattern: /software|anwendung|domino|buchhaltung|wiki|intranet(?!\s*server)|mail(?![\s-]?server)|ticketsystem|zeiterfassung|druckerverwaltung|antragsmanagementsystem|managementsystem|verwaltungs|berechnungs|statistik|zweifaktor|authentifizierung|remote[\s-]?app\b|stipendiaten|zertifizierungsst|e[\s-]?mail[\s-]?archiv|dokumenten[\s-]?management|dms\b|erp\b|crm\b|tool\b|vertraulichkeit|vertrauenserkl|förderung|beantragungs|aqurate/i, category: 'anwendungen', score: 80 },
  // Physical/IoT devices (USV, alarms, printers, copiers)
  { pattern: /\busv\b|ups\b|socomec|alarmanlage|\balarm\b(?!.*server)|kopierer|cockpit[\s-]?box|drucker(?!verwaltung)|apc\b(?!.*software)|kamera(?!.*software)/i, category: 'iotSysteme', score: 80 },
  // Network connections
  { pattern: /vpn\b|mpls\b|wan[\s-]?anbindung|standleitung|internet[\s-]?anbindung|lwl|lichtwellenleiter/i, category: 'netzverbindungen', score: 80 },
  // Clients
  { pattern: /\bclient\b(?!.*server)|laptop|notebook|\bdesktop\b|\bpc\b(?!\s*server)|arbeitsplatz(?!.*server)|smartphone|tablet|thin[\s-]?client|zero[\s-]?client/i, category: 'clients', score: 80 },
  // ICS
  { pattern: /\bsps\b|\bplc\b|\bscada\b|\bics\b|steuerung(?!.*software)|simatic|s7[\s-]|wincc|prozessleittechnik|ot[\s-]?netz/i, category: 'icsSysteme', score: 85 },
];

// Detects which columns in an unstructured sheet contain: name, anzahl, hersteller, modell, standort
// by matching column header strings against known patterns.
function detectColumnRoles(columns: string[]): {
  nameCol: string | null;
  anzahlCol: string | null;
  herstellerCol: string | null;
  modellCol: string | null;
  standortCol: string | null;
} {
  const find = (patterns: RegExp) => columns.find(c => patterns.test(c.toLowerCase())) ?? null;
  return {
    nameCol:      find(/kurzbeschreibung|bezeichnung|beschreibung|name|komponente|gerät|system|titel|objekt/),
    anzahlCol:    find(/anzahl|count|menge|stück|qty/),
    herstellerCol:find(/hersteller|vendor|manufacturer|marke|brand/),
    modellCol:    find(/modell|model|type|typ|version|artikel/),
    standortCol:  find(/standort|location|ort|raum|gebäude/),
  };
}

export function classifyRows(
  rows: Record<string, unknown>[],
  columns: string[]
): RowClassification[] {
  const roles = detectColumnRoles(columns);

  // If no name column found, use the first column
  const nameCol = roles.nameCol ?? columns[0] ?? '';

  const results: RowClassification[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawName = String(row[nameCol] ?? '').trim().replace(/\r\n|\r|\n/g, ' ').trim();

    // Merge continuation rows (empty name) into the previous entry's erlaeuterung
    if (!rawName && results.length > 0) {
      const prev = results[results.length - 1];
      // Append sub-description to the previous entry's rawData notes
      const subDesc = columns
        .filter(c => c !== nameCol)
        .map(c => String(row[c] ?? '').trim())
        .filter(Boolean)
        .join(' | ');
      if (subDesc) {
        const existing = String(prev.rawData['_subDesc'] ?? '');
        prev.rawData['_subDesc'] = existing ? `${existing}; ${subDesc}` : subDesc;
      }
      continue;
    }

    if (!rawName) continue;

    // Build match text from name + hersteller + modell
    const hersteller = String(row[roles.herstellerCol ?? ''] ?? '').trim();
    const modell = String(row[roles.modellCol ?? ''] ?? '').trim();
    const matchText = [rawName, hersteller, modell].filter(Boolean).join(' ');

    let best: CategoryKey = 'server'; // fallback
    let bestScore = 0;

    for (const rule of ROW_RULES) {
      if (rule.pattern.test(matchText)) {
        if (rule.score > bestScore) {
          bestScore = rule.score;
          best = rule.category;
          break; // rules are priority-ordered
        }
      }
    }

    // Keyword fallback via CATEGORY_KEYWORDS if no rule matched well
    if (bestScore === 0) {
      const kw = scoreByKeywords(matchText);
      if (kw.best && kw.confidence > 20) {
        best = kw.best;
        bestScore = kw.confidence;
      }
    }

    results.push({
      rowIndex: i,
      name: rawName,
      rawData: {
        ...row,
        _hersteller: hersteller,
        _modell: modell,
        _anzahl: String(row[roles.anzahlCol ?? ''] ?? '').trim(),
        _standort: String(row[roles.standortCol ?? ''] ?? '').trim(),
      },
      suggestedCategory: best,
      confidence: bestScore,
    });
  }

  return results;
}

// ── Excel / XLSX / XLS ──────────────────────────────────────────────────────
function analyzeSpreadsheet(XLSX: XLSXModule, data: Uint8Array): ImportAnalysis {
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

  // Switch to unstructured mode if no sheet has decent column confidence
  const maxConf = Math.max(...sheets.map(s => s.confidence), 0);
  if (maxConf < 30) {
    // Take the first sheet with data
    const firstSheet = sheets[0];
    if (firstSheet) {
      const ws = wb.Sheets[firstSheet.sheetName];
      const allRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
      const columns = allRows.length > 0 ? Object.keys(allRows[0]) : [];

      // First row might be a sub-header (e.g. "Kurzbeschreibung | Anzahl | Hersteller | ...")
      // Detect: if first row values are all short non-numeric strings → skip it as header
      let dataRows = allRows;
      if (allRows.length > 1) {
        const firstRowVals = Object.values(allRows[0]).map(v => String(v).trim());
        const looksLikeHeader = firstRowVals.every(v => v.length < 30 && isNaN(Number(v)));
        if (looksLikeHeader) {
          dataRows = allRows.slice(1);
        }
      }

      const classifiedRows = classifyRows(dataRows, columns);
      return { sheets, fileType: 'excel', limitedAnalysis: false, mode: 'unstructured', classifiedRows };
    }
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
  return import('xlsx').then(XLSX => new Promise<ImportAnalysis>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        resolve(analyzeSpreadsheet(XLSX, data));
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  }));
}

// Rückwärtskompatibilität für bestehende Aufrufe
export const analyzeExcel = analyzeFile;
