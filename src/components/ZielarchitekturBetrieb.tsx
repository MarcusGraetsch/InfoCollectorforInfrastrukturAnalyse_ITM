import React, { useMemo } from 'react';
import type { AppState } from '../types';

interface Props { state: AppState }

interface SystemEmpfehlung {
  kuerzel: string;
  name: string;
  kategorie: string;
  cloudEignung: string;
  bereitstellung: string;
  deploymentZiel: string;
  backupStrategie: string;
  rto: string;
  rpo: string;
  besonderheit: string;
  schutzbedarf: string;
}

function deriveDeployment(item: { bereitstellung?: string; cloudEignung?: string; schutzbedarf?: string }): string {
  const e = item.cloudEignung || '';
  const b = item.bereitstellung || '';
  if (e.includes('Rehost'))          return 'IaaS VM (Lift & Shift)';
  if (e.includes('Replatform'))      return 'PaaS / Managed Service';
  if (e.includes('Recontainerize'))  return 'Container (Kubernetes)';
  if (e.includes('Repurchase'))      return 'SaaS-Alternative';
  if (e.includes('Refactor'))        return 'Cloud-native (PaaS/FaaS)';
  if (e.includes('Retain'))          return 'On-Premises verbleiben';
  if (e.includes('Retire'))          return 'Abschalten';
  if (b.includes('SaaS'))            return 'SaaS (bereits Cloud)';
  if (b.includes('Container'))       return 'Container (bereits)';
  if (b.includes('Kubernetes'))      return 'Kubernetes (bereits)';
  return 'Noch nicht definiert';
}

function deriveRTO(schutzbedarf?: string, cloudEignung?: string): string {
  if (cloudEignung?.includes('Retain') || cloudEignung?.includes('Retire')) return '–';
  if (schutzbedarf === 'Sehr hoch') return '< 1 Stunde';
  if (schutzbedarf === 'Hoch')      return '< 4 Stunden';
  return '< 24 Stunden';
}

function deriveRPO(schutzbedarf?: string, cloudEignung?: string): string {
  if (cloudEignung?.includes('Retain') || cloudEignung?.includes('Retire')) return '–';
  if (schutzbedarf === 'Sehr hoch') return '< 15 Minuten';
  if (schutzbedarf === 'Hoch')      return '< 1 Stunde';
  return '< 24 Stunden';
}

function deriveBackup(schutzbedarf?: string, cloudEignung?: string, bereitstellung?: string): string {
  if (cloudEignung?.includes('Retire')) return 'Entfällt';
  if (cloudEignung?.includes('Retain') || bereitstellung?.includes('On-Premises')) return 'Bestehende On-Prem-Strategie beibehalten';
  if (schutzbedarf === 'Sehr hoch') return 'Geo-redundant, stündlich, Immutable Backup (WORM)';
  if (schutzbedarf === 'Hoch')      return 'Geo-redundant, täglich, 90 Tage Aufbewahrung';
  return 'Snapshot täglich, 30 Tage Aufbewahrung';
}

function buildSystemEmpfehlungen(state: AppState): SystemEmpfehlung[] {
  const result: SystemEmpfehlung[] = [];
  const cats = [
    { key: 'anwendungen', label: 'Anwendung' },
    { key: 'server',      label: 'Server' },
  ] as const;

  for (const cat of cats) {
    const items = state[cat.key] as { id: string; kuerzel: string; name: string; cloudEignung?: string; bereitstellung?: string; schutzbedarf?: string }[];
    for (const item of items) {
      const deployment = deriveDeployment(item);
      let besonderheit = '';
      if (item.schutzbedarf === 'Sehr hoch') besonderheit = 'Confidential Computing prüfen';
      else if (item.cloudEignung?.includes('Refactor')) besonderheit = 'Erheblicher Entwicklungsaufwand';
      else if (item.cloudEignung?.includes('Repurchase')) besonderheit = 'Datenmigration + User-Schulung erforderlich';
      else if (item.cloudEignung?.includes('Retain')) besonderheit = 'Hybrid-Connectivity (VPN/ExpressRoute)';

      result.push({
        kuerzel: item.kuerzel,
        name: item.name,
        kategorie: cat.label,
        cloudEignung: item.cloudEignung || '–',
        bereitstellung: item.bereitstellung || '–',
        deploymentZiel: deployment,
        backupStrategie: deriveBackup(item.schutzbedarf, item.cloudEignung, item.bereitstellung),
        rto: deriveRTO(item.schutzbedarf, item.cloudEignung),
        rpo: deriveRPO(item.schutzbedarf, item.cloudEignung),
        besonderheit,
        schutzbedarf: item.schutzbedarf || '–',
      });
    }
  }
  return result;
}

