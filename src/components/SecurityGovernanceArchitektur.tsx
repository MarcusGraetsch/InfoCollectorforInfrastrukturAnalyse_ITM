import React, { useMemo } from 'react';
import type { AppState } from '../types';
import { assessAll } from '../cloudReadiness';

interface Props { state: AppState }

interface Empfehlung {
  titel: string;
  beschreibung: string;
  prioritaet: 'Pflicht' | 'Empfohlen' | 'Optional';
  bereich: string;
}

function buildEmpfehlungen(state: AppState): Empfehlung[] {
  const result: Empfehlung[] = [];
  const alle = assessAll(state);

  const anzahlSysteme = alle.length;
  const hochSchutzbedarf = [...state.anwendungen, ...state.server].filter(s => s.schutzbedarf === 'Hoch' || s.schutzbedarf === 'Sehr hoch').length;
  const sehrHoch = [...state.anwendungen, ...state.server].filter(s => s.schutzbedarf === 'Sehr hoch').length;
const bsiC5 = [...state.anwendungen, ...state.server].filter(s => s.datensouveraenitaet === 'Streng souverän (C5 / Gaia-X)' || s.datensouveraenitaet === 'Confidential Computing (TEE / Enclave)').length;
  const dsgvo = [...state.anwendungen, ...state.server].filter(s => s.datensouveraenitaet === 'EU / DSGVO' || s.datensouveraenitaet === 'Deutschland').length;
  const keinCloud = [...state.anwendungen, ...state.server].filter(s => s.lizenzCloudfaehig === 'Nein').length;
  const hatICS = state.icsSysteme.length > 0;
  const hatIoT = state.iotSysteme.length > 0;

  // IAM
  result.push({
    bereich: 'Identität & Zugriff (IAM)',
    titel: 'Zero-Trust Identity Management',
    beschreibung: `Für ${anzahlSysteme} Systeme empfiehlt sich eine zentrale IAM-Plattform (z.B. Azure Active Directory / Entra ID, AWS IAM Identity Center). Prinzip der minimalen Berechtigungen (Least Privilege), MFA für alle Benutzer, privilegierte Konten per PAM verwalten.`,
    prioritaet: 'Pflicht',
  });

  if (hochSchutzbedarf > 0) {
    result.push({
      bereich: 'Identität & Zugriff (IAM)',
      titel: 'Privileged Access Management (PAM)',
      beschreibung: `${hochSchutzbedarf} System${hochSchutzbedarf !== 1 ? 'e' : ''} mit hohem oder sehr hohem Schutzbedarf erfordern dediziertes PAM für Admin-Zugriffe. Just-in-Time Access, Session-Recording und automatische Passwort-Rotation sind zu implementieren.`,
      prioritaet: 'Pflicht',
    });
  }

  // Netzwerksegmentierung
  result.push({
    bereich: 'Netzwerk & Perimeter',
    titel: 'Netzwerksegmentierung & VPC-Design',
    beschreibung: 'Getrennte Netzwerksegmente (Virtual Private Cloud/VNet) für Produktion, Entwicklung und Management. Network Security Groups / Security Group Rules nach Whitelist-Prinzip. Private Endpoints für Datenbankzugriffe — kein direkter Internet-Zugang von Daten-Ebene.',
    prioritaet: 'Pflicht',
  });

  if (hatICS || hatIoT) {
    result.push({
      bereich: 'Netzwerk & Perimeter',
      titel: 'OT/IoT-Netzwerktrennung',
      beschreibung: `${hatICS ? state.icsSysteme.length + ' ICS/OT-Systeme' : ''}${hatICS && hatIoT ? ' und ' : ''}${hatIoT ? state.iotSysteme.length + ' IoT-Systeme' : ''} müssen in isolierten DMZ-Segmenten betrieben werden. Air-Gap oder Datendiode für kritische OT-Bereiche prüfen.`,
      prioritaet: 'Pflicht',
    });
  }

  // DSGVO / Datenschutz
  if (dsgvo > 0) {
    result.push({
      bereich: 'Datenschutz & Compliance',
      titel: 'DSGVO-konforme Datenverarbeitung',
      beschreibung: `${dsgvo} System${dsgvo !== 1 ? 'e' : ''} mit EU-DSGVO-Anforderungen: Datenverarbeitung ausschließlich in EU-Rechenzentren, Auftragsverarbeitungsverträge (AVV) mit allen Cloud-Anbietern, Datenschutz-Folgenabschätzung (DSFA) für kritische Anwendungen.`,
      prioritaet: 'Pflicht',
    });
  }

  if (bsiC5 > 0) {
    result.push({
      bereich: 'Datenschutz & Compliance',
      titel: 'BSI C5-Zertifizierung & Gaia-X',
      beschreibung: `${bsiC5} System${bsiC5 !== 1 ? 'e' : ''} erfordern BSI C5-zertifizierte Cloud-Anbieter. In Deutschland: Deutsche Telekom Open Telekom Cloud, Bundescloud, OVHcloud. Alternativ: Confidential Computing (Azure Confidential, AWS Nitro Enclaves) für höchste Anforderungen.`,
      prioritaet: 'Pflicht',
    });
  }

  if (sehrHoch > 0) {
    result.push({
      bereich: 'Datenschutz & Compliance',
      titel: 'Datenverschlüsselung (at-rest & in-transit)',
      beschreibung: `${sehrHoch} System${sehrHoch !== 1 ? 'e' : ''} mit sehr hohem Schutzbedarf erfordern durchgängige Verschlüsselung. Customer Managed Keys (CMK/BYOK), TLS 1.2+ für alle Übertragungen, verschlüsselte Backups, Key Management Service (KMS) mit Hardware Security Module (HSM).`,
      prioritaet: 'Pflicht',
    });
  }

  // Governance
  result.push({
    bereich: 'Cloud Governance',
    titel: 'Landing Zone & Cloud Governance Framework',
    beschreibung: 'Einrichtung einer Cloud Landing Zone mit definierten Guardrails: Azure Policy / AWS Control Tower / GCP Organization Policy. Separierung per Subscription/Account nach Umgebung (Prod/Dev/Test). Tagging-Strategie für Kostenzuordnung.',
    prioritaet: 'Pflicht',
  });

  result.push({
    bereich: 'Cloud Governance',
    titel: 'Security Monitoring & SIEM',
    beschreibung: 'Zentrales Security Information and Event Management (SIEM) für alle Cloud-Ressourcen. Cloud-native: Microsoft Sentinel, AWS Security Hub, Google Chronicle. Alerting für kritische Ereignisse (unbekannte IP-Zugriffe, privilege escalation, Datenexfiltration).',
    prioritaet: 'Empfohlen',
  });

  if (keinCloud > 0) {
    result.push({
      bereich: 'Cloud Governance',
      titel: 'Hybrid-Security für On-Premises-Verbleib',
      beschreibung: `${keinCloud} Anwendung${keinCloud !== 1 ? 'en' : ''} verbleiben aufgrund von Lizenzrestriktionen On-Premises. Für diese empfiehlt sich eine Zero-Trust-Erweiterung (ZTNA/SASE) statt klassischer VPN-Lösung sowie einheitliche Sicherheitsrichtlinien über Hybrid-Management-Plattformen.`,
      prioritaet: 'Empfohlen',
    });
  }

  result.push({
    bereich: 'Betrieb & Notfallmanagement',
    titel: 'Security Incident Response Plan',
    beschreibung: 'Cloud-spezifischer Incident-Response-Plan: Kontakte zu Cloud-Anbieter-Security-Teams (z.B. AWS Support, Azure Security Center), Runbooks für häufige Szenarien (Datenpanne, Ransomware, Account Compromise), regelmäßige IR-Übungen.',
    prioritaet: 'Empfohlen',
  });

  result.push({
    bereich: 'Betrieb & Notfallmanagement',
    titel: 'Vulnerability Management & Patch-Prozess',
    beschreibung: 'Automatisiertes Schwachstellen-Scanning (AWS Inspector, Azure Defender, Qualys). Patch-Zyklen: kritisch ≤ 24h, hoch ≤ 7 Tage, mittel ≤ 30 Tage. Container-Images in Registry scannen (Trivy, Snyk).',
    prioritaet: 'Empfohlen',
  });

  result.push({
    bereich: 'Entwicklung & DevSecOps',
    titel: 'Infrastructure-as-Code & Drift-Detection',
    beschreibung: 'Cloud-Infrastruktur ausschließlich über IaC (Terraform, Bicep, CloudFormation) provisionieren. Manuelle Änderungen unterbinden (Config Rule / Policy). Drift-Detection automatisch bei jeder Deployment-Pipeline ausführen.',
    prioritaet: 'Optional',
  });

  return result;
}

