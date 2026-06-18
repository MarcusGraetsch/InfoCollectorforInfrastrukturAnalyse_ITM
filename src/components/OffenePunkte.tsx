import React, { useMemo, useState } from 'react';
import type { AppState, CategoryKey, CloudFields } from '../types';
import { ASSESSABLE_CATEGORIES } from '../cloudReadiness';

const CATEGORY_LABELS: Record<string, string> = {
  anwendungen: 'Anwendungen',
  server: 'Server',
  clients: 'Clients',
  icsSysteme: 'ICS-Systeme',
  iotSysteme: 'IoT-Systeme',
};

interface OpenField {
  fieldKey: keyof CloudFields;
  label: string;
  currentValue: string;
  isUnklar: boolean; // true = explizit Unklar, false = leer/nicht erfasst
  question: string;
  theme: 'Betrieb & Bereitstellung' | 'Lizenz & Kosten' | 'Lebenszyklus & Technik' | 'Sicherheit & Compliance';
}

interface OpenItem {
  id: string;
  kuerzel: string;
  name: string;
  category: CategoryKey;
  categoryLabel: string;
  openFields: OpenField[];
}

const FIELD_DEFS: {
  key: keyof CloudFields;
  label: string;
  theme: OpenField['theme'];
  question: (name: string) => string;
}[] = [
  {
    key: 'schutzbedarf',
    label: 'Schutzbedarf',
    theme: 'Sicherheit & Compliance',
    question: (n) => `Wie hoch ist der Schutzbedarf von „${n}"? (Normal / Hoch / Sehr hoch) — Relevant für Vertraulichkeit, Integrität und Verfügbarkeit.`,
  },
  {
    key: 'bereitstellung',
    label: 'Bereitstellung',
    theme: 'Betrieb & Bereitstellung',
    question: (n) => `Wo läuft „${n}" aktuell? On-Premises (physisch/virtualisiert), Hybrid, Private Cloud oder bereits SaaS/Public Cloud?`,
  },
  {
    key: 'lizenzCloudfaehig',
    label: 'Lizenz cloudfähig',
    theme: 'Lizenz & Kosten',
    question: (n) => `Erlaubt die Lizenz von „${n}" einen Cloud- oder Hosting-Betrieb? Gibt es Cloud-Klauseln, Named-Host- oder On-Premises-Bindungen im Lizenzvertrag?`,
  },
  {
    key: 'migrationskomplexitaet',
    label: 'Migrationskomplexität',
    theme: 'Betrieb & Bereitstellung',
    question: (n) => `Wie komplex wäre eine Migration von „${n}"? Gibt es spezifische Abhängigkeiten, Hardware-Bindungen, proprietäre Schnittstellen oder umfangreiches Customizing?`,
  },
  {
    key: 'lebenszyklus',
    label: 'Lebenszyklus-Status',
    theme: 'Lebenszyklus & Technik',
    question: (n) => `Wie ist der Wartungs- und Supportstatus von „${n}"? Wann läuft der Herstellersupport aus? Gibt es einen geplanten Ablöse- oder Migrationstermin?`,
  },
  {
    key: 'internetfaehig',
    label: 'Internet-/Cloudfähigkeit',
    theme: 'Betrieb & Bereitstellung',
    question: (n) => `Kann „${n}" über das Internet oder aus der Cloud heraus betrieben werden? Gibt es Latenzanforderungen, lokale Hardwareabhängigkeiten oder spezielle Netzwerkanforderungen?`,
  },
  {
    key: 'datensouveraenitaet',
    label: 'Datensouveränität',
    theme: 'Sicherheit & Compliance',
    question: (n) => `Welche regulatorischen Anforderungen gelten für die Daten von „${n}"? Gibt es Vorgaben zu DSGVO, Datenspeicherort (Deutschland/EU) oder Zertifizierungen wie BSI C5 / Gaia-X?`,
  },
];

function isOpen(val: string | undefined): boolean {
  return !val || val === '' || val === 'Unklar';
}

function buildOpenItems(state: AppState): OpenItem[] {
  const result: OpenItem[] = [];
  for (const cat of ASSESSABLE_CATEGORIES) {
    const items = state[cat] as unknown as (CloudFields & { id: string; kuerzel: string; name: string })[];
    for (const item of items) {
      const openFields: OpenField[] = [];
      for (const def of FIELD_DEFS) {
        const val = item[def.key] as string | undefined;
        if (isOpen(val)) {
          openFields.push({
            fieldKey: def.key,
            label: def.label,
            currentValue: val ?? '',
            isUnklar: val === 'Unklar',
            question: def.question(item.name),
            theme: def.theme,
          });
        }
      }
      if (openFields.length > 0) {
        result.push({
          id: item.id,
          kuerzel: item.kuerzel,
          name: item.name,
          category: cat,
          categoryLabel: CATEGORY_LABELS[cat] ?? cat,
          openFields,
        });
      }
    }
  }
  return result;
}

