import type { EvidenceItem, EvidenceStatus } from '../types';
import { NACHWEIS_KATALOG } from './nachweise';
import type { NachweisKategorie } from './nachweise';
import { makeId } from '../utils/governance';

// ─────────────────────────────────────────────────────────────────────────────
// Paket 9 — Brücke vom statischen Nachweis-Katalog zum interaktiven Evidence-Modell.
// Erzeugt aus NACHWEIS_KATALOG editierbare EvidenceItems (zentrale Nachweisobjekte,
// n:m zu Themen/Rollen/Objekten) und migriert den Alt-Status (nachweisStatus)
// non-destruktiv. Kein Bruch der bestehenden NachweisKatalog-Daten.
// ─────────────────────────────────────────────────────────────────────────────

/** Standard-Themen-Tags (Norm-/Themenbezug) für Filter & Klassifizierung. */
export const EVIDENCE_THEMEN = [
  'DSGVO', 'NIS2', 'BSI', 'C5', 'DORA', 'AI Act', 'ISO 27001', 'Supply-Chain', 'Souveränität',
] as const;

/** Mappt die statische NachweisKategorie auf Themen-Tags. */
const KATEGORIE_THEMEN: Record<NachweisKategorie, string[]> = {
  Datenschutz: ['DSGVO'],
  Cybersicherheit: ['NIS2', 'BSI', 'ISO 27001'],
  Souveränität: ['Souveränität', 'C5'],
  KI: ['AI Act'],
  'Supply-Chain': ['Supply-Chain', 'DORA'],
};

/** Warum-wichtig-Kurztext je Kategorie (orientierend, editierbar). */
const KATEGORIE_WARUM: Record<NachweisKategorie, string> = {
  Datenschutz: 'Erforderlich für die Rechtmäßigkeit der Verarbeitung personenbezogener Daten und die Nachweispflicht (Accountability) nach DSGVO.',
  Cybersicherheit: 'Beleg für ein angemessenes Sicherheitsniveau und Voraussetzung für NIS2-Konformität / Zertifizierungsfähigkeit.',
  Souveränität: 'Beleg für digitale Souveränität, operative Unabhängigkeit und Vermeidung von Anbieter-Lock-in.',
  KI: 'Erforderlich für die Einstufung und Konformität von KI-Systemen nach EU AI Act.',
  'Supply-Chain': 'Transparenz und Risikosteuerung in der Liefer-/Subprozessoren-Kette (NIS2 Art. 21, DORA).',
};

/** Deterministische Seed-ID für einen Katalog-Nachweis. */
const seedIdFor = (nachweisId: string) => `ev-${nachweisId}`;

/** Legt aus dem statischen Katalog eine (noch nicht persistierte) EvidenceItem-Vorlage an. */
function buildSeedItem(nachweisId: string): EvidenceItem | undefined {
  const n = NACHWEIS_KATALOG.find(x => x.id === nachweisId);
  if (!n) return undefined;
  return {
    id: seedIdFor(n.id),
    seedKey: n.id,
    title: n.anforderung,
    description: n.nachweis,
    evidenceType: 'Nachweis/Artefakt',
    status: 'Offen',
    whyImportant: KATEGORIE_WARUM[n.kategorie],
    themen: KATEGORIE_THEMEN[n.kategorie],
    normativeReferences: [n.quelle],
    beispielNachweise: n.nachweis,
    benoetigteInfos: `Aktuelles Dokument/Artefakt zu: ${n.anforderung}.`,
  };
}

/**
 * Erzeugt/ergänzt EvidenceItems aus dem statischen Katalog (idempotent über `seedKey`).
 * Migriert vorhandene Alt-Status (nachweisStatus: vorhanden→'Erhalten', notiz→fileReference).
 * Bestehende EvidenceItems werden NICHT überschrieben.
 */
export function seedEvidenceItems(
  existing: EvidenceItem[] = [],
  legacyStatus: Record<string, { vorhanden: boolean; notiz: string }> = {},
): EvidenceItem[] {
  const haveSeedKeys = new Set(existing.map(e => e.seedKey).filter(Boolean));
  const additions: EvidenceItem[] = [];
  for (const n of NACHWEIS_KATALOG) {
    if (haveSeedKeys.has(n.id)) continue;
    const seed = buildSeedItem(n.id);
    if (!seed) continue;
    const legacy = legacyStatus[n.id];
    if (legacy) {
      const status: EvidenceStatus = legacy.vorhanden ? 'Erhalten' : 'Offen';
      seed.status = status;
      if (legacy.notiz?.trim()) seed.fileReference = legacy.notiz.trim();
    }
    additions.push(seed);
  }
  return [...existing, ...additions];
}

/** Erzeugt ein leeres, eigenes EvidenceItem (für „Eigener Nachweis"). */
export function makeBlankEvidence(): EvidenceItem {
  return { id: makeId('ev'), title: 'Neuer Nachweis', status: 'Offen', themen: [] };
}

/** Anzahl der Katalog-Nachweise, die noch nicht als EvidenceItem existieren. */
export function missingSeedCount(existing: EvidenceItem[] = []): number {
  const haveSeedKeys = new Set(existing.map(e => e.seedKey).filter(Boolean));
  return NACHWEIS_KATALOG.filter(n => !haveSeedKeys.has(n.id)).length;
}
