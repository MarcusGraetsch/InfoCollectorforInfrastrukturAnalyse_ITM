/**
 * Block 7 — EnEfG / CO₂ Nachhaltigkeitsmodul
 *
 * Einfaches Energieprofil-Modell für Rechenzentren und Cloud-Migration.
 * Basiert auf öffentlichen Richtwerten (Uptime Institute, IEA, Bitkom).
 */

import type { AppState, NachhaltigkeitsAnnahmen, Server } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Paket 10 — Transparente, drill-down-fähige Energie-/CO₂-Berechnung je Server
// mit editierbaren Annahmen. Richtwerte als Defaults; alle Annahmen überschreibbar.
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_ANNAHMEN: NachhaltigkeitsAnnahmen = {
  pueOnPrem: 1.6,            // Uptime Institute PUE Global Survey 2023 (Firmen-RZ)
  pueCloud: 1.15,           // Hyperscaler-Durchschnitt
  betriebsstundenJahr: 8760, // 24 × 365
  strommixFaktorOnPrem: 0.380, // UBA Emissionsfaktor DE 2023 (kg CO₂eq/kWh)
  strommixFaktorCloud: 0.200,  // Hyperscaler-Mix (mehr Erneuerbare)
  auslastung: 1.0,          // Volllast-Annahme (konservativ)
  defaultLeistungW: 456,    // ≈ 4.000 kWh/Jahr bei 8760 h (Uptime: 3.000–5.000)
};

/** Führt gespeicherte Annahmen mit den Defaults zusammen (robust gegen fehlende Keys). */
export function mergeAnnahmen(a?: Partial<NachhaltigkeitsAnnahmen>): NachhaltigkeitsAnnahmen {
  return { ...DEFAULT_ANNAHMEN, ...(a ?? {}) };
}

const num = (s: string | undefined): number => {
  const v = parseFloat((s ?? '').toString().replace(',', '.'));
  return Number.isFinite(v) ? v : 0;
};

/** Ermittelt die Leistungsaufnahme (W) eines Servers + Herkunft des Werts. */
export function serverLeistungW(s: Server, annahmen: NachhaltigkeitsAnnahmen): { w: number; quelle: 'gemessen' | 'max' | 'default' } {
  const stromW = num(s.stromverbrauch);
  if (stromW > 0) return { w: stromW, quelle: 'gemessen' };
  const maxKw = num(s.leistungsaufnahmeMax);
  if (maxKw > 0) return { w: maxKw * 1000, quelle: 'max' };
  return { w: annahmen.defaultLeistungW, quelle: 'default' };
}

export interface ServerEnergieZeile {
  id: string;
  name: string;
  kuerzel: string;
  anzahl: number;
  leistungW: number;          // Leistung je Einheit
  quelle: 'gemessen' | 'max' | 'default';
  itKwhJahr: number;          // ohne PUE (gesamt über anzahl)
  energieKwhJahr: number;     // mit PUE On-Prem
  co2KgJahr: number;          // On-Prem
}

export interface EnergieDetail {
  zeilen: ServerEnergieZeile[];
  annahmen: NachhaltigkeitsAnnahmen;
  itKwhJahr: number;          // Summe IT-Energie (ohne PUE)
  onPremKwhJahr: number;
  onPremCo2KgJahr: number;
  cloudKwhJahr: number;
  cloudCo2KgJahr: number;
  einsparungKwhJahr: number;
  einsparungCo2KgJahr: number;
  einsparungProzent: number;  // bezogen auf CO₂
  serverOhneMesswert: number; // Anzahl Server, die den Default nutzen
}

