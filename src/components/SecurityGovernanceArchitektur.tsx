import React, { useMemo, useState, useEffect } from 'react';
import type { AppState } from '../types';
import { getEffektiverSchutzbedarf } from '../schutzbedarfsVererbung';
import { assessAll } from '../cloudReadiness';

interface Props { state: AppState; onOpenCloudWizard: (id: string) => void }

type MassnahmeStatus = 'Offen' | 'Geplant' | 'Umgesetzt';
const LS_STATUS  = 'it-sa-security-status';
const LS_DETAILS = 'it-sa-security-details';

interface MassnahmeDetails { notiz: string; verantwortlicher: string; termin: string; }

function loadStatus(): Record<string, MassnahmeStatus> {
  try { return JSON.parse(localStorage.getItem(LS_STATUS) ?? '{}'); } catch { return {}; }
}
function saveStatus(s: Record<string, MassnahmeStatus>) {
  localStorage.setItem(LS_STATUS, JSON.stringify(s));
}
function loadDetails(): Record<string, MassnahmeDetails> {
  try { return JSON.parse(localStorage.getItem(LS_DETAILS) ?? '{}'); } catch { return {}; }
}
function saveDetails(d: Record<string, MassnahmeDetails>) {
  localStorage.setItem(LS_DETAILS, JSON.stringify(d));
}

interface BetroffenesSystem { id: string; kuerzel: string; name: string; }

interface Empfehlung {
  titel: string;
  beschreibung: string;
  prioritaet: 'Pflicht' | 'Empfohlen' | 'Optional';
  bereich: string;
  betroffeneSysteme?: BetroffenesSystem[];
}

function toSys(item: { id: string; kuerzel: string; name: string }): BetroffenesSystem {
  return { id: item.id, kuerzel: item.kuerzel, name: item.name };
}

