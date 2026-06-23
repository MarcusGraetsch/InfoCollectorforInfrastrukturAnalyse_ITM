/**
 * Nachweis-/Evidence-Katalog — statische, deklarative Zuordnung von
 * Compliance-Anforderungen zu den dafür einzuholenden Nachweis-Artefakten.
 *
 * Offline, deterministisch. Quelle: EU/DE Cloud- & KI-Compliance-Korpus.
 */

export type NachweisKategorie =
  | 'Datenschutz'
  | 'Cybersicherheit'
  | 'Souveränität'
  | 'KI'
  | 'Supply-Chain';

export interface NachweisItem {
  id: string;
  anforderung: string;
  nachweis: string;
  quelle: string;
  kategorie: NachweisKategorie;
}

export const NACHWEIS_KATEGORIEN: NachweisKategorie[] = [
  'Datenschutz',
  'Cybersicherheit',
  'Souveränität',
  'KI',
  'Supply-Chain',
];

export const NACHWEIS_KATALOG: NachweisItem[] = [
  // ── Datenschutz ──
  { id: 'nw-avv', kategorie: 'Datenschutz', anforderung: 'Auftragsverarbeitung personenbezogener Daten', nachweis: 'Auftragsverarbeitungsvertrag (AVV/DPA) nach Art. 28 DSGVO inkl. Subprozessoren-Anlage', quelle: 'DSGVO Art. 28 + DSK' },
  { id: 'nw-scc', kategorie: 'Datenschutz', anforderung: 'Drittlandtransfer in unsichere Drittstaaten', nachweis: 'EU-Standardvertragsklauseln (SCC) — passende Module + ausgefüllte Annexe', quelle: 'EU-Kommission SCC (2021/914) + Schrems II' },
  { id: 'nw-tia', kategorie: 'Datenschutz', anforderung: 'Wirksamkeit der Transfergarantien', nachweis: 'Transfer-Impact-Assessment (TIA) inkl. Bewertung des Zielland-Rechtsrahmens', quelle: 'EDPB Empfehlungen 01/2020' },
  { id: 'nw-krypto', kategorie: 'Datenschutz', anforderung: 'Schutz ruhender & übertragener Daten', nachweis: 'Verschlüsselungs- & Key-Management-Konzept (BYOK/HYOK, HSM, TLS-Konfiguration)', quelle: 'DSGVO Art. 32 + BSI TR-02102' },
  { id: 'nw-voa', kategorie: 'Datenschutz', anforderung: 'Nachweis der Verarbeitungstätigkeiten', nachweis: 'Verzeichnis von Verarbeitungstätigkeiten (VVT) + Datenflussdiagramm', quelle: 'DSGVO Art. 30' },

  // ── Cybersicherheit ──
  { id: 'nw-c5', kategorie: 'Cybersicherheit', anforderung: 'Sicherheitsniveau des Cloud-Dienstes', nachweis: 'BSI C5:2026-Testat (Typ 2) + aktueller Bridge-Letter', quelle: 'BSI C5:2026' },
  { id: 'nw-isms', kategorie: 'Cybersicherheit', anforderung: 'Informationssicherheits-Managementsystem', nachweis: 'ISMS-Policy + Risk-Register + Incident-Response-SOP (Melde-SLA NIS2)', quelle: 'NIS2 Art. 21 + ISO 27001' },
  { id: 'nw-iso27001', kategorie: 'Cybersicherheit', anforderung: 'Anerkanntes Sicherheitszertifikat', nachweis: 'ISO/IEC 27001-Zertifikat + Statement of Applicability (SoA)', quelle: 'ISO/IEC 27001 (Metadaten)' },
  { id: 'nw-pentest', kategorie: 'Cybersicherheit', anforderung: 'Wirksamkeit technischer Schutzmaßnahmen', nachweis: 'Aktueller Penetrationstest-/Schwachstellen-Report + Remediation-Nachweis', quelle: 'BSI IT-Grundschutz' },

  // ── Souveränität ──
  { id: 'nw-exit', kategorie: 'Souveränität', anforderung: 'Anbieterwechsel / Vermeidung Lock-in', nachweis: 'Exit-Plan + dokumentierter Export-Test + Time-to-Exit-KPI', quelle: 'Data Act (EU) 2023/2854' },
  { id: 'nw-admin', kategorie: 'Souveränität', anforderung: 'Operative Unabhängigkeit vom Anbieter', nachweis: 'Admin-Zugriffsmodell + Jurisdiktions-/Datacenter-Karte (wer kann worauf zugreifen)', quelle: 'DSK Souveräne Clouds' },
  { id: 'nw-gaiax', kategorie: 'Souveränität', anforderung: 'Vertrauensanker & Selbstbeschreibung', nachweis: 'Gaia-X Self-Description + Trust-Anchor / Konformitätsnachweis', quelle: 'Gaia-X Trust Framework' },
  { id: 'nw-portab', kategorie: 'Souveränität', anforderung: 'Datenportabilität in offenen Formaten', nachweis: 'Liste unterstützter offener Export-Formate + Schema-Doku', quelle: 'Data Act + Free Flow of Non-Personal Data' },
  { id: 'nw-iso27018', kategorie: 'Souveränität', anforderung: 'Schutz von PII in Public Clouds', nachweis: 'ISO/IEC 27018-Zertifikat (Code of Practice für PII-Prozessoren)', quelle: 'ISO/IEC 27018 (Metadaten)' },

  // ── KI ──
  { id: 'nw-aic4', kategorie: 'KI', anforderung: 'Sicherheit von KI-Cloud-Diensten', nachweis: 'BSI AIC4-Nachweise: Modell-Inventar, Data-Lineage, Inference-Monitoring', quelle: 'BSI AIC4' },
  { id: 'nw-iso42001', kategorie: 'KI', anforderung: 'KI-Managementsystem', nachweis: 'ISO/IEC 42001 (AIMS)-Dokumentation + Konformitätsnachweis', quelle: 'ISO/IEC 42001 (Metadaten)' },
  { id: 'nw-ailog', kategorie: 'KI', anforderung: 'Nachvollziehbarkeit von KI-Systemen', nachweis: 'Logging-Konzept (Art. 12 EU AI Act) + Aufzeichnungs-Aufbewahrungsplan', quelle: 'EU AI Act Art. 12' },
  { id: 'nw-airisk', kategorie: 'KI', anforderung: 'Risikomanagement für Hochrisiko-KI', nachweis: 'Risikomanagement-Dokumentation + technische Dokumentation (Anhang IV) + menschliche Aufsicht', quelle: 'EU AI Act Art. 9/11' },

  // ── Supply-Chain ──
  { id: 'nw-sbom', kategorie: 'Supply-Chain', anforderung: 'Transparenz der Software-Lieferkette', nachweis: 'SBOM (CycloneDX oder SPDX) + Build-Provenance (SLSA-Level)', quelle: 'SLSA + CycloneDX/SPDX' },
  { id: 'nw-subproz', kategorie: 'Supply-Chain', anforderung: 'Transparenz der Subprozessoren', nachweis: 'Aktuelle Subprozessoren-Liste inkl. Standort + Änderungs-Benachrichtigungsprozess', quelle: 'DSGVO Art. 28 (4)' },
  { id: 'nw-soc2', kategorie: 'Supply-Chain', anforderung: 'Kontrollumgebung des Dienstleisters', nachweis: 'SOC 2 Typ 2-Report (Trust Services Criteria)', quelle: 'AICPA SOC 2 / TSC' },
];