/** Transparente Berechnung je Server (Drill-down) + aggregierte Cloud-Gegenüberstellung. */
export function berechneEnergieDetail(state: AppState, annahmenInput?: Partial<NachhaltigkeitsAnnahmen>): EnergieDetail {
  const annahmen = mergeAnnahmen(annahmenInput ?? state.nachhaltigkeitAnnahmen);
  const servers = state.server ?? [];
  let serverOhneMesswert = 0;

  const zeilen: ServerEnergieZeile[] = servers.map(s => {
    const { w, quelle } = serverLeistungW(s, annahmen);
    if (quelle === 'default') serverOhneMesswert++;
    const anzahl = Math.max(1, Math.round(num(s.anzahl) || 1));
    const itKwh = (w / 1000) * annahmen.betriebsstundenJahr * annahmen.auslastung * anzahl;
    const energieKwh = itKwh * annahmen.pueOnPrem;
    const co2Kg = energieKwh * annahmen.strommixFaktorOnPrem;
    return {
      id: s.id, name: s.name, kuerzel: s.kuerzel, anzahl,
      leistungW: w, quelle,
      itKwhJahr: Math.round(itKwh),
      energieKwhJahr: Math.round(energieKwh),
      co2KgJahr: Math.round(co2Kg),
    };
  });

  const itKwh = zeilen.reduce((sum, z) => sum + z.itKwhJahr, 0);
  const onPremKwh = itKwh * annahmen.pueOnPrem;
  const onPremCo2 = onPremKwh * annahmen.strommixFaktorOnPrem;
  const cloudKwh = itKwh * annahmen.pueCloud;
  const cloudCo2 = cloudKwh * annahmen.strommixFaktorCloud;
  const einsparungKwh = Math.max(0, onPremKwh - cloudKwh);
  const einsparungCo2 = Math.max(0, onPremCo2 - cloudCo2);
  const einsparungProzent = onPremCo2 > 0 ? Math.round((einsparungCo2 / onPremCo2) * 100) : 0;

  return {
    zeilen,
    annahmen,
    itKwhJahr: Math.round(itKwh),
    onPremKwhJahr: Math.round(onPremKwh),
    onPremCo2KgJahr: Math.round(onPremCo2),
    cloudKwhJahr: Math.round(cloudKwh),
    cloudCo2KgJahr: Math.round(cloudCo2),
    einsparungKwhJahr: Math.round(einsparungKwh),
    einsparungCo2KgJahr: Math.round(einsparungCo2),
    einsparungProzent,
    serverOhneMesswert,
  };
}

export interface EnergieProfil {
  serverCount: number;
  estimatedKwhJahr: number;    // kWh/Jahr On-Prem
  estimatedCo2TonnenJahr: number; // t CO₂eq/Jahr On-Prem
  cloudKwhJahr: number;          // kWh/Jahr Cloud (PUE-optimiert)
  cloudCo2TonnenJahr: number;    // t CO₂eq/Jahr Cloud
  einsparungKwh: number;
  einsparungCo2Tonnen: number;
  einsparungProzent: number;
}

export interface NachhaltigkeitsSummary {
  profil: EnergieProfil;
  enefgPflicht: boolean;        // EnEfG: >= 1 MW IT-Leistung => Pflicht
  enefgHinweis: string;
  massnahmen: NachhaltigkeitsMassnahme[];
}

export interface NachhaltigkeitsMassnahme {
  titel: string;
  potenzialKwh: number;
  aufwand: 'Niedrig' | 'Mittel' | 'Hoch';
  beschreibung: string;
}

// Richtwerte (Quellen: IEA 2024, Uptime Institute PUE Global Survey 2023, UBA Emissionsfaktor DE 2023)
const PUE_ON_PREM = 1.6;          // typisches Firmen-RZ
const PUE_CLOUD = 1.15;           // hyperscaler avg
const KWH_PER_SERVER_YEAR = 4000; // kWh/Server/Jahr (Uptime Institute: ~3.000–5.000)
const CO2_FAKTOR_DE = 0.380;       // kg CO₂eq/kWh (UBA 2023 Strommix DE)
const CO2_FAKTOR_CLOUD = 0.200;    // kg CO₂eq/kWh (Hyperscaler: mehr EE, ~0,1–0,3)
const MW_IT_ENEFG_THRESHOLD = 1;   // 1 MW IT-Leistung (EnEfG §6)

