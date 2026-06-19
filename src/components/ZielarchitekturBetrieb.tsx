import React, { useMemo, useState } from 'react';
import type { AppState } from '../types';
import { assessSovereignty } from '../cloudReadiness';
import { getEffektiverSchutzbedarf } from '../schutzbedarfsVererbung';
import { esc, openPrintWindow, printHeader, printFooter } from '../utils/safePrint';

interface Props {
  state: AppState;
  onOpenCloudWizard: (id: string) => void;
}

interface SystemEmpfehlung {
  id: string;
  categoryKey: 'anwendungen' | 'server';
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
  sovereignLevel: string;
  sovereignLabel: string;
}

function deriveDeployment(item: { bereitstellung?: string; cloudEignung?: string }): string {
  const e = item.cloudEignung || '';
  const b = item.bereitstellung || '';
  if (e.includes('Rehost'))         return 'IaaS VM (Lift & Shift)';
  if (e.includes('Replatform'))     return 'PaaS / Managed Service';
  if (e.includes('Recontainerize')) return 'Container (Kubernetes)';
  if (e.includes('Repurchase'))     return 'SaaS-Alternative';
  if (e.includes('Refactor'))       return 'Cloud-native (PaaS/FaaS)';
  if (e.includes('Retain'))         return 'On-Premises verbleiben';
  if (e.includes('Retire'))         return 'Abschalten';
  if (b.includes('SaaS'))           return 'SaaS (bereits Cloud)';
  if (b.includes('Container'))      return 'Container (bereits)';
  if (b.includes('Kubernetes'))     return 'Kubernetes (bereits)';
  return 'Noch nicht definiert';
}

function deriveRTO(schutzbedarf?: string, cloudEignung?: string): string {
  if (cloudEignung?.includes('Retain') || cloudEignung?.includes('Retire')) return '–';
  if (schutzbedarf === 'Sehr hoch') return '< 1 h';
  if (schutzbedarf === 'Hoch')      return '< 4 h';
  return '< 24 h';
}

