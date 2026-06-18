import type { CategoryKey } from './types';

export type FieldType = 'text' | 'textarea' | 'select' | 'multiref';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  /** Vorschlagswerte für Textfelder – Nutzer kann trotzdem frei eingeben (datalist) */
  suggestions?: string[];
  refCategory?: CategoryKey;
  tooltip?: string;
  required?: boolean;
  /** 'basis' = BSI-Strukturanalyse, 'cloud' = Cloud-Readiness-Zusatz */
  group?: 'basis' | 'cloud';
}

/** Erklärende Hilfe für den durchführenden Mitarbeiter (BSI-orientiert). */
export interface CategoryHelp {
  intro: string;
  bsiWhy: string;
  cloudWhy: string;
  interviewQuestions: string[];
  ansprechpartner: string;
  wenFragen: { rolle: string; tipps: string[] }[];
}

export interface CategoryDef {
  key: CategoryKey;
  label: string;
  prefix: string;
  fields: FieldDef[];
  help?: CategoryHelp;
}

const STATUS_FIELD: FieldDef = {
  key: 'status',
  label: 'Status',
  type: 'select',
  options: ['Aktiv', 'Inaktiv', 'In Planung', 'Außer Betrieb'],
  tooltip: 'Aktueller Betriebsstatus des Eintrags',
  required: true,
};

const TAGS_FIELD: FieldDef = {
  key: 'tags',
  label: 'Tags',
  type: 'text',
  tooltip: 'Kommagetrennte Schlagwörter zur Kategorisierung',
};

/**
 * Cloud-Readiness-Zusatzfelder. Werden an Anwendungen, Server, Clients,
 * ICS- und IoT-Systeme angehängt und bilden die Grundlage für das Scoring
 * im Cloud-Readiness-Dashboard und den Workshop.
 */
export const CLOUD_FIELDS: FieldDef[] = [
  {
    key: 'schutzbedarf',
    label: 'Schutzbedarf',
    type: 'select',
    options: ['Normal', 'Hoch', 'Sehr hoch'],
    group: 'cloud',
    tooltip:
      'BSI-Schutzbedarf (Vertraulichkeit/Integrität/Verfügbarkeit, höchster Wert). Bestimmt mit, ob eine Public Cloud zulässig ist.',
  },
  {
    key: 'datensouveraenitaet',
    label: 'Datensouveränität / Schutzmodell',
    type: 'select',
    options: [
      'Keine spezielle Anforderung',
      'EU / DSGVO',
      'Deutschland',
      'Streng souverän (C5 / Gaia-X)',
      'Confidential Computing (TEE / Enclave)',
    ],
    group: 'cloud',
    tooltip:
      'Rechtliche/regulatorische Anforderung an den Speicherort und den Schutz der Daten. "Confidential Computing" schützt Daten auch während der Verarbeitung im RAM via Trusted Execution Environment (TEE) — relevant für höchsten Schutzbedarf auch in Public Clouds.',
  },
  {
    key: 'bereitstellung',
    label: 'Aktuelle Bereitstellung',
    type: 'select',
    options: [
      'On-Premises (physisch)',
      'On-Premises (virtualisiert)',
      'Container (Docker / Podman)',
      'Kubernetes (On-Premises)',
      'Private Cloud',
      'Hybrid (On-Prem + Cloud)',
      'Managed Kubernetes (Cloud)',
      'PaaS / App Service',
      'Serverless / FaaS',
      'SaaS / Public Cloud',
    ],
    group: 'cloud',
    tooltip:
      'Wie wird das Objekt heute betrieben? Container- und K8s-Umgebungen sind oft der erste Schritt zur Cloud-Migration. Bereits containerisierte Workloads sind leichter zu migrieren.',
  },
  {
    key: 'cloudDienst',
    label: 'Cloud-Dienst / Service-Typ',
    type: 'text',
    group: 'cloud',
    tooltip:
      'Konkreter Cloud-Dienst oder Ziel-Service-Typ — generisch oder Hyperscaler-spezifisch. Beispiele: "Azure VM", "Amazon EC2", "STACKIT Compute Engine", "Kubernetes Pod". Freie Eingabe möglich.',
    suggestions: [
      // ── Generisch / technologieneutral ──
      'VM (IaaS — generisch)',
      'Container (CaaS — generisch)',
      'Kubernetes Cluster (generisch)',
      'Managed Kubernetes (generisch)',
      'Serverless / FaaS (generisch)',
      'Object Storage (S3-kompatibel)',
      'Managed Database (generisch)',
      'Load Balancer (generisch)',
      'CDN (Content Delivery Network)',
      'API Gateway (generisch)',
      'Service Mesh (Istio / Linkerd)',
      'Private Container Registry',
      // ── Microsoft Azure ──
      'Azure Virtual Machine (VM)',
      'Azure Kubernetes Service (AKS)',
      'Azure Container Instances (ACI)',
      'Azure App Service (PaaS)',
      'Azure Functions (Serverless)',
      'Azure SQL Database (PaaS-DB)',
      'Azure Database for PostgreSQL',
      'Azure Blob Storage',
      'Azure Container Registry (ACR)',
      'Azure Arc (Hybrid-Management)',
      'Azure DevOps / GitHub Actions',
      // ── AWS (Amazon Web Services) ──
      'Amazon EC2 (VM)',
      'Amazon EKS (Managed K8s)',
      'Amazon ECS / Fargate (Container)',
      'AWS Lambda (Serverless)',
      'Amazon S3 (Object Storage)',
      'Amazon RDS (Managed DB)',
      'Amazon Aurora (Cloud-native DB)',
      'AWS App Runner (Container PaaS)',
      'Amazon ECR (Container Registry)',
      // ── Google Cloud (GCP) ──
      'Google Compute Engine (GCE — VM)',
      'Google Kubernetes Engine (GKE)',
      'Cloud Run (Serverless Container)',
      'Cloud Functions (Serverless)',
      'Cloud SQL (Managed DB)',
      'Google Cloud Storage (GCS)',
      'Artifact Registry (GCP)',
      // ── STACKIT (Schwarz Gruppe) ──
      'STACKIT Compute Engine (VM)',
      'STACKIT Kubernetes Engine (SKE)',
      'STACKIT Object Storage (S3)',
      'STACKIT Database as a Service',
      'STACKIT Load Balancer',
      'STACKIT DNS',
      // ── IONOS Cloud ──
      'IONOS Cloud VMs (DCD)',
      'IONOS Managed Kubernetes',
      'IONOS S3 Object Storage',
      'IONOS Managed Databases',
      'IONOS Load Balancer',
      'IONOS Private Cloud (DCD)',
      // ── VMware Tanzu ──
      'VMware Tanzu Kubernetes Grid (TKG)',
      'VMware Tanzu Application Platform (TAP)',
      'VMware Tanzu Mission Control (TMC)',
      'VMware Tanzu Service Mesh',
      // ── Confidential Computing ──
      'Confidential Computing — enclaive.io (TEE)',
      'Confidential Computing — Intel SGX (Enclave)',
      'Confidential Computing — AMD SEV (Secure VM)',
      'Confidential Computing — Azure Confidential VMs',
      'Confidential Computing — AWS Nitro Enclaves',
      'Confidential Computing — GCP Confidential VMs',
    ],
  },
  {
    key: 'lizenzCloudfaehig',
    label: 'Lizenz cloudfähig',
    type: 'select',
    options: ['Ja', 'Nein', 'Unklar'],
    group: 'cloud',
    tooltip:
      'Erlaubt das Lizenzmodell den Betrieb in der Cloud (z.B. BYOL, SaaS-Verfügbarkeit)? Nicht cloudfähige Lizenzen erzwingen oft einen Repurchase.',
  },
  {
    key: 'migrationskomplexitaet',
    label: 'Migrationskomplexität',
    type: 'select',
    options: ['Niedrig', 'Mittel', 'Hoch'],
    group: 'cloud',
    tooltip:
      'Geschätzter Aufwand/Risiko einer Migration (Abhängigkeiten, Customizing, Schnittstellen, Datenmenge).',
  },
  {
    key: 'lebenszyklus',
    label: 'Lebenszyklus',
    type: 'select',
    options: ['Aktuell', 'Wartung läuft aus', 'End-of-Life'],
    group: 'cloud',
    tooltip:
      'Technischer Lebenszyklus. End-of-Life-Systeme sind Kandidaten für Ablösung (Retire) oder Neubeschaffung (Repurchase).',
  },
  {
    key: 'internetfaehig',
    label: 'Internet-/Cloud-fähig',
    type: 'select',
    options: ['Ja', 'Nein'],
    group: 'cloud',
    tooltip:
      'Kann das Objekt über Internet/Cloud-Anbindung betrieben werden, oder benötigt es lokale Latenz/Hardware (typisch für OT/ICS)?',
  },
  {
    key: 'cloudEignung',
    label: 'Migrationsstrategie (6R + K8s)',
    type: 'select',
    options: [
      'Rehost (Lift & Shift)',
      'Replatform (z.B. Containerisierung)',
      'Recontainerize (→ Kubernetes)',
      'Repurchase (SaaS)',
      'Refactor (Cloud-native)',
      'Retire (Abschalten)',
      'Retain (Behalten)',
      'Noch offen',
    ],
    group: 'cloud',
    tooltip:
      'Geplante Migrationsstrategie. "Recontainerize" ergänzt das klassische 6R-Modell für Workloads, die in Kubernetes überführt werden sollen (Hybrid → Container → Managed K8s). Das Dashboard schlägt automatisch eine Strategie vor.',
  },
  {
    key: 'cloudNotiz',
    label: 'Cloud-Notiz',
    type: 'textarea',
    group: 'cloud',
    tooltip: 'Freitext: Besonderheiten, Risiken, Annahmen für den Workshop.',
    suggestions: [
      'Containerisierung geplant (Docker → K8s)',
      'Kubernetes-Migration via AKS (Azure)',
      'Kubernetes-Migration via EKS (AWS)',
      'Kubernetes-Migration via GKE (GCP)',
      'Kubernetes-Migration via SKE (STACKIT)',
      'Kubernetes-Migration via IONOS Managed K8s',
      'Helm-Charts vorhanden / geplant',
      'CI/CD-Pipeline (GitOps / ArgoCD) erforderlich',
      'Service-Mesh-Integration (Istio) geplant',
      'Persistent Storage-Anforderung (PVC)',
      'Stateful Workload — Migration komplex',
      'Lizenz erlaubt BYOL (Bring Your Own License)',
      'Vendor-Lock-in vermeiden — Kubernetes bevorzugt',
      'Souveräne Cloud erforderlich (STACKIT / IONOS)',
      'Datenschutz: nur DE/EU-Rechenzentrum',
      'Confidential Computing prüfen (enclaive.io)',
      'TEE erforderlich — Daten auch im RAM geschützt',
      'VMware Tanzu Migration (TKG → TAP)',
      'Tanzu Mission Control für Multi-Cluster-Management',
    ],
  },
];