export function berechneEnergieProfil(state: AppState): EnergieProfil {
  const serverCount = (state.server?.length ?? 0);
  const clientCount = (state.clients?.length ?? 0);

  // Grobe Schätzung: Server + 20% für Clients/Netz
  const totalServerEquiv = serverCount + Math.round(clientCount * 0.1);

  const onPremKwh = totalServerEquiv * KWH_PER_SERVER_YEAR * PUE_ON_PREM;
  const onPremCo2 = (onPremKwh * CO2_FAKTOR_DE) / 1000; // t

  // Cloud: niedrigerer PUE + besserer Energiemix
  const cloudKwh = totalServerEquiv * KWH_PER_SERVER_YEAR * PUE_CLOUD;
  const cloudCo2 = (cloudKwh * CO2_FAKTOR_CLOUD) / 1000; // t

  const einsparungKwh = Math.max(0, onPremKwh - cloudKwh);
  const einsparungCo2 = Math.max(0, onPremCo2 - cloudCo2);
  const einsparungProzent = onPremKwh > 0 ? Math.round((einsparungKwh / onPremKwh) * 100) : 0;

  return {
    serverCount,
    estimatedKwhJahr: Math.round(onPremKwh),
    estimatedCo2TonnenJahr: Math.round(onPremCo2 * 10) / 10,
    cloudKwhJahr: Math.round(cloudKwh),
    cloudCo2TonnenJahr: Math.round(cloudCo2 * 10) / 10,
    einsparungKwh: Math.round(einsparungKwh),
    einsparungCo2Tonnen: Math.round(einsparungCo2 * 10) / 10,
    einsparungProzent,
  };
}

export function berechneNachhaltigkeit(state: AppState): NachhaltigkeitsSummary {
  const profil = berechneEnergieProfil(state);

  // EnEfG-Pflicht: Rechenzentren mit >= 1 MW IT-Leistung
  // Schätzung: 1 Server ≈ 0,5–1 kW IT-Leistung
  const geschaetzteITMW = (profil.serverCount * 0.7) / 1000;
  const enefgPflicht = geschaetzteITMW >= MW_IT_ENEFG_THRESHOLD;

  const enefgHinweis = enefgPflicht
    ? `Geschätzte IT-Leistung: ${geschaetzteITMW.toFixed(1)} MW — Energieeffizienzgesetz (EnEfG) wahrscheinlich anwendbar. PUE-Monitoring, Jahresbericht und Zielwert PUE ≤ 1,5 (2027) / ≤ 1,3 (2030) beachten.`
    : `Geschätzte IT-Leistung: ${(geschaetzteITMW * 1000).toFixed(0)} kW — unterhalb der EnEfG-Meldeschwelle von 1 MW. Dennoch Effizienzmaßnahmen und ESG-Reporting empfohlen.`;

  const massnahmen: NachhaltigkeitsMassnahme[] = [
    {
      titel: 'Server-Konsolidierung / Virtualisierung',
      potenzialKwh: Math.round(profil.estimatedKwhJahr * 0.25),
      aufwand: 'Mittel',
      beschreibung: 'Phyische Server durch virtuelle Instanzen ersetzen. Typisches Einsparpotenzial: 20–30% Energieverbrauch.',
    },
    {
      titel: 'Abschaltung nicht genutzter Systeme (End-of-Life)',
      potenzialKwh: Math.round(profil.estimatedKwhJahr * 0.10),
      aufwand: 'Niedrig',
      beschreibung: 'End-of-Life-Systeme identifizieren und abschalten. Jeder nicht benötigte Server spart ~4.000 kWh/Jahr.',
    },
    {
      titel: 'Migration auf Hyperscaler-Cloud',
      potenzialKwh: profil.einsparungKwh,
      aufwand: 'Hoch',
      beschreibung: `Durch Migration auf Hyperscaler-Cloud geschätztes Einsparpotenzial: ${profil.einsparungProzent}% Energieverbrauch (PUE-Optimierung + erneuerbarer Strom).`,
    },
    {
      titel: 'Green Cloud Provider / 100% Erneuerbare',
      potenzialKwh: Math.round(profil.cloudKwhJahr * 0.5),
      aufwand: 'Niedrig',
      beschreibung: 'Bei Cloud-Migration explizit CO₂-neutrale Regionen wählen (z.B. Azure Sweden North, AWS eu-north-1). CO₂-Emissionen um 50–90% reduzierbar.',
    },
  ];

  return { profil, enefgPflicht, enefgHinweis, massnahmen };
}
