import React, { useState, useMemo } from 'react';
import type { AppState, Anwendung } from '../types';
import { esc, openPrintWindow, printHeader, printFooter } from '../utils/safePrint';

interface Props {
  state: AppState;
  onUpdateAnwendung: (id: string, changes: Partial<Anwendung>) => void;
}

const LIZENZMODELL_OPTIONS = ['Named User', 'Core-basiert', 'Site License', 'Subscription (SaaS)', 'OEM / Bundled', 'Open Source', 'Freeware', 'Unklar'];

type Risiko = 'Hoch' | 'Mittel' | 'Niedrig' | 'Unbewertet';

function berechneRisiko(a: Anwendung): Risiko {
  let punkte = 0;
  if (a.lizenzCloudfaehig === 'Nein') punkte += 3;
  else if (a.lizenzCloudfaehig === 'Unklar' || !a.lizenzCloudfaehig) punkte += 1;
  if (a.vertragsende) {
    const monate = (new Date(a.vertragsende).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
    if (monate < 6)  punkte += 3;
    else if (monate < 18) punkte += 1;
  }
  if (a.migrationskomplexitaet === 'Hoch') punkte += 2;
  if (!a.lizenzkosten) return 'Unbewertet';
  if (punkte >= 4) return 'Hoch';
  if (punkte >= 2) return 'Mittel';
  return 'Niedrig';
}

const RISIKO_COLORS: Record<Risiko, string> = {
  'Hoch':       'bg-red-100 text-red-800',
  'Mittel':     'bg-amber-100 text-amber-800',
  'Niedrig':    'bg-green-100 text-green-800',
  'Unbewertet': 'bg-gray-100 text-gray-500',
};

export const LizenzKostenAnalyse: React.FC<Props> = ({ state, onUpdateAnwendung }) => {
  const [filterRisiko, setFilterRisiko] = useState<string>('Alle');
  const [editId, setEditId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Partial<Anwendung>>({});
  const [showRenewalEmail, setShowRenewalEmail] = useState(false);
  const [infoBannerDismissed, setInfoBannerDismissed] = useState(false);
  const [samTab, setSamTab] = useState<'lizenz' | 'sam'>('lizenz');

  const anwendungen = state.anwendungen;

  const rows = useMemo(() => anwendungen.map(a => ({ ...a, risiko: berechneRisiko(a) })), [anwendungen]);

  const filtered = useMemo(() =>
    filterRisiko === 'Alle' ? rows : rows.filter(r => r.risiko === filterRisiko),
    [rows, filterRisiko]
  );

  const stats = useMemo(() => {
    const kosten = anwendungen.map(a => parseFloat((a.lizenzkosten || '0').replace(/[^0-9.,]/g, '').replace(',', '.')) || 0);
    return {
      gesamt: anwendungen.length,
      bewertet: anwendungen.filter(a => a.lizenzkosten).length,
      nichtCloudFaehig: anwendungen.filter(a => a.lizenzCloudfaehig === 'Nein').length,
      auslaufend: anwendungen.filter(a => {
        if (!a.vertragsende) return false;
        return (new Date(a.vertragsende).getTime() - Date.now()) < 1000 * 60 * 60 * 24 * 30 * 12;
      }).length,
      gesamtkosten: kosten.reduce((s, k) => s + k, 0),
    };
  }, [anwendungen]);

  // Block 9 — SAM Compliance Analyse
  const samStats = useMemo(() => {
    const total = anwendungen.length;
    const mitAnbieter = anwendungen.filter(a => a.lizenzAnbieter).length;
    const mitModell   = anwendungen.filter(a => a.lizenzmodell).length;
    const mitKosten   = anwendungen.filter(a => a.lizenzkosten).length;
    const mitEnde     = anwendungen.filter(a => a.vertragsende).length;
    const unklar      = anwendungen.filter(a => a.lizenzCloudfaehig === 'Unklar' || !a.lizenzCloudfaehig).length;
    const neinCloud   = anwendungen.filter(a => a.lizenzCloudfaehig === 'Nein').length;
    const vollstaendig = anwendungen.filter(a => a.lizenzAnbieter && a.lizenzmodell && a.lizenzkosten && a.vertragsende).length;
    const compliance = total > 0 ? Math.round((vollstaendig / total) * 100) : 0;
    return { total, mitAnbieter, mitModell, mitKosten, mitEnde, unklar, neinCloud, vollstaendig, compliance };
  }, [anwendungen]);

  const startEdit = (a: Anwendung) => {
    setEditId(a.id);
    setEditFields({ lizenzAnbieter: a.lizenzAnbieter || '', lizenzmodell: a.lizenzmodell || '', lizenzkosten: a.lizenzkosten || '', vertragsende: a.vertragsende || '', lizenzCloudfaehig: a.lizenzCloudfaehig || '' });
  };

  const saveEdit = (id: string) => {
    onUpdateAnwendung(id, editFields);
    setEditId(null);
  };

  const handlePrint = () => {
    const body = `${printHeader('Lizenz- und Kostenanalyse (LG 5)', state.customerName)}
      <p>${anwendungen.length} Anwendungen</p>
      <table><thead><tr><th>Kürzel</th><th>Anwendung</th><th>Anbieter</th><th>Lizenzmodell</th><th>Cloudfähig</th><th>Jahreskosten</th><th>Vertragsende</th><th>Risiko</th></tr></thead><tbody>
      ${rows.map(a => `<tr><td>${esc(a.kuerzel)}</td><td>${esc(a.name)}</td><td>${esc(a.lizenzAnbieter || '–')}</td><td>${esc(a.lizenzmodell || '–')}</td><td>${esc(a.lizenzCloudfaehig || '–')}</td><td>${esc(a.lizenzkosten || '–')}</td><td>${a.vertragsende ? new Date(a.vertragsende).toLocaleDateString('de-DE') : '–'}</td><td style="color:${a.risiko==='Hoch'?'#dc2626':a.risiko==='Mittel'?'#d97706':'#16a34a'};font-weight:${a.risiko==='Hoch'?'700':a.risiko==='Mittel'?'600':'normal'}">${esc(a.risiko)}</td></tr>`).join('')}
      </tbody></table>${printFooter()}`;
    openPrintWindow(`Lizenz- und Kostenanalyse — ${state.customerName || 'Kunde'}`, body);
  };

  if (anwendungen.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-hi-navy mb-1">Lizenz- und Kostenanalyse (LG 5)</h2>
        <div className="mt-8 text-center text-gray-400 py-12 border-2 border-dashed border-gray-200 rounded-xl">
          Keine Anwendungen erfasst. Bitte zuerst Anwendungen in der Infrastruktur-Analyse anlegen.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-hi-navy mb-1">Lizenz- und Kostenanalyse (LG 5)</h2>
          <p className="text-sm text-gray-500">Lizenzmodelle, Vertragsstrukturen und Betriebskosten aller Anwendungen</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => stats.auslaufend > 0 && setShowRenewalEmail(true)}
            disabled={stats.auslaufend === 0}
            title={stats.auslaufend === 0 ? 'Keine Verträge mit Ablauf in <12 Monaten' : `${stats.auslaufend} auslaufende Verträge`}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${stats.auslaufend > 0 ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 cursor-pointer' : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Verlängerungs-E-Mail
            {stats.auslaufend > 0 && <span className="bg-amber-200 text-amber-800 text-xs px-1.5 py-0.5 rounded-full font-bold">{stats.auslaufend}</span>}
          </button>
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-hi-navy text-white rounded-lg text-sm font-medium hover:bg-hi-navy/90">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Drucken / PDF
        </button>
        </div>
      </div>

      {/* Block 9 — SAM Tab Switcher */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {([['lizenz', 'Lizenz & Kosten'], ['sam', 'SAM-Compliance']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSamTab(key)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${samTab === key ? 'border-hi-accent text-hi-accent' : 'border-transparent text-gray-500 hover:text-hi-navy'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {showRenewalEmail && (
        <RenewalEmailModal
          customerName={state.customerName}
          anwendungen={anwendungen}
          onClose={() => setShowRenewalEmail(false)}
        />
      )}

      {samTab === 'lizenz' && <>
      {/* Info Banner */}
      {!infoBannerDismissed && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="text-sm text-blue-800 flex-1">
            <strong>Bearbeitung:</strong> Klicken Sie das <span className="inline-flex items-center bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-mono mx-1">✎</span>-Symbol am rechten Zeilenende um Lizenzfelder zu bearbeiten. Anbieter, Lizenzmodell, Jahreskosten und Vertragsende können direkt in der Tabelle erfasst werden.
          </p>
          <button onClick={() => setInfoBannerDismissed(true)} className="text-blue-400 hover:text-blue-600 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Anwendungen gesamt', value: stats.gesamt, sub: `${stats.bewertet} mit Kostendaten` },
          { label: 'Nicht cloudfähig', value: stats.nichtCloudFaehig, sub: 'Lizenz-Risiko', color: stats.nichtCloudFaehig > 0 ? 'text-red-600' : '' },
          { label: 'Verträge < 12 Monate', value: stats.auslaufend, sub: 'Handlungsbedarf', color: stats.auslaufend > 0 ? 'text-amber-600' : '' },
          { label: 'Gesamtkosten/Jahr', value: stats.gesamtkosten > 0 ? `${stats.gesamtkosten.toLocaleString('de-DE')} €` : '–', sub: 'aus Kostendaten' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
            <div className={`text-xl font-bold text-hi-navy ${kpi.color || ''}`}>{kpi.value}</div>
            <div className="text-xs font-medium text-gray-700 mt-0.5">{kpi.label}</div>
            <div className="text-xs text-gray-400">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-gray-600">Risiko:</label>
        <select value={filterRisiko} onChange={e => setFilterRisiko(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-hi-accent outline-none">
          <option>Alle</option>
          <option>Hoch</option>
          <option>Mittel</option>
          <option>Niedrig</option>
          <option>Unbewertet</option>
        </select>
        <span className="text-xs text-gray-400">{filtered.length} Einträge</span>
      </div>

      {/* Tabelle */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-hi-navy text-white text-xs">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium w-20">Kürzel</th>
                <th className="px-3 py-2.5 text-left font-medium">Anwendung</th>
                <th className="px-3 py-2.5 text-left font-medium">Anbieter</th>
                <th className="px-3 py-2.5 text-left font-medium">Lizenzmodell</th>
                <th className="px-3 py-2.5 text-left font-medium w-24">Cloudfähig</th>
                <th className="px-3 py-2.5 text-left font-medium">Jahreskosten</th>
                <th className="px-3 py-2.5 text-left font-medium">Vertragsende</th>
                <th className="px-3 py-2.5 text-left font-medium w-24">Risiko</th>
                <th className="px-3 py-2.5 text-left font-medium w-20">Bearbeiten</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(a => (
                <React.Fragment key={a.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-xs text-gray-500">{a.kuerzel}</td>
                    <td className="px-3 py-2 font-medium text-gray-800">{a.name}</td>
                    {editId === a.id ? (
                      <>
                        <td className="px-2 py-1.5"><input value={editFields.lizenzAnbieter ?? ''} onChange={e => setEditFields(f => ({ ...f, lizenzAnbieter: e.target.value }))} className="w-full text-xs border border-gray-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-hi-accent" placeholder="Anbieter" /></td>
                        <td className="px-2 py-1.5">
                          <select value={editFields.lizenzmodell ?? ''} onChange={e => setEditFields(f => ({ ...f, lizenzmodell: e.target.value }))} className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white outline-none focus:ring-1 focus:ring-hi-accent">
                            <option value="">–</option>
                            {LIZENZMODELL_OPTIONS.map(o => <option key={o}>{o}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <select value={editFields.lizenzCloudfaehig ?? ''} onChange={e => setEditFields(f => ({ ...f, lizenzCloudfaehig: e.target.value }))} className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white outline-none focus:ring-1 focus:ring-hi-accent">
                            <option value="">–</option>
                            <option>Ja</option><option>Nein</option><option>Unklar</option>
                          </select>
                        </td>
                        <td className="px-2 py-1.5"><input value={editFields.lizenzkosten ?? ''} onChange={e => setEditFields(f => ({ ...f, lizenzkosten: e.target.value }))} className="w-full text-xs border border-gray-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-hi-accent" placeholder="z.B. 45.000 €" /></td>
                        <td className="px-2 py-1.5"><input type="date" value={editFields.vertragsende ?? ''} onChange={e => setEditFields(f => ({ ...f, vertragsende: e.target.value }))} className="w-full text-xs border border-gray-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-hi-accent" /></td>
                        <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RISIKO_COLORS[a.risiko]}`}>{a.risiko}</span></td>
                        <td className="px-2 py-1.5">
                          <button onClick={() => saveEdit(a.id)} className="text-green-600 hover:text-green-800 text-xs font-medium">✔</button>
                          <button onClick={() => setEditId(null)} className="ml-2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 text-gray-600 text-xs">{a.lizenzAnbieter || <span className="text-gray-300">–</span>}</td>
                        <td className="px-3 py-2 text-gray-600 text-xs">{a.lizenzmodell || <span className="text-gray-300">–</span>}</td>
                        <td className="px-3 py-2">
                          {a.lizenzCloudfaehig ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.lizenzCloudfaehig === 'Ja' ? 'bg-green-100 text-green-800' : a.lizenzCloudfaehig === 'Nein' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>{a.lizenzCloudfaehig}</span>
                          ) : <span className="text-gray-300 text-xs">–</span>}
                        </td>
                        <td className="px-3 py-2 text-gray-600 text-xs font-mono">{a.lizenzkosten || <span className="text-gray-300">–</span>}</td>
                        <td className="px-3 py-2 text-xs">
                          {a.vertragsende ? (
                            <span className={(new Date(a.vertragsende).getTime() - Date.now()) < 1000 * 60 * 60 * 24 * 30 * 12 ? 'text-amber-700 font-medium' : 'text-gray-600'}>
                              {new Date(a.vertragsende).toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' })}
                            </span>
                          ) : <span className="text-gray-300">–</span>}
                        </td>
                        <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RISIKO_COLORS[a.risiko]}`}>{a.risiko}</span></td>
                        <td className="px-2 py-2">
                          <button onClick={() => startEdit(a)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-hi-navy bg-gray-100 hover:bg-hi-navy hover:text-white transition-colors text-xs font-medium" title="Bearbeiten">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            ✎
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Risikoampel: Nicht cloudfähige Lizenz + Vertragsende &lt; 6 Monate + Hohe Migrationskomplexität = Hoch.
        Felder können direkt in der Tabelle bearbeitet werden (Stift-Icon).
      </p>
      </> }

      {/* Block 9 — SAM-Compliance Tab */}
      {samTab === 'sam' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'SAM-Vollständigkeit', value: `${samStats.compliance}%`, sub: `${samStats.vollstaendig} von ${samStats.total} vollständig`, accent: samStats.compliance >= 75 ? 'text-green-700' : samStats.compliance >= 50 ? 'text-amber-700' : 'text-red-700' },
              { label: 'Mit Anbieter', value: samStats.mitAnbieter, sub: `${samStats.total - samStats.mitAnbieter} fehlen`, accent: 'text-hi-accent' },
              { label: 'Mit Lizenzmodell', value: samStats.mitModell, sub: `${samStats.total - samStats.mitModell} fehlen`, accent: 'text-hi-accent' },
              { label: 'Cloudfähigkeit unklar', value: samStats.unklar, sub: 'Klärungsbedarf', accent: samStats.unklar > 0 ? 'text-amber-700' : 'text-green-700' },
            ].map(kpi => (
              <div key={kpi.label} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                <div className={`text-xl font-bold ${kpi.accent}`}>{kpi.value}</div>
                <div className="text-xs font-medium text-gray-700 mt-0.5">{kpi.label}</div>
                <div className="text-xs text-gray-400">{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* Vollständigkeits-Matrix */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-hi-navy uppercase tracking-wider">SAM-Vollständigkeitsmatrix</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-hi-gray">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold text-hi-slate">Anwendung</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-hi-slate">Anbieter</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-hi-slate">Modell</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-hi-slate">Kosten</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-hi-slate">Vertragsende</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-hi-slate">Cloudfähig</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-hi-slate">Vollständig</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {anwendungen.map(a => {
                    const checks = [!!a.lizenzAnbieter, !!a.lizenzmodell, !!a.lizenzkosten, !!a.vertragsende, !!a.lizenzCloudfaehig && a.lizenzCloudfaehig !== 'Unklar'];
                    const vollst = checks.every(Boolean);
                    const Check = ({ ok }: { ok: boolean }) => (
                      <span className={ok ? 'text-green-600 font-bold' : 'text-red-400'}>
                        {ok ? '✓' : '✗'}
                      </span>
                    );
                    return (
                      <tr key={a.id} className={vollst ? 'bg-green-50/30' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-2 font-medium text-hi-navy">
                          <span className="font-mono text-hi-accent text-[10px] mr-1.5">{a.kuerzel}</span>
                          {a.name}
                        </td>
                        <td className="px-3 py-2 text-center"><Check ok={!!a.lizenzAnbieter} /></td>
                        <td className="px-3 py-2 text-center"><Check ok={!!a.lizenzmodell} /></td>
                        <td className="px-3 py-2 text-center"><Check ok={!!a.lizenzkosten} /></td>
                        <td className="px-3 py-2 text-center"><Check ok={!!a.vertragsende} /></td>
                        <td className="px-3 py-2 text-center"><Check ok={!!a.lizenzCloudfaehig && a.lizenzCloudfaehig !== 'Unklar'} /></td>
                        <td className="px-3 py-2 text-center">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${vollst ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {vollst ? 'Vollst.' : 'Lücken'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SAM-Handlungsempfehlungen */}
          {samStats.compliance < 100 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-800 mb-2">SAM-Handlungsempfehlungen</p>
              <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                {samStats.total - samStats.mitAnbieter > 0 && <li>{samStats.total - samStats.mitAnbieter} Anwendung(en) ohne Anbieter-Angabe — für Audits und Vertragsverhandlungen erforderlich.</li>}
                {samStats.total - samStats.mitModell > 0 && <li>{samStats.total - samStats.mitModell} Anwendung(en) ohne Lizenzmodell — Named User, Core, Site License unterscheiden sich massiv im Cloud-Betrieb.</li>}
                {samStats.total - samStats.mitKosten > 0 && <li>{samStats.total - samStats.mitKosten} Anwendung(en) ohne Kostendaten — TCO-Berechnung und Business Case nicht vollständig möglich.</li>}
                {samStats.unklar > 0 && <li>{samStats.unklar} Anwendung(en) mit unklarer Cloud-Fähigkeit — vor Migration mit Anbieter oder Lizenzberater klären (SPLA, Cloud-Rider, BYOL).</li>}
                {samStats.neinCloud > 0 && <li>{samStats.neinCloud} Anwendung(en) lizenzrechtlich NICHT cloud-fähig — SaaS-Alternative (Repurchase) oder Lizenz-Upgrade erforderlich.</li>}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface RenewalEmailProps {
  customerName: string;
  anwendungen: Anwendung[];
  onClose: () => void;
}

const RenewalEmailModal: React.FC<RenewalEmailProps> = ({ customerName, anwendungen, onClose }) => {
  const heute = new Date();
  const auslaufend = anwendungen
    .filter(a => {
      if (!a.vertragsende) return false;
      const monate = (new Date(a.vertragsende).getTime() - heute.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return monate < 12;
    })
    .sort((a, b) => (a.vertragsende ?? '').localeCompare(b.vertragsende ?? ''));

  const listLines = auslaufend.map(a => {
    const monate = Math.round((new Date(a.vertragsende!).getTime() - heute.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const datum = new Date(a.vertragsende!).toLocaleDateString('de-DE');
    return `  - ${a.name}${a.lizenzAnbieter ? ` (${a.lizenzAnbieter})` : ''}: Vertragsende ${datum} (in ca. ${monate} Monat${monate !== 1 ? 'en' : ''})`;
  }).join('\n');

  const emailText = `Betreff: Lizenzverträge mit Handlungsbedarf – ${customerName || 'Ihr Unternehmen'}

Guten Tag,

im Rahmen unserer Lizenz- und Kostenanalyse haben wir folgende Anwendungen identifiziert, deren Verträge in den nächsten 12 Monaten auslaufen:

${listLines}

Wir empfehlen, frühzeitig mit den jeweiligen Anbietern in Verhandlungen zu treten — insbesondere dann, wenn im Zuge der Cloud-Migration eine Umstellung des Lizenzmodells geplant ist (z.B. von Perpetual auf Subscription oder SaaS).

Bitte prüfen Sie für diese Verträge:
  1. Verlängerung zu aktuellen Konditionen (Kosten, Laufzeit)
  2. Migration auf Cloud-natives Modell vor Vertragsende
  3. Ablösung durch alternative Lösung

Wir stehen für eine Abstimmung der nächsten Schritte gern zur Verfügung.

Mit freundlichen Grüßen`;

  const handleCopy = () => {
    navigator.clipboard.writeText(emailText).then(() => alert('E-Mail-Text kopiert!'));
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-hi-navy">Verlängerungs-E-Mail</h3>
            <p className="text-xs text-gray-500 mt-0.5">{auslaufend.length} Vertrag{auslaufend.length !== 1 ? 'e' : ''} mit Ablauf in &lt;12 Monaten</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {auslaufend.map(a => {
              const monate = Math.round((new Date(a.vertragsende!).getTime() - heute.getTime()) / (1000 * 60 * 60 * 24 * 30));
              return (
                <span key={a.id} className={`text-xs px-2 py-1 rounded-full border font-medium ${monate < 3 ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                  {a.name} · {monate}M
                </span>
              );
            })}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Entwurf (bearbeitbar)</label>
            <textarea
              defaultValue={emailText}
              rows={16}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-hi-accent outline-none resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Schließen</button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-hi-navy text-white rounded-lg text-sm font-medium hover:bg-hi-navy/90"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Text kopieren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