function buildEmpfehlungen(state: AppState): Empfehlung[] {
  const result: Empfehlung[] = [];
  const alle = assessAll(state);
  const alleSys = [...state.anwendungen, ...state.server];

  const anzahlSysteme = alle.length;
  const hochSchutzItems = alleSys.filter(s => { const e = getEffektiverSchutzbedarf(s); return e === 'Hoch' || e === 'Sehr hoch'; });
  const sehrHochItems   = alleSys.filter(s => getEffektiverSchutzbedarf(s) === 'Sehr hoch');
  const bsiC5Items      = alleSys.filter(s => s.datensouveraenitaet === 'Streng souverän (C5 / Gaia-X)' || s.datensouveraenitaet === 'Confidential Computing (TEE / Enclave)');
  const dsgvoItems      = alleSys.filter(s => s.datensouveraenitaet === 'EU / DSGVO' || s.datensouveraenitaet === 'Deutschland');
  const keinCloudItems  = alleSys.filter(s => s.lizenzCloudfaehig === 'Nein');
  const hochSchutzbedarf = hochSchutzItems.length;
  const sehrHoch         = sehrHochItems.length;
  const bsiC5            = bsiC5Items.length;
  const dsgvo            = dsgvoItems.length;
  const keinCloud        = keinCloudItems.length;
  const hatICS = state.icsSysteme.length > 0;
  const hatIoT = state.iotSysteme.length > 0;

  // IAM
  result.push({
    bereich: 'Identität & Zugriff (IAM)',
    titel: 'Zero-Trust Identity Management',
    beschreibung: `Für ${anzahlSysteme} Systeme empfiehlt sich eine zentrale IAM-Plattform (z.B. Azure Active Directory / Entra ID, AWS IAM Identity Center). Prinzip der minimalen Berechtigungen (Least Privilege), MFA für alle Benutzer, privilegierte Konten per PAM verwalten.`,
    prioritaet: 'Pflicht',
    betroffeneSysteme: alleSys.map(toSys),
  });

  if (hochSchutzbedarf > 0) {
    result.push({
      bereich: 'Identität & Zugriff (IAM)',
      titel: 'Privileged Access Management (PAM)',
      beschreibung: `${hochSchutzbedarf} System${hochSchutzbedarf !== 1 ? 'e' : ''} mit hohem oder sehr hohem Schutzbedarf erfordern dediziertes PAM für Admin-Zugriffe. Just-in-Time Access, Session-Recording und automatische Passwort-Rotation sind zu implementieren.`,
      prioritaet: 'Pflicht',
      betroffeneSysteme: hochSchutzItems.map(toSys),
    });
  }

  // Netzwerksegmentierung
  result.push({
    bereich: 'Netzwerk & Perimeter',
    titel: 'Netzwerksegmentierung & VPC-Design',
    beschreibung: 'Getrennte Netzwerksegmente (Virtual Private Cloud/VNet) für Produktion, Entwicklung und Management. Network Security Groups / Security Group Rules nach Whitelist-Prinzip. Private Endpoints für Datenbankzugriffe — kein direkter Internet-Zugang von Daten-Ebene.',
    prioritaet: 'Pflicht',
    betroffeneSysteme: alleSys.map(toSys),
  });

  if (hatICS || hatIoT) {
    result.push({
      bereich: 'Netzwerk & Perimeter',
      titel: 'OT/IoT-Netzwerktrennung',
      beschreibung: `${hatICS ? state.icsSysteme.length + ' ICS/OT-Systeme' : ''}${hatICS && hatIoT ? ' und ' : ''}${hatIoT ? state.iotSysteme.length + ' IoT-Systeme' : ''} müssen in isolierten DMZ-Segmenten betrieben werden. Air-Gap oder Datendiode für kritische OT-Bereiche prüfen.`,
      prioritaet: 'Pflicht',
      betroffeneSysteme: [
        ...state.icsSysteme.map(s => ({ id: s.id, kuerzel: s.kuerzel, name: s.name })),
        ...state.iotSysteme.map(s => ({ id: s.id, kuerzel: s.kuerzel, name: s.name })),
      ],
    });
  }

  // DSGVO / Datenschutz
  if (dsgvo > 0) {
    result.push({
      bereich: 'Datenschutz & Compliance',
      titel: 'DSGVO-konforme Datenverarbeitung',
      beschreibung: `${dsgvo} System${dsgvo !== 1 ? 'e' : ''} mit EU-DSGVO-Anforderungen: Datenverarbeitung ausschließlich in EU-Rechenzentren, Auftragsverarbeitungsverträge (AVV) mit allen Cloud-Anbietern, Datenschutz-Folgenabschätzung (DSFA) für kritische Anwendungen.`,
      prioritaet: 'Pflicht',
      betroffeneSysteme: dsgvoItems.map(toSys),
    });
  }

  if (bsiC5 > 0) {
    result.push({
      bereich: 'Datenschutz & Compliance',
      titel: 'BSI C5-Zertifizierung & Gaia-X',
      beschreibung: `${bsiC5} System${bsiC5 !== 1 ? 'e' : ''} erfordern BSI C5-zertifizierte Cloud-Anbieter. In Deutschland: Deutsche Telekom Open Telekom Cloud, Bundescloud, OVHcloud. Alternativ: Confidential Computing (Azure Confidential, AWS Nitro Enclaves) für höchste Anforderungen.`,
      prioritaet: 'Pflicht',
      betroffeneSysteme: bsiC5Items.map(toSys),
    });
  }

  if (sehrHoch > 0) {
    result.push({
      bereich: 'Datenschutz & Compliance',
      titel: 'Datenverschlüsselung (at-rest & in-transit)',
      beschreibung: `${sehrHoch} System${sehrHoch !== 1 ? 'e' : ''} mit sehr hohem Schutzbedarf erfordern durchgängige Verschlüsselung. Customer Managed Keys (CMK/BYOK), TLS 1.2+ für alle Übertragungen, verschlüsselte Backups, Key Management Service (KMS) mit Hardware Security Module (HSM).`,
      prioritaet: 'Pflicht',
      betroffeneSysteme: sehrHochItems.map(toSys),
    });
  }

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
    betroffeneSysteme: alleSys.map(toSys),
  });

  if (keinCloud > 0) {
    result.push({
      bereich: 'Cloud Governance',
      titel: 'Hybrid-Security für On-Premises-Verbleib',
      beschreibung: `${keinCloud} Anwendung${keinCloud !== 1 ? 'en' : ''} verbleiben aufgrund von Lizenzrestriktionen On-Premises. Für diese empfiehlt sich eine Zero-Trust-Erweiterung (ZTNA/SASE) statt klassischer VPN-Lösung sowie einheitliche Sicherheitsrichtlinien über Hybrid-Management-Plattformen.`,
      prioritaet: 'Empfohlen',
      betroffeneSysteme: keinCloudItems.map(toSys),
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
    betroffeneSysteme: alleSys.map(toSys),
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

const STATUS_CYCLE: MassnahmeStatus[] = ['Offen', 'Geplant', 'Umgesetzt'];
const STATUS_STYLES: Record<MassnahmeStatus, string> = {
  'Offen':     'bg-gray-100 text-gray-600 border-gray-300',
  'Geplant':   'bg-amber-100 text-amber-700 border-amber-300',
  'Umgesetzt': 'bg-green-100 text-green-700 border-green-300',
};

export const SecurityGovernanceArchitektur: React.FC<Props> = ({ state, onOpenCloudWizard }) => {
  const empfehlungen = useMemo(() => buildEmpfehlungen(state), [state]);
  const [statusMap,  setStatusMap]  = useState<Record<string, MassnahmeStatus>>(loadStatus);
  const [detailsMap, setDetailsMap] = useState<Record<string, MassnahmeDetails>>(loadDetails);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => { saveStatus(statusMap); },  [statusMap]);
  useEffect(() => { saveDetails(detailsMap); }, [detailsMap]);

  const toggleStatus = (titel: string) => {
    setStatusMap(prev => {
      const current = prev[titel] ?? 'Offen';
      const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length];
      return { ...prev, [titel]: next };
    });
  };

  const updateDetail = (titel: string, field: keyof MassnahmeDetails, value: string) => {
    setDetailsMap(prev => ({
      ...prev,
      [titel]: { ...{ notiz: '', verantwortlicher: '', termin: '' }, ...prev[titel], [field]: value },
    }));
  };

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

      <div className="flex gap-3 flex-wrap items-center">
        <span className="text-xs px-3 py-1.5 bg-red-100 text-red-800 border border-red-200 rounded-full font-medium">{pflicht} Pflicht</span>
        <span className="text-xs px-3 py-1.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-full font-medium">{empfohlen} Empfohlen</span>
        <span className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-medium">{empfehlungen.length - pflicht - empfohlen} Optional</span>
        <span className="text-gray-300">|</span>
        <span className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 border border-gray-300 rounded-full font-medium">
          {empfehlungen.filter(e => (statusMap[e.titel] ?? 'Offen') === 'Offen').length} Offen
        </span>
        <span className="text-xs px-3 py-1.5 bg-amber-100 text-amber-700 border border-amber-300 rounded-full font-medium">
          {empfehlungen.filter(e => statusMap[e.titel] === 'Geplant').length} Geplant
        </span>
        <span className="text-xs px-3 py-1.5 bg-green-100 text-green-700 border border-green-300 rounded-full font-medium">
          {empfehlungen.filter(e => statusMap[e.titel] === 'Umgesetzt').length} Umgesetzt
        </span>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800">
        <strong>Hinweis:</strong> Diese Empfehlungen werden automatisch aus den erfassten Infrastruktur-Daten abgeleitet (Schutzbedarf, Datensouveränität, Bereitstellung, ICS/IoT-Systeme). Sie ersetzen keine individuelle Sicherheitsarchitektur, bilden aber eine valide Ausgangsbasis für den LG-9-Workshop.
      </div>

      <div className="space-y-6">
        {grouped.map(group => (
          <div key={group.bereich}>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{group.bereich}</h3>
            <div className="space-y-3">
              {group.items.map((e, i) => {
                const st = statusMap[e.titel] ?? 'Offen';
                const det = detailsMap[e.titel] ?? { notiz: '', verantwortlicher: '', termin: '' };
                const isExpanded = expandedKey === `${group.bereich}-${i}`;
                const hasDetails = det.notiz || det.verantwortlicher || det.termin;
                return (
                  <div key={i} className={`bg-white border rounded-xl shadow-sm transition-all ${st === 'Umgesetzt' ? 'border-green-200 bg-green-50/20' : 'border-gray-200'}`}>
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 mt-0.5 ${PRIO_COLORS[e.prioritaet]}`}>{e.prioritaet}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <h4 className={`text-sm font-semibold ${st === 'Umgesetzt' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{e.titel}</h4>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                onClick={() => setExpandedKey(isExpanded ? null : `${group.bereich}-${i}`)}
                                className={`text-xs px-2 py-1 rounded-lg border transition-colors ${isExpanded || hasDetails ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-500 border-gray-300 hover:border-gray-400'}`}
                                title="Verantwortlicher, Termin und Notiz"
                              >
                                {hasDetails ? '📋' : '+'} Details
                              </button>
                              <button
                                onClick={() => toggleStatus(e.titel)}
                                title="Klicken: Offen → Geplant → Umgesetzt"
                                className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors cursor-pointer hover:opacity-80 ${STATUS_STYLES[st]}`}
                              >
                                {st === 'Umgesetzt' && '✓ '}{st}
                              </button>
                            </div>
                          </div>
                          <p className={`text-sm leading-relaxed ${st === 'Umgesetzt' ? 'text-gray-400' : 'text-gray-600'}`}>{e.beschreibung}</p>

                          {/* Betroffene Systeme */}
                          {e.betroffeneSysteme && e.betroffeneSysteme.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Betroffene Systeme:</span>
                              {e.betroffeneSysteme.slice(0, 8).map(sys => (
                                <button
                                  key={sys.id}
                                  onClick={() => onOpenCloudWizard(sys.id)}
                                  title={`${sys.name} — Cloud-Felder bearbeiten`}
                                  className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full hover:bg-hi-accent hover:text-white hover:border-hi-accent transition-colors font-mono"
                                >
                                  {sys.kuerzel}
                                </button>
                              ))}
                              {e.betroffeneSysteme.length > 8 && (
                                <span className="text-xs text-gray-400">+{e.betroffeneSysteme.length - 8} weitere</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expandable Details */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Verantwortlich</label>
                            <input
                              type="text"
                              value={det.verantwortlicher}
                              onChange={e2 => updateDetail(e.titel, 'verantwortlicher', e2.target.value)}
                              placeholder="Name / Rolle"
                              className="w-full text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-hi-accent outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Zieldatum</label>
                            <input
                              type="date"
                              value={det.termin}
                              onChange={e2 => updateDetail(e.titel, 'termin', e2.target.value)}
                              className="w-full text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-hi-accent outline-none"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Notiz / Entscheidung</label>
                            <textarea
                              value={det.notiz}
                              onChange={e2 => updateDetail(e.titel, 'notiz', e2.target.value)}
                              rows={2}
                              placeholder="Entscheidung, offene Punkte, Links zu Tickets …"
                              className="w-full text-sm border border-gray-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-hi-accent outline-none resize-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