const PRIO_COLORS: Record<string, string> = {
  'Pflicht':    'bg-red-100 text-red-800 border-red-200',
  'Empfohlen':  'bg-amber-100 text-amber-800 border-amber-200',
  'Optional':   'bg-blue-50 text-blue-700 border-blue-200',
};

const BEREICHE_ORDER = ['Identität & Zugriff (IAM)', 'Netzwerk & Perimeter', 'Datenschutz & Compliance', 'Cloud Governance', 'Betrieb & Notfallmanagement', 'Entwicklung & DevSecOps'];

export const SecurityGovernanceArchitektur: React.FC<Props> = ({ state }) => {
  const empfehlungen = useMemo(() => buildEmpfehlungen(state), [state]);

  const grouped = useMemo(() => {
    return BEREICHE_ORDER.map(b => ({ bereich: b, items: empfehlungen.filter(e => e.bereich === b) })).filter(g => g.items.length > 0);
  }, [empfehlungen]);

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
    win.document.write(`<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">
      <title>Security- und Governance-Architektur — ${state.customerName || 'Kunde'}</title>
      <style>body{font-family:Arial,sans-serif;margin:32px;font-size:11px;color:#1a1a2e}h1{font-size:18px}h2{font-size:13px;margin-top:20px;color:#1a1a2e;border-bottom:1px solid #e5e7eb;padding-bottom:4px}h3{font-size:11px;margin:12px 0 4px;font-weight:700}.pflicht{color:#dc2626}.empfohlen{color:#d97706}.optional{color:#2563eb}.item{margin-bottom:12px;padding:8px;border-left:3px solid #e5e7eb}p{margin:2px 0 6px;color:#374151}</style>
      </head><body>
      <h1>Vorschlag Security- und Governance-Architektur (LG 9)</h1>
      <p>Kunde: <strong>${state.customerName || '–'}</strong> · Stand: ${today} · ${empfehlungen.length} Empfehlungen</p>
      ${grouped.map(g => `<h2>${g.bereich}</h2>${g.items.map(e => `<div class="item"><h3 class="${e.prioritaet.toLowerCase()}">[${e.prioritaet}] ${e.titel}</h3><p>${e.beschreibung}</p></div>`).join('')}`).join('')}
      </body></html>`);
    win.document.close();
    win.print();
  };

  const pflicht    = empfehlungen.filter(e => e.prioritaet === 'Pflicht').length;
  const empfohlen  = empfehlungen.filter(e => e.prioritaet === 'Empfohlen').length;

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-hi-navy mb-1">Security- & Governance-Architektur (LG 9)</h2>
          <p className="text-sm text-gray-500">Automatisch abgeleitete Empfehlungen aus der Infrastruktur-Analyse</p>
        </div>
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-hi-navy text-white rounded-lg text-sm font-medium hover:bg-hi-navy/90 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Drucken / PDF
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <span className="text-xs px-3 py-1.5 bg-red-100 text-red-800 border border-red-200 rounded-full font-medium">{pflicht} Pflicht-Maßnahmen</span>
        <span className="text-xs px-3 py-1.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-full font-medium">{empfohlen} Empfehlungen</span>
        <span className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-medium">{empfehlungen.length - pflicht - empfohlen} Optional</span>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800">
        <strong>Hinweis:</strong> Diese Empfehlungen werden automatisch aus den erfassten Infrastruktur-Daten abgeleitet (Schutzbedarf, Datensouveränität, Bereitstellung, ICS/IoT-Systeme). Sie ersetzen keine individuelle Sicherheitsarchitektur, bilden aber eine valide Ausgangsbasis für den LG-9-Workshop.
      </div>

      <div className="space-y-6">
        {grouped.map(group => (
          <div key={group.bereich}>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{group.bereich}</h3>
            <div className="space-y-3">
              {group.items.map((e, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 mt-0.5 ${PRIO_COLORS[e.prioritaet]}`}>{e.prioritaet}</span>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-1">{e.titel}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{e.beschreibung}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
