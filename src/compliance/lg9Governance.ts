import type { GovernanceDomain } from '../types';
import type { GovernanceTopicInfo } from '../utils/governance';

/**
 * Paket 3 — Strukturierte Governance-Themen für den Security-/Governance-Bereich (LG 9):
 * BCM (Business Continuity Management) und Cloud-Exit-Strategie. Statischer
 * Beratungsinhalt; die erfasste Bearbeitung lebt als GovernanceTopic im AppState
 * (domain 'bcm' / 'cloudExit'). Referenziert Rollen + Nachweise zentral.
 */
export interface LG9TopicDef {
  domain: GovernanceDomain;
  key: string;
  title: string;
  kurz: string;
  info: GovernanceTopicInfo;
}

export const LG9_GOVERNANCE_TOPICS: LG9TopicDef[] = [
  {
    domain: 'bcm',
    key: 'bcm',
    title: 'Business Continuity Management (BCM)',
    kurz: 'Fortführung und Wiederanlauf kritischer Prozesse bei Ausfällen und Krisen.',
    info: {
      whyImportant: 'BCM sichert, dass kritische Geschäftsprozesse einen Ausfall (IT-Störung, Cyberangriff, Standortverlust) überstehen oder schnell wiederanlaufen. Bei Ransomware ist ein geprüftes Backup-/Wiederanlaufkonzept oft die letzte Verteidigungslinie.',
      normative: 'BSI-Standard 200-4 (BCM), NIS2 Art. 21 (2) c / §30 BSIG, ISO 22301.',
      dataInfluences: [
        'Erfasste Backup-Software (RPO/RTO, 3-2-1, Offsite/Air-Gap)',
        'Server-/System-Redundanz (HA/Cluster)',
        'Kritische Geschäftsprozesse und ihr Schutzbedarf',
      ],
      missingInfos: [
        'Business Impact Analyse (BIA) mit RTO/RPO je kritischem Prozess',
        'Getestete Backup-Restores (nicht nur Backup-Erfolg)',
        'Wiederanlaufpläne / Notfallhandbuch',
        'Benannter Krisenstab + Krisenkommunikationsplan',
        'Durchgeführte Notfallübungen (mit Datum)',
      ],
      improvements: [
        'BIA für kritische Prozesse erstellen, RTO/RPO festlegen',
        'Restore-Tests regelmäßig durchführen und protokollieren',
        'Notfallhandbuch erstellen, Krisenstab benennen (s. Rollenübersicht)',
        'Notfallübung ansetzen, Lessons Learned dokumentieren',
      ],
      workshopFragen: [
        'Gibt es eine BIA mit RTO/RPO? Werden Restores regelmäßig getestet?',
        'Existiert ein Notfallhandbuch und ein benannter Krisenstab?',
        'Wann fand die letzte Notfallübung statt? Wie ist die Krisenkommunikation geregelt?',
      ],
      naechsteSchritte: ['BIA kritischer Prozesse erstellen', 'Restore-Test ansetzen', 'Krisenstab benennen + Notfallhandbuch starten', 'Notfallübung planen'],
      roleKeys: ['bcm-beauftragter', 'krisenstab-leitung', 'krisenkommunikation', 'krisenstab-mitglieder'],
      evidenceSeedKeys: ['nw-isms'],
      appDataHint: 'Hilft: erfasste Backup-Software (RPO/RTO/3-2-1) unter Anwendungen, Server-Redundanz, Geschäftsprozesse mit Schutzbedarf.',
    },
  },
  {
    domain: 'cloudExit',
    key: 'cloud-exit',
    title: 'Cloud-Exit-Strategie',
    kurz: 'Geplante, getestete Rückhol-/Wechselfähigkeit aus einem Cloud-Dienst.',
    info: {
      whyImportant: 'Eine Cloud-Exit-Strategie sichert Handlungsfähigkeit bei Anbieterwechsel, Preis-/Vertragsänderungen, Insolvenz oder geopolitischen Risiken. Ohne getesteten Exit besteht faktischer Lock-in — Souveränität bleibt Theorie.',
      normative: 'EU Data Act (2023/2854), DORA (Exit-Anforderungen Finanzsektor), BSI C5 (Portabilität/Beendigung).',
      dataInfluences: [
        'SEAL-Level / Portabilitätsreife der Objekte',
        'DORA-/IKT-Register: Exit-Strategien und Kündigungsfristen je Provider',
        'Cloud-Bereitstellungsart (proprietär vs. portabel/Kubernetes)',
      ],
      missingInfos: [
        'Definierte Exit-Szenarien (geplant / Notfall / Insolvenz)',
        'Datenportabilität: Exportformate + getesteter Export',
        'Vertrags-/Kündigungsfristen und Datenrückgabe-/Löschpflichten',
        'Technische Abhängigkeiten (proprietäre Dienste/APIs)',
        'Identitäten/IAM-Migration, Schlüsselmanagement (Key-Übergabe)',
        'IaC-/Deployment-Artefakte (reproduzierbarer Wiederaufbau)',
        'Backup/Restore/Migration auf Zielplattform',
        'Zielplattform(en) definiert, Kosten und Risiken bewertet',
      ],
      improvements: [
        'Exit-Plan je kritischem Dienst erstellen und einen Export-Test durchführen',
        'Auf offene Formate / Kubernetes / Standard-APIs setzen',
        'Zielplattform(en) festlegen, Migrationskosten/-risiken abschätzen',
        'IaC + Schlüssel-/IAM-Übergabe dokumentieren',
      ],
      workshopFragen: [
        'Gibt es für kritische Cloud-Dienste einen dokumentierten, getesteten Exit-Plan?',
        'In welche offenen Formate kann exportiert werden? Wurde der Export getestet?',
        'Welche Kündigungsfristen und Datenrückgaberegeln gelten? Sind IAM/Schlüssel migrierbar?',
        'Welche Zielplattform käme infrage, mit welchen Kosten/Risiken?',
      ],
      naechsteSchritte: ['Exit-Szenarien definieren', 'Export-Test je kritischem Provider', 'Zielplattform + Kosten/Risiken bewerten', 'IaC/IAM/Schlüssel-Übergabe dokumentieren'],
      roleKeys: ['cloud-governance', 'cloud-service-owner', 'lieferanten-management', 'iam-verantwortliche', 'krypto-verantwortliche'],
      evidenceSeedKeys: ['nw-exit', 'nw-portab', 'nw-admin'],
      appDataHint: 'Hilft: DORA IKT-Register (Exit-Strategie, Kündigungsfristen), SEAL-/Portabilitätsreife, Cloud-Bereitstellungsart der Objekte.',
    },
  },
];
