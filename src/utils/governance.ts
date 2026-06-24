import type {
  RoleAssignment, RoleRelevance, GovernanceTopic, GovernanceDomain,
  EvidenceItem, ActionItem,
} from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Querschnitt — reine Hilfsfunktionen für das gemeinsame Governance-/Evidence-/
// Rollen-/Action-Modell. Keine UI, keine Mutation des AppState (immer neue Arrays).
// ─────────────────────────────────────────────────────────────────────────────

/** Deterministische ID mit Präfix (kollisionsarm, ohne externe Dependency). */
export function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const DOMAIN_LABEL: Record<GovernanceDomain, string> = {
  nis2: 'NIS2',
  cloudSovereignty: 'Cloud-Souveränität',
  aiAct: 'EU AI Act',
  bcm: 'BCM / Notfall',
  cloudExit: 'Cloud-Exit',
  sustainability: 'Nachhaltigkeit',
  itGrundschutz: 'IT-Grundschutz',
};

export const ROLE_RELEVANCE_LABEL: Record<RoleRelevance, string> = {
  isms: 'ISMS / Zertifizierung',
  bcm: 'BCM / Krise',
  nis2: 'NIS2',
  cloudGovernance: 'Cloud-Governance',
  datenschutz: 'Datenschutz',
  empfohlen: 'Empfohlen',
};

/**
 * Seed-Katalog der ISMS-/BCM-/NIS2-Rollen (Paket 4). Bewusst NICHT als „in jeder
 * Organisation formal vorgeschrieben" deklariert — die `relevanz`-Tags markieren,
 * für welchen Rahmen eine Rolle typischerweise zertifizierungs-/BCM-/NIS2-relevant
 * oder lediglich empfohlen ist. normative Hinweise sind orientierend.
 */
export interface RoleCatalogEntry {
  key: string;
  roleName: string;
  relevanz: RoleRelevance[];
  responsibility: string;
  normativeHint?: string;
}

