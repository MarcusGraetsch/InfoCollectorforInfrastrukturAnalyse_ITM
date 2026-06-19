import React, { useMemo, useState } from 'react';
import type { AppState, TCODaten } from '../types';

interface Props {
  state: AppState;
  onUpdate: (tco: TCODaten) => void;
}

function toNum(s: string): number {
  return parseFloat(s.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
}

function fmt(n: number): string {
  return n > 0 ? `${n.toLocaleString('de-DE')} €` : '–';
}

const INPUT_CLASS = 'w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-hi-accent focus:border-transparent outline-none text-right font-mono';

interface FieldProps {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}
const CostField: React.FC<FieldProps> = ({ label, value, placeholder, onChange }) => (
  <div className="flex items-center gap-3">
    <label className="text-sm text-gray-600 flex-1 min-w-0">{label}</label>
    <div className="w-36 flex-shrink-0">
      <input type="text" inputMode="numeric" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || '0 €'} className={INPUT_CLASS} />
    </div>
  </div>
);

export const TCOModell: React.FC<Props> = ({ state, onUpdate }) => {
  const tco = state.tcoData;
  const jahre = Math.max(1, parseInt(tco.zeithorizont) || 5);
  const [showRichtwerte, setShowRichtwerte] = useState(false);
  const [showLogik, setShowLogik] = useState(false);
  const [showSchätzPreview, setShowSchätzPreview] = useState(false);
  const [schätzWerte, setSchätzWerte] = useState<null | { lizenzen: number; hardware: number; raumEnergie: number; wartung: number; cloudInfrastruktur: number; lizenzenSaaS: number; }>(null);

  const berechneSchätzung = () => {
    const anwendungen = state.anwendungen ?? [];
    const server = state.server ?? [];
    const serverCount = server.length;
    const lizenzSumme = anwendungen.reduce((s, a) => {
      return s + (parseFloat((a.lizenzkosten || '0').replace(/[^0-9.,]/g, '').replace(',', '.')) || 0);
    }, 0);
    const saasLizenzen = anwendungen
      .filter(a => a.bereitstellung?.toLowerCase().includes('saas') || a.lizenzmodell?.toLowerCase().includes('saas') || a.lizenzmodell?.toLowerCase().includes('subscription'))
      .reduce((s, a) => s + (parseFloat((a.lizenzkosten || '0').replace(/[^0-9.,]/g, '').replace(',', '.')) || 0), 0);
    setSchätzWerte({
      lizenzen: Math.round(lizenzSumme),
      hardware: Math.round(serverCount * 15000),
      raumEnergie: Math.round(serverCount * 3500),
      wartung: Math.round(serverCount * 2500),
      cloudInfrastruktur: Math.round(serverCount * 6000),
      lizenzenSaaS: Math.round(saasLizenzen),
    });
    setShowSchätzPreview(true);
  };

  const übernehmeSchätzung = () => {
    if (!schätzWerte) return;
    const updated = {
      ...tco,
      istkostenOnPrem: {
        ...tco.istkostenOnPrem,
        lizenzen: schätzWerte.lizenzen > 0 ? `${schätzWerte.lizenzen} €` : tco.istkostenOnPrem.lizenzen,
        hardware: schätzWerte.hardware > 0 ? `${schätzWerte.hardware} €` : tco.istkostenOnPrem.hardware,
        raumEnergie: schätzWerte.raumEnergie > 0 ? `${schätzWerte.raumEnergie} €` : tco.istkostenOnPrem.raumEnergie,
        wartung: schätzWerte.wartung > 0 ? `${schätzWerte.wartung} €` : tco.istkostenOnPrem.wartung,
      },
      zielkostenCloud: {
        ...tco.zielkostenCloud,
        cloudInfrastruktur: schätzWerte.cloudInfrastruktur > 0 ? `${schätzWerte.cloudInfrastruktur} €` : tco.zielkostenCloud.cloudInfrastruktur,
        lizenzenSaaS: schätzWerte.lizenzenSaaS > 0 ? `${schätzWerte.lizenzenSaaS} €` : tco.zielkostenCloud.lizenzenSaaS,
      },
    };
    onUpdate(updated);
    setShowSchätzPreview(false);
  };

  const set = (path: string, val: string) => {
    const parts = path.split('.');
    if (parts.length === 1) {
      onUpdate({ ...tco, [path]: val });
    } else {
      onUpdate({ ...tco, [parts[0]]: { ...(tco as unknown as Record<string, Record<string, string>>)[parts[0]], [parts[1]]: val } });
    }
  };

  const istGesamt = useMemo(() => {
    const b = tco.istkostenOnPrem;
    return (toNum(b.hardware) + toNum(b.lizenzen) + toNum(b.personalBetrieb) + toNum(b.wartung) + toNum(b.raumEnergie) + toNum(b.sonstiges));
  }, [tco.istkostenOnPrem]);

  const cloudJahrlich = useMemo(() => {
    const b = tco.zielkostenCloud;
    return (toNum(b.cloudInfrastruktur) + toNum(b.lizenzenSaaS) + toNum(b.personalCloud) + toNum(b.sonstiges));
  }, [tco.zielkostenCloud]);

  const migration = toNum(tco.zielkostenCloud.migration);
  const cloudGesamt = cloudJahrlich * jahre + migration;
  const istGesamt5 = istGesamt * jahre;
  const einsparung = istGesamt5 - cloudGesamt;
  const breakEvenJahr = migration > 0 && (istGesamt - cloudJahrlich) > 0
    ? Math.ceil(migration / (istGesamt - cloudJahrlich))
    : null;

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
    const pct = istGesamt5 > 0 ? Math.round((einsparung / istGesamt5) * 100) : 0;
    win.document.write(`<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">
      <title>TCO-Modell — ${state.customerName || 'Kunde'}</title>
      <style>body{font-family:Arial,sans-serif;margin:32px;font-size:11px;color:#1a1a2e}h1{font-size:18px}h2{font-size:13px;margin-top:20px;border-bottom:1px solid #e5e7eb;padding-bottom:4px}table{width:100%;border-collapse:collapse;margin-bottom:16px}th{background:#f3f4f6;padding:5px 8px;text-align:left;font-size:10px}td{padding:5px 8px;border-bottom:1px solid #f0f0f0}.mono{font-family:monospace;text-align:right}.total{font-weight:700;background:#f9fafb}.highlight{background:#dbeafe;font-weight:700}.saving{color:${einsparung > 0 ? '#16a34a' : '#dc2626'}}</style>
      </head><body>
      <h1>TCO-Modell & Wirtschaftlichkeitsanalyse (LG 6)</h1>
      <p>Kunde: <strong>${state.customerName || '–'}</strong> · Stand: ${today} · Zeithorizont: ${jahre} Jahre</p>
      <h2>Ist-Kosten On-Premises (jährlich)</h2>
      <table><thead><tr><th>Position</th><th style="text-align:right">€ / Jahr</th></tr></thead><tbody>
      ${[['Hardware / Abschreibung',tco.istkostenOnPrem.hardware],['Lizenzen / Software',tco.istkostenOnPrem.lizenzen],['Personal Betrieb',tco.istkostenOnPrem.personalBetrieb],['Wartung / Support',tco.istkostenOnPrem.wartung],['Raum / Energie',tco.istkostenOnPrem.raumEnergie],['Sonstiges',tco.istkostenOnPrem.sonstiges]].map(([l,v])=>`<tr><td>${l}</td><td class="mono">${toNum(String(v)).toLocaleString('de-DE')} €</td></tr>`).join('')}
      <tr class="total"><td>Summe / Jahr</td><td class="mono">${fmt(istGesamt)}</td></tr>
      <tr class="total"><td>Summe ${jahre} Jahre</td><td class="mono">${fmt(istGesamt5)}</td></tr>
      </tbody></table>
      <h2>Ziel-Kosten Cloud (${jahre} Jahre)</h2>
      <table><thead><tr><th>Position</th><th style="text-align:right">€ / Jahr</th></tr></thead><tbody>
      ${[['Cloud-Infrastruktur',tco.zielkostenCloud.cloudInfrastruktur],['Lizenzen SaaS',tco.zielkostenCloud.lizenzenSaaS],['Personal Cloud-Betrieb',tco.zielkostenCloud.personalCloud],['Sonstiges',tco.zielkostenCloud.sonstiges]].map(([l,v])=>`<tr><td>${l}</td><td class="mono">${toNum(String(v)).toLocaleString('de-DE')} €</td></tr>`).join('')}
      <tr><td>Migrationskosten (einmalig)</td><td class="mono">${fmt(migration)}</td></tr>
      <tr class="total"><td>Summe ${jahre} Jahre (inkl. Migration)</td><td class="mono">${fmt(cloudGesamt)}</td></tr>
      </tbody></table>
      <h2>Wirtschaftlichkeitsvergleich</h2>
      <table><tbody>
      <tr class="highlight"><td>Einsparung über ${jahre} Jahre</td><td class="mono saving">${fmt(Math.abs(einsparung))} ${einsparung >= 0 ? '(Einsparung)' : '(Mehrkosten)'}</td></tr>
      <tr><td>Relative Einsparung</td><td class="mono saving">${Math.abs(pct)} %</td></tr>
      ${breakEvenJahr ? `<tr><td>Break-Even-Zeitpunkt</td><td class="mono">ca. ${breakEvenJahr} Jahr${breakEvenJahr !== 1 ? 'e' : ''} nach Migration</td></tr>` : ''}
      </tbody></table>
      ${tco.notizen ? `<h2>Anmerkungen</h2><p>${tco.notizen}</p>` : ''}
      </body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-hi-navy mb-1">TCO-Modell & Wirtschaftlichkeitsanalyse (LG 6)</h2>
          <p className="text-sm text-gray-500">Vergleich On-Premises vs. Cloud über mehrere Jahre</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={berechneSchätzung} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-teal-50 text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-100">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Aus Infrastrukturdaten schätzen
          </button>
          <button onClick={() => setShowLogik(s => !s)} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            Berechnung
          </button>
          <button onClick={() => setShowRichtwerte(s => !s)} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Richtwerte & Quellen
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-hi-navy text-white rounded-lg text-sm font-medium hover:bg-hi-navy/90 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Drucken / PDF
          </button>
        </div>
      </div>

      {showSchätzPreview && schätzWerte && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSchätzPreview(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-hi-navy">Schätzung aus Infrastrukturdaten</h3>
                <p className="text-xs text-gray-500 mt-0.5">{state.server?.length ?? 0} Server · {state.anwendungen?.length ?? 0} Anwendungen</p>
              </div>
              <button onClick={() => setShowSchätzPreview(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-500">Basierend auf erfassten Servern (×Richtwerte) und Lizenzkosten aus Anwendungen. Nur Felder mit Wert &gt; 0 werden überschrieben.</p>
              <div className="space-y-2 text-sm">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Ist-Kosten On-Prem</p>
                {([['Lizenzen / Software', schätzWerte.lizenzen, 'Σ Lizenzkosten Anwendungen'],['Hardware / Abschreibung', schätzWerte.hardware, `${state.server?.length ?? 0} Server × 15.000 €`],['Raum / Energie / Kühlung', schätzWerte.raumEnergie, `${state.server?.length ?? 0} Server × 3.500 €`],['Wartung / Support', schätzWerte.wartung, `${state.server?.length ?? 0} Server × 2.500 €`]] as [string,number,string][]).map(([l,v,h]) => (
                  <div key={l} className="flex items-center justify-between gap-2">
                    <span className="text-gray-600 flex-1">{l}</span>
                    <span className="text-xs text-gray-400">{h}</span>
                    <span className="font-mono font-medium text-hi-navy w-28 text-right">{v > 0 ? `${v.toLocaleString('de-DE')} €` : '–'}</span>
                  </div>
                ))}
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide pt-2">Ziel-Kosten Cloud</p>
                {([['Cloud-Infrastruktur (IaaS)', schätzWerte.cloudInfrastruktur, `${state.server?.length ?? 0} Server × 6.000 €/J.`],['Lizenzen / SaaS', schätzWerte.lizenzenSaaS, 'SaaS-Anwendungen']] as [string,number,string][]).map(([l,v,h]) => (
                  <div key={l} className="flex items-center justify-between gap-2">
                    <span className="text-gray-600 flex-1">{l}</span>
                    <span className="text-xs text-gray-400">{h}</span>
                    <span className="font-mono font-medium text-blue-700 w-28 text-right">{v > 0 ? `${v.toLocaleString('de-DE')} €` : '–'}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Diese Werte sind grobe Schätzungen auf Basis von Richtwerten. Bitte mit echten Kostendaten des Kunden abgleichen!</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowSchätzPreview(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Abbrechen</button>
                <button onClick={übernehmeSchätzung} className="flex items-center gap-2 px-4 py-2 bg-hi-navy text-white rounded-lg text-sm font-medium hover:bg-hi-navy/90">
                  Werte übernehmen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLogik && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2 text-sm text-amber-900">
          <p className="font-semibold">So funktioniert die Berechnung:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <p><strong>Ist-Kosten (On-Prem):</strong> Alle Felder links werden pro Jahr summiert → Jahresgesamt × Zeithorizont = On-Prem-Gesamtkosten.</p>
              <p><strong>Ziel-Kosten (Cloud):</strong> Laufende Kosten × Zeithorizont + einmalige Migrationskosten = Cloud-Gesamtinvestition.</p>
            </div>
            <div className="space-y-1">
              <p><strong>Einsparung:</strong> On-Prem-Gesamt minus Cloud-Gesamt. Positiv = Cloud günstiger; negativ = Cloud teurer.</p>
              <p><strong>Break-Even:</strong> Migrationskosten ÷ (Ist-Jahreskosten − Cloud-Jahreskosten) = Amortisationsdauer in Jahren.</p>
            </div>
          </div>
          <p className="text-xs text-amber-700 mt-1">Die Werte werden hier manuell eingegeben. Quelle: IT-Abteilung + aktuelle Angebote der Cloud-Anbieter. Lizenzkosten können aus dem Tab "Lizenz & Kosten (LG 5)" übertragen werden.</p>
        </div>
      )}

      {showRichtwerte && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-4">
          <p className="text-sm font-semibold text-blue-900">Richtwerte & Quellen für die Kostenschätzung</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-blue-900">
            <div className="space-y-3">
              <div>
                <p className="font-semibold mb-1">Hardware / Abschreibung (On-Prem)</p>
                <p>Standard-Server (2-Socket): 8.000–25.000 € Anschaffung, Abschreibung über 4–5 Jahre → 1.600–5.000 €/Jahr. Storage (SAN, 10 TB): 20.000–60.000 €, Abschreibung 5 J.</p>
                <p className="text-blue-600 mt-1">Quelle: <a href="https://www.dell.com/de-de/shop/servers-storage-and-networking/sc/servers" target="_blank" rel="noopener noreferrer" className="underline">Dell Server-Preise</a> · <a href="https://www.gartner.com/en/information-technology/insights/it-key-metrics-data" target="_blank" rel="noopener noreferrer" className="underline">Gartner IT Key Metrics</a></p>
              </div>
              <div>
                <p className="font-semibold mb-1">Personal Betrieb (On-Prem)</p>
                <p>1 Linux-Admin in DE: ~65.000–85.000 €/Jahr Fully Loaded Cost (Gehalt + NK). Cloud-Admin (nach Training): ähnlich, aber 30–40% weniger Routinearbeit.</p>
                <p className="text-blue-600 mt-1">Quelle: <a href="https://www.bitkom.org/Themen/Digitale-Transformation-Unternehmen/Jobs-Karriere" target="_blank" rel="noopener noreferrer" className="underline">Bitkom Gehaltsstudie</a> · <a href="https://www.stepstone.de/e-recruiting/wissen/gehalt-ratgeber/" target="_blank" rel="noopener noreferrer" className="underline">Stepstone IT-Gehaltsreport</a></p>
              </div>
              <div>
                <p className="font-semibold mb-1">Raum / Energie / Kühlung</p>
                <p>Typisches RZ: 1–3 kW/Server. Stromkosten DE: ~0,20–0,30 €/kWh × PUE 1,5 = ~0,30–0,45 €/kWh effektiv. Server 1,5 kW → ~3.000–5.000 €/Jahr.</p>
                <p className="text-blue-600 mt-1">Quelle: <a href="https://uptimeinstitute.com/resources/research-and-reports/uptime-institute-global-data-center-survey-results-2023" target="_blank" rel="noopener noreferrer" className="underline">Uptime Institute PUE Survey</a> · <a href="https://www.dena.de/themen-projekte/projekte/energieeffizienz/rechenzentren/" target="_blank" rel="noopener noreferrer" className="underline">DENA RZ-Studie</a></p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="font-semibold mb-1">Cloud-Infrastruktur (IaaS)</p>
                <p>Azure D4s v5 (4 vCPU, 16 GB): ~130–180 €/Monat (Pay-as-you-go) bzw. ~80–120 €/Monat (1-Jahr-Reserved). AWS m6i.xlarge: ähnlich.</p>
                <p className="text-blue-600 mt-1">Quelle: <a href="https://azure.microsoft.com/de-de/pricing/calculator/" target="_blank" rel="noopener noreferrer" className="underline">Azure-Preisrechner</a> · <a href="https://calculator.aws/" target="_blank" rel="noopener noreferrer" className="underline">AWS-Preisrechner</a> · <a href="https://cloud.google.com/products/calculator" target="_blank" rel="noopener noreferrer" className="underline">GCP-Preisrechner</a></p>
              </div>
              <div>
                <p className="font-semibold mb-1">Migrationskosten (einmalig)</p>
                <p>Rehost (Lift&Shift): 5–15% der Jahres-IT-Kosten. Replatform: 15–30%. Refactor: 40–80%+. Consultant-Tagessatz ~1.500–2.500 €.</p>
                <p className="text-blue-600 mt-1">Quelle: <a href="https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/cloud-migration" target="_blank" rel="noopener noreferrer" className="underline">McKinsey Cloud Migration Report</a> · <a href="https://www.gartner.com/en/information-technology/insights/it-key-metrics-data" target="_blank" rel="noopener noreferrer" className="underline">Gartner Cloud TCO Studies</a></p>
              </div>
              <div>
                <p className="font-semibold mb-1">Typische Einsparungsbandbreite</p>
                <p>Rehost: 15–30% Kosteneinsparung nach 3 Jahren. Replatform/Refactor: 30–50% nach 5 Jahren. Aber: Hidden Costs (Egress, Support, Training) einkalkulieren!</p>
                <p className="text-blue-600 mt-1">Quelle: <a href="https://info.flexera.com/CM-RESEARCH-State-of-the-Cloud-Report" target="_blank" rel="noopener noreferrer" className="underline">Flexera State of the Cloud 2024</a> · <a href="https://aws.amazon.com/economics/" target="_blank" rel="noopener noreferrer" className="underline">AWS Economics Center</a></p>
              </div>
            </div>
          </div>
          <p className="text-xs text-blue-700 border-t border-blue-200 pt-2 mt-2">
            ⚠️ Diese Werte sind Orientierungsgrößen. Für das Projekt sollten aktuelle Angebote der Cloud-Anbieter und konkrete Hardware-/Personalkosten des Kunden verwendet werden. Hyperscaler-Preisrechner:
            <a href="https://azure.microsoft.com/de-de/pricing/calculator/" target="_blank" rel="noopener noreferrer" className="underline ml-1">Azure</a> ·
            <a href="https://calculator.aws/pricing/2/metaindex.json" target="_blank" rel="noopener noreferrer" className="underline ml-1">AWS</a> ·
            <a href="https://cloud.google.com/products/calculator" target="_blank" rel="noopener noreferrer" className="underline ml-1">GCP</a>
          </p>
        </div>
      )}

      {/* Zeithorizont */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Zeithorizont (Jahre):</label>
          {['3','5','7','10'].map(j => (
            <button key={j} onClick={() => set('zeithorizont', j)} className={`px-3 py-1 rounded-lg text-sm font-medium border transition-colors ${tco.zeithorizont === j ? 'bg-hi-navy text-white border-hi-navy' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}>{j} J.</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Ist-Kosten */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-400 inline-block" />
            Ist-Kosten On-Premises <span className="text-gray-400 font-normal">(€ / Jahr)</span>
          </h3>
          <CostField label="Hardware / Abschreibung" value={tco.istkostenOnPrem.hardware} onChange={v => set('istkostenOnPrem.hardware', v)} />
          <CostField label="Lizenzen / Software" value={tco.istkostenOnPrem.lizenzen} onChange={v => set('istkostenOnPrem.lizenzen', v)} />
          <CostField label="Personal Betrieb" value={tco.istkostenOnPrem.personalBetrieb} onChange={v => set('istkostenOnPrem.personalBetrieb', v)} />
          <CostField label="Wartung / Support" value={tco.istkostenOnPrem.wartung} onChange={v => set('istkostenOnPrem.wartung', v)} />
          <CostField label="Raum / Energie / Kühlung" value={tco.istkostenOnPrem.raumEnergie} onChange={v => set('istkostenOnPrem.raumEnergie', v)} />
          <CostField label="Sonstiges" value={tco.istkostenOnPrem.sonstiges} onChange={v => set('istkostenOnPrem.sonstiges', v)} />
          <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">Summe / Jahr</span>
            <span className="text-sm font-bold text-hi-navy font-mono">{fmt(istGesamt)}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Summe über {jahre} Jahre</span>
            <span className="font-mono font-medium">{fmt(istGesamt5)}</span>
          </div>
        </div>

        {/* Ziel-Kosten Cloud */}
        <div className="bg-white border border-blue-200 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
            Ziel-Kosten Cloud <span className="text-gray-400 font-normal">(€ / Jahr)</span>
          </h3>
          <CostField label="Cloud-Infrastruktur (IaaS/PaaS)" value={tco.zielkostenCloud.cloudInfrastruktur} onChange={v => set('zielkostenCloud.cloudInfrastruktur', v)} />
          <CostField label="Lizenzen / SaaS-Abonnements" value={tco.zielkostenCloud.lizenzenSaaS} onChange={v => set('zielkostenCloud.lizenzenSaaS', v)} />
          <CostField label="Personal Cloud-Betrieb" value={tco.zielkostenCloud.personalCloud} onChange={v => set('zielkostenCloud.personalCloud', v)} />
          <CostField label="Sonstiges" value={tco.zielkostenCloud.sonstiges} onChange={v => set('zielkostenCloud.sonstiges', v)} />
          <div className="border-t border-gray-200 pt-3">
            <CostField label="Migrationskosten (einmalig)" value={tco.zielkostenCloud.migration} onChange={v => set('zielkostenCloud.migration', v)} placeholder="Einmalig" />
          </div>
          <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">Summe / Jahr (lfd.)</span>
            <span className="text-sm font-bold text-blue-700 font-mono">{fmt(cloudJahrlich)}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Gesamtinvestition {jahre} Jahre (inkl. Migration)</span>
            <span className="font-mono font-medium">{fmt(cloudGesamt)}</span>
          </div>
        </div>
      </div>

      {/* Ergebnis */}
      <div className={`rounded-xl p-5 border-2 ${einsparung >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Wirtschaftlichkeitsvergleich über {jahre} Jahre</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700 font-mono">{fmt(istGesamt5)}</div>
            <div className="text-xs text-gray-500 mt-1">On-Premises {jahre} Jahre</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-700 font-mono">{fmt(cloudGesamt)}</div>
            <div className="text-xs text-gray-500 mt-1">Cloud {jahre} Jahre (inkl. Migration)</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold font-mono ${einsparung >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {einsparung >= 0 ? '–' : '+'}{fmt(Math.abs(einsparung))}
            </div>
            <div className="text-xs text-gray-500 mt-1">{einsparung >= 0 ? 'Einsparung' : 'Mehrkosten'}</div>
          </div>
        </div>
        {breakEvenJahr !== null && (
          <p className="text-xs text-center text-gray-600 mt-4">
            Break-Even nach ca. <strong>{breakEvenJahr} {breakEvenJahr === 1 ? 'Jahr' : 'Jahren'}</strong> — danach laufende Einsparung von <strong className="text-green-700">{fmt(istGesamt - cloudJahrlich)}/Jahr</strong>
          </p>
        )}
        {istGesamt === 0 && cloudJahrlich === 0 && (
          <p className="text-xs text-center text-gray-400 mt-2">Bitte geben Sie Kostenwerte ein um den Vergleich zu berechnen.</p>
        )}
      </div>

      {/* Notizen */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <label className="block text-xs font-medium text-gray-600 mb-2">Anmerkungen / qualitative Faktoren</label>
        <textarea
          value={tco.notizen}
          onChange={e => set('notizen', e.target.value)}
          rows={3}
          placeholder="Qualitative Faktoren: Flexibilität, Skalierbarkeit, Vendor Lock-in, Regulatorik, strategische Priorität …"
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-hi-accent focus:border-transparent outline-none resize-none"
        />
      </div>
    </div>
  );
};
