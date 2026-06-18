import type { AppState } from '../types';
import { CATEGORIES } from '../categories';
import { assessAll, summarize } from '../cloudReadiness';

function esc(v: unknown): string {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function scoreColor(score: number): string {
  if (score >= 70) return '#16a34a';
  if (score >= 40) return '#d97706';
  return '#dc2626';
}

export function exportConsultantReport(state: AppState): void {
  const assessed = assessAll(state);
  const summary = summarize(assessed);
  const date = new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' });
  const dateISO = new Date().toISOString().split('T')[0];

  const categoryRows = CATEGORIES.map((cat) => {
    const count = (state[cat.key] as unknown[]).length;
    return `<tr><td>${esc(cat.label)}</td><td style="text-align:center">${count}</td></tr>`;
  }).join('');

  const cloudRows = assessed.map((item) => {
    const col = scoreColor(item.result.score);
    return `<tr>
      <td>${esc(item.kuerzel)}</td>
      <td>${esc(item.name)}</td>
      <td>${esc(item.categoryLabel)}</td>
      <td style="text-align:center;font-weight:600;color:${col}">${item.result.score}</td>
      <td>${esc(item.result.level)}</td>
      <td>${esc(item.result.empfehlung)}</td>
      <td style="text-align:center">${item.result.souveraen ? 'Ja' : '–'}</td>
    </tr>`;
  }).join('');

  const categoryDetailSections = CATEGORIES.map((cat) => {
    const items = state[cat.key] as unknown as Record<string, unknown>[];
    if (items.length === 0) return '';
    const headers = cat.fields.map((f) => `<th>${esc(f.label)}</th>`).join('');
    const rows = items.map((item) => {
      const cells = cat.fields.map((f) => {
        const val = item[f.key];
        const display = Array.isArray(val) ? val.join(', ') : String(val ?? '');
        return `<td>${esc(display)}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    return `
      <section class="page-break">
        <h2>${esc(cat.label)} <span class="badge">${items.length}</span></h2>
        <div class="table-wrap">
          <table>
            <thead><tr>${headers}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>`;
  }).join('');

  const dispositionTable = Object.entries(summary.dispositionCounts)
    .map(([k, v]) => `<tr><td>${esc(k)}</td><td>${v}</td></tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>IT Strukturanalyse – ${esc(state.customerName)}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1a1a2e; background: #fff; }
  a { color: #0057B8; }

  /* Header */
  .report-header { background: #001B4E; color: #fff; padding: 32px 48px; }
  .report-header .brand { font-size: 10pt; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 8px; }
  .report-header h1 { font-size: 24pt; font-weight: 700; margin-bottom: 4px; }
  .report-header .subtitle { font-size: 11pt; color: rgba(255,255,255,0.75); }
  .report-header .meta { margin-top: 20px; display: flex; gap: 32px; font-size: 9pt; color: rgba(255,255,255,0.55); }
  .report-header .meta strong { color: rgba(255,255,255,0.9); }

  /* Content */
  .content { padding: 32px 48px; }

  h2 { font-size: 14pt; font-weight: 700; color: #001B4E; margin: 32px 0 12px; padding-bottom: 6px; border-bottom: 2px solid #0057B8; display: flex; align-items: center; gap: 10px; }
  h3 { font-size: 11pt; font-weight: 600; color: #003087; margin: 20px 0 8px; }

  .badge { background: #0057B8; color: #fff; font-size: 8pt; padding: 2px 8px; border-radius: 99px; font-weight: 700; }

  /* Summary cards */
  .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0 24px; }
  .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; }
  .card .label { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.1em; color: #6B7A99; margin-bottom: 6px; }
  .card .value { font-size: 20pt; font-weight: 700; color: #001B4E; }
  .card.green .value { color: #16a34a; }
  .card.amber .value { color: #d97706; }
  .card.red .value { color: #dc2626; }
  .card.blue .value { color: #0057B8; }

  /* Tables */
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  thead tr { background: #001B4E; color: #fff; }
  thead th { padding: 8px 10px; text-align: left; font-weight: 600; font-size: 8.5pt; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody tr:hover { background: #eff6ff; }
  td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }

  /* Sections */
  section { margin-bottom: 32px; }
  .intro-box { background: #f0f6ff; border-left: 4px solid #0057B8; padding: 14px 18px; border-radius: 0 8px 8px 0; font-size: 10pt; color: #003087; margin-bottom: 24px; }

  /* Footer */
  .report-footer { margin-top: 48px; padding: 20px 48px; background: #f4f6fa; border-top: 1px solid #e2e8f0; font-size: 8.5pt; color: #6B7A99; display: flex; justify-content: space-between; }

  /* Print */
  @media print {
    body { font-size: 9.5pt; }
    .report-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    thead tr { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page-break { page-break-before: always; }
    .no-print { display: none; }
    .summary-grid { grid-template-columns: repeat(4, 1fr); }
  }
</style>
</head>
<body>

<header class="report-header">
  <div class="brand">HiSolutions AG · Vertraulich</div>
  <h1>IT Strukturanalyse</h1>
  <div class="subtitle">Cloud-Readiness-Bewertung nach BSI IT-Grundschutz 200-2</div>
  <div class="meta">
    <span><strong>Kunde:</strong> ${esc(state.customerName) || '–'}</span>
    <span><strong>Erstellt:</strong> ${date}</span>
    <span><strong>Bewerter:</strong> HiSolutions AG</span>
  </div>
</header>

<div class="content">

  <div class="intro-box">
    Dieses Dokument enthält die Ergebnisse der IT-Strukturanalyse für <strong>${esc(state.customerName) || 'den Kunden'}</strong>.
    Es dient als Arbeitsgrundlage für den Cloud-Readiness-Workshop und ist vertraulich zu behandeln.
  </div>

  <!-- Übersicht -->
  <section>
    <h2>Gesamtübersicht</h2>
    <div class="summary-grid">
      <div class="card blue">
        <div class="label">Objekte gesamt</div>
        <div class="value">${summary.total}</div>
      </div>
      <div class="card green">
        <div class="label">Cloud-ready (Hoch)</div>
        <div class="value">${summary.hoch}</div>
      </div>
      <div class="card amber">
        <div class="label">Bedingt (Mittel)</div>
        <div class="value">${summary.mittel}</div>
      </div>
      <div class="card red">
        <div class="label">Kritisch / Niedrig</div>
        <div class="value">${summary.niedrig}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
      <div>
        <h3>Kategorien-Übersicht</h3>
        <table>
          <thead><tr><th>Kategorie</th><th style="text-align:center">Einträge</th></tr></thead>
          <tbody>${categoryRows}</tbody>
        </table>
      </div>
      <div>
        <h3>6R-Disposition</h3>
        <table>
          <thead><tr><th>Strategie</th><th>Anzahl</th></tr></thead>
          <tbody>${dispositionTable || '<tr><td colspan="2">Noch keine Bewertung</td></tr>'}</tbody>
        </table>
        <p style="margin-top:12px;font-size:8.5pt;color:#6B7A99;">
          Ø Readiness-Score: <strong>${summary.avgScore}/100</strong> ·
          Souveräne Cloud erforderlich: <strong>${summary.souveraen}</strong>
        </p>
      </div>
    </div>
  </section>

  <!-- Cloud-Readiness -->
  ${assessed.length > 0 ? `
  <section class="page-break">
    <h2>Cloud-Readiness-Bewertung</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Kürzel</th><th>Name</th><th>Typ</th>
            <th style="text-align:center">Score</th><th>Level</th>
            <th>Empfehlung (6R)</th><th style="text-align:center">Souverän</th>
          </tr>
        </thead>
        <tbody>${cloudRows}</tbody>
      </table>
    </div>
  </section>` : ''}

  <!-- Detaildaten je Kategorie -->
  ${categoryDetailSections}

</div>

<footer class="report-footer">
  <span>HiSolutions AG · IT Strukturanalyse · ${esc(state.customerName)}</span>
  <span>Erstellt: ${date} · Vertraulich</span>
</footer>

</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `IT-Strukturanalyse-Bericht_${state.customerName || 'Export'}_${dateISO}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
