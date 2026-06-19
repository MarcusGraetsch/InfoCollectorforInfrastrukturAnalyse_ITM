import React, { useMemo } from 'react';
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
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-hi-navy text-white rounded-lg text-sm font-medium hover:bg-hi-navy/90 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Drucken / PDF
        </button>
      </div>

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
