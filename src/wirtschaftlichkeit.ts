import type { AppState, CategoryKey } from './types';

/**
 * Wirtschaftlichkeit / AfA — lineare Abschreibung (Decision 4).
 *
 * Buchwert-Berechnung und Aggregation der Einzel-Objektkosten in die TCO-Ist-Summe.
 * Alle Eingabewerte sind Strings (Datenmodell-Konvention) und werden tolerant
 * geparst (deutsche Tausender/Komma-Formate, Einheiten-Suffixe wie "€").
 */

/** Parst einen numerischen String tolerant (entfernt Einheiten, dt. Komma). */
export function parseNum(s: string | undefined | null): number {
  if (!s) return 0;
  const cleaned = String(s).replace(/[^0-9.,-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export interface BuchwertErgebnis {
  /** Aktueller Restbuchwert in € (>= 0). */
  buchwert: number;
  /** Bereits abgeschriebener Betrag in €. */
  abschreibungBisher: number;
  /** Jährliche lineare AfA-Rate in €. */
  jahresAfa: number;
  /** Verstrichene Jahre seit Anschaffung (Dezimal). */
  verstricheneJahre: number;
  /** Restliche Nutzungsdauer in Jahren (>= 0). */
  restlaufzeit: number;
  /** true, wenn vollständig abgeschrieben. */
  abgeschrieben: boolean;
}

/**
 * Lineare AfA: Buchwert = Anschaffungspreis − (Jahres-AfA × verstrichene Jahre),
 * Jahres-AfA = Anschaffungspreis / Abschreibungsdauer. Restwert nie < 0.
 */
export function berechneBuchwert(
  anschaffungsdatum: string | undefined,
  anschaffungspreis: string | undefined,
  abschreibungsdauerJahre: string | undefined,
  stichtag: Date = new Date()
): BuchwertErgebnis | null {
  const preis = parseNum(anschaffungspreis);
  const dauer = parseNum(abschreibungsdauerJahre);
  if (preis <= 0 || dauer <= 0 || !anschaffungsdatum) return null;

  const start = new Date(anschaffungsdatum);
  if (Number.isNaN(start.getTime())) return null;

  const msProJahr = 365.25 * 24 * 60 * 60 * 1000;
  const verstricheneJahre = Math.max(0, (stichtag.getTime() - start.getTime()) / msProJahr);
  const jahresAfa = preis / dauer;
  const abschreibungBisher = Math.min(preis, jahresAfa * verstricheneJahre);
  const buchwert = Math.max(0, preis - abschreibungBisher);
  const restlaufzeit = Math.max(0, dauer - verstricheneJahre);

  return {
    buchwert: Math.round(buchwert * 100) / 100,
    abschreibungBisher: Math.round(abschreibungBisher * 100) / 100,
    jahresAfa: Math.round(jahresAfa * 100) / 100,
    verstricheneJahre: Math.round(verstricheneJahre * 100) / 100,
    restlaufzeit: Math.round(restlaufzeit * 100) / 100,
    abgeschrieben: buchwert <= 0,
  };
}

/** Kategorien mit Wirtschaftlichkeits-Feldern (siehe WIRTSCHAFT_RELEVANT). */
export const WIRTSCHAFT_CATEGORIES: CategoryKey[] = [
  'server', 'clients', 'netzkomponenten', 'icsSysteme', 'iotSysteme', 'datentraeger', 'anwendungen',
];

export interface AssetKostenZeile {
  category: CategoryKey;
  categoryLabel: string;
  id: string;
  kuerzel: string;
  name: string;
  anschaffungspreis: number;
  betriebskostenJahr: number;
  wartungskostenJahr: number;
  buchwert: BuchwertErgebnis | null;
}

export interface ObjektkostenSumme {
  /** Summe aller Anschaffungspreise (CAPEX / Hardware-Investition). */
  anschaffungGesamt: number;
  /** Summe der Betriebskosten pro Jahr. */
  betriebskostenJahr: number;
  /** Summe der Wartungskosten pro Jahr. */
  wartungskostenJahr: number;
  /** Summe der aktuellen Buchwerte (Asset-Restwert). */
  buchwertGesamt: number;
  /** Summe der jährlichen linearen AfA (= Hardware-Abschreibung/Jahr). */
  jahresAfaGesamt: number;
  /** Summe der Lizenzkosten (aus Anwendungen). */
  lizenzkostenJahr: number;
  zeilen: AssetKostenZeile[];
}

const CATEGORY_LABELS: Record<string, string> = {
  server: 'Server', clients: 'Clients', netzkomponenten: 'Netzkomponenten',
  icsSysteme: 'ICS-Systeme', iotSysteme: 'IoT-Systeme', datentraeger: 'Datenträger',
  anwendungen: 'Anwendungen',
};

/**
 * Aggregiert die per-Objekt erfassten Wirtschaftlichkeitsdaten über alle
 * Kategorien (Single Source of Truth für die TCO-Ist-Summe).
 */
export function summiereObjektkosten(state: AppState, stichtag: Date = new Date()): ObjektkostenSumme {
  const zeilen: AssetKostenZeile[] = [];
  let anschaffungGesamt = 0;
  let betriebskostenJahr = 0;
  let wartungskostenJahr = 0;
  let buchwertGesamt = 0;
  let jahresAfaGesamt = 0;
  let lizenzkostenJahr = 0;

  for (const cat of WIRTSCHAFT_CATEGORIES) {
    const items = (state[cat] ?? []) as unknown as Record<string, string>[];
    for (const item of items) {
      const anschaffung = parseNum(item.anschaffungspreis);
      const betrieb = parseNum(item.betriebskostenJahr);
      const wartung = parseNum(item.wartungskostenJahr);
      const lizenz = cat === 'anwendungen' ? parseNum(item.lizenzkosten) : 0;
      const bw = berechneBuchwert(item.anschaffungsdatum, item.anschaffungspreis, item.abschreibungsdauer, stichtag);

      anschaffungGesamt += anschaffung;
      betriebskostenJahr += betrieb;
      wartungskostenJahr += wartung;
      lizenzkostenJahr += lizenz;
      if (bw) {
        buchwertGesamt += bw.buchwert;
        jahresAfaGesamt += bw.jahresAfa;
      }

      // Nur Zeilen mit irgendeiner wirtschaftlichen Angabe aufnehmen.
      if (anschaffung > 0 || betrieb > 0 || wartung > 0 || lizenz > 0) {
        zeilen.push({
          category: cat,
          categoryLabel: CATEGORY_LABELS[cat] ?? cat,
          id: item.id,
          kuerzel: item.kuerzel,
          name: item.name,
          anschaffungspreis: anschaffung,
          betriebskostenJahr: betrieb,
          wartungskostenJahr: wartung,
          buchwert: bw,
        });
      }
    }
  }

  return {
    anschaffungGesamt: Math.round(anschaffungGesamt * 100) / 100,
    betriebskostenJahr: Math.round(betriebskostenJahr * 100) / 100,
    wartungskostenJahr: Math.round(wartungskostenJahr * 100) / 100,
    buchwertGesamt: Math.round(buchwertGesamt * 100) / 100,
    jahresAfaGesamt: Math.round(jahresAfaGesamt * 100) / 100,
    lizenzkostenJahr: Math.round(lizenzkostenJahr * 100) / 100,
    zeilen,
  };
}
