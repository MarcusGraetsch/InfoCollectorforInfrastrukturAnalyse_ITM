/**
 * Block 7 / Paket 10 — EnEfG / CO₂ Nachhaltigkeitsmodul (transparent & drill-down)
 */
import React, { useMemo, useState } from 'react';
import type { AppState, NachhaltigkeitsAnnahmen } from '../types';
import { berechneNachhaltigkeit, berechneEnergieDetail, mergeAnnahmen, DEFAULT_ANNAHMEN } from '../sustainability';
import { esc, openPrintWindow, printHeader, printFooter } from '../utils/safePrint';

interface Props {
  state: AppState;
  onUpdate: (annahmen: NachhaltigkeitsAnnahmen) => void;
}

const AUFWAND_COLOR: Record<string, string> = {
  'Niedrig': 'bg-green-100 text-green-800',
  'Mittel':  'bg-amber-100 text-amber-800',
  'Hoch':    'bg-red-100 text-red-800',
};

const QUELLE_LABEL: Record<string, string> = {
  gemessen: 'gemessen (Stromverbrauch)',
  max: 'aus max. Leistungsaufnahme',
  default: 'Default-Annahme',
};
const QUELLE_STYLE: Record<string, string> = {
  gemessen: 'bg-emerald-100 text-emerald-700',
  max: 'bg-sky-100 text-sky-700',
  default: 'bg-amber-100 text-amber-700',
};

const fmt = (n: number) => n.toLocaleString('de-DE');
const t = (kg: number) => Math.round(kg / 100) / 10; // kg → t, 1 Nachkommastelle