export const CATEGORIES: CategoryDef[] = [
  {
    key: 'geschaeftsprozesse',
    label: 'Geschäftsprozesse',
    prefix: 'GP',
    fields: [
      { key: 'kuerzel', label: 'Kürzel', type: 'text', tooltip: 'Eindeutiges Kürzel, z.B. GP-001', required: true },
      { key: 'name', label: 'Name', type: 'text', tooltip: 'Bezeichnung des Geschäftsprozesses', required: true },
      { key: 'erlaeuterung', label: 'Erläuterung', type: 'textarea', tooltip: 'Beschreibung und Zweck des Prozesses' },
      STATUS_FIELD,
      { key: 'prozessArt', label: 'Prozess-Art', type: 'select', options: ['Kernprozess', 'Unterstützungsprozess'], tooltip: 'Art des Prozesses: Kern- oder Unterstützungsprozess' },
      { key: 'verantwortlicher', label: 'Verantwortlicher/Fachabteilung', type: 'text', tooltip: 'Zuständige Person oder Abteilung', suggestions: ['Geschäftsführung', 'IT-Abteilung', 'Finanz & Controlling', 'Personalwesen (HR)', 'Vertrieb', 'Einkauf / Beschaffung', 'Produktion', 'Logistik / Supply Chain', 'Compliance / Recht', 'Marketing', 'Kundenservice', 'Forschung & Entwicklung'] },
      { key: 'beteiligte', label: 'Beteiligte', type: 'text', tooltip: 'Weitere beteiligte Personen oder Rollen', suggestions: ['IT-Administration', 'Prozessverantwortliche', 'Key User', 'Datenschutzbeauftragter', 'Qualitätsmanagement', 'Betriebsrat'] },
      TAGS_FIELD,
      { key: 'daten', label: 'Daten', type: 'multiref', refCategory: 'daten', tooltip: 'Verknüpfte Datenobjekte' },
      { key: 'anwendungen', label: 'Anwendungen', type: 'multiref', refCategory: 'anwendungen', tooltip: 'Unterstützende Anwendungen' },
    ],
  },
  {
    key: 'daten',
    label: 'Daten',
    prefix: 'D',
    fields: [
      { key: 'kuerzel', label: 'Kürzel', type: 'text', tooltip: 'Eindeutiges Kürzel, z.B. D-001', required: true },
      { key: 'name', label: 'Name', type: 'text', tooltip: 'Bezeichnung des Datenobjekts', required: true },
      { key: 'erlaeuterung', label: 'Erläuterung', type: 'textarea', tooltip: 'Beschreibung der Daten und ihres Verwendungszwecks' },
      STATUS_FIELD,
      { key: 'personenbezug', label: 'Personenbezug', type: 'select', options: ['Ja', 'Nein'], tooltip: 'Enthält das Datenobjekt personenbezogene Daten (DSGVO relevant)?' },
      { key: 'datensouveraenitaet', label: 'Datensouveränität', type: 'select', options: ['Keine spezielle Anforderung', 'EU / DSGVO', 'Deutschland', 'Streng souverän (C5 / Gaia-X)'], group: 'cloud', tooltip: 'Regulatorische Anforderung an den Speicherort. Wichtigster Treiber für eine souveräne Cloud.' },
      { key: 'verantwortlicher', label: 'Verantwortlicher/Fachabteilung', type: 'text', tooltip: 'Zuständige Person oder Abteilung', suggestions: ['Datenschutzbeauftragter (DSB)', 'IT-Abteilung', 'Compliance / Recht', 'Finanz & Controlling', 'Personalwesen (HR)', 'Vertrieb', 'Geschäftsführung', 'Qualitätsmanagement'] },
      { key: 'beteiligte', label: 'Beteiligte', type: 'text', tooltip: 'Weitere beteiligte Personen oder Rollen', suggestions: ['IT-Administration', 'Fachbereichsleitung', 'Betriebsrat', 'Datenschutzbeauftragter', 'Externe Dienstleister'] },
      TAGS_FIELD,
      { key: 'anwendungen', label: 'Anwendungen', type: 'multiref', refCategory: 'anwendungen', tooltip: 'Anwendungen, die diese Daten verarbeiten' },
    ],
  },
  {
    key: 'anwendungen',
    label: 'Anwendungen',
    prefix: 'A',
    fields: [
      { key: 'kuerzel', label: 'Kürzel', type: 'text', tooltip: 'Eindeutiges Kürzel, z.B. A-001', required: true },
      { key: 'name', label: 'Name', type: 'text', tooltip: 'Name der Anwendung/Software', required: true },
      { key: 'erlaeuterung', label: 'Erläuterung', type: 'textarea', tooltip: 'Beschreibung und Zweck der Anwendung' },
      {
        key: 'typ',
        label: 'Anwendungstyp',
        type: 'select',
        options: [
          '',
          'Web-Applikation (Browser-basiert)',
          'Desktop-Applikation (Windows/macOS/Linux)',
          'Mobile App (iOS/Android)',
          'Server-Dienst / Backend-Service',
          'Datenbank / Datenhaltung',
          'ERP / CRM (Geschäftssoftware)',
          'Middleware / Integration',
          'Entwicklungs-/DevOps-Tool',
          'Sicherheits-/Monitoring-Tool',
          'OS-nahe Software / Treiber',
          'Sonstiges',
        ],
        tooltip: 'Art der Anwendung – hilft bei der Einordnung und Cloud-Eignung',
      },
      STATUS_FIELD,
      { key: 'verantwortlicher', label: 'Verantwortlich/Administrator', type: 'text', tooltip: 'Technisch verantwortliche Person oder Rolle', suggestions: ['IT-Administration', 'Application Owner', 'Fachbereichsleitung', 'IT-Leitung / CIO', 'Externes RZ / Dienstleister', 'DevOps-Team'] },
      { key: 'benutzer', label: 'Benutzer', type: 'text', tooltip: 'Nutzergruppen oder Personen die die Anwendung verwenden', suggestions: ['Alle Mitarbeiter', 'IT-Abteilung', 'Finanz & Controlling', 'Personalwesen (HR)', 'Vertrieb', 'Einkauf', 'Produktion', 'Management', 'Externe Dienstleister', 'Kunden (Self-Service)'] },
      TAGS_FIELD,
      { key: 'anwendungen', label: 'Abhängige Anwendungen', type: 'multiref', refCategory: 'anwendungen', tooltip: 'Andere Anwendungen von denen diese abhängt' },
      { key: 'itSysteme', label: 'IT-Systeme', type: 'multiref', refCategory: 'server', tooltip: 'Server und Systeme auf denen die Anwendung läuft' },
      { key: 'netzverbindungen', label: 'Netzverbindungen', type: 'multiref', refCategory: 'netzverbindungen', tooltip: 'Genutzte Netzverbindungen' },
    ],
  },
  {
    key: 'datentraeger',
    label: 'Datenträger',
    prefix: 'DT',
    fields: [
      { key: 'kuerzel', label: 'Kürzel', type: 'text', tooltip: 'Eindeutiges Kürzel, z.B. DT-001', required: true },
      { key: 'name', label: 'Name', type: 'text', tooltip: 'Bezeichnung des Datenträgers', required: true, suggestions: ['USB-Stick', 'Externe Festplatte', 'Bandlaufwerk (LTO)', 'NAS-Laufwerk', 'SAN-Volume', 'Speicherkarte (SD/CF)', 'Optische Medien (DVD/Blu-ray)', 'RDX-Wechseldatenträger', 'Magnetband-Bibliothek'] },
      { key: 'erlaeuterung', label: 'Erläuterung', type: 'textarea', tooltip: 'Beschreibung des Datenträgers (Typ, Verwendung)' },
      STATUS_FIELD,
      { key: 'anzahl', label: 'Anzahl', type: 'text', tooltip: 'Anzahl der vorhandenen Einheiten' },
      { key: 'verantwortlicher', label: 'Verantwortlich/Administrator', type: 'text', tooltip: 'Zuständige Person oder Rolle', suggestions: ['IT-Administration', 'Backup-Verantwortliche', 'IT-Leitung', 'Systemadministrator'] },
      { key: 'benutzer', label: 'Benutzer', type: 'text', tooltip: 'Nutzergruppen des Datenträgers', suggestions: ['IT-Administration', 'Alle Mitarbeiter', 'Backup-System (automatisiert)', 'Externe Dienstleister'] },
      TAGS_FIELD,
      { key: 'daten', label: 'Daten', type: 'multiref', refCategory: 'daten', tooltip: 'Auf dem Datenträger gespeicherte Daten' },
      { key: 'anwendungen', label: 'Anwendungen', type: 'multiref', refCategory: 'anwendungen', tooltip: 'Anwendungen die den Datenträger nutzen' },
    ],
  },
  {
    key: 'server',
    label: 'Server',
    prefix: 'S',
    fields: [
      { key: 'kuerzel', label: 'Kürzel', type: 'text', tooltip: 'Eindeutiges Kürzel, z.B. S-001', required: true },
      { key: 'name', label: 'Name', type: 'text', tooltip: 'Hostname oder Bezeichnung des Servers', required: true },
      { key: 'erlaeuterung', label: 'Erläuterung', type: 'textarea', tooltip: 'Beschreibung und Funktion des Servers' },
      STATUS_FIELD,
      { key: 'anzahl', label: 'Anzahl', type: 'text', tooltip: 'Anzahl gleichartiger Server' },
      { key: 'plattform', label: 'Plattform', type: 'text', tooltip: 'Betriebssystem, Hypervisor, Container-Runtime oder Cloud-VM-Typ. Für Cloud-Systeme bitte auch den Hyperscaler-Service im Feld "Cloud-Dienst / Service-Typ" eintragen.', suggestions: [
        // On-Premises OS
        'Windows Server 2022', 'Windows Server 2019', 'Windows Server 2016', 'Windows Server 2012 R2',
        'Ubuntu Server 24.04 LTS', 'Ubuntu Server 22.04 LTS', 'Ubuntu Server 20.04 LTS',
        'Red Hat Enterprise Linux 9 (RHEL)', 'Red Hat Enterprise Linux 8 (RHEL)',
        'SUSE Linux Enterprise Server 15 (SLES)', 'Debian 12', 'CentOS Stream 9', 'Oracle Linux 9',
        // Hypervisor / Virtualisierung
        'VMware ESXi 8.0', 'VMware ESXi 7.0', 'Microsoft Hyper-V', 'Proxmox VE 8', 'Nutanix AHV', 'oVirt / RHEV',
        // Container / K8s
        'Docker Host (Linux)', 'Podman Host (RHEL/Fedora)',
        'Kubernetes Node (generisch)', 'k3s Node (Leichtgewicht-K8s)', 'K3s / RKE2 (Rancher)',
        'OpenShift Node (Red Hat)', 'VMware Tanzu Kubernetes Grid Node (TKG)', 'Talos Linux (K8s-OS)',
        // Azure VM-Typen
        'Azure VM — General Purpose (B/D-Serie)', 'Azure VM — Compute Optimized (F-Serie)',
        'Azure VM — Memory Optimized (E/M-Serie)', 'Azure VM — AKS Node Pool',
        // AWS EC2-Typen
        'AWS EC2 — General Purpose (t3/m6i)', 'AWS EC2 — Compute Optimized (c6i)',
        'AWS EC2 — Memory Optimized (r6i)', 'AWS EKS Managed Node Group',
        // GCP Compute
        'GCP Compute Engine — General Purpose (n2)', 'GCP Compute Engine — Memory Optimized (m2)',
        'GCP GKE Node Pool',
        // STACKIT
        'STACKIT Compute Engine (VM)', 'STACKIT Kubernetes Engine Node (SKE)',
        // IONOS
        'IONOS Cloud VM (DCD)', 'IONOS Managed Kubernetes Node',
      ] },
      { key: 'verantwortlicher', label: 'Verantwortlich/Administrator', type: 'text', tooltip: 'Systemadministrator oder zuständige Rolle', suggestions: ['Systemadministrator', 'IT-Leitung', 'DevOps-Team', 'Externes RZ / Managed Service', 'Cloud-Team', 'Fachbereichsleitung'] },
      { key: 'benutzer', label: 'Benutzer', type: 'text', tooltip: 'Nutzergruppen des Servers', suggestions: ['IT-Administration', 'Alle Mitarbeiter (Dienste)', 'Anwendungsnutzer', 'Entwickler', 'Externe Dienstleister'] },
      TAGS_FIELD,
      { key: 'anwendungen', label: 'Anwendungen', type: 'multiref', refCategory: 'anwendungen', tooltip: 'Auf dem Server betriebene Anwendungen' },
      { key: 'itSysteme', label: 'IT-Systeme', type: 'multiref', refCategory: 'server', tooltip: 'Verknüpfte IT-Systeme' },
      { key: 'netzverbindungen', label: 'Netzverbindungen', type: 'multiref', refCategory: 'netzverbindungen', tooltip: 'Netzverbindungen des Servers' },
      { key: 'raeume', label: 'Räume', type: 'multiref', refCategory: 'raeume', tooltip: 'Aufstellungsort (Raum)' },
      { key: 'gebaeude', label: 'Gebäude', type: 'multiref', refCategory: 'gebaeude', tooltip: 'Aufstellungsort (Gebäude)' },
    ],
  },
  {
    key: 'netzkomponenten',
    label: 'Netzkomponenten',
    prefix: 'NK',
    fields: [
      { key: 'kuerzel', label: 'Kürzel', type: 'text', tooltip: 'Eindeutiges Kürzel, z.B. NK-001', required: true },
      { key: 'name', label: 'Name', type: 'text', tooltip: 'Bezeichnung der Netzkomponente', required: true },
      { key: 'erlaeuterung', label: 'Erläuterung', type: 'textarea', tooltip: 'Beschreibung und Funktion (Switch, Router, Firewall, etc.)' },
      STATUS_FIELD,
      { key: 'anzahl', label: 'Anzahl', type: 'text', tooltip: 'Anzahl gleichartiger Komponenten' },
      { key: 'plattform', label: 'Plattform', type: 'text', tooltip: 'Hersteller, Modell und Firmware-Version', suggestions: ['Cisco Catalyst (Switch)', 'Cisco ASA (Firewall)', 'Cisco Firepower (NGFW)', 'Juniper EX-Series (Switch)', 'Juniper SRX (Firewall)', 'Fortinet FortiGate', 'Palo Alto Networks', 'Check Point', 'Sophos XG/XGS', 'pfSense / OPNsense', 'HP Aruba (Switch/WLAN)', 'Ubiquiti UniFi', 'F5 BIG-IP (Load Balancer)', 'Barracuda', 'Netgear'] },
      { key: 'verantwortlicher', label: 'Verantwortlich/Administrator', type: 'text', tooltip: 'Zuständige Person oder Rolle', suggestions: ['Netzwerk-Administration', 'IT-Sicherheit / CISO', 'IT-Leitung', 'Externes RZ / Provider', 'Managed Service Provider'] },
      TAGS_FIELD,
      { key: 'itSysteme', label: 'IT-Systeme', type: 'multiref', refCategory: 'server', tooltip: 'Angeschlossene IT-Systeme' },
      { key: 'netzverbindungen', label: 'Netzverbindungen', type: 'multiref', refCategory: 'netzverbindungen', tooltip: 'Zugehörige Netzverbindungen' },
      { key: 'raeume', label: 'Räume', type: 'multiref', refCategory: 'raeume', tooltip: 'Aufstellungsort (Raum)' },
      { key: 'gebaeude', label: 'Gebäude', type: 'multiref', refCategory: 'gebaeude', tooltip: 'Aufstellungsort (Gebäude)' },
    ],
  },
  {
    key: 'netzverbindungen',
    label: 'Netzverbindungen',
    prefix: 'N',
    fields: [
      { key: 'kuerzel', label: 'Kürzel', type: 'text', tooltip: 'Eindeutiges Kürzel, z.B. N-001', required: true },
      { key: 'name', label: 'Name', type: 'text', tooltip: 'Bezeichnung der Netzverbindung', required: true },
      { key: 'erlaeuterung', label: 'Erläuterung', type: 'textarea', tooltip: 'Beschreibung der Verbindung und ihres Zwecks' },
      STATUS_FIELD,
      { key: 'protokolle', label: 'Protokolle', type: 'text', tooltip: 'Verwendete Protokolle, z.B. TCP/IP, HTTPS, VPN, gRPC. Cloud- und K8s-Verbindungen bitte mit Dienst angeben.', suggestions: [
        // Klassisch
        'HTTPS / TLS 1.3', 'VPN (IPSec/IKEv2)', 'VPN (SSL/TLS)', 'MPLS', 'SD-WAN',
        'BGP', 'OSPF', 'VLAN (802.1Q)', 'RDP', 'SSH', 'SMB / CIFS',
        'LDAP / LDAPS', 'DNS', 'SMTP / SMTPS', 'SIP / RTP (VoIP)', 'FTP / SFTP',
        // OT/IoT
        'Modbus TCP', 'OPC UA', 'MQTT',
        // Cloud / K8s
        'HTTPS (Cloud API / REST)', 'gRPC (Microservices / K8s)', 'WebSocket',
        'Kubernetes API (kubectl)', 'Kubernetes Ingress (NGINX / Traefik)',
        'AWS PrivateLink', 'Azure Private Endpoint', 'GCP Private Service Connect',
        'STACKIT VPC Peering', 'IONOS VPN Gateway',
        'ExpressRoute (Azure)', 'AWS Direct Connect', 'Cloud Interconnect (GCP)',
        'Service Mesh mTLS (Istio / Linkerd)',
      ] },
      { key: 'externNetz', label: 'Extern.Netz', type: 'select', options: ['Ja', 'Nein'], tooltip: 'Handelt es sich um eine externe Netzverbindung (Internet, WAN)?' },
      TAGS_FIELD,
      { key: 'anwendungen', label: 'Anwendungen', type: 'multiref', refCategory: 'anwendungen', tooltip: 'Anwendungen die diese Verbindung nutzen' },
      { key: 'clients', label: 'Clients', type: 'multiref', refCategory: 'clients', tooltip: 'Verbundene Clients' },
      { key: 'server', label: 'Server', type: 'multiref', refCategory: 'server', tooltip: 'Verbundene Server' },
      { key: 'netzverbindungen', label: 'Netzverbindungen', type: 'multiref', refCategory: 'netzverbindungen', tooltip: 'Verknüpfte Netzverbindungen' },
      { key: 'netzkomponenten', label: 'Netzkomponenten', type: 'multiref', refCategory: 'netzkomponenten', tooltip: 'Beteiligte Netzkomponenten' },
      { key: 'raeume', label: 'Räume', type: 'multiref', refCategory: 'raeume', tooltip: 'Betroffene Räume' },
      { key: 'gebaeude', label: 'Gebäude', type: 'multiref', refCategory: 'gebaeude', tooltip: 'Betroffene Gebäude' },
    ],
  },
  {
    key: 'clients',
    label: 'Clients',
    prefix: 'C',
    fields: [
      { key: 'kuerzel', label: 'Kürzel', type: 'text', tooltip: 'Eindeutiges Kürzel, z.B. C-001', required: true },
      { key: 'name', label: 'Name', type: 'text', tooltip: 'Bezeichnung des Clients', required: true },
      { key: 'erlaeuterung', label: 'Erläuterung', type: 'textarea', tooltip: 'Beschreibung und Verwendungszweck des Clients' },
      STATUS_FIELD,
      { key: 'anzahl', label: 'Anzahl', type: 'text', tooltip: 'Anzahl gleichartiger Clients' },
      { key: 'plattform', label: 'Plattform', type: 'text', tooltip: 'Betriebssystem und Version, z.B. Windows 11', suggestions: ['Windows 11 Pro', 'Windows 11 Enterprise', 'Windows 10 Pro', 'Windows 10 Enterprise', 'macOS 15 Sequoia', 'macOS 14 Sonoma', 'macOS 13 Ventura', 'Ubuntu 24.04 LTS Desktop', 'Ubuntu 22.04 LTS Desktop', 'Chrome OS', 'iOS 18', 'Android 15', 'Thin Client (Windows IoT)', 'Zero Client'] },
      { key: 'verantwortlicher', label: 'Verantwortlich/Administrator', type: 'text', tooltip: 'Zuständige Person oder Rolle', suggestions: ['Client-Management', 'IT-Helpdesk / Support', 'IT-Administration', 'Managed Service Provider', 'IT-Leitung'] },
      { key: 'benutzer', label: 'Benutzer', type: 'text', tooltip: 'Nutzergruppen des Clients', suggestions: ['Alle Mitarbeiter', 'Außendienst / Mobile Worker', 'Home-Office-Mitarbeiter', 'Führungskräfte', 'Produktion / Fertigung', 'IT-Abteilung', 'Externe Dienstleister'] },
      TAGS_FIELD,
      { key: 'itSysteme', label: 'IT-Systeme', type: 'multiref', refCategory: 'server', tooltip: 'Verknüpfte IT-Systeme' },
      { key: 'netzverbindungen', label: 'Netzverbindungen', type: 'multiref', refCategory: 'netzverbindungen', tooltip: 'Netzverbindungen des Clients' },
      { key: 'raeume', label: 'Räume', type: 'multiref', refCategory: 'raeume', tooltip: 'Aufstellungsort (Raum)' },
      { key: 'gebaeude', label: 'Gebäude', type: 'multiref', refCategory: 'gebaeude', tooltip: 'Aufstellungsort (Gebäude)' },
    ],
  },
  {
    key: 'icsSysteme',
    label: 'ICS-Systeme',
    prefix: 'ICS',
    fields: [
      { key: 'kuerzel', label: 'Kürzel', type: 'text', tooltip: 'Eindeutiges Kürzel, z.B. ICS-001', required: true },
      { key: 'name', label: 'Name', type: 'text', tooltip: 'Bezeichnung des ICS-Systems', required: true },
      { key: 'erlaeuterung', label: 'Erläuterung', type: 'textarea', tooltip: 'Beschreibung des industriellen Steuerungssystems' },
      STATUS_FIELD,
      { key: 'anzahl', label: 'Anzahl', type: 'text', tooltip: 'Anzahl gleichartiger Systeme' },
      { key: 'plattform', label: 'Plattform', type: 'text', tooltip: 'Hersteller, Typ und Version des Systems', suggestions: ['Siemens SIMATIC S7 (SPS)', 'Siemens SIMATIC WinCC (SCADA)', 'Allen-Bradley / Rockwell Automation', 'Beckhoff TwinCAT (SPS/IPC)', 'Schneider Electric Modicon', 'ABB AC500 / 800xA', 'Honeywell Experion PKS', 'Inductive Automation Ignition (SCADA)', 'AVEVA / Wonderware System Platform', 'Mitsubishi MELSEC', 'Phoenix Contact PLCnext', 'B&R Automation (Bernecker & Rainer)'] },
      { key: 'verantwortlicher', label: 'Verantwortlich/Administrator', type: 'text', tooltip: 'Zuständige Person oder Rolle', suggestions: ['OT-/Produktionsverantwortliche', 'Automatisierungstechniker', 'IT-OT-Koordinator', 'Anlagenhersteller / Integrator', 'Werkstechnik'] },
      { key: 'benutzer', label: 'Benutzer', type: 'text', tooltip: 'Nutzergruppen des Systems', suggestions: ['Produktion / Fertigung', 'Anlagenführer', 'Wartungspersonal', 'Prozessleittechnik', 'Qualitätssicherung'] },
      TAGS_FIELD,
      { key: 'itSysteme', label: 'IT-Systeme', type: 'multiref', refCategory: 'server', tooltip: 'Verknüpfte IT-Systeme' },
      { key: 'netzverbindungen', label: 'Netzverbindungen', type: 'multiref', refCategory: 'netzverbindungen', tooltip: 'Netzverbindungen des Systems' },
      { key: 'raeume', label: 'Räume', type: 'multiref', refCategory: 'raeume', tooltip: 'Aufstellungsort (Raum)' },
      { key: 'gebaeude', label: 'Gebäude', type: 'multiref', refCategory: 'gebaeude', tooltip: 'Aufstellungsort (Gebäude)' },
    ],
  },
  {
    key: 'iotSysteme',
    label: 'IoT-Systeme',
    prefix: 'IoT',
    fields: [
      { key: 'kuerzel', label: 'Kürzel', type: 'text', tooltip: 'Eindeutiges Kürzel, z.B. IoT-001', required: true },
      { key: 'name', label: 'Name', type: 'text', tooltip: 'Bezeichnung des IoT-Geräts', required: true },
      { key: 'erlaeuterung', label: 'Erläuterung', type: 'textarea', tooltip: 'Beschreibung und Verwendungszweck des IoT-Geräts' },
      STATUS_FIELD,
      { key: 'anzahl', label: 'Anzahl', type: 'text', tooltip: 'Anzahl gleichartiger Geräte' },
      { key: 'plattform', label: 'Plattform', type: 'text', tooltip: 'Hersteller, Modell und Firmware-Version', suggestions: ['Siemens LOGO! / IOT2040', 'Bosch IoT Suite', 'Hager / WAGO Gebäudesteuerung', 'KNX / EIB (Gebäudeautomation)', 'DALI (Lichtsteuerung)', 'Gira / Jung (Smart Building)', 'Axis Communications (IP-Kamera)', 'Bosch Sicherheitssysteme', 'Honeywell Gebäudetechnik', 'Azure IoT Hub (Plattform)', 'AWS IoT Greengrass (Plattform)', 'Raspberry Pi (DIY/Industrie)'] },
      { key: 'verantwortlicher', label: 'Verantwortlich/Administrator', type: 'text', tooltip: 'Zuständige Person oder Rolle', suggestions: ['Facility Management', 'Haustechnik', 'IT-Administration', 'Sicherheitsdienst', 'Anlagenhersteller / Wartungsfirma'] },
      { key: 'benutzer', label: 'Benutzer', type: 'text', tooltip: 'Nutzergruppen des Geräts', suggestions: ['Facility Management', 'Alle Mitarbeiter (Passiv)', 'Sicherheitspersonal', 'Haustechnik', 'Automatisch (keine Nutzer)'] },
      TAGS_FIELD,
      { key: 'itSysteme', label: 'IT-Systeme', type: 'multiref', refCategory: 'server', tooltip: 'Verknüpfte IT-Systeme' },
      { key: 'netzverbindungen', label: 'Netzverbindungen', type: 'multiref', refCategory: 'netzverbindungen', tooltip: 'Netzverbindungen des Geräts' },
      { key: 'raeume', label: 'Räume', type: 'multiref', refCategory: 'raeume', tooltip: 'Aufstellungsort (Raum)' },
      { key: 'gebaeude', label: 'Gebäude', type: 'multiref', refCategory: 'gebaeude', tooltip: 'Aufstellungsort (Gebäude)' },
    ],
  },
  {
    key: 'raeume',
    label: 'Räume',
    prefix: 'R',
    fields: [
      { key: 'kuerzel', label: 'Kürzel', type: 'text', tooltip: 'Eindeutiges Kürzel, z.B. R-001', required: true },
      { key: 'name', label: 'Name', type: 'text', tooltip: 'Bezeichnung des Raums', required: true },
      { key: 'erlaeuterung', label: 'Erläuterung', type: 'textarea', tooltip: 'Beschreibung und Verwendungszweck des Raums', suggestions: ['Serverraum', 'Rechenzentrum / Co-Location', 'Technikraum / IT-Keller', 'Netzwerkverteilerraum (MDF/IDF)', 'Büro / Arbeitsraum', 'Konferenzraum', 'Archiv / Lagerraum', 'Produktionshalle', 'Laborfläche', 'Rechenzentrum (extern/Colocation)'] },
      { key: 'anzahl', label: 'Anzahl', type: 'text', tooltip: 'Anzahl gleichartiger Räume' },
      { key: 'verantwortlicher', label: 'Verantwortlich', type: 'text', tooltip: 'Zuständige Person oder Rolle', suggestions: ['Facility Management', 'IT-Leitung', 'Haustechnik', 'Gebäudemanagement', 'Sicherheitsdienst'] },
      { key: 'benutzer', label: 'Benutzer', type: 'text', tooltip: 'Nutzergruppen des Raums', suggestions: ['IT-Administration', 'Alle Mitarbeiter', 'Facility Management', 'Autorisiertes Personal', 'Wartungspersonal', 'Geschäftsführung'] },
      TAGS_FIELD,
      { key: 'gebaeude', label: 'Gebäude', type: 'multiref', refCategory: 'gebaeude', tooltip: 'Gebäude in dem sich der Raum befindet' },
    ],
  },
  {
    key: 'gebaeude',
    label: 'Gebäude',
    prefix: 'G',
    fields: [
      { key: 'kuerzel', label: 'Kürzel', type: 'text', tooltip: 'Eindeutiges Kürzel, z.B. G-001', required: true },
      { key: 'name', label: 'Name', type: 'text', tooltip: 'Bezeichnung des Gebäudes', required: true },
      { key: 'erlaeuterung', label: 'Erläuterung', type: 'textarea', tooltip: 'Adresse und Beschreibung des Gebäudes' },
      { key: 'anzahl', label: 'Anzahl', type: 'text', tooltip: 'Anzahl gleichartiger Gebäude' },
      { key: 'verantwortlicher', label: 'Verantwortlich', type: 'text', tooltip: 'Zuständige Person oder Rolle', suggestions: ['Facility Management', 'Geschäftsführung', 'Gebäudemanagement', 'Immobilienverwaltung', 'Standortleitung'] },
      { key: 'benutzer', label: 'Benutzer', type: 'text', tooltip: 'Nutzergruppen des Gebäudes', suggestions: ['Alle Mitarbeiter', 'Produktion / Fertigung', 'Verwaltung', 'Kunden / Besucher', 'Externe Dienstleister', 'IT-Abteilung'] },
      TAGS_FIELD,
    ],
  },
];

