/**
 * Paket 8 — Geführter Beratungsinhalt je NIS2-Mindestmaßnahme (Art. 21 NIS2 / §30 BSIG).
 * Statisch, offline, deterministisch. Verknüpft jede Maßnahme mit Rollen (ROLE_CATALOG.key)
 * und Beispiel-Nachweisen (NACHWEIS_KATALOG.id) für die zentrale Referenzierung.
 */

export interface NIS2MassnahmeInfo {
  key: string;
  whyImportant: string;
  normative: string;
  mussVorhanden: string[];
  beispielNachweise: string[];
  workshopFragen: string[];
  naechsteSchritte: string[];
  /** Vorgeschlagene verantwortliche Rollen (Schlüssel aus ROLE_CATALOG). */
  roleKeys: string[];
  /** Vorgeschlagene Nachweise (seedKey aus NACHWEIS_KATALOG). */
  evidenceSeedKeys: string[];
  /** Hinweis, welche bereits erfassten App-Daten helfen. */
  appDataHint: string;
}

export const NIS2_MASSNAHMEN_INFO: Record<string, NIS2MassnahmeInfo> = {
  risikoanalyse: {
    key: 'risikoanalyse',
    whyImportant: 'Eine dokumentierte Risikoanalyse ist das Fundament des gesamten ISMS — ohne sie lassen sich Maßnahmen weder priorisieren noch begründen. NIS2 verlangt explizit einen risikobasierten Ansatz.',
    normative: 'Art. 21 (2) a NIS2 / §30 BSIG; BSI-Standard 200-3 (Risikoanalyse); ISO/IEC 27001 Kap. 6 + ISO 27005.',
    mussVorhanden: [
      'Methodik der Risikoanalyse (Bewertungsmaßstäbe, Eintritt/Schaden)',
      'Aktuelles Risikoregister mit bewerteten Risiken',
      'Informationssicherheits-Leitlinie/-konzept, von der Leitung verabschiedet',
      'Regelmäßiger Review-Zyklus der Risiken',
    ],
    beispielNachweise: ['Risikoanalyse-Dokument / Risikoregister', 'Informationssicherheitsleitlinie', 'ISMS-Policy + SoA'],
    workshopFragen: [
      'Gibt es eine dokumentierte, aktuelle Risikoanalyse? Wann zuletzt aktualisiert?',
      'Wer ist methodisch verantwortlich und wie werden Risiken bewertet?',
      'Sind die Geschäftsprozesse und ihr Schutzbedarf erfasst?',
    ],
    naechsteSchritte: ['Schutzbedarf je Geschäftsprozess/Asset feststellen', 'Risikoregister aufsetzen/aktualisieren', 'Leitlinie durch Leitung verabschieden lassen'],
    roleKeys: ['risikomanagement', 'isb'],
    evidenceSeedKeys: ['nw-isms', 'nw-iso27001'],
    appDataHint: 'Hilft: erfasste Geschäftsprozesse, Daten (Schutzbedarf/CIA), Anwendungen und Server in der Strukturanalyse.',
  },
  incident: {
    key: 'incident',
    whyImportant: 'Schnelle, geübte Reaktion auf Sicherheitsvorfälle begrenzt Schäden und erfüllt die strengen NIS2-Meldepflichten (Frühwarnung 24h, Meldung 72h, Abschlussbericht 1 Monat).',
    normative: 'Art. 21 (2) b + Art. 23 NIS2 / §§30, 32 BSIG (Meldepflichten); ISO/IEC 27035.',
    mussVorhanden: [
      'Incident-Response-Prozess (Erkennung, Klassifizierung, Eskalation)',
      'Definierte Meldewege zu BSI/CSIRT inkl. Fristen',
      'Rollen/Rufbereitschaft und Kontaktlisten',
      'Lessons-Learned / Nachbereitung',
    ],
    beispielNachweise: ['Incident-Response-Prozess/SOP', 'Meldekonzept mit Fristen', 'Vorfall-Logbuch'],
    workshopFragen: [
      'Gibt es einen dokumentierten Incident-Response-Prozess? Wer ist 24/7 erreichbar?',
      'Sind die NIS2-Meldefristen und -wege bekannt und eingeübt?',
      'Werden Vorfälle dokumentiert und nachbereitet?',
    ],
    naechsteSchritte: ['IR-Prozess dokumentieren', 'Meldewege zu BSI festlegen', 'Tabletop-Übung planen'],
    roleKeys: ['incident-response', 'isb'],
    evidenceSeedKeys: ['nw-isms'],
    appDataHint: 'Hilft: erfasste Sicherheits-/Monitoring-Tools (SIEM/EDR) unter Anwendungen.',
  },
  bcm: {
    key: 'bcm',
    whyImportant: 'Business Continuity sichert die Fortführung kritischer Prozesse bei Ausfällen. Backup/Restore und Krisenmanagement sind bei Cyber-Vorfällen oft die letzte Verteidigungslinie.',
    normative: 'Art. 21 (2) c NIS2 / §30 BSIG; BSI-Standard 200-4 (BCM); ISO 22301.',
    mussVorhanden: [
      'Business Impact Analyse (BIA) mit RTO/RPO je Prozess',
      'Backup-Konzept inkl. Restore-Tests (3-2-1, Offsite/Air-Gap)',
      'Wiederanlauf-/Notfallpläne, Notfallhandbuch',
      'Krisenmanagement-Struktur (Krisenstab, Krisenkommunikation), Notfallübungen',
    ],
    beispielNachweise: ['BIA-Dokument', 'Backup-Konzept + Restore-Test-Protokoll', 'Notfallhandbuch', 'Übungsprotokoll'],
    workshopFragen: [
      'Gibt es eine BIA mit RTO/RPO? Werden Restores regelmäßig getestet?',
      'Existiert ein Notfallhandbuch und ein benannter Krisenstab?',
      'Wann fand die letzte Notfallübung statt?',
    ],
    naechsteSchritte: ['BIA für kritische Prozesse erstellen', 'Restore-Test ansetzen', 'Krisenstab benennen (s. Rollenübersicht)'],
    roleKeys: ['bcm-beauftragter', 'krisenstab-leitung'],
    evidenceSeedKeys: ['nw-isms'],
    appDataHint: 'Hilft: erfasste Backup-Software (RPO/RTO/3-2-1) unter Anwendungen, Server-Redundanz.',
  },
  lieferkette: {
    key: 'lieferkette',
    whyImportant: 'Angriffe erfolgen zunehmend über Dienstleister und Software-Lieferketten. NIS2 verlangt die Steuerung von Lieferantenrisiken.',
    normative: 'Art. 21 (2) d NIS2 / §30 BSIG; ISO/IEC 27001 A.5.19–A.5.22; DORA (Finanzsektor).',
    mussVorhanden: [
      'Lieferantenverzeichnis mit Kritikalitätsbewertung',
      'Sicherheitsanforderungen in Verträgen/SLAs',
      'Subprozessoren-Transparenz und Änderungsbenachrichtigung',
      'Konzentrationsrisiko-Betrachtung',
    ],
    beispielNachweise: ['Lieferantenbewertung', 'Subprozessoren-Liste', 'SOC-2-Report', 'SBOM'],
    workshopFragen: [
      'Gibt es eine Übersicht kritischer Lieferanten/Provider und deren Bewertung?',
      'Welche Sicherheitsanforderungen sind vertraglich vereinbart?',
      'Bestehen Konzentrationsrisiken (Single Provider)?',
    ],
    naechsteSchritte: ['IKT-Dienstleister im DORA-Register pflegen', 'Lieferantenbewertung einführen', 'SBOM/SOC-2 anfordern'],
    roleKeys: ['lieferanten-management'],
    evidenceSeedKeys: ['nw-subproz', 'nw-soc2', 'nw-sbom'],
    appDataHint: 'Hilft: DORA IKT-Drittparteienregister (iktDienstleister), Provider in den Cloud-Feldern.',
  },
  einkauf: {
    key: 'einkauf',
    whyImportant: 'Sicherheit muss über den gesamten Lebenszyklus von IT-Systemen mitgedacht werden — von Beschaffung über Entwicklung bis Wartung, inkl. Schwachstellenmanagement.',
    normative: 'Art. 21 (2) e NIS2 / §30 BSIG; ISO/IEC 27001 A.8.25–A.8.29; BSI IT-Grundschutz.',
    mussVorhanden: [
      'Secure-Development-/Beschaffungsrichtlinie',
      'Patch- und Schwachstellenmanagement-Prozess',
      'Härtungs-/Konfigurationsvorgaben',
      'Test-/Abnahmeverfahren vor Produktivnahme',
    ],
    beispielNachweise: ['Patch-/Vulnerability-Prozess', 'Penetrationstest-Report', 'SBOM', 'Härtungsrichtlinie'],
    workshopFragen: [
      'Gibt es einen definierten Patch-/Schwachstellenprozess? Wie schnell werden kritische Lücken geschlossen?',
      'Werden Sicherheitsanforderungen bei Beschaffung/Entwicklung berücksichtigt?',
    ],
    naechsteSchritte: ['Patch-Prozess dokumentieren', 'Schwachstellenscan beauftragen', 'EoL-Systeme identifizieren'],
    roleKeys: ['it-betrieb', 'isb'],
    evidenceSeedKeys: ['nw-sbom', 'nw-pentest'],
    appDataHint: 'Hilft: Lebenszyklus/Support-Ende (EoL/EoS) der Systeme, Update-Zyklen der Anwendungen.',
  },
  wirksamkeit: {
    key: 'wirksamkeit',
    whyImportant: 'Maßnahmen müssen nachweislich wirken. NIS2 verlangt Konzepte zur Bewertung der Wirksamkeit des Risikomanagements.',
    normative: 'Art. 21 (2) f NIS2 / §30 BSIG; ISO/IEC 27001 Kap. 9 (Bewertung der Leistung).',
    mussVorhanden: [
      'Internes Audit-Programm',
      'Kennzahlen/KPIs zur Sicherheit',
      'Management-Review',
      'Maßnahmen-Tracking aus Audits',
    ],
    beispielNachweise: ['Audit-Berichte', 'Management-Review-Protokoll', 'KPI-Reporting', 'ISO-27001-Zertifikat'],
    workshopFragen: [
      'Werden interne Audits durchgeführt? Wann zuletzt?',
      'Gibt es Sicherheits-KPIs und ein Management-Review?',
    ],
    naechsteSchritte: ['Audit-Plan aufsetzen', 'KPIs definieren', 'Management-Review terminieren'],
    roleKeys: ['compliance-audit', 'isb'],
    evidenceSeedKeys: ['nw-pentest', 'nw-iso27001'],
    appDataHint: 'Hilft: Fortschritts-Cockpit, Offene-Punkte-Liste als Wirksamkeitsindikatoren.',
  },
  kryptografie: {
    key: 'kryptografie',
    whyImportant: 'Verschlüsselung schützt Vertraulichkeit und Integrität ruhender und übertragener Daten. NIS2 verlangt Konzepte für Kryptografie und Verschlüsselung.',
    normative: 'Art. 21 (2) h NIS2 / §30 BSIG; BSI TR-02102; ISO/IEC 27001 A.8.24.',
    mussVorhanden: [
      'Kryptokonzept (Algorithmen, Schlüssellängen)',
      'Schlüsselmanagement (Erzeugung, Rotation, Hinterlegung)',
      'TLS-/Transportverschlüsselungsvorgaben',
      'Festlegung BYOK/HYOK bei Cloud-Nutzung',
    ],
    beispielNachweise: ['Kryptokonzept', 'Key-Management-Konzept', 'TLS-Konfigurationsnachweis'],
    workshopFragen: [
      'Gibt es ein Kryptokonzept? Wer verwaltet die Schlüssel?',
      'Sind Schnittstellen durchgehend verschlüsselt (TLS-Version)?',
    ],
    naechsteSchritte: ['Kryptokonzept erstellen', 'Schlüsselverantwortliche benennen', 'Unverschlüsselte Schnittstellen prüfen'],
    roleKeys: ['krypto-verantwortliche'],
    evidenceSeedKeys: ['nw-krypto'],
    appDataHint: 'Hilft: Schnittstellen (Verschlüsselung TLS/mTLS/Keine), Datensouveränität/Verschlüsselungshoheit.',
  },
  personal: {
    key: 'personal',
    whyImportant: 'Menschen und Zugänge sind ein zentrales Angriffsziel. NIS2 verlangt Personalsicherheit, Zugriffskontrolle und Asset-Management.',
    normative: 'Art. 21 (2) i NIS2 / §30 BSIG; ISO/IEC 27001 A.5.15–A.5.18, A.6, A.5.9.',
    mussVorhanden: [
      'Berechtigungskonzept (Least Privilege, Rezertifizierung)',
      'Asset-Inventar / Informationsverbund',
      'Personalsicherheit (Onboarding/Offboarding, Vertraulichkeit)',
      'Privilegierte Zugänge gesondert geschützt',
    ],
    beispielNachweise: ['IAM-/Berechtigungskonzept', 'Asset-Inventar', 'Onboarding/Offboarding-Prozess'],
    workshopFragen: [
      'Gibt es ein Berechtigungskonzept mit Rezertifizierung?',
      'Ist ein vollständiges Asset-Inventar vorhanden?',
      'Wie werden privilegierte Zugänge geschützt?',
    ],
    naechsteSchritte: ['Berechtigungen rezertifizieren', 'Asset-Inventar vervollständigen', 'PAM prüfen'],
    roleKeys: ['iam-verantwortliche', 'it-betrieb'],
    evidenceSeedKeys: ['nw-isms'],
    appDataHint: 'Hilft: die gesamte Asset-Erfassung (Server/Clients/Anwendungen) ist Teil des Asset-Managements.',
  },
  mfa: {
    key: 'mfa',
    whyImportant: 'MFA ist eine der wirksamsten Einzelmaßnahmen gegen Account-Übernahmen. NIS2 nennt MFA und gesicherte Kommunikation explizit.',
    normative: 'Art. 21 (2) j NIS2 / §30 BSIG; BSI IT-Grundschutz ORP.4.',
    mussVorhanden: [
      'MFA für privilegierte und Remote-Zugänge',
      'Rollout-Plan / Abdeckungsgrad',
      'Gesicherte Sprach-/Video-/Text-Kommunikation',
      'Notfallkommunikationsmittel',
    ],
    beispielNachweise: ['MFA-Rollout-Plan', 'Abdeckungs-Report', 'Konzept gesicherte Kommunikation'],
    workshopFragen: [
      'Ist MFA flächendeckend aktiv (mind. Admin/Remote)?',
      'Gibt es gesicherte Notfallkommunikationskanäle?',
    ],
    naechsteSchritte: ['MFA-Abdeckung erheben', 'Rollout-Plan für Lücken', 'Notfallkommunikation festlegen'],
    roleKeys: ['iam-verantwortliche'],
    evidenceSeedKeys: ['nw-isms'],
    appDataHint: 'Hilft: Authentifizierung der Schnittstellen, IAM-Komponenten unter Anwendungen.',
  },
  schulung: {
    key: 'schulung',
    whyImportant: 'Awareness reduziert Erfolg von Phishing & Social Engineering. NIS2 verlangt Cyberhygiene und regelmäßige Schulungen — auch für die Leitung.',
    normative: 'Art. 21 (2) g + Art. 20 NIS2 / §§30, 38 BSIG (Schulungspflicht der Leitung).',
    mussVorhanden: [
      'Awareness-/Schulungskonzept mit Turnus',
      'Nachweise durchgeführter Schulungen (Teilnahme)',
      'Spezifische Schulung der Leitungsorgane',
      'Phishing-Simulationen (optional)',
    ],
    beispielNachweise: ['Schulungskonzept', 'Teilnahmenachweise', 'Leitungs-Schulungsnachweis'],
    workshopFragen: [
      'Werden regelmäßig Awareness-Schulungen durchgeführt? Auch für die Leitung?',
      'Gibt es Teilnahmenachweise?',
    ],
    naechsteSchritte: ['Schulungsturnus festlegen', 'Leitungs-Schulung ansetzen', 'Phishing-Test erwägen'],
    roleKeys: ['isb', 'leitung'],
    evidenceSeedKeys: [],
    appDataHint: 'Hilft: Stakeholder-Register als Verteiler/Teilnehmerbasis für Schulungen.',
  },
};