function deriveRPO(schutzbedarf?: string, cloudEignung?: string): string {
  if (cloudEignung?.includes('Retain') || cloudEignung?.includes('Retire')) return '–';
  if (schutzbedarf === 'Sehr hoch') return '< 15 min';
  if (schutzbedarf === 'Hoch')      return '< 1 h';
  return '< 24 h';
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
    { key: 'anwendungen' as const, label: 'Anwendung' },
    { key: 'server'      as const, label: 'Server' },
  ];

  for (const cat of cats) {
    const items = state[cat.key] as import('../types').CloudFields[]  & { id: string; kuerzel: string; name: string; cloudEignung?: string; bereitstellung?: string }[];
    for (const item of items) {
      const deployment = deriveDeployment(item);
      const effSb = getEffektiverSchutzbedarf(item);
      let besonderheit = '';
      if (effSb === 'Sehr hoch') besonderheit = 'Confidential Computing prüfen';
      else if (item.cloudEignung?.includes('Refactor'))    besonderheit = 'Erheblicher Entwicklungsaufwand';
      else if (item.cloudEignung?.includes('Repurchase'))  besonderheit = 'Datenmigration + User-Schulung erforderlich';
      else if (item.cloudEignung?.includes('Retain'))      besonderheit = 'Hybrid-Connectivity (VPN/ExpressRoute)';

      const sovereign = assessSovereignty(item);
      result.push({
        id: item.id,
        categoryKey: cat.key,
        kuerzel: item.kuerzel,
        name: item.name,
        kategorie: cat.label,
        cloudEignung: item.cloudEignung || '–',
        bereitstellung: item.bereitstellung || '–',
        deploymentZiel: deployment,
        backupStrategie: deriveBackup(effSb, item.cloudEignung, item.bereitstellung),
        rto: deriveRTO(effSb, item.cloudEignung),
        rpo: deriveRPO(effSb, item.cloudEignung),
        besonderheit,
        schutzbedarf: effSb || '–',
        sovereignLevel: sovereign.level,
        sovereignLabel: sovereign.label,
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

// Kleines Tooltip-Icon mit Hover-Popup
const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (
  <span className="relative group inline-flex items-center gap-1">
    {children}
    <span className="ml-0.5 cursor-help text-gray-400 hover:text-gray-600">
      <svg className="w-3.5 h-3.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </span>
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 hidden group-hover:block w-72 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 leading-relaxed shadow-xl pointer-events-none">
      {text}
      <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
    </span>
  </span>
);

export const ZielarchitekturBetrieb: React.FC<Props> = ({ state, onOpenCloudWizard }) => {
  const systemEmpfehlungen = useMemo(() => buildSystemEmpfehlungen(state), [state]);
  const [showInfo, setShowInfo] = useState(true);

  const stats = useMemo(() => {
    const deploy = systemEmpfehlungen.map(s => s.deploymentZiel);
    return {
      iaaS:   deploy.filter(d => d.includes('IaaS')).length,
      paaS:   deploy.filter(d => d.includes('PaaS') || d.includes('Container') || d.includes('Kubernetes')).length,
      saaS:   deploy.filter(d => d.includes('SaaS')).length,
      retain: deploy.filter(d => d.includes('On-Premises')).length,
      retire: deploy.filter(d => d.includes('Abschalten')).length,
    };
  }, [systemEmpfehlungen]);

  const handlePrint = () => {
    const body = `${printHeader('Zielarchitektur Betriebs-, Backup- und Recovery-Konzept (LG 10)', state.customerName)}
      <h2>Systemübersicht mit Deployment-Zielen</h2>
      <table><thead><tr><th>Kürzel</th><th>System</th><th>Kat.</th><th>Schutzbedarf</th><th>Deployment-Ziel</th><th>Backup-Strategie</th><th>RTO</th><th>RPO</th><th>Besonderheit</th></tr></thead><tbody>
      ${systemEmpfehlungen.map(s => `<tr><td>${esc(s.kuerzel)}</td><td>${esc(s.name)}</td><td>${esc(s.kategorie)}</td><td style="color:${s.schutzbedarf==='Sehr hoch'?'#dc2626':s.schutzbedarf==='Hoch'?'#d97706':'inherit'};font-weight:${s.schutzbedarf==='Sehr hoch'?'700':s.schutzbedarf==='Hoch'?'600':'normal'}">${esc(s.schutzbedarf)}</td><td>${esc(s.deploymentZiel)}</td><td>${esc(s.backupStrategie)}</td><td>${esc(s.rto)}</td><td>${esc(s.rpo)}</td><td>${esc(s.besonderheit||'–')}</td></tr>`).join('')}
      </tbody></table>
      <h2>Grundsätze Betriebskonzept</h2>
      <p>IaC-gestütztes Deployment (Terraform/Bicep), Blue-Green oder Rolling Updates, Monitoring via Cloud-native Tools (CloudWatch, Azure Monitor, GCP Operations). Automatische Skalierung (Autoscaling Groups / HPA in Kubernetes). Health-Checks und Circuit-Breaker für kritische Pfade.</p>
      ${printFooter()}`;
    openPrintWindow(`Zielarchitektur — ${state.customerName || 'Kunde'}`, body,
      'h2{font-size:12px;margin-top:16px;border-bottom:1px solid #e5e7eb;padding-bottom:4px}');
  };

  if (systemEmpfehlungen.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-hi-navy mb-1">Zielarchitektur Betrieb / Backup / Recovery (LG 10)</h2>
        <div className="mt-8 text-center text-gray-400 py-12 border-2 border-dashed border-gray-200 rounded-xl">
          Keine Anwendungen oder Server mit Cloud-Migrations-Strategie erfasst.<br/>
          Bitte zuerst Cloud-Readiness-Assessment in der Infrastruktur-Analyse abschließen.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-hi-navy mb-1">Zielarchitektur Betrieb / Backup / Recovery (LG 10)</h2>
          <p className="text-sm text-gray-500">Abgeleitet aus Cloud-Readiness-Assessment — Zeile klicken zum Bearbeiten</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowInfo(s => !s)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {showInfo ? 'Hinweis ausblenden' : 'Wie ändere ich Werte?'}
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-hi-navy text-white rounded-lg text-sm font-medium hover:bg-hi-navy/90 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Drucken / PDF
          </button>
        </div>
      </div>

      {showInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-blue-800">So funktioniert diese Tabelle — und so änderst du Werte:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-blue-800">
            <div className="space-y-1">
              <p><strong>Deployment-Ziel</strong> ergibt sich aus dem Feld <em>„Cloud-Eignung / Migrationsstrategie"</em> des Systems (z.B. Rehost → IaaS VM). Klicke auf eine Tabellenzeile um dieses Feld zu ändern.</p>
              <p><strong>Backup-Strategie, RTO, RPO</strong> werden aus dem <em>„Schutzbedarf"</em> abgeleitet. Schutzbedarf ändern → alle drei Werte aktualisieren sich automatisch.</p>
            </div>
            <div className="space-y-1">
              <p><strong>Besonderheit</strong> = automatisch abgeleiteter Hinweis basierend auf Schutzbedarf + Migrationsstrategie. Z.B.: Sehr hoch → Confidential Computing prüfen; Refactor → Entwicklungsaufwand.</p>
              <p><strong>Klicke eine Zeile an</strong> um den Cloud-Readiness-Editor für dieses System zu öffnen und dort Migrationsstrategie, Schutzbedarf und weitere Felder direkt zu bearbeiten.</p>
            </div>
          </div>
        </div>
      )}

      {/* Deployment-Verteilung */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'IaaS (VM)', value: stats.iaaS, color: 'text-blue-700' },
          { label: 'PaaS / Container', value: stats.paaS, color: 'text-cyan-700' },
          { label: 'SaaS', value: stats.saaS, color: 'text-teal-700' },
          { label: 'Retain (On-Prem)', value: stats.retain, color: 'text-gray-700' },
          { label: 'Retire', value: stats.retire, color: 'text-red-700' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm text-center">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
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
                <th className="px-3 py-2.5 text-left font-medium">
                  Deployment-Ziel
                  <span className="text-white/60 text-[10px] ml-1">(aus Cloud-Eignung)</span>
                </th>
                <th className="px-3 py-2.5 text-left font-medium">Backup-Strategie</th>
                <th className="px-3 py-2.5 text-center font-medium w-20">
                  <Tooltip text="RTO = Recovery Time Objective: Die maximale tolerierbare Zeit, bis ein System nach einem Ausfall wieder funktioniert. Abgeleitet aus Schutzbedarf: Sehr hoch → < 1h, Hoch → < 4h, Normal → < 24h.">
                    RTO
                  </Tooltip>
                </th>
                <th className="px-3 py-2.5 text-center font-medium w-20">
                  <Tooltip text="RPO = Recovery Point Objective: Der maximale tolerierbare Datenverlust — wie alt darf das letzte Backup sein? Sehr hoch → < 15 Minuten (stündliche Backups), Hoch → < 1h, Normal → < 24h (täglich).">
                    RPO
                  </Tooltip>
                </th>
                <th className="px-3 py-2.5 text-left font-medium w-24">Souveränität</th>
                <th className="px-3 py-2.5 text-left font-medium">
                  <Tooltip text="Automatisch abgeleiteter Hinweis: Bei 'Sehr hoch' → Confidential Computing (verschlüsselte Ausführungsumgebung) prüfen. Bei 'Refactor' → erheblicher Umbauaufwand. Bei 'Repurchase' → SaaS-Ablösung mit Datenmigration. Bei 'Retain' → Hybrid-Anbindung via VPN oder ExpressRoute nötig.">
                    Besonderheit
                  </Tooltip>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {systemEmpfehlungen.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => onOpenCloudWizard(s.id)}
                  className="hover:bg-blue-50 cursor-pointer transition-colors group"
                  title={`Klicken um Cloud-Felder von „${s.name}" zu bearbeiten`}
                >
                  <td className="px-3 py-2.5 font-mono text-gray-500">{s.kuerzel}</td>
                  <td className="px-3 py-2.5">
                    <span className="font-medium text-gray-800 group-hover:text-hi-accent transition-colors">{s.name}</span>
                    <span className="ml-1.5 text-gray-400 text-[10px] hidden group-hover:inline">✎ bearbeiten</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${SCHUTZBEDARF_DOT[s.schutzbedarf] || 'bg-gray-300'}`} />
                      <span className="text-gray-600">{s.schutzbedarf}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-medium text-gray-800">{s.deploymentZiel}</td>
                  <td className="px-3 py-2.5 text-gray-600">{s.backupStrategie}</td>
                  <td className="px-3 py-2.5 text-center text-gray-700 font-mono">{s.rto}</td>
                  <td className="px-3 py-2.5 text-center text-gray-700 font-mono">{s.rpo}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      s.sovereignLevel === 'S3' ? 'bg-red-100 text-red-800' :
                      s.sovereignLevel === 'S2' ? 'bg-purple-100 text-purple-800' :
                      s.sovereignLevel === 'S1' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-500'
                    }`}>{s.sovereignLevel}</span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 italic">{s.besonderheit || <span className="not-italic text-gray-300">–</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" /></svg>
          Zeile klicken um Cloud-Felder zu bearbeiten · Werte werden automatisch aktualisiert
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
    </div>
  );
};