function KpiBox({ label, value, sub, accent = 'text-hi-accent' }: { label: string; value: React.ReactNode; sub?: string; accent?: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <div className="text-xs font-semibold text-hi-slate uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-2xl font-bold ${accent} leading-none`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

const NumField: React.FC<{ label: string; value: number; step?: number; min?: number; unit?: string; onChange: (v: number) => void }> = ({ label, value, step = 0.01, min = 0, unit, onChange }) => (
  <label className="block">
    <span className="text-[11px] font-semibold text-hi-slate">{label}{unit && <span className="text-gray-400 font-normal"> ({unit})</span>}</span>
    <input
      type="number" value={value} step={step} min={min}
      onChange={e => onChange(parseFloat(e.target.value.replace(',', '.')) || 0)}
      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-hi-accent"
    />
  </label>
);

export const NachhaltigkeitsModul: React.FC<Props> = ({ state, onUpdate }) => {
  const annahmen = useMemo(() => mergeAnnahmen(state.nachhaltigkeitAnnahmen), [state.nachhaltigkeitAnnahmen]);
  const detail = useMemo(() => berechneEnergieDetail(state, annahmen), [state, annahmen]);
  const { enefgPflicht, enefgHinweis } = useMemo(() => berechneNachhaltigkeit(state), [state]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const patch = (changes: Partial<NachhaltigkeitsAnnahmen>) => onUpdate({ ...annahmen, ...changes });

  const massnahmen = useMemo(() => [
    { titel: 'Server-Konsolidierung / Virtualisierung', aufwand: 'Mittel' as const, potenzialKwh: Math.round(detail.onPremKwhJahr * 0.25), beschreibung: 'Physische Server durch virtuelle Instanzen ersetzen. Typisch 20–30 % Energieeinsparung.' },
    { titel: 'Abschaltung nicht genutzter Systeme (End-of-Life)', aufwand: 'Niedrig' as const, potenzialKwh: Math.round(detail.onPremKwhJahr * 0.10), beschreibung: 'EoL-Systeme identifizieren und abschalten.' },
    { titel: 'Migration auf Hyperscaler-Cloud', aufwand: 'Hoch' as const, potenzialKwh: detail.einsparungKwhJahr, beschreibung: `Geschätztes Einsparpotenzial: ${detail.einsparungProzent} % CO₂ (PUE-Optimierung + Strommix).` },
    { titel: 'Green Cloud / 100 % Erneuerbare', aufwand: 'Niedrig' as const, potenzialKwh: Math.round(detail.cloudKwhJahr * 0.5), beschreibung: 'CO₂-arme Cloud-Regionen wählen (z.B. AWS eu-north-1, Azure Sweden).' },
  ], [detail]);

  const handlePrint = () => {
    const a = annahmen;
    const rows = detail.zeilen.map(z => `<tr>
      <td>${esc(z.kuerzel)}</td><td>${esc(z.name)}</td><td>${z.anzahl}</td>
      <td>${fmt(z.leistungW)} W (${esc(QUELLE_LABEL[z.quelle])})</td>
      <td>${fmt(z.energieKwhJahr)}</td><td>${fmt(z.co2KgJahr)}</td></tr>`).join('');
    const body = `${printHeader('Nachhaltigkeit & Energieeffizienz (EnEfG/ESG)', state.customerName)}
      <h2>Annahmen (editierbar, Schätzung)</h2>
      <ul>
        <li>PUE On-Prem: ${a.pueOnPrem} &middot; PUE Cloud: ${a.pueCloud}</li>
        <li>Betriebsstunden/Jahr: ${fmt(a.betriebsstundenJahr)} h &middot; Auslastung: ${Math.round(a.auslastung * 100)} %</li>
        <li>Strommix On-Prem: ${a.strommixFaktorOnPrem} kg CO₂eq/kWh &middot; Cloud: ${a.strommixFaktorCloud} kg CO₂eq/kWh</li>
        <li>Default-Leistung je Server ohne Messwert: ${a.defaultLeistungW} W</li>
      </ul>
      <h2>Berechnungsformeln</h2>
      <p>IT-Energie = Leistung [kW] × Betriebsstunden × Auslastung × Anzahl<br>
      Energie On-Prem = IT-Energie × PUE&nbsp;On-Prem &middot; CO₂ = Energie × Strommix-Faktor<br>
      Cloud-Energie = IT-Energie × PUE&nbsp;Cloud &middot; Einsparung = On-Prem − Cloud</p>
      <h2>Server (${detail.zeilen.length}) — ${detail.serverOhneMesswert} ohne Messwert (Default)</h2>
      <table><thead><tr><th>Kürzel</th><th>Server</th><th>Anzahl</th><th>Leistung</th><th>Energie kWh/J</th><th>CO₂ kg/J</th></tr></thead><tbody>${rows}</tbody></table>
      <h2>Summen & Cloud-Vergleich (Schätzung)</h2>
      <ul>
        <li>On-Prem: ${fmt(detail.onPremKwhJahr)} kWh/J &middot; ${fmt(detail.onPremCo2KgJahr)} kg (${t(detail.onPremCo2KgJahr)} t) CO₂eq/J</li>
        <li>Cloud: ${fmt(detail.cloudKwhJahr)} kWh/J &middot; ${fmt(detail.cloudCo2KgJahr)} kg (${t(detail.cloudCo2KgJahr)} t) CO₂eq/J</li>
        <li>Einsparung: ${fmt(detail.einsparungKwhJahr)} kWh/J &middot; ${fmt(detail.einsparungCo2KgJahr)} kg (${t(detail.einsparungCo2KgJahr)} t) CO₂eq/J (${detail.einsparungProzent} %)</li>
      </ul>
      <p style="color:#888;font-size:9px;margin-top:16px">Schätzung auf Basis erfasster Server-Leistungsdaten und der o.g. Annahmen — keine Messung. Quellen: Uptime Institute PUE Survey 2023, IEA, UBA 2023.</p>
      ${printFooter()}`;
    openPrintWindow(`Nachhaltigkeit — ${state.customerName || 'Kunde'}`, body, 'h2{font-size:13px;margin-top:18px}');
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-hi-navy mb-1">Nachhaltigkeit & Energieeffizienz (EnEfG / ESG)</h2>
          <p className="text-sm text-hi-slate max-w-2xl">
            Transparente, nachvollziehbare Energie- und CO₂-Bilanz: pro Server aus den erfassten
            Leistungsdaten berechnet, alle Annahmen editierbar. <strong>Schätzung</strong>, keine Messung.
          </p>
        </div>
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-hi-navy text-white rounded-lg text-sm font-medium hover:bg-hi-navy/90 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Drucken / Export
        </button>
      </div>

      {/* EnEfG-Banner */}
      <div className={`rounded-xl p-4 border flex items-start gap-3 ${enefgPflicht ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
        <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${enefgPflicht ? 'text-red-600' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={enefgPflicht ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" : "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
        </svg>
        <div>
          <p className={`text-sm font-semibold ${enefgPflicht ? 'text-red-800' : 'text-blue-800'}`}>EnEfG-Status: {enefgPflicht ? 'Meldepflichtig (≥ 1 MW IT-Leistung)' : 'Unterhalb Meldeschwelle'}</p>
          <p className={`text-xs mt-0.5 ${enefgPflicht ? 'text-red-700' : 'text-blue-700'}`}>{enefgHinweis}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiBox label="Server erfasst" value={detail.zeilen.length} sub={`${detail.serverOhneMesswert} ohne Messwert`} accent="text-hi-navy" />
        <KpiBox label="Energie On-Prem/Jahr" value={fmt(detail.onPremKwhJahr)} sub={`kWh/Jahr (PUE ${annahmen.pueOnPrem})`} accent="text-gray-700" />
        <KpiBox label="CO₂ On-Prem/Jahr" value={fmt(detail.onPremCo2KgJahr)} sub={`kg (${t(detail.onPremCo2KgJahr)} t) CO₂eq/Jahr`} accent="text-red-700" />
        <KpiBox label="CO₂-Einsparung Cloud" value={`${detail.einsparungProzent} %`} sub={`${t(detail.einsparungCo2KgJahr)} t CO₂eq/Jahr`} accent="text-green-700" />
      </div>

      {/* Editierbare Annahmen */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-sm font-bold text-hi-navy">Annahmen (editierbar)</h3>
          <button onClick={() => onUpdate({ ...DEFAULT_ANNAHMEN })} className="text-xs font-semibold text-hi-slate border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50">Auf Richtwerte zurücksetzen</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <NumField label="PUE On-Prem" value={annahmen.pueOnPrem} step={0.05} onChange={v => patch({ pueOnPrem: v })} />
          <NumField label="PUE Cloud" value={annahmen.pueCloud} step={0.05} onChange={v => patch({ pueCloud: v })} />
          <NumField label="Betriebsstunden/Jahr" value={annahmen.betriebsstundenJahr} step={1} unit="h" onChange={v => patch({ betriebsstundenJahr: v })} />
          <NumField label="Auslastung" value={annahmen.auslastung} step={0.05} unit="0–1" onChange={v => patch({ auslastung: v })} />
          <NumField label="Strommix On-Prem" value={annahmen.strommixFaktorOnPrem} step={0.01} unit="kg/kWh" onChange={v => patch({ strommixFaktorOnPrem: v })} />
          <NumField label="Strommix Cloud" value={annahmen.strommixFaktorCloud} step={0.01} unit="kg/kWh" onChange={v => patch({ strommixFaktorCloud: v })} />
          <NumField label="Default-Leistung/Server" value={annahmen.defaultLeistungW} step={10} unit="W" onChange={v => patch({ defaultLeistungW: v })} />
        </div>
        <div className="mt-3 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-[11px] text-gray-600 leading-relaxed">
          <strong>Formeln:</strong> IT-Energie = Leistung[kW] × Betriebsstunden × Auslastung × Anzahl ·
          Energie On-Prem = IT-Energie × <em>PUE On-Prem</em> · CO₂ = Energie × <em>Strommix-Faktor</em> ·
          Cloud-Energie = IT-Energie × <em>PUE Cloud</em> · Einsparung = On-Prem − Cloud.
        </div>
      </div>

      {/* Server-Drilldown */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-hi-navy uppercase tracking-wider">Server-Energiebilanz (Klick = Formel)</h3>
          <span className="text-xs text-gray-400">{detail.zeilen.length} Server</span>
        </div>
        {detail.zeilen.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-400 text-center">Noch keine Server erfasst — Stromverbrauch/Leistung im Server-Formular ergänzen für genauere Werte.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500">
                <tr className="text-left">
                  <th className="px-4 py-2 font-semibold">Server</th>
                  <th className="px-4 py-2 font-semibold">Leistung</th>
                  <th className="px-4 py-2 font-semibold">Quelle</th>
                  <th className="px-4 py-2 font-semibold text-right">Energie kWh/J</th>
                  <th className="px-4 py-2 font-semibold text-right">CO₂ kg/J</th>
                </tr>
              </thead>
              <tbody>
                {detail.zeilen.map(z => (
                  <React.Fragment key={z.id}>
                    <tr onClick={() => setExpandedId(expandedId === z.id ? null : z.id)} className="border-t border-gray-50 hover:bg-hi-accent/5 cursor-pointer transition-colors">
                      <td className="px-4 py-2 font-medium text-hi-navy">{z.name} {z.anzahl > 1 && <span className="text-gray-400">× {z.anzahl}</span>}<div className="text-[10px] text-gray-400 font-mono">{z.kuerzel}</div></td>
                      <td className="px-4 py-2 text-hi-slate">{fmt(z.leistungW)} W</td>
                      <td className="px-4 py-2"><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${QUELLE_STYLE[z.quelle]}`}>{QUELLE_LABEL[z.quelle]}</span></td>
                      <td className="px-4 py-2 text-right tabular-nums">{fmt(z.energieKwhJahr)}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-red-700">{fmt(z.co2KgJahr)}</td>
                    </tr>
                    {expandedId === z.id && (
                      <tr className="bg-gray-50/60">
                        <td colSpan={5} className="px-4 py-2 text-[11px] text-gray-600 leading-relaxed">
                          <strong>Rechenweg:</strong><br />
                          IT-Energie = {z.leistungW} W ÷ 1000 × {fmt(annahmen.betriebsstundenJahr)} h × {annahmen.auslastung} × {z.anzahl} = <strong>{fmt(z.itKwhJahr)} kWh/J</strong><br />
                          Energie (mit PUE {annahmen.pueOnPrem}) = {fmt(z.itKwhJahr)} × {annahmen.pueOnPrem} = <strong>{fmt(z.energieKwhJahr)} kWh/J</strong><br />
                          CO₂ = {fmt(z.energieKwhJahr)} × {annahmen.strommixFaktorOnPrem} kg/kWh = <strong>{fmt(z.co2KgJahr)} kg/J</strong>
                          {z.quelle === 'default' && <div className="text-amber-600 mt-1">⚠ Kein Messwert erfasst — Default-Leistung {annahmen.defaultLeistungW} W angenommen. Stromverbrauch im Server-Formular ergänzen für genauere Werte.</div>}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold text-hi-navy">
                  <td className="px-4 py-2" colSpan={3}>Summe On-Premises</td>
                  <td className="px-4 py-2 text-right tabular-nums">{fmt(detail.onPremKwhJahr)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-red-700">{fmt(detail.onPremCo2KgJahr)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CO₂-Einsparung Cloud — Detailansicht */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-hi-navy mb-4">CO₂-Einsparung Cloud — Detailrechnung</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
            <p className="text-[11px] font-semibold text-gray-400 uppercase">On-Prem Baseline</p>
            <p className="text-lg font-bold text-gray-700">{fmt(detail.onPremCo2KgJahr)} kg</p>
            <p className="text-[11px] text-gray-400">{fmt(detail.onPremKwhJahr)} kWh × {annahmen.strommixFaktorOnPrem} (PUE {annahmen.pueOnPrem})</p>
          </div>
          <div className="border border-gray-100 rounded-lg p-3 bg-green-50/50">
            <p className="text-[11px] font-semibold text-gray-400 uppercase">Cloud-Szenario</p>
            <p className="text-lg font-bold text-green-700">{fmt(detail.cloudCo2KgJahr)} kg</p>
            <p className="text-[11px] text-gray-400">{fmt(detail.cloudKwhJahr)} kWh × {annahmen.strommixFaktorCloud} (PUE {annahmen.pueCloud})</p>
          </div>
          <div className="border border-gray-100 rounded-lg p-3 bg-emerald-50">
            <p className="text-[11px] font-semibold text-gray-400 uppercase">Differenz (Einsparung)</p>
            <p className="text-lg font-bold text-emerald-700">{fmt(detail.einsparungCo2KgJahr)} kg · {detail.einsparungProzent} %</p>
            <p className="text-[11px] text-gray-400">{t(detail.einsparungCo2KgJahr)} t CO₂eq/Jahr</p>
          </div>
        </div>
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[11px] text-amber-800">
          <strong>Unsicherheit/Annahme:</strong> Das Cloud-Szenario nimmt gleiche IT-Last bei optimiertem PUE
          ({annahmen.pueCloud}) und Cloud-Strommix ({annahmen.strommixFaktorCloud} kg/kWh) an. Reale Einsparungen
          hängen von Region, Workload-Optimierung und Anbieter ab — Bandbreite typ. ±30 %. Keine Scheingenauigkeit:
          Werte sind Schätzungen, kein Messergebnis.
        </div>
      </div>

      {/* Maßnahmen */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100"><h3 className="text-sm font-bold text-hi-navy uppercase tracking-wider">Empfohlene Maßnahmen</h3></div>
        <div className="divide-y divide-gray-50">
          {massnahmen.map((m, i) => (
            <div key={i} className="px-5 py-4 flex items-start gap-4">
              <span className={`flex-shrink-0 mt-0.5 text-xs px-2 py-0.5 rounded-full font-semibold ${AUFWAND_COLOR[m.aufwand]}`}>{m.aufwand}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-hi-navy">{m.titel}</p>
                <p className="text-xs text-hi-slate mt-0.5">{m.beschreibung}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-sm font-bold text-green-700">~{fmt(m.potenzialKwh)} kWh/J.</div>
                <div className="text-xs text-gray-400">Einsparpotenzial</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-amber-800 mb-1">Hinweis zu den Schätzwerten</p>
        <p className="text-xs text-amber-700">
          Die Energiewerte werden aus den erfassten Server-Leistungsdaten (Stromverbrauch bzw. max.
          Leistungsaufnahme) und den editierbaren Annahmen berechnet. Server ohne Messwert nutzen die
          Default-Leistung. Für ein präzises Energieaudit sind reale Stromverbrauchs- und PUE-Messungen nötig.
          Alle Werte sind ausdrücklich Schätzungen für ESG-Reporting und Maßnahmenplanung.
        </p>
      </div>
    </div>
  );
};
