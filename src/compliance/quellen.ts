/**
 * Offline-Compliance-Quellen-Register — kuratierte, statische Referenz.
 * NUR Metadaten/Abstracts, KEINE Volltexte (insb. ISO-Lizenz!). Keine Live-Ingestion.
 *
 * Stand der Pflege: 2026-06-23. Keine Rechtsberatung.
 */

export type QuellenStatus = 'gilt' | 'gilt_ab' | 'in_entwicklung' | 'entwurf';
export type Bindung = 'Gesetz' | 'Behördenvorgabe' | 'Norm' | 'Branchenrahmen' | 'Urteil';

/** Ebenen: 1 Hard Law · 2 Behördliche Vorgaben · 3 Normen & Zertifikate · 4 Souveränitäts-Architektur · 5 Technische Implementierung */
export type QuellenEbene = 1 | 2 | 3 | 4 | 5;

export interface QuelleRef {
  id: string;
  titel: string;
  kurz: string;
  bindung: Bindung;
  status: QuellenStatus;
  datum?: string;
  ablaufHinweis?: string;
  url: string;
  ebene: QuellenEbene;
}

export const EBENEN_LABEL: Record<QuellenEbene, string> = {
  1: 'Hard Law (Gesetze & Urteile)',
  2: 'Behördliche Vorgaben',
  3: 'Normen & Zertifikate',
  4: 'Souveränitäts-Architektur',
  5: 'Technische Implementierung',
};