// Cloud-Readiness-Felder an die cloud-relevanten Kategorien anhängen.
const CLOUD_RELEVANT: CategoryKey[] = [
  'anwendungen',
  'server',
  'clients',
  'icsSysteme',
  'iotSysteme',
];
for (const cat of CATEGORIES) {
  if (CLOUD_RELEVANT.includes(cat.key)) {
    cat.fields.push(...CLOUD_FIELDS.map((f) => ({ ...f })));
  }
}

// BSI-orientierte Hilfetexte für den geführten Erhebungs-Assistenten.
const HELP: Partial<Record<CategoryKey, CategoryHelp>> = {
  geschaeftsprozesse: {
    intro:
      'Geschäftsprozesse sind die fachlichen Abläufe, mit denen das Unternehmen seine Wertschöpfung erbringt. Sie bilden den Ausgangspunkt der Strukturanalyse.',
    bsiWhy:
      'Nach BSI IT-Grundschutz (Standard 200-2) wird der Schutzbedarf von den Geschäftsprozessen auf Anwendungen und IT-Systeme „vererbt". Ohne die Prozesse kann der Schutzbedarf nicht sauber begründet werden.',
    cloudWhy:
      'Kernprozesse mit hoher Verfügbarkeitsanforderung bestimmen, welche Systeme geschäftskritisch sind. Das priorisiert die Migrationsreihenfolge und zeigt, wo Cloud-Ausfallsicherheit (SLA) wichtig ist.',
    interviewQuestions: [
      'Was sind Ihre wichtigsten Geschäftsprozesse, ohne die der Betrieb stillsteht?',
      'Welche Prozesse sind Kernprozesse, welche unterstützen nur?',
      'Wie lange darf ein Prozess maximal ausfallen?',
      'Welche Abteilungen/Personen sind verantwortlich?',
    ],
    ansprechpartner: 'Geschäftsführung, Fachbereichsleitungen, Prozessverantwortliche',
    wenFragen: [
      { rolle: 'Geschäftsführung', tipps: ['Fragt nach Kernprozessen und strategischen Prioritäten', 'Kennt die übergeordneten Unternehmensziele und Wertschöpfungskette'] },
      { rolle: 'Fachbereichsleitungen', tipps: ['Können Prozessabläufe und Abhängigkeiten im Detail beschreiben', 'Kennen Ausfallzeiten, SLAs und Kritikalität aus Sicht des Fachbereichs'] },
      { rolle: 'Prozessverantwortliche', tipps: ['Detailkenntnis über konkrete Abläufe und Ausnahmen', 'Wissen, welche IT-Systeme und Daten pro Prozess genutzt werden'] },
    ],
  },
  daten: {
    intro:
      'Hier werden die Informationen/Daten erfasst, die in den Prozessen verarbeitet, gespeichert oder übertragen werden – gruppiert nach Art (z.B. Kundendaten, Finanzdaten).',
    bsiWhy:
      'Daten sind die zentralen Schutzobjekte. Ihr Schutzbedarf (Vertraulichkeit, Integrität, Verfügbarkeit) sowie ein etwaiger Personenbezug (DSGVO) sind Grundlage jeder Risikobetrachtung.',
    cloudWhy:
      'Datenklassifizierung und Souveränitätsanforderung entscheiden, ob Daten in eine Public Cloud dürfen oder eine souveräne Cloud (C5/Gaia-X, DE-Standort) nötig ist. Das ist der wichtigste Cloud-Show-Stopper.',
    interviewQuestions: [
      'Welche Arten von Daten verarbeiten Sie (Kunden-, Personal-, Finanz-, Konstruktionsdaten …)?',
      'Sind personenbezogene oder besonders schützenswerte Daten dabei?',
      'Gibt es gesetzliche Vorgaben zum Speicherort (z.B. nur Deutschland/EU)?',
      'Welche Daten wären bei Verlust/Offenlegung geschäftskritisch?',
    ],
    ansprechpartner: 'Datenschutzbeauftragter, Fachbereiche, ggf. Compliance',
    wenFragen: [
      { rolle: 'Datenschutzbeauftragter (DSB)', tipps: ['Kennt alle personenbezogenen Daten und DSGVO-Relevanz', 'Weiß über Verarbeitungsverzeichnis und Löschfristen Bescheid'] },
      { rolle: 'Compliance / Recht', tipps: ['Kennt regulatorische Anforderungen (z.B. nur DE/EU-Speicherung)', 'Weiß über Branchenvorschriften (KRITIS, GoBD etc.) Bescheid'] },
      { rolle: 'Fachbereichsleitungen', tipps: ['Wissen, welche Daten in ihrem Bereich erzeugt werden', 'Können Schutzbedarf aus Geschäftssicht einschätzen'] },
    ],
  },
  anwendungen: {
    intro:
      'Anwendungen sind die Software/Fachverfahren, mit denen die Prozesse arbeiten. Wichtig ist die Zuordnung Anwendung → Prozess und Anwendung → IT-System.',
    bsiWhy:
      'Anwendungen sind eine eigene Schicht im IT-Grundschutz. Über sie wird der Schutzbedarf der Prozesse an die IT-Systeme weitergegeben.',
    cloudWhy:
      'Auf Anwendungsebene wird die 6R-Migrationsstrategie entschieden (Rehost, Replatform, Repurchase/SaaS, Refactor, Retire, Retain). Lizenzmodell, Lebenszyklus und Abhängigkeiten bestimmen Aufwand und Eignung.',
    interviewQuestions: [
      'Welche Anwendungen/Fachverfahren setzen Sie ein und wofür?',
      'Gibt es bereits eine SaaS-/Cloud-Variante des Herstellers?',
      'Wie ist die Anwendung lizenziert – ist Cloud-Betrieb erlaubt?',
      'Welche Schnittstellen/Abhängigkeiten zu anderen Systemen bestehen?',
      'Wie aktuell ist die Anwendung (Version, Support-Ende)?',
    ],
    ansprechpartner: 'Anwendungsverantwortliche, IT-Leitung, Fachbereiche',
    wenFragen: [
      { rolle: 'IT-Leitung / CIO', tipps: ['Überblick über die gesamte Anwendungslandschaft', 'Kennt Lizenzverträge und Upgrade-Roadmap'] },
      { rolle: 'Anwendungsverantwortliche', tipps: ['Detailwissen zu Schnittstellen und Abhängigkeiten', 'Wissen über Customizing und besondere Betriebsanforderungen'] },
      { rolle: 'Fachbereiche (Key User)', tipps: ['Können Funktionsumfang und Kritikalität aus Nutzersicht beschreiben', 'Wissen oft von Schatten-IT oder parallelen Excel-Lösungen'] },
    ],
  },
  datentraeger: {
    intro:
      'Datenträger, die nicht bereits durch Server/Clients abgedeckt sind – z.B. externe Festplatten, USB-Medien, Bandlaufwerke, separate NAS-Medien.',
    bsiWhy:
      'Datenträger können sensible Daten außerhalb der zentralen Systeme enthalten und sind relevant für Vertraulichkeit, sichere Löschung und Notfallvorsorge.',
    cloudWhy:
      'Lokale Datenträger und Backup-Medien zeigen, welche Datenmengen zu migrieren sind und wo Cloud-Backup/Archiv-Strategien ansetzen können.',
    interviewQuestions: [
      'Gibt es externe Datenträger oder Wechselmedien mit relevanten Daten?',
      'Wie erfolgt heute das Backup und wo werden Medien aufbewahrt?',
    ],
    ansprechpartner: 'IT-Administration, Backup-Verantwortliche',
    wenFragen: [
      { rolle: 'IT-Administration', tipps: ['Kennt alle Backup-Medien, NAS und Wechseldatenträger', 'Weiß über Aufbewahrungsorte und Löschprozesse Bescheid'] },
      { rolle: 'Backup-Verantwortliche', tipps: ['Detailwissen zu Backup-Zyklen und Wiederherstellungszeiten', 'Kennen Offsite-Lagerung und Transportwege für Medien'] },
    ],
  },
  server: {
    intro:
      'Server stellen anderen Systemen Dienste bereit (z.B. Datei-, Datenbank-, Applikationsserver). Erfassen Sie auch virtuelle Server und Cluster (mit Anzahl/Gruppierung).',
    bsiWhy:
      'Server sind zentrale IT-Systeme im Grundschutz. Plattform und Verknüpfungen sind nötig, um Bausteine zuzuordnen und den Schutzbedarf abzuleiten.',
    cloudWhy:
      'Server sind die häufigsten Migrationsobjekte. Virtualisierungsgrad, Schutzbedarf und Lebenszyklus bestimmen, ob Rehost (Lift & Shift), Replatform oder Retain sinnvoll ist.',
    interviewQuestions: [
      'Welche Server betreiben Sie und welche Aufgabe haben sie?',
      'Physisch oder virtualisiert? Welche Plattform/OS-Version?',
      'Welche laufen auf veralteten Betriebssystemen (Support-Ende)?',
      'Welche Server sind für den Betrieb am kritischsten?',
    ],
    ansprechpartner: 'System-/Server-Administration, IT-Leitung',
    wenFragen: [
      { rolle: 'System-/Server-Administration', tipps: ['Vollständige Übersicht aller Server und VMs', 'Kennen Betriebssysteme, Patchstand und Support-Ende-Daten'] },
      { rolle: 'IT-Leitung', tipps: ['Kennt strategische Entscheidungen zu Virtualisierung und RZ-Betrieb', 'Überblick über Lizenzkosten und Wartungsverträge'] },
      { rolle: 'Anwendungsverantwortliche', tipps: ['Wissen, welche Server für ihre Anwendungen benötigt werden', 'Können Verfügbarkeitsanforderungen und Wartungsfenster nennen'] },
    ],
  },
  netzkomponenten: {
    intro:
      'Aktive und passive Netzkomponenten wie Router, Switches, Firewalls und WLAN-Access-Points, die für das Netzwerk relevant sind.',
    bsiWhy:
      'Netzkomponenten sind für die Netzsicherheit (Segmentierung, Perimeter) zentral und gehören zu den IT-Systemen des Informationsverbunds.',
    cloudWhy:
      'Die Netz-Topologie zeigt, welche Anbindung (Bandbreite, Firewall, VPN) für einen Cloud-Übergang nötig ist und wo Latenz/Abhängigkeiten Migrationen begrenzen.',
    interviewQuestions: [
      'Welche zentralen Netzkomponenten (Firewall, Core-Switch, Router) gibt es?',
      'Wie ist das Netz segmentiert (z.B. OT/IT-Trennung)?',
      'Welche Internet-Anbindung/Bandbreite steht zur Verfügung?',
    ],
    ansprechpartner: 'Netzwerk-Administration, IT-Sicherheit',
    wenFragen: [
      { rolle: 'Netzwerk-Administration', tipps: ['Vollständige Übersicht aller aktiven Netzkomponenten', 'Kennen Topologie, VLANs und Netz-Segmentierung'] },
      { rolle: 'IT-Sicherheit / CISO', tipps: ['Kennt Firewall-Regeln und Perimeterschutz-Konzepte', 'Weiß über Netz-Monitoring und Anomalie-Erkennung Bescheid'] },
    ],
  },
  netzverbindungen: {
    intro:
      'Physische und logische Kommunikationsverbindungen innerhalb und zwischen Standorten – inkl. externer Verbindungen (Internet, WAN, VPN).',
    bsiWhy:
      'Kommunikationsverbindungen, insbesondere mit Außenanbindung, sind im Grundschutz kritische Betrachtungsobjekte (Schnittstellen nach außen).',
    cloudWhy:
      'Externe Verbindungen und Bandbreiten bestimmen die Cloud-Anbindungsstrategie (z.B. dediziertes Cloud-Interconnect, VPN, SD-WAN) und Latenz-Restriktionen.',
    interviewQuestions: [
      'Welche Standortverbindungen und externen Verbindungen gibt es?',
      'Welche Verbindungen verlassen das Unternehmensnetz?',
      'Welche Protokolle/Bandbreiten und Sicherheitsmechanismen werden genutzt?',
    ],
    ansprechpartner: 'Netzwerk-Administration, Provider-Management',
    wenFragen: [
      { rolle: 'Netzwerk-Administration', tipps: ['Kennt alle internen und externen Verbindungen (WAN, VPN, Internet)', 'Weiß über Provider-Verträge und SLAs Bescheid'] },
      { rolle: 'Provider-Management', tipps: ['Kann Bandbreiten, Laufzeiten und Uptime-Garantien benennen', 'Kennt Optionen für Cloud-Interconnect oder SD-WAN'] },
    ],
  },
  clients: {
    intro:
      'Arbeitsplatzrechner, Notebooks, Thin-Clients und mobile Endgeräte der Anwender.',
    bsiWhy:
      'Clients sind verbreitete IT-Systeme und häufiges Angriffsziel. Plattform und Anzahl/Gruppierung sind für die Bausteinzuordnung wichtig.',
    cloudWhy:
      'Clients sind Kandidaten für DaaS/VDI (z.B. virtuelle Desktops) und Modern-Workplace-Konzepte. Plattform und Anbindung zeigen das Potenzial.',
    interviewQuestions: [
      'Welche Client-Typen und Betriebssysteme sind im Einsatz (Anzahl)?',
      'Gibt es mobile/Remote-Arbeitsplätze?',
      'Wäre ein virtueller Desktop (DaaS/VDI) denkbar?',
    ],
    ansprechpartner: 'Client-Management / IT-Support',
    wenFragen: [
      { rolle: 'Client-Management / IT-Support (Helpdesk)', tipps: ['Vollständige Übersicht aller Endgeräte-Typen und Stückzahlen', 'Kennen Betriebssystem-Versionen, Patchstand und Refresh-Zyklen'] },
      { rolle: 'HR / Personalleitung', tipps: ['Weiß über Remote-Work-Anforderungen und Home-Office-Quote Bescheid', 'Kennt geplante Personalveränderungen und Standortentwicklung'] },
      { rolle: 'Fachbereichsleitungen', tipps: ['Können Anforderungen an mobile Geräte und Remote-Zugriff nennen'] },
    ],
  },
  icsSysteme: {
    intro:
      'Industrial Control Systems – Steuer- und Kontrollsysteme von Produktions-/Industrieanlagen (SPS, SCADA, Leitsysteme).',
    bsiWhy:
      'ICS/OT haben besondere Schutzanforderungen (Verfügbarkeit, lange Lebenszyklen). Das BSI behandelt sie gesondert (ICS-Security/IND-Bausteine).',
    cloudWhy:
      'OT-/ICS-Systeme sind meist NICHT cloud-migrierbar (Echtzeit, lokale Hardware, Herstellerfreigaben) und werden i.d.R. „Retain" – wichtig, um sie bewusst aus dem Migrationsscope zu nehmen.',
    interviewQuestions: [
      'Welche Steuerungs-/Produktionssysteme gibt es?',
      'Bestehen Echtzeit-/Latenzanforderungen oder Herstellerbindungen?',
      'Ist eine Trennung von der Office-IT vorhanden?',
    ],
    ansprechpartner: 'Produktion/OT-Verantwortliche, Anlagenhersteller',
    wenFragen: [
      { rolle: 'Produktion / OT-Verantwortliche', tipps: ['Vollständige Übersicht über Steuerungssysteme und Produktionsanlagen', 'Kennen Echtzeitanforderungen, Herstellervorgaben und Wartungsintervalle'] },
      { rolle: 'Anlagenhersteller / Integratoren', tipps: ['Wissen über Updatefähigkeit und Cloud-Support der Systeme', 'Kennen sicherheitsrelevante Zertifizierungen (IEC 62443 etc.)'] },
    ],
  },
  iotSysteme: {
    intro:
      'Vernetzte Geräte wie Gebäudetechnik, Klima-/Lüftungssteuerung, Brand-/Einbruchmeldeanlagen, smarte Sensorik.',
    bsiWhy:
      'IoT-Geräte erweitern die Angriffsfläche und werden oft übersehen. Ihre Erfassung ist für ein vollständiges Lagebild nötig.',
    cloudWhy:
      'Viele IoT-Lösungen nutzen bereits Hersteller-Cloud-Plattformen. Relevant ist, welche Daten dort abfließen und welche Souveränitätsanforderungen gelten.',
    interviewQuestions: [
      'Welche vernetzten Geräte/Anlagen (Gebäude, Sicherheit, Sensorik) gibt es?',
      'Nutzen diese bereits eine Hersteller-Cloud?',
      'Welche Daten werden übertragen und wohin?',
    ],
    ansprechpartner: 'Facility-Management, Haustechnik, IT',
    wenFragen: [
      { rolle: 'Facility-Management / Haustechnik', tipps: ['Kennt vernetzte Gebäudesysteme (Klima, Zugang, Brandmeldeanlage)', 'Weiß, welche Systeme Daten in Hersteller-Clouds senden'] },
      { rolle: 'IT / Netzwerk-Administration', tipps: ['Kennt Netzsegmente, in denen IoT-Geräte eingebunden sind', 'Weiß über Firmware-Update-Prozesse und Absicherungsmaßnahmen Bescheid'] },
    ],
  },
  raeume: {
    intro:
      'Für den Informationsverbund relevante Räume (Serverraum, Technikraum, Büros mit besonderer Bedeutung).',
    bsiWhy:
      'Räume sind die infrastrukturelle Schicht. Zutrittsschutz und Umgebungsbedingungen (Klima, Brand) sind grundschutzrelevant.',
    cloudWhy:
      'Serverräume mit hohem Erhaltungsaufwand (Klima, USV, Wartung) sind ein wirtschaftliches Argument für die Cloud-Migration („Rechenzentrum verkleinern/auflösen").',
    interviewQuestions: [
      'Wo stehen IT-Systeme (Serverraum, Technikräume)?',
      'Wie sind Zutritt, Klima, USV und Brandschutz geregelt?',
    ],
    ansprechpartner: 'Facility-Management, IT-Leitung',
    wenFragen: [
      { rolle: 'Facility-Management', tipps: ['Kennt alle relevanten Räume und deren Sicherheitsausstattung', 'Weiß über Klimatisierung, USV und Brandschutzeinrichtungen Bescheid'] },
      { rolle: 'IT-Leitung', tipps: ['Kennt RZ-/Serverraum-Kapazitäten und Auslastung', 'Kann Betriebskosten für den Serverraum / das eigene RZ benennen'] },
    ],
  },
  gebaeude: {
    intro:
      'Gebäude/Standorte, die für den Informationsverbund relevant sind.',
    bsiWhy:
      'Gebäude bilden den äußeren infrastrukturellen Rahmen (Standortsicherheit, bauliche Maßnahmen) und sind für Standort-Risiken relevant.',
    cloudWhy:
      'Die Standortstruktur (Anzahl, Verteilung) zeigt das Potenzial für Standort-Konsolidierung und die Anbindungsplanung für Cloud-Dienste.',
    interviewQuestions: [
      'Welche Standorte/Gebäude gibt es?',
      'Welche beherbergen IT-Infrastruktur?',
    ],
    ansprechpartner: 'Facility-Management, Geschäftsführung',
    wenFragen: [
      { rolle: 'Facility-Management', tipps: ['Vollständige Übersicht aller Standorte und Gebäude mit IT-Relevanz', 'Kennt bauliche Sicherheitsmaßnahmen und Zutrittskonzepte'] },
      { rolle: 'Geschäftsführung', tipps: ['Kennt strategische Standortplanung und etwaige Konsolidierungspläne', 'Weiß über Mietverträge, Eigentumsrechte und Expansion Bescheid'] },
    ],
  },
};
for (const cat of CATEGORIES) {
  cat.help = HELP[cat.key];
}

export const CATEGORY_MAP: Record<CategoryKey, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c])
) as Record<CategoryKey, CategoryDef>;
