import type { AppState, CategoryKey, Beziehung, BeziehungsTyp } from '../types';
import { CATEGORIES } from '../categories';

export const VERBINDUNGSMEDIEN: string[] = [
  'Kabel (Ethernet / LAN)',
  'Glasfaser',
  'USB',
  'Seriell (RS232 / RS485)',
  'WiFi / WLAN',
  'Bluetooth',
  'ZigBee',
  'LoRaWAN',
  'NFC',
  'Mobilfunk (4G / 5G)',
  'Funk / RF (proprietär)',
  'Sonstige',
];

export const BEZIEHUNGS_TYPEN: { typ: BeziehungsTyp; label: string; defaultRichtung: 'uni' | 'bi'; farbe: string }[] = [
  { typ: 'kommuniziert', label: 'Kommuniziert mit',          defaultRichtung: 'bi',  farbe: '#0891b2' },
  { typ: 'physisch',     label: 'Physisch verbunden mit',    defaultRichtung: 'uni', farbe: '#7c3aed' },
  { typ: 'treiber',      label: 'Treiber / Software für',    defaultRichtung: 'uni', farbe: '#ca8a04' },
  { typ: 'abhaengig',    label: 'Abhängig von',              defaultRichtung: 'uni', farbe: '#dc2626' },
  { typ: 'teil-von',     label: 'Teil von / Komponente von', defaultRichtung: 'uni', farbe: '#16a34a' },
  { typ: 'redundanz',    label: 'Redundant zu / Cluster',    defaultRichtung: 'bi',  farbe: '#2563eb' },
];

export const TYP_LABEL: Record<BeziehungsTyp, string> = Object.fromEntries(
  BEZIEHUNGS_TYPEN.map(t => [t.typ, t.label])
) as Record<BeziehungsTyp, string>;

export function objektLabel(state: AppState, kat: CategoryKey, id: string): string | null {
  const arr = (state[kat] as unknown as { id: string; kuerzel?: string; name?: string }[]) ?? [];
  const o = arr.find(x => x.id === id);
  return o ? (o.kuerzel ? `${o.kuerzel} · ${o.name ?? ''}`.trim() : (o.name ?? id)) : null;
}

export function kategorieLabel(kat: CategoryKey): string {
  return CATEGORIES.find(c => c.key === kat)?.label ?? String(kat);
}

/** All edges where the item is source or target. */
export function beziehungenFuerObjekt(state: AppState, kat: CategoryKey, id: string): Beziehung[] {
  return (state.beziehungen ?? []).filter(b =>
    (b.quelleKategorie === kat && b.quelleId === id) || (b.zielKategorie === kat && b.zielId === id));
}

/** Removes edges whose endpoints no longer exist. */
export function pruneOrphanBeziehungen(state: AppState): Beziehung[] {
  const exists = (kat: CategoryKey, id: string) =>
    ((state[kat] as unknown as { id: string }[]) ?? []).some(x => x.id === id);
  return (state.beziehungen ?? []).filter(b => exists(b.quelleKategorie, b.quelleId) && exists(b.zielKategorie, b.zielId));
}

export function addBeziehung(list: Beziehung[], b: Beziehung): Beziehung[] { return [...list, b]; }
export function removeBeziehung(list: Beziehung[], id: string): Beziehung[] { return list.filter(b => b.id !== id); }