const SCHUTZBEDARF_DOT: Record<string, string> = {
  'Sehr hoch': 'bg-red-500',
  'Hoch':      'bg-amber-500',
  'Normal':    'bg-green-500',
  '–':         'bg-gray-300',
};

export const ZielarchitekturBetrieb: React.FC<Props> = ({ state }) => {
  const systemEmpfehlungen = useMemo(() => buildSystemEmpfehlungen(state), [state]);

  const stats = useMemo(() => {
    const deploy = systemEmpfehlungen.map(s => s.deploymentZiel);
    return {
      iaaS: deploy.filter(d => d.includes('IaaS')).length,
      paaS: deploy.filter(d => d.includes('PaaS') || d.includes('Container') || d.includes('Kubernetes')).length,
      saaS: deploy.filter(d => d.includes('SaaS')).length,
      retain: deploy.filter(d => d.includes('On-Premises')).length,
      retire: deploy.filter(d => d.includes('Abschalten')).length,
    };
  }, [systemEmpfehlungen]);

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
    win.document.write(`<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">
      <title>Zielarchitektur — ${state.customerName || 'Kunde'}</title>
      <style>body{font-family:Arial,sans-serif;margin:32px;font-size:10px;color:#1a1a2e}h1{font-size:16px}h2{font-size:12px;margin-top:16px;border-bottom:1px solid #e5e7eb;padding-bottom:4px}table{width:100%;border-collapse:collapse;margin-bottom:12px}th{background:#1a1a2e;color:white;padding:4px 6px;text-align:left;font-size:9px}td{padding:4px 6px;border-bottom:1px solid #f0f0f0;vertical-align:top}tr:nth-child(even){background:#f9fafb}.hoch{color:#d97706;font-weight:600}.sehr-hoch{color:#dc2626;font-weight:700}</style>
      </head><body>
      <h1>Zielarchitektur Betriebs-, Backup- und Recovery-Konzept (LG 10)</h1>
      <p>Kunde: <strong>${state.customerName || '–'}</strong> · Stand: ${today}</p>
      <h2>Systemübersicht mit Deployment-Zielen</h2>
      <table><thead><tr><th>Kürzel</th><th>System</th><th>Kat.</th><th>Schutzbedarf</th><th>Deployment-Ziel</th><th>Backup-Strategie</th><th>RTO</th><th>RPO</th><th>Besonderheit</th></tr></thead><tbody>
      ${systemEmpfehlungen.map(s => `<tr><td>${s.kuerzel}</td><td>${s.name}</td><td>${s.kategorie}</td><td class="${s.schutzbedarf==='Sehr hoch'?'sehr-hoch':s.schutzbedarf==='Hoch'?'hoch':''}">${s.schutzbedarf}</td><td>${s.deploymentZiel}</td><td>${s.backupStrategie}</td><td>${s.rto}</td><td>${s.rpo}</td><td>${s.besonderheit||'–'}</td></tr>`).join('')}
      </tbody></table>
      <h2>Grundsätze Betriebskonzept</h2>
      <p>IaC-gestütztes Deployment (Terraform/Bicep), Blue-Green oder Rolling Updates, Monitoring via Cloud-native Tools (CloudWatch, Azure Monitor, GCP Operations). Automatische Skalierung (Autoscaling Groups / HPA in Kubernetes). Health-Checks und Circuit-Breaker für kritische Pfade.</p>
      </body></html>`);
    win.document.close();
    win.print();
  };

  if (systemEmpfehlungen.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-hi-navy mb-1">Zielarchitektur Betrieb / Backup / Recovery (LG 10)</h2>
        <div className="mt-8 text-center text-gray-400 py-12 border-2 border-dashed border-gray-200 rounded-xl">
          Keine Anwendungen oder Server mit Cloud-Migrations-Strategie erfasst.<br/>Bitte zuerst Cloud-Readiness-Assessment in der Infrastruktur-Analyse abschließen.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-hi-navy mb-1">Zielarchitektur Betrieb / Backup / Recovery (LG 10)</h2>
          <p className="text-sm text-gray-500">Abgeleitet aus Cloud-Readiness-Scores und Migrationsstrategien</p>
        </div>
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-hi-navy text-white rounded-lg text-sm font-medium hover:bg-hi-navy/90 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Drucken / PDF
        </button>
      </div>

      {/* Deployment-Verteilung */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'IaaS (VM)', value: stats.iaaS, color: 'bg-blue-100 text-blue-800' },
          { label: 'PaaS / Container', value: stats.paaS, color: 'bg-cyan-100 text-cyan-800' },
          { label: 'SaaS', value: stats.saaS, color: 'bg-teal-100 text-teal-800' },
          { label: 'Retain (On-Prem)', value: stats.retain, color: 'bg-gray-100 text-gray-700' },
          { label: 'Retire', value: stats.retire, color: 'bg-red-100 text-red-700' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm text-center">
            <div className={`text-xl font-bold ${s.color.split(' ')[1]}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Systemtabelle */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-hi-navy text-white">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium">Kürzel</th>
                <th className="px-3 py-2.5 text-left font-medium">System</th>
                <th className="px-3 py-2.5 text-left font-medium w-20">Schutz</th>
                <th className="px-3 py-2.5 text-left font-medium">Deployment-Ziel</th>
                <th className="px-3 py-2.5 text-left font-medium">Backup-Strategie</th>
                <th className="px-3 py-2.5 text-center font-medium w-20">RTO</th>
                <th className="px-3 py-2.5 text-center font-medium w-20">RPO</th>
                <th className="px-3 py-2.5 text-left font-medium">Besonderheit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {systemEmpfehlungen.map((s, i) => {
                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-gray-500">{s.kuerzel}</td>
                    <td className="px-3 py-2 font-medium text-gray-800">{s.name}</td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${SCHUTZBEDARF_DOT[s.schutzbedarf] || 'bg-gray-300'}`} />
                        <span className="text-gray-600">{s.schutzbedarf}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-700 font-medium">{s.deploymentZiel}</td>
                    <td className="px-3 py-2 text-gray-600">{s.backupStrategie}</td>
                    <td className="px-3 py-2 text-center text-gray-600">{s.rto}</td>
                    <td className="px-3 py-2 text-center text-gray-600">{s.rpo}</td>
                    <td className="px-3 py-2 text-gray-500 italic">{s.besonderheit || '–'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Betriebsgrundsätze */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { titel: 'Deployment & Updates', text: 'Infrastructure-as-Code (Terraform/Bicep/CloudFormation) als Standard. Blue-Green oder Rolling Updates für Zero-Downtime-Deployments. Feature Flags für kontrollierte Rollouts.' },
          { titel: 'Monitoring & Observability', text: 'Cloud-native Monitoring: Azure Monitor, AWS CloudWatch, GCP Operations. Zentrales Dashboard für Verfügbarkeit aller Systeme. Alerting bei RTO-kritischen Ausfällen.' },
          { titel: 'Skalierung & Kapazität', text: 'Automatische Skalierung (Autoscaling Groups, Kubernetes HPA/VPA). Kapazitätsplanung quartalsweise. Reserved Instances für Baseline-Last, Spot/Preemptible für Spitzen.' },
          { titel: 'Disaster Recovery', text: 'DR-Tests mindestens jährlich, kritische Systeme halbjährlich. Backup-Wiederherstellung monatlich testen. Runbooks für alle kritischen Ausfallszenarien dokumentiert.' },
        ].map(p => (
          <div key={p.titel} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">{p.titel}</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{p.text}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400">
        RTO = Recovery Time Objective (maximale Ausfallzeit) · RPO = Recovery Point Objective (maximaler Datenverlust) · Abgeleitet aus Schutzbedarf und Migrationsstrategie — bitte im Workshop validieren.
      </p>
    </div>
  );
};