const THEMES: OpenField['theme'][] = [
  'Betrieb & Bereitstellung',
  'Lizenz & Kosten',
  'Lebenszyklus & Technik',
  'Sicherheit & Compliance',
];

const THEME_ICONS: Record<string, string> = {
  'Betrieb & Bereitstellung': '🖥',
  'Lizenz & Kosten': '📄',
  'Lebenszyklus & Technik': '🔄',
  'Sicherheit & Compliance': '🔒',
};

interface Props {
  state: AppState;
}

export const OffenePunkte: React.FC<Props> = ({ state }) => {
  const [tab, setTab] = useState<'liste' | 'interview'>('liste');
  const [filterCategory, setFilterCategory] = useState<CategoryKey | 'alle'>('alle');

  const allOpen = useMemo(() => buildOpenItems(state), [state]);

  const filtered = useMemo(
    () => filterCategory === 'alle' ? allOpen : allOpen.filter(i => i.category === filterCategory),
    [allOpen, filterCategory]
  );

  const byCategory = useMemo(() => {
    const map: Partial<Record<CategoryKey, OpenItem[]>> = {};
    for (const item of filtered) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category]!.push(item);
    }
    return map;
  }, [filtered]);

  const totalFields = filtered.reduce((s, i) => s + i.openFields.length, 0);
  const unklarCount = filtered.reduce((s, i) => s + i.openFields.filter(f => f.isUnklar).length, 0);
  const leerCount = totalFields - unklarCount;

  // Interview: alle Fragen nach Thema gruppiert
  const byTheme = useMemo(() => {
    const map: Partial<Record<OpenField['theme'], { item: OpenItem; field: OpenField }[]>> = {};
    for (const item of filtered) {
      for (const field of item.openFields) {
        if (!map[field.theme]) map[field.theme] = [];
        map[field.theme]!.push({ item, field });
      }
    }
    return map;
  }, [filtered]);

  const handlePrint = () => {
    window.print();
  };

  if (allOpen.length === 0) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-hi-navy mb-2">Keine offenen Punkte</h2>
          <p className="text-sm text-hi-slate">Alle cloud-relevanten Felder sind vollständig erfasst.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      {/* Print-only header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold">Offene Punkte · Interview-Vorbereitung</h1>
        <p className="text-sm text-gray-500 mt-1">
          {state.customerName ? `Kunde: ${state.customerName} · ` : ''}Erstellt: {new Date().toLocaleDateString('de-DE')}
        </p>
        <hr className="mt-3" />
      </div>

      {/* Header */}
      <div className="print:hidden">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-hi-navy">Offene Punkte</h2>
            <p className="text-sm text-hi-slate mt-1">
              Alle cloud-relevanten Felder die noch nicht vollständig bewertet sind.
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-hi-navy text-white rounded-lg text-sm font-semibold hover:bg-hi-blue transition-colors shadow print:hidden"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Drucken / PDF
          </button>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="text-xs font-semibold text-hi-slate uppercase tracking-wider mb-1">Betroffene Objekte</div>
            <div className="text-3xl font-bold text-hi-accent">{filtered.length}</div>
            <div className="text-xs text-gray-400 mt-0.5">von {allOpen.length} insgesamt</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="text-xs font-semibold text-hi-slate uppercase tracking-wider mb-1">Explizit „Unklar"</div>
            <div className="text-3xl font-bold text-amber-500">{unklarCount}</div>
            <div className="text-xs text-gray-400 mt-0.5">Felder die bewusst offen gelassen wurden</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="text-xs font-semibold text-hi-slate uppercase tracking-wider mb-1">Noch nicht erfasst</div>
            <div className="text-3xl font-bold text-red-400">{leerCount}</div>
            <div className="text-xs text-gray-400 mt-0.5">Felder ohne jede Angabe</div>
          </div>
        </div>

        {/* Tabs + Filter */}
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <div className="flex gap-1 bg-hi-gray rounded-lg p-1">
            <button
              onClick={() => setTab('liste')}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${tab === 'liste' ? 'bg-white text-hi-navy shadow-sm' : 'text-hi-slate hover:text-hi-navy'}`}
            >
              Offene Punkte
            </button>
            <button
              onClick={() => setTab('interview')}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${tab === 'interview' ? 'bg-white text-hi-navy shadow-sm' : 'text-hi-slate hover:text-hi-navy'}`}
            >
              Interview-Vorbereitung
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-hi-slate font-medium">Kategorie:</span>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value as CategoryKey | 'alle')}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-hi-navy focus:outline-none focus:ring-2 focus:ring-hi-accent"
            >
              <option value="alle">Alle ({allOpen.length})</option>
              {ASSESSABLE_CATEGORIES.filter(c => byCategory[c]).map(c => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]} ({byCategory[c]?.length})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── TAB: OFFENE PUNKTE ── */}
      {tab === 'liste' && (
        <div className="space-y-4 print:space-y-6">
          {ASSESSABLE_CATEGORIES.filter(c => byCategory[c]).map(cat => (
            <div key={cat} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-hi-gray border-b border-gray-200 flex items-center gap-3">
                <h3 className="text-sm font-bold text-hi-navy uppercase tracking-wider">
                  {CATEGORY_LABELS[cat]}
                </h3>
                <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 font-bold">
                  {byCategory[cat]!.length} Objekte
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {byCategory[cat]!.map(item => (
                  <div key={item.id} className="px-5 py-3 flex items-start gap-4">
                    <div className="w-32 flex-shrink-0">
                      <div className="font-mono text-hi-accent text-xs font-bold">{item.kuerzel}</div>
                      <div className="text-sm font-semibold text-hi-navy mt-0.5 leading-snug">{item.name}</div>
                    </div>
                    <div className="flex-1 flex flex-wrap gap-2">
                      {item.openFields.map(f => (
                        <span
                          key={f.fieldKey}
                          className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                            f.isUnklar
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-red-50 text-red-600 border-red-200'
                          }`}
                        >
                          {f.label}
                          {f.isUnklar ? ' · Unklar' : ' · fehlt'}
                        </span>
                      ))}
                    </div>
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                      {item.openFields.length}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: INTERVIEW-VORBEREITUNG ── */}
      {tab === 'interview' && (
        <div className="space-y-5 print:space-y-8">
          {/* Print-only: intro */}
          <div className="hidden print:block">
            <p className="text-sm text-gray-600 mb-4">
              Strukturierte Fragenliste zur Klärung offener Punkte. Bitte für jede Frage die Antwort ergänzen
              und anschließend im Tool nachtragen.
            </p>
          </div>

          {THEMES.filter(t => byTheme[t]).map(theme => (
            <div key={theme} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden print:border print:shadow-none print:rounded-none">
              <div className="px-5 py-3 bg-hi-gray border-b border-gray-200 flex items-center gap-3">
                <span className="text-base print:text-lg">{THEME_ICONS[theme]}</span>
                <h3 className="text-sm font-bold text-hi-navy uppercase tracking-wider">{theme}</h3>
                <span className="text-xs text-hi-slate ml-auto">{byTheme[theme]!.length} Fragen</span>
              </div>
              <div className="divide-y divide-gray-50">
                {byTheme[theme]!.map(({ item, field }, idx) => (
                  <div key={`${item.id}-${field.fieldKey}`} className="px-5 py-4 print:py-5">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-hi-accent text-white text-xs font-bold flex items-center justify-center mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-hi-accent text-xs font-bold">{item.kuerzel}</span>
                          <span className="text-xs font-semibold text-hi-navy">{item.name}</span>
                          <span className="text-[10px] text-hi-slate bg-hi-gray rounded px-1.5 py-0.5">{item.categoryLabel}</span>
                          {field.isUnklar && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5 font-semibold">Unklar</span>
                          )}
                        </div>
                        <p className="text-sm text-hi-navy leading-relaxed">{field.question}</p>
                        {/* Answer box for print */}
                        <div className="mt-3 border border-dashed border-gray-300 rounded-lg p-3 min-h-[40px] print:min-h-[56px] print:mt-4">
                          <span className="text-xs text-gray-300 print:hidden">Antwort …</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <p className="text-xs text-hi-slate print:hidden">
            Tipp: „Drucken / PDF" oben rechts erzeugt eine vollständige Fragenliste mit Antwortfeldern für das Interview.
          </p>
        </div>
      )}
    </div>
  );
};
