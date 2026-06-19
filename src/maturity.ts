// Block 12 — Reifegradmodell & Maturity-Assessment
import type { AppState } from './types';

export type MaturityLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface MaturityDimension {
  id: string;
  label: string;
  description: string;
  level: MaturityLevel;
  maxLevel: 5;
  rationale: string;
}

export interface MaturityResult {
  dimensions: MaturityDimension[];
  gesamtLevel: number; // 0–5, one decimal
  gesamtLabel: string;
  handlungsempfehlungen: string[];
}

const LEVEL_LABELS: Record<number, string> = {
  0: 'Nicht vorhanden',
  1: 'Initial',
  2: 'Wiederholbar',
  3: 'Definiert',
  4: 'Gesteuert',
  5: 'Optimiert',
};

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function berechneMaturity(state: AppState): MaturityResult {
  const dims: MaturityDimension[] = [];

  // 1. Datenerfassung
  const totalItems =
    state.anwendungen.length + state.server.length + state.clients.length +
    state.netzkomponenten.length + state.icsSysteme.length + state.iotSysteme.length;
  const datenLevel = clamp(
    totalItems === 0 ? 0 : totalItems < 5 ? 1 : totalItems < 20 ? 2 : totalItems < 50 ? 3 : totalItems < 100 ? 4 : 5,
    0, 5
  ) as MaturityLevel;
  dims.push({
    id: 'datenerfassung',
    label: 'Datenerfassung',
    description: 'Vollständigkeit der erfassten IT-Komponenten',
    level: datenLevel,
    maxLevel: 5,
    rationale: `${totalItems} Komponenten erfasst`,
  });

  // 2. Cloud-Readiness
  const cloudItems = [...state.anwendungen, ...state.server, ...state.clients, ...state.icsSysteme, ...state.iotSysteme];
  const withCloud = cloudItems.filter((i) => i.migrationskomplexitaet && i.migrationskomplexitaet !== 'Unklar');
  const cloudRatio = cloudItems.length === 0 ? 0 : withCloud.length / cloudItems.length;
  const cloudLevel = clamp(
    cloudRatio === 0 ? 0 : cloudRatio < 0.2 ? 1 : cloudRatio < 0.4 ? 2 : cloudRatio < 0.6 ? 3 : cloudRatio < 0.8 ? 4 : 5,
    0, 5
  ) as MaturityLevel;
  dims.push({
    id: 'cloud_readiness',
    label: 'Cloud-Readiness',
    description: 'Anteil der Komponenten mit definierter Migrationsstrategie',
    level: cloudLevel,
    maxLevel: 5,
    rationale: `${Math.round(cloudRatio * 100)}% mit Strategie (${withCloud.length}/${cloudItems.length})`,
  });

  // 3. Sicherheits-Governance
  const hasNIS2 = !!state.nis2Assessment;
  const secItems = cloudItems.filter((i) => i.schutzbedarf && i.schutzbedarf !== 'Unklar');
  const secRatio = cloudItems.length === 0 ? 0 : secItems.length / cloudItems.length;
  const secLevel = clamp(
    !hasNIS2 && secRatio < 0.1 ? 0 :
    !hasNIS2 ? 1 :
    secRatio < 0.3 ? 2 :
    secRatio < 0.6 ? 3 :
    secRatio < 0.9 ? 4 : 5,
    0, 5
  ) as MaturityLevel;
  dims.push({
    id: 'sicherheit',
    label: 'Sicherheits-Governance',
    description: 'Schutzbedarf-Klassifizierung und NIS2-Assessment',
    level: secLevel,
    maxLevel: 5,
    rationale: `NIS2: ${hasNIS2 ? 'vorhanden' : 'fehlt'}, ${Math.round(secRatio * 100)}% mit Schutzbedarf`,
  });

  // 4. Projektmanagement
  const lgDone = state.liefergegenstaende.filter((l) => l.status === 'Abgenommen').length;
  const lgTotal = state.liefergegenstaende.length;
  const hasMeetings = state.meetings.length > 0;
  const hasStakeholder = state.stakeholder.length > 0;
  const pmScore = (lgTotal > 0 ? lgDone / lgTotal : 0) * 3 + (hasMeetings ? 1 : 0) + (hasStakeholder ? 1 : 0);
  const pmLevel = clamp(Math.round(pmScore), 0, 5) as MaturityLevel;
  dims.push({
    id: 'projektmanagement',
    label: 'Projektmanagement',
    description: 'Liefergegenstände, Meetings, Stakeholder-Management',
    level: pmLevel,
    maxLevel: 5,
    rationale: `${lgDone}/${lgTotal} LG abgenommen, ${state.meetings.length} Protokolle, ${state.stakeholder.length} Stakeholder`,
  });

  // 5. Kosten-Transparenz
  const hasTCO = !!(state.tcoData.istkostenOnPrem || state.tcoData.zielkostenCloud);
  const hasLizenz = state.anwendungen.some((a) => a.lizenzkosten);
  const hasSAM = state.anwendungen.some((a) => a.lizenzmodell && a.lizenzmodell !== 'Unklar');
  const kostenLevel = clamp(
    !hasTCO && !hasLizenz ? 0 :
    hasLizenz && !hasTCO ? 1 :
    hasTCO && !hasSAM ? 2 :
    hasTCO && hasSAM && !state.tcoData.szenarien ? 3 :
    hasTCO && hasSAM && state.tcoData.szenarien ? 4 : 5,
    0, 5
  ) as MaturityLevel;
  dims.push({
    id: 'kostentransparenz',
    label: 'Kosten-Transparenz',
    description: 'TCO-Analyse, Lizenzmanagement, FinOps-Szenarien',
    level: kostenLevel,
    maxLevel: 5,
    rationale: `TCO: ${hasTCO ? 'vorhanden' : 'fehlt'}, Lizenz: ${hasLizenz ? 'ja' : 'nein'}, SAM: ${hasSAM ? 'ja' : 'nein'}`,
  });

  // 6. Compliance & Regulatorik
  const hasDORA = (state.iktDienstleister?.length ?? 0) > 0;
  const nis2Score = state.nis2Assessment?.einstufung ?? '';
  const complianceLevel = clamp(
    !hasNIS2 && !hasDORA ? 0 :
    hasNIS2 && !hasDORA ? 1 :
    hasDORA && !hasNIS2 ? 1 :
    nis2Score === 'Nicht betroffen' ? 2 :
    nis2Score === 'Wichtig' ? 3 :
    nis2Score === 'Besonders wichtig' ? 4 : 2,
    0, 5
  ) as MaturityLevel;
  dims.push({
    id: 'compliance',
    label: 'Compliance & Regulatorik',
    description: 'NIS2, DORA IKT-Register, Datenschutz',
    level: complianceLevel,
    maxLevel: 5,
    rationale: `NIS2: ${hasNIS2 ? nis2Score || 'bewertet' : 'fehlt'}, DORA-Register: ${hasDORA ? (state.iktDienstleister?.length ?? 0) + ' Einträge' : 'leer'}`,
  });

  const avg = dims.reduce((sum, d) => sum + d.level, 0) / dims.length;
  const gesamtLevel = Math.round(avg * 10) / 10;
  const gesamtLabel = LEVEL_LABELS[Math.round(avg)] ?? 'Unbekannt';

  // Handlungsempfehlungen
  const handlungsempfehlungen: string[] = [];
  const lowest = [...dims].sort((a, b) => a.level - b.level).slice(0, 3);
  for (const d of lowest) {
    if (d.level < 3) {
      handlungsempfehlungen.push(`${d.label} (Level ${d.level}): ${d.rationale} — Ausbau empfohlen`);
    }
  }
  if (handlungsempfehlungen.length === 0) {
    handlungsempfehlungen.push('Alle Dimensionen auf gutem Niveau — Optimierung und Automatisierung als nächste Schritte');
  }

  return { dimensions: dims, gesamtLevel, gesamtLabel, handlungsempfehlungen };
}

export { LEVEL_LABELS };