export const ROLE_CATALOG: RoleCatalogEntry[] = [
  { key: 'leitung', roleName: 'Geschäftsleitung / oberste Leitung', relevanz: ['isms', 'nis2', 'bcm'],
    responsibility: 'Gesamtverantwortung für Informationssicherheit, Bereitstellung von Ressourcen, Genehmigung der Leitlinie. Nach NIS2 persönliche Verantwortung der Leitungsorgane für Aufsicht und Billigung der Risikomanagementmaßnahmen.',
    normativeHint: 'BSI 200-2 (Leitung), Art. 20 NIS2 / §38 BSIG (Governance, Leitungsverantwortung), ISO 27001 Kap. 5' },
  { key: 'isb', roleName: 'Informationssicherheitsbeauftragte:r (ISB)', relevanz: ['isms', 'nis2'],
    responsibility: 'Steuert das ISMS, koordiniert Sicherheitsmaßnahmen, berichtet an die Leitung, zentrale Ansprechperson für Informationssicherheit.',
    normativeHint: 'BSI 200-2 (ISB), ISO 27001 Kap. 5.3' },
  { key: 'it-sibe', roleName: 'IT-Sicherheitsbeauftragte:r (IT-SiBe)', relevanz: ['isms'],
    responsibility: 'Operative IT-Sicherheit, technische Umsetzung von Sicherheitsmaßnahmen (sofern in der Organisation vom ISB unterschieden).',
    normativeHint: 'BSI 200-2 (Rollendifferenzierung optional)' },
  { key: 'isms-team', roleName: 'IS-Management-Team / ISMS-Team', relevanz: ['isms'],
    responsibility: 'Unterstützt ISB, bündelt Fachexpertise, bereitet Entscheidungen vor, betreut Teilbereiche des ISMS.',
    normativeHint: 'BSI 200-2 (IS-Management-Team)' },
  { key: 'asset-owner', roleName: 'Asset Owner / Informationsverbund-Verantwortliche', relevanz: ['isms'],
    responsibility: 'Verantwortet einzelne Informationswerte/Assets, Schutzbedarfsfeststellung, Freigaben.',
    normativeHint: 'BSI 200-2 (Verantwortliche für Zielobjekte), ISO 27001 A.5.9' },
  { key: 'prozessverantwortliche', roleName: 'Prozessverantwortliche / Fachverantwortliche', relevanz: ['isms', 'empfohlen'],
    responsibility: 'Verantwortet Geschäftsprozesse und deren Schutzbedarf, fachliche Anforderungen an die IT.',
    normativeHint: 'BSI 200-2 (Fachverantwortliche)' },
  { key: 'it-betrieb', roleName: 'IT-Betriebsverantwortliche', relevanz: ['isms', 'empfohlen'],
    responsibility: 'Sicherer Betrieb der IT-Systeme, Patch-/Change-Management, technische Umsetzung von Maßnahmen.',
    normativeHint: 'BSI 200-2, ISO 27001 A.8' },
  { key: 'dsb', roleName: 'Datenschutzbeauftragte:r (DSB)', relevanz: ['datenschutz'],
    responsibility: 'Überwacht die Einhaltung der DSGVO, berät, Schnittstelle zur Aufsichtsbehörde, Verzeichnis der Verarbeitungstätigkeiten.',
    normativeHint: 'Art. 37–39 DSGVO, §§5 ff. BDSG' },
  { key: 'risikomanagement', roleName: 'Risikomanagement-Verantwortliche:r', relevanz: ['isms', 'nis2'],
    responsibility: 'Methodik und Durchführung der Risikoanalyse, Risikobehandlung, Berichtswesen an die Leitung.',
    normativeHint: 'BSI 200-3, Art. 21 (2) a NIS2, ISO 27005' },
  { key: 'bcm-beauftragter', roleName: 'Notfall-/BCM-Beauftragte:r', relevanz: ['bcm', 'nis2'],
    responsibility: 'Aufbau und Pflege des BCM, Business Impact Analyse, Notfallhandbuch, Wiederanlaufpläne, Notfallübungen.',
    normativeHint: 'BSI 200-4 (BCM-Beauftragte:r), Art. 21 (2) c NIS2' },
  { key: 'krisenstab-leitung', roleName: 'Krisenstabsleitung', relevanz: ['bcm'],
    responsibility: 'Leitet den Krisenstab, trifft Entscheidungen in der Bewältigungsphase, Eskalation und Ressourcensteuerung.',
    normativeHint: 'BSI 200-4 (Krisenstab)' },
  { key: 'krisenstab-mitglieder', roleName: 'Krisenstab-Mitglieder', relevanz: ['bcm'],
    responsibility: 'Vertreten Fach-/Querschnittsfunktionen im Krisenstab (IT, Recht, Kommunikation, Personal, Betrieb).',
    normativeHint: 'BSI 200-4 (Krisenstab-Zusammensetzung)' },
  { key: 'krisenkommunikation', roleName: 'Kommunikationsverantwortliche:r Krise', relevanz: ['bcm'],
    responsibility: 'Interne und externe Krisenkommunikation, Sprachregelungen, Presse-/Behördenkommunikation.',
    normativeHint: 'BSI 200-4 (Krisenkommunikation)' },
  { key: 'incident-response', roleName: 'Incident-Response-Verantwortliche:r / CSIRT-Schnittstelle', relevanz: ['nis2', 'bcm'],
    responsibility: 'Bearbeitung von Sicherheitsvorfällen, Meldewege, Schnittstelle zu CSIRT/BSI, Einhaltung der NIS2-Meldepflichten.',
    normativeHint: 'Art. 21 (2) b + Art. 23 NIS2 / §32 BSIG (Meldepflichten)' },
  { key: 'cloud-service-owner', roleName: 'Cloud-Service-Owner', relevanz: ['cloudGovernance'],
    responsibility: 'Fachliche/technische Verantwortung für einzelne Cloud-Dienste, Konfiguration, Kosten, Sicherheitseinstellungen.',
    normativeHint: 'BSI C5, ISO 27017' },
  { key: 'cloud-governance', roleName: 'Cloud-Governance-Verantwortliche:r', relevanz: ['cloudGovernance'],
    responsibility: 'Cloud-Strategie, Richtlinien, Souveränitäts-/Lock-in-Bewertung, Freigabeprozesse für Cloud-Nutzung.',
    normativeHint: 'BSI C5, Gaia-X, EU Cloud Rulebook' },
  { key: 'lieferanten-management', roleName: 'Lieferanten-/Provider-Management', relevanz: ['nis2', 'cloudGovernance'],
    responsibility: 'Lieferantenbewertung, Vertrags-/SLA-Management, Sicherheit der Lieferkette, Drittparteienrisiken.',
    normativeHint: 'Art. 21 (2) d NIS2 (Lieferkette), ISO 27001 A.5.19–A.5.22, DORA' },
  { key: 'compliance-audit', roleName: 'Compliance-/Audit-Verantwortliche:r', relevanz: ['isms', 'nis2'],
    responsibility: 'Interne Audits, Wirksamkeitsprüfung der Maßnahmen, Nachweisführung, Vorbereitung externer Audits/Zertifizierungen.',
    normativeHint: 'Art. 21 (2) f NIS2 (Wirksamkeit), ISO 27001 Kap. 9' },
  { key: 'iam-verantwortliche', roleName: 'IAM-/Berechtigungsmanagement-Verantwortliche:r', relevanz: ['isms', 'nis2'],
    responsibility: 'Identitäten und Berechtigungen, Least-Privilege, Rezertifizierung, MFA-Strategie, privilegierte Zugänge.',
    normativeHint: 'Art. 21 (2) i + j NIS2 (Zugriffskontrolle, MFA), ISO 27001 A.5.15–A.5.18' },
  { key: 'krypto-verantwortliche', roleName: 'Key-/Kryptographie-Verantwortliche:r', relevanz: ['isms', 'nis2'],
    responsibility: 'Kryptokonzept, Schlüsselmanagement (Erzeugung, Rotation, Hinterlegung), Verschlüsselungsvorgaben.',
    normativeHint: 'Art. 21 (2) h NIS2 (Kryptografie), ISO 27001 A.8.24, BSI TR-02102' },
];

