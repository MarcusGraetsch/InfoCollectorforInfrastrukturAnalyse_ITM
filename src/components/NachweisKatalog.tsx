import { useState, useMemo } from 'react';
import type { AppState } from '../types';
import { NACHWEIS_KATALOG, NACHWEIS_KATEGORIEN } from '../compliance/nachweise';
import type { NachweisKategorie } from '../compliance/nachweise';
import { openPrintWindow, esc, printHeader, printFooter } from '../utils/safePrint';

interface Props {
  state: AppState;
  onUpdate: (status: Record<string, { vorhanden: boolean; notiz: string }>) => void;
}

const KAT_FARBE: Record<NachweisKategorie, string> = {
  Datenschutz: 'bg-blue-100 text-blue-800',
  Cybersicherheit: 'bg-red-100 text-red-800',
  Souveränität: 'bg-purple-100 text-purple-800',
  KI: 'bg-teal-100 text-teal-800',
  'Supply-Chain': 'bg-amber-100 text-amber-800',
};

export function NachweisKatalog({ state, onUpdate }: Props) {
  const status = state.nachweisStatus ?? {};
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const counts = useMemo(() => {
    const vorhanden = NACHWEIS_KATALOG.filter((n) => status[n.id]?.vorhanden).length;
    return { vorhanden, gesamt: NACHWEIS_KATALOG.length };
  }, [status]);

  const setItem = (id: string, changes: Partial<{ vorhanden: boolean; notiz: string }>) => {
    const prev = status[id] ?? { vorhanden: false, notiz: '' };
    onUpdate({ ...status, [id]: { ...prev, ...changes } });
  };

  const toggleGroup = (k: string) => setCollapsed((c) => ({ ...c, [k]: !c[k] }));

  const offene = NACHWEIS_KATALOG.filter((n) => !status[n.id]?.vorhanden);

  const emailKopieren = async () => {
    const lines = [
      `Sehr geehrte Damen und Herren,`,
      ``,
      `für die Cloud-/Compliance-Bewertung benötigen wir von Ihnen folgende Nachweise/Unterlagen:`,
      ``,
      ...offene.map((n, i) => `${i + 1}. ${n.nachweis}\n   (Anforderung: ${n.anforderung} — Quelle: ${n.quelle})`),
      ``,
      `Bitte stellen Sie uns die genannten Dokumente bereit. Vielen Dank.`,
      ``,
      `Mit freundlichen Grüßen`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      alert(`E-Mail-Text mit ${offene.length} offenen Nachweis-Anforderungen in die Zwischenablage kopiert.`);
    } catch {
      alert('Kopieren fehlgeschlagen — bitte manuell auswählen.');
    }
  };

  const drucken = () => {
    const rows = NACHWEIS_KATEGORIEN.map((kat) => {
      const items = NACHWEIS_KATALOG.filter((n) => n.kategorie === kat);
      const body = items.map((n) => {
        const s = status[n.id];
        return `<tr><td>${s?.vorhanden ? '✓' : '—'}</td><td>${esc(n.anforderung)}</td><td>${esc(n.nachweis)}</td><td>${esc(n.quelle)}</td><td>${esc(s?.notiz ?? '')}</td></tr>`;
      }).join('');
      return `<h2>${esc(kat)}</h2><table><thead><tr><th>Vorh.</th><th>Anforderung</th><th>Benötigter Nachweis</th><th>Quelle</th><th>Status/Fundstelle</th></tr></thead><tbody>${body}</tbody></table>`;
    }).join('');
    openPrintWindow(
      'Nachweis-Katalog',
      `${printHeader('Nachweis-/Evidence-Katalog', state.customerName)}${rows}${printFooter()}`
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-hi-navy">Nachweis-/Evidence-Katalog</h2>
          <p className="text-sm text-gray-500 mt-1">
            Welche Nachweise sind vom Cloud-/KI-Provider einzuholen? {counts.vorhanden}/{counts.gesamt} als vorhanden markiert.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={emailKopieren} className="px-3 py-2 text-sm font-medium rounded-lg bg-hi-accent text-white hover:opacity-90">
            Offene Nachweise als E-Mail-Anforderung
          </button>
          <button onClick={drucken} className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 text-hi-navy hover:border-hi-navy">
            Drucken
          </button>
        </div>
      </div>

      {NACHWEIS_KATEGORIEN.map((kat) => {
        const items = NACHWEIS_KATALOG.filter((n) => n.kategorie === kat);
        const offen = items.filter((n) => !status[n.id]?.vorhanden).length;
        const isCollapsed = collapsed[kat];
        return (
          <section key={kat} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => toggleGroup(kat)}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50"
            >
              <span className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${KAT_FARBE[kat]}`}>{kat}</span>
                <span className="text-sm text-gray-500">{items.length} Anforderungen · {offen} offen</span>
              </span>
              <span className="text-gray-400 text-sm">{isCollapsed ? '▸' : '▾'}</span>
            </button>
            {!isCollapsed && (
              <div className="divide-y divide-gray-100 border-t border-gray-100">
                {items.map((n) => {
                  const s = status[n.id] ?? { vorhanden: false, notiz: '' };
                  return (
                    <div key={n.id} className="px-5 py-3 flex gap-3 items-start">
                      <input
                        type="checkbox"
                        checked={s.vorhanden}
                        onChange={(e) => setItem(n.id, { vorhanden: e.target.checked })}
                        className="mt-1 h-4 w-4 accent-hi-accent flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-hi-navy">{n.anforderung}</div>
                        <div className="text-xs text-gray-600 mt-0.5">{n.nachweis}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">Quelle: {n.quelle}</div>
                        <input
                          type="text"
                          value={s.notiz}
                          onChange={(e) => setItem(n.id, { notiz: e.target.value })}
                          placeholder="Status / Fundstelle (optional)"
                          className="mt-2 w-full text-xs border border-gray-200 rounded-md px-2 py-1 focus:border-hi-accent focus:outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
