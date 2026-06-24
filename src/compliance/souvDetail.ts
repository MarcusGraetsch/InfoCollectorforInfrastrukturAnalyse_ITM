import type { GovernanceTopicInfo } from '../utils/governance';
import type { SouvDimension } from './souveraenitaet';

/**
 * Paket 6 — Geführter Beratungsinhalt je Cloud-Souveränitäts-Dimension.
 * Statisch/offline. Verknüpft mit Rollen (ROLE_CATALOG.key) und Nachweisen
 * (NACHWEIS_KATALOG.id) für zentrale Referenzierung über GovernanceTopic.
 */
export const SOUV_DIMENSION_INFO: Record<SouvDimension, GovernanceTopicInfo> = {
  datenschutz: {
    whyImportant: 'Datenschutz entscheidet, ob personenbezogene Daten überhaupt in eine (Public) Cloud dürfen. Schutzbedarf, Datensouveränität und Anbieter-Jurisdiktion bestimmen das Restrisiko (Drittlandtransfer, behördlicher Zugriff).',
    normative: 'DSGVO (insb. Art. 28, 32, 44 ff.), Schrems II, EDPB-Empfehlungen 01/2020, BSI C5.',
    dataInfluences: [
      'Schutzbedarf & Datensouveränität der cloud-relevanten Objekte',
      'Cloud-Anbieter-Jurisdiktion (EU/USA/Gemischt)',
      'Verschlüsselungshoheit (Anbieter vs. BYOK/HYOK)',
    ],
    missingInfos: ['Vollständige Datenklassifizierung', 'AVV/SCC-Status je Provider', 'Transfer-Impact-Assessment bei Drittlandtransfer'],
    improvements: ['EU-/DE-Rechenzentrum bzw. souveräne Cloud wählen', 'BYOK/HYOK einführen', 'Confidential Computing für höchsten Schutzbedarf prüfen'],
    workshopFragen: [
      'Sind alle personenbezogenen Datenbestände klassifiziert und der Schutzbedarf festgelegt?',
      'Liegen für alle Cloud-Provider AVV und ggf. SCC + TIA vor?',
      'Wer hält die Verschlüsselungsschlüssel?',
    ],
    naechsteSchritte: ['Datenklassifizierung vervollständigen', 'AVV/SCC/TIA je Provider einholen', 'Schlüsselmanagement festlegen'],
    roleKeys: ['dsb', 'cloud-governance', 'krypto-verantwortliche'],
    evidenceSeedKeys: ['nw-avv', 'nw-scc', 'nw-tia', 'nw-krypto', 'nw-voa'],
    appDataHint: 'Hilft: Schutzbedarf/Datensouveränität der Objekte, Daten-Kategorie (Personenbezug), Verschlüsselungshoheit in den Cloud-Feldern.',
  },
  cybersicherheit: {
    whyImportant: 'Ohne belegtes Sicherheitsniveau des Cloud-Dienstes und ein funktionierendes ISMS bleiben Souveränitätsversprechen wirkungslos. Cybersicherheit ist Voraussetzung für NIS2-Konformität.',
    normative: 'NIS2 Art. 21 / §30 BSIG, BSI C5:2026, ISO/IEC 27001.',
    dataInfluences: ['NIS2-Gap-Analyse (Erfüllungsgrad der Mindestmaßnahmen)', 'Vorhandene Sicherheits-/Monitoring-Tools', 'Zertifikate (C5/ISO 27001)'],
    missingInfos: ['Aktuelles C5-Testat / ISO-Zertifikat', 'Penetrationstest-Ergebnisse', 'ISMS-Reifegrad'],
    improvements: ['NIS2-Maßnahmen schließen (s. NIS2-Check)', 'C5-Testat des Providers anfordern', 'ISMS nach ISO 27001 etablieren'],
    workshopFragen: [
      'Liegt ein aktuelles BSI-C5-Testat (Typ 2) des Providers vor?',
      'Wie ist der NIS2-Erfüllungsgrad?',
      'Gibt es ein zertifiziertes ISMS?',
    ],
    naechsteSchritte: ['NIS2-Gap-Analyse abschließen', 'C5/ISO-Nachweise einholen', 'Pentest beauftragen'],
    roleKeys: ['isb', 'compliance-audit'],
    evidenceSeedKeys: ['nw-c5', 'nw-isms', 'nw-iso27001', 'nw-pentest'],
    appDataHint: 'Hilft: NIS2-Check (Erfüllungsgrad), erfasste Sicherheits-/Monitoring-Tools.',
  },
  resilienz: {
    whyImportant: 'Operative Resilienz sichert, dass kritische Dienste auch bei Ausfall eines Providers weiterlaufen oder schnell wiederhergestellt werden. Konzentrationsrisiken und fehlende Exit-Fähigkeit sind zentrale Souveränitätsrisiken.',
    normative: 'DORA (Finanzsektor), NIS2 Art. 21 (2) c, BSI 200-4 (BCM), EU Data Act (Exit/Portabilität).',
    dataInfluences: ['DORA-/IKT-Drittparteienregister (Kritikalität, Exit-Strategien)', 'Konzentrationsrisiko je Provider', 'Backup-/Wiederanlauf-Daten'],
    missingInfos: ['Dokumentierte Exit-Pläne je kritischem Provider', 'Getestete Wiederanlaufzeiten (RTO/RPO)', 'Multi-Provider-/Multi-Region-Strategie'],
    improvements: ['Exit-Pläne erstellen und testen', 'Konzentrationsrisiken reduzieren', 'BCM/Wiederanlauf üben'],
    workshopFragen: [
      'Existieren getestete Exit-Pläne für kritische Cloud-Dienste?',
      'Bestehen Konzentrationsrisiken (Single Provider/Region)?',
      'Sind RTO/RPO definiert und getestet?',
    ],
    naechsteSchritte: ['IKT-Register vervollständigen', 'Exit-Plan + Export-Test je kritischem Provider', 'BCM-Übung ansetzen'],
    roleKeys: ['bcm-beauftragter', 'lieferanten-management', 'cloud-governance'],
    evidenceSeedKeys: ['nw-exit', 'nw-portab', 'nw-soc2'],
    appDataHint: 'Hilft: DORA IKT-Register (Kritikalität, Exit, Konzentrationsrisiko), Backup-Software-Felder.',
  },
  lockin: {
    whyImportant: 'Vendor-Lock-in untergräbt digitale Souveränität: Wer nicht wechseln kann, ist abhängig. Portabilität in offenen Formaten und Standard-APIs erhalten die Handlungsfähigkeit.',
    normative: 'EU Data Act (2023/2854), Free Flow of Non-Personal Data, Gaia-X, SEAL-Bewertung.',
    dataInfluences: ['SEAL-Level je Objekt', 'Portabilitätsreife (Standard- vs. proprietäre Formate)', 'Gaia-X-Konformität'],
    missingInfos: ['Liste proprietärer Abhängigkeiten', 'Export-/Migrationstests', 'Gaia-X Self-Description'],
    improvements: ['Auf offene Standards/Kubernetes setzen', 'Datenportabilität testen', 'Souveräne Cloud (STACKIT/IONOS) erwägen'],
    workshopFragen: [
      'Welche Workloads sind proprietär gebunden?',
      'Sind Export in offene Formate und Migration getestet?',
      'Ist Gaia-X-Konformität ein Vergabekriterium?',
    ],
    naechsteSchritte: ['Lock-in-Risiken je Workload bewerten', 'Portabilität testen', 'Zielarchitektur ohne Lock-in skizzieren'],
    roleKeys: ['cloud-governance', 'cloud-service-owner'],
    evidenceSeedKeys: ['nw-portab', 'nw-gaiax', 'nw-exit', 'nw-admin'],
    appDataHint: 'Hilft: SEAL-Bewertung, Portabilitätsreife & Cloud-Eignung (6R) in den Cloud-Feldern.',
  },
  kiGovernance: {
    whyImportant: 'KI-Systeme bringen eigene Souveränitäts- und Compliance-Risiken (Datenherkunft, Modell-Provider, Aufsicht). Ohne KI-Governance drohen Shadow-AI und EU-AI-Act-Verstöße.',
    normative: 'EU AI Act (insb. Art. 9, 11, 12), BSI AIC4, ISO/IEC 42001.',
    dataInfluences: ['Als KI markierte Anwendungen + Risikoklasse', 'Menschliche Aufsicht & Logging', 'Modell-/Anbieterherkunft'],
    missingInfos: ['Vollständiges KI-Inventar (inkl. Shadow-AI)', 'Risikoklassifizierung je System', 'Logging-/Aufsichtsnachweise'],
    improvements: ['KI-Inventar vervollständigen (s. EU AI Act-Tab)', 'Hochrisiko-Systeme dokumentieren', 'AIC4/ISO-42001 anstreben'],
    workshopFragen: [
      'Sind alle KI-Systeme inkl. Shadow-AI erfasst und klassifiziert?',
      'Bestehen menschliche Aufsicht und Logging?',
      'Woher stammen Modelle/Trainingsdaten?',
    ],
    naechsteSchritte: ['KI-Inventar abschließen', 'Risikoklassen festlegen', 'Aufsicht/Logging nachweisen'],
    roleKeys: ['cloud-governance', 'dsb', 'compliance-audit'],
    evidenceSeedKeys: ['nw-aic4', 'nw-iso42001', 'nw-ailog', 'nw-airisk'],
    appDataHint: 'Hilft: EU AI Act-Inventar (istKISystem, Risikoklasse, Aufsicht, Logging) der Anwendungen.',
  },
  supplyChain: {
    whyImportant: 'Transparenz über Provider, Subprozessoren und Software-Lieferkette ist Voraussetzung für Risikosteuerung und Souveränität — verdeckte Subprozessoren in Drittländern unterlaufen sonst alle Garantien.',
    normative: 'NIS2 Art. 21 (2) d, DSGVO Art. 28 (4), DORA, SLSA/SBOM (CycloneDX/SPDX).',
    dataInfluences: ['Provider-/Subprozessor-Sichtbarkeit (IKT-Register)', 'SBOM-/SOC-2-Verfügbarkeit', 'Standortangaben der Dienstleister'],
    missingInfos: ['Aktuelle Subprozessoren-Liste', 'SBOM kritischer Software', 'Standort-/Jurisdiktionskarte'],
    improvements: ['Subprozessoren-Transparenz vertraglich sichern', 'SBOM anfordern', 'SOC-2/ISO-Nachweise einholen'],
    workshopFragen: [
      'Sind alle Subprozessoren inkl. Standort bekannt?',
      'Liegen SBOMs für kritische Software vor?',
      'Gibt es einen Änderungs-Benachrichtigungsprozess?',
    ],
    naechsteSchritte: ['Subprozessoren-Liste anfordern', 'SBOM/SOC-2 einholen', 'IKT-Register pflegen'],
    roleKeys: ['lieferanten-management', 'cloud-governance'],
    evidenceSeedKeys: ['nw-subproz', 'nw-sbom', 'nw-soc2'],
    appDataHint: 'Hilft: DORA IKT-Register (Provider, Land), Cloud-Anbieter-Jurisdiktion der Objekte.',
  },
};