/**
 * Erzeugt RoleAssignments aus dem Seed-Katalog. Bestehende Rollen (per `key`)
 * bleiben unverändert; nur fehlende werden ergänzt → wiederholbar/idempotent.
 */
export function seedRoleAssignments(existing: RoleAssignment[] = []): RoleAssignment[] {
  const haveKeys = new Set(existing.map(r => r.key).filter(Boolean));
  const additions = ROLE_CATALOG
    .filter(c => !haveKeys.has(c.key))
    .map<RoleAssignment>(c => ({
      id: makeId('role'),
      key: c.key,
      roleName: c.roleName,
      relevanz: c.relevanz,
      responsibility: c.responsibility,
      status: 'Offen',
    }));
  return [...existing, ...additions];
}

// ── Fortschritts-Helfer ──────────────────────────────────────────────────────

export interface RoleProgress {
  total: number;
  benannt: number;        // personName gesetzt
  mitVertretung: number;  // deputy gesetzt
  mitNachweis: number;    // evidenceIds oder bestellungsdokument gesetzt
}

export function roleProgress(roles: RoleAssignment[]): RoleProgress {
  let benannt = 0, mitVertretung = 0, mitNachweis = 0;
  for (const r of roles) {
    if (r.personName?.trim()) benannt++;
    if (r.deputy?.trim()) mitVertretung++;
    if ((r.evidenceIds && r.evidenceIds.length > 0) || r.bestellungsdokument?.trim()) mitNachweis++;
  }
  return { total: roles.length, benannt, mitVertretung, mitNachweis };
}

/** Anteil [0..1] „erledigter" Governance-Themen (Erfüllt + N/A zählen als abgeschlossen). */
export function topicCompletion(topics: GovernanceTopic[]): number {
  if (topics.length === 0) return 0;
  const done = topics.filter(t => t.status === 'Erfüllt' || t.status === 'N/A').length;
  return done / topics.length;
}

export interface EvidenceProgress {
  total: number;
  offen: number;
  inArbeit: number;   // Angefragt/Erhalten
  geprueft: number;
  na: number;
}

export function evidenceProgress(items: EvidenceItem[]): EvidenceProgress {
  let offen = 0, inArbeit = 0, geprueft = 0, na = 0;
  for (const e of items) {
    if (e.status === 'Offen') offen++;
    else if (e.status === 'Angefragt' || e.status === 'Erhalten') inArbeit++;
    else if (e.status === 'Geprüft') geprueft++;
    else if (e.status === 'Nicht anwendbar') na++;
  }
  return { total: items.length, offen, inArbeit, geprueft, na };
}

// ── Referenz-Auflösung (n:m ohne Duplikate) ─────────────────────────────────

export function roleName(roles: RoleAssignment[], id: string | undefined): string | undefined {
  if (!id) return undefined;
  return roles.find(r => r.id === id)?.roleName;
}

/** Alle Evidence-Items, die einem Thema zugeordnet sind (über beide Richtungen). */
export function evidenceForTopic(items: EvidenceItem[], topic: GovernanceTopic): EvidenceItem[] {
  const fromTopic = new Set(topic.relatedEvidenceIds ?? []);
  return items.filter(e => fromTopic.has(e.id) || (e.relatedTopicIds ?? []).includes(topic.id));
}

/** Alle Themen, denen ein Evidence-Item zugeordnet ist. */
export function topicsForEvidence(topics: GovernanceTopic[], evidence: EvidenceItem): GovernanceTopic[] {
  const fromEv = new Set(evidence.relatedTopicIds ?? []);
  return topics.filter(t => fromEv.has(t.id) || (t.relatedEvidenceIds ?? []).includes(evidence.id));
}

/** Offene ActionItems über alle Themen (für eine spätere globale Aufgabenliste). */
export function openActions(topics: GovernanceTopic[]): ActionItem[] {
  return topics.flatMap(t => (t.actionItems ?? []).filter(a => a.status !== 'Erledigt'));
}