export const QUELLEN_REGISTER: QuelleRef[] = [
  // ── Ebene 1 — Hard Law ──
  { id: 'q-dsgvo', ebene: 1, titel: 'DSGVO (EU) 2016/679', kurz: 'Europäische Datenschutz-Grundverordnung. Regelt Verarbeitung personenbezogener Daten, Auftragsverarbeitung (Art. 28), Drittlandtransfer (Kap. V).', bindung: 'Gesetz', status: 'gilt', datum: '2018-05-25', url: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj' },
  { id: 'q-bdsg', ebene: 1, titel: 'BDSG', kurz: 'Bundesdatenschutzgesetz — nationale Ergänzung der DSGVO in Deutschland.', bindung: 'Gesetz', status: 'gilt', datum: '2018-05-25', url: 'https://www.gesetze-im-internet.de/bdsg_2018/' },
  { id: 'q-aiact', ebene: 1, titel: 'EU AI Act (EU) 2024/1689', kurz: 'Risikobasierte KI-Verordnung. Gestaffelte Geltung: Verbote 02/2025, GPAI 08/2025, Hochrisiko 08/2026.', bindung: 'Gesetz', status: 'gilt_ab', datum: '2024-08-01', ablaufHinweis: 'Hauptpflichten ab 2026-08-02; 2026 Omnibus-Vereinfachung in Entwicklung.', url: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj' },
  { id: 'q-nis2', ebene: 1, titel: 'NIS2-Richtlinie (EU) 2022/2555', kurz: 'EU-Rahmen für Cybersicherheit kritischer und wichtiger Einrichtungen. Mindestmaßnahmen Art. 21, Meldepflichten.', bindung: 'Gesetz', status: 'gilt', datum: '2023-01-16', url: 'https://eur-lex.europa.eu/eli/dir/2022/2555/oj' },
  { id: 'q-bsig', ebene: 1, titel: 'BSIG (NIS2-Umsetzung DE)', kurz: 'Deutsches BSI-Gesetz mit NIS2-Umsetzung (§30 Mindestmaßnahmen, Registrierungs- und Meldepflichten).', bindung: 'Gesetz', status: 'gilt', datum: '2025-12-06', url: 'https://www.gesetze-im-internet.de/bsig_2009/' },
  { id: 'q-dataact', ebene: 1, titel: 'Data Act (EU) 2023/2854', kurz: 'Regelt Datenzugang, Cloud-Switching und Vermeidung von Lock-in. Pflicht zu Wechsel- und Portabilitätsklauseln.', bindung: 'Gesetz', status: 'gilt_ab', datum: '2025-09-12', url: 'https://eur-lex.europa.eu/eli/reg/2023/2854/oj' },
  { id: 'q-dga', ebene: 1, titel: 'Data Governance Act (EU) 2022/868', kurz: 'Rahmen für vertrauenswürdiges Daten-Teilen, Datenintermediäre und Datenaltruismus.', bindung: 'Gesetz', status: 'gilt', datum: '2023-09-24', url: 'https://eur-lex.europa.eu/eli/reg/2022/868/oj' },
  { id: 'q-ffd', ebene: 1, titel: 'Free Flow of Non-Personal Data (EU) 2018/1807', kurz: 'Freier Verkehr nicht-personenbezogener Daten; Selbstregulierung zu Cloud-Portabilität.', bindung: 'Gesetz', status: 'gilt', datum: '2019-05-28', url: 'https://eur-lex.europa.eu/eli/reg/2018/1807/oj' },
  { id: 'q-schrems2', ebene: 1, titel: 'Schrems II (EuGH C-311/18)', kurz: 'EuGH-Urteil: Privacy Shield ungültig; SCC nur mit zusätzlichen Garantien (TIA) tragfähig.', bindung: 'Urteil', status: 'gilt', datum: '2020-07-16', url: 'https://curia.europa.eu/juris/liste.jsf?num=C-311/18' },
  { id: 'q-scc', ebene: 1, titel: 'EU-Standardvertragsklauseln (2021/914)', kurz: 'Modular aufgebaute Standardvertragsklauseln für Drittlandtransfers nach Art. 46 DSGVO.', bindung: 'Behördenvorgabe', status: 'gilt', datum: '2021-06-04', url: 'https://eur-lex.europa.eu/eli/dec_impl/2021/914/oj' },
  { id: 'q-csa', ebene: 1, titel: 'Cybersecurity Act (EU) 2019/881', kurz: 'Schafft ENISA-Mandat und EU-weites Cybersicherheits-Zertifizierungssystem (Basis für EUCS).', bindung: 'Gesetz', status: 'gilt', datum: '2019-06-27', url: 'https://eur-lex.europa.eu/eli/reg/2019/881/oj' },

  // ── Ebene 2 — Behördliche Vorgaben ──
  { id: 'q-c5', ebene: 2, titel: 'BSI C5:2026', kurz: 'Cloud Computing Compliance Criteria Catalogue des BSI — Kriterienkatalog und Testat-Verfahren für Cloud-Dienste.', bindung: 'Behördenvorgabe', status: 'gilt', datum: '2026-01-01', url: 'https://www.bsi.bund.de/dok/c5' },
  { id: 'q-grundschutz', ebene: 2, titel: 'BSI IT-Grundschutz', kurz: 'Methodik und Bausteine für Informationssicherheit; Grundlage für ISO-27001-Zertifizierung auf Basis IT-Grundschutz.', bindung: 'Behördenvorgabe', status: 'gilt', url: 'https://www.bsi.bund.de/grundschutz' },
  { id: 'q-aic4', ebene: 2, titel: 'BSI AIC4', kurz: 'AI Cloud Service Compliance Criteria Catalogue — Sicherheitskriterien für KI-Cloud-Dienste (Modell-Inventar, Monitoring).', bindung: 'Behördenvorgabe', status: 'gilt', url: 'https://www.bsi.bund.de/dok/aic4' },
  { id: 'q-c3a', ebene: 2, titel: 'BSI C3A', kurz: 'Cloud Computing Compliance Assessment-Ansatz / kontinuierliche Prüfung (BSI).', bindung: 'Behördenvorgabe', status: 'in_entwicklung', ablaufHinweis: 'In Entwicklung / Konsultation.', url: 'https://www.bsi.bund.de/' },
  { id: 'q-dsk', ebene: 2, titel: 'DSK — Souveräne Clouds', kurz: 'Orientierungshilfe der Datenschutzkonferenz zu souveränen Cloud-Diensten und Auftragsverarbeitung.', bindung: 'Behördenvorgabe', status: 'gilt', url: 'https://www.datenschutzkonferenz-online.de/' },
  { id: 'q-bfdi', ebene: 2, titel: 'BfDI Cloud-Fragebogen', kurz: 'Prüf-/Fragebogen des Bundesbeauftragten für Datenschutz zur Cloud-Nutzung in Behörden.', bindung: 'Behördenvorgabe', status: 'gilt', url: 'https://www.bfdi.bund.de/' },
  { id: 'q-zendis', ebene: 2, titel: 'ZenDiS', kurz: 'Zentrum für Digitale Souveränität der öffentlichen Verwaltung; openDesk, Whitepaper „Souveränitäts-Washing".', bindung: 'Behördenvorgabe', status: 'gilt', url: 'https://zendis.de/' },
  { id: 'q-eucs', ebene: 2, titel: 'ENISA EUCS', kurz: 'European Cybersecurity Certification Scheme for Cloud Services — EU-weites Cloud-Zertifizierungsschema.', bindung: 'Behördenvorgabe', status: 'in_entwicklung', ablaufHinweis: 'Noch nicht final verabschiedet (Souveränitäts-Anforderungen umstritten).', url: 'https://www.enisa.europa.eu/topics/cloud-and-big-data/cloud-certification-scheme' },
  { id: 'q-cloudcoc', ebene: 2, titel: 'EU Cloud Code of Conduct', kurz: 'Genehmigter Verhaltenskodex nach Art. 40 DSGVO für Cloud-Anbieter.', bindung: 'Branchenrahmen', status: 'gilt', url: 'https://eucoc.cloud/' },

  // ── Ebene 3 — Normen & Zertifikate ──
  { id: 'q-iso27001', ebene: 3, titel: 'ISO/IEC 27001', kurz: 'Internationale Norm für Informationssicherheits-Managementsysteme (ISMS). Zertifizierbar. (Metadaten)', bindung: 'Norm', status: 'gilt', url: 'https://www.iso.org/standard/27001' },
  { id: 'q-iso27017', ebene: 3, titel: 'ISO/IEC 27017', kurz: 'Leitfaden für Informationssicherheitsmaßnahmen bei Cloud-Diensten. (Metadaten)', bindung: 'Norm', status: 'gilt', url: 'https://www.iso.org/standard/43757.html' },
  { id: 'q-iso27018', ebene: 3, titel: 'ISO/IEC 27018', kurz: 'Verhaltenskodex zum Schutz personenbezogener Daten (PII) in Public Clouds. (Metadaten)', bindung: 'Norm', status: 'gilt', url: 'https://www.iso.org/standard/76559.html' },
  { id: 'q-iso27701', ebene: 3, titel: 'ISO/IEC 27701', kurz: 'Erweiterung von 27001/27002 um ein Datenschutz-Managementsystem (PIMS). (Metadaten)', bindung: 'Norm', status: 'gilt', url: 'https://www.iso.org/standard/71670.html' },
  { id: 'q-iso42001', ebene: 3, titel: 'ISO/IEC 42001', kurz: 'Norm für KI-Managementsysteme (AIMS). (Metadaten)', bindung: 'Norm', status: 'gilt', datum: '2023-12-01', url: 'https://www.iso.org/standard/81230.html' },
  { id: 'q-iso23894', ebene: 3, titel: 'ISO/IEC 23894', kurz: 'Leitlinien für Risikomanagement im Kontext künstlicher Intelligenz. (Metadaten)', bindung: 'Norm', status: 'gilt', url: 'https://www.iso.org/standard/77304.html' },
  { id: 'q-ccm', ebene: 3, titel: 'CSA CCM / CAIQ', kurz: 'Cloud Controls Matrix und Consensus Assessment Initiative Questionnaire der Cloud Security Alliance.', bindung: 'Branchenrahmen', status: 'gilt', url: 'https://cloudsecurityalliance.org/research/cloud-controls-matrix' },
  { id: 'q-aicm', ebene: 3, titel: 'CSA AICM', kurz: 'AI Controls Matrix der Cloud Security Alliance — Kontrollrahmen für KI-Systeme.', bindung: 'Branchenrahmen', status: 'in_entwicklung', url: 'https://cloudsecurityalliance.org/' },
  { id: 'q-soc2', ebene: 3, titel: 'SOC 2 / TSC', kurz: 'AICPA Service Organization Control 2 nach Trust Services Criteria. Typ-2-Report über Kontrollwirksamkeit.', bindung: 'Branchenrahmen', status: 'gilt', url: 'https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2' },
  { id: 'q-nistairmf', ebene: 3, titel: 'NIST AI RMF', kurz: 'AI Risk Management Framework des NIST (freiwillig, govern/map/measure/manage).', bindung: 'Branchenrahmen', status: 'gilt', datum: '2023-01-26', url: 'https://www.nist.gov/itl/ai-risk-management-framework' },
  { id: 'q-nistcsf', ebene: 3, titel: 'NIST CSF 2.0', kurz: 'Cybersecurity Framework des NIST — funktionsbasierter Sicherheitsrahmen (identify/protect/detect/respond/recover/govern).', bindung: 'Branchenrahmen', status: 'gilt', datum: '2024-02-26', url: 'https://www.nist.gov/cyberframework' },

  // ── Ebene 4 — Souveränitäts-Architektur ──
  { id: 'q-gaiax', ebene: 4, titel: 'Gaia-X Trust Framework', kurz: 'Regelwerk für föderierte, souveräne Dateninfrastruktur: Self-Descriptions, Trust Anchors, Compliance.', bindung: 'Branchenrahmen', status: 'gilt', url: 'https://gaia-x.eu/' },
  { id: 'q-idsa', ebene: 4, titel: 'IDSA Rulebook', kurz: 'International Data Spaces Association — Governance- und Architektur-Rulebook für souveräne Datenräume.', bindung: 'Branchenrahmen', status: 'gilt', url: 'https://internationaldataspaces.org/' },
  { id: 'q-dvc', ebene: 4, titel: 'Deutsche Verwaltungscloud (DVC)', kurz: 'Strategie und Standards für die föderale Verwaltungscloud-Infrastruktur in Deutschland.', bindung: 'Behördenvorgabe', status: 'in_entwicklung', url: 'https://www.it-planungsrat.de/' },

  // ── Ebene 5 — Technische Implementierung ──
  { id: 'q-k8spss', ebene: 5, titel: 'Kubernetes Pod Security Standards', kurz: 'Abgestufte Sicherheitsprofile (privileged/baseline/restricted) für Kubernetes-Workloads.', bindung: 'Branchenrahmen', status: 'gilt', url: 'https://kubernetes.io/docs/concepts/security/pod-security-standards/' },
  { id: 'q-nsacisa', ebene: 5, titel: 'NSA/CISA Kubernetes Hardening', kurz: 'Hardening-Leitfaden für Kubernetes-Cluster von NSA und CISA.', bindung: 'Behördenvorgabe', status: 'gilt', url: 'https://www.cisa.gov/news-events/alerts/2022/03/15/updated-kubernetes-hardening-guide' },
  { id: 'q-slsa', ebene: 5, titel: 'SLSA', kurz: 'Supply-chain Levels for Software Artifacts — Framework für Build-Integrität und Provenance.', bindung: 'Branchenrahmen', status: 'gilt', url: 'https://slsa.dev/' },
  { id: 'q-cyclonedx', ebene: 5, titel: 'CycloneDX', kurz: 'OWASP-SBOM-Standard für Software Bill of Materials und Lieferketten-Transparenz.', bindung: 'Branchenrahmen', status: 'gilt', url: 'https://cyclonedx.org/' },
  { id: 'q-spdx', ebene: 5, titel: 'SPDX (ISO/IEC 5962)', kurz: 'Standard für Software Bill of Materials und Lizenz-/Komponenten-Metadaten. (Metadaten)', bindung: 'Norm', status: 'gilt', url: 'https://spdx.dev/' },
  { id: 'q-bitkom', ebene: 5, titel: 'Bitkom Cloud-Leitfaden', kurz: 'Praxisleitfäden des Branchenverbands Bitkom zu Cloud-Compliance und -Migration.', bindung: 'Branchenrahmen', status: 'gilt', url: 'https://www.bitkom.org/' },
];

/** Zeitstrahl-Meilensteine (regulatorisch relevante Daten). */
export interface ZeitstrahlEintrag {
  datum: string;
  titel: string;
  status: QuellenStatus;
}

export const ZEITSTRAHL: ZeitstrahlEintrag[] = [
  { datum: '2018-05-25', titel: 'DSGVO gilt', status: 'gilt' },
  { datum: '2020-07-16', titel: 'Schrems II — Privacy Shield ungültig', status: 'gilt' },
  { datum: '2021-06-04', titel: 'Neue EU-Standardvertragsklauseln (SCC)', status: 'gilt' },
  { datum: '2023-01-16', titel: 'NIS2-Richtlinie in Kraft', status: 'gilt' },
  { datum: '2024-08-01', titel: 'EU AI Act in Kraft', status: 'gilt' },
  { datum: '2025-02-02', titel: 'AI Act — Verbotene Praktiken gelten', status: 'gilt' },
  { datum: '2025-08-02', titel: 'AI Act — GPAI-Pflichten gelten', status: 'gilt' },
  { datum: '2025-09-12', titel: 'Data Act anwendbar', status: 'gilt' },
  { datum: '2025-12-06', titel: 'NIS2-Umsetzung (BSIG) DE', status: 'gilt' },
  { datum: '2026-01-01', titel: 'BSI C5:2026', status: 'gilt' },
  { datum: '2026-08-02', titel: 'AI Act — Hochrisiko-Hauptpflichten', status: 'gilt_ab' },
  { datum: '2026-12-31', titel: 'ENISA EUCS (erwartet)', status: 'in_entwicklung' },
];
