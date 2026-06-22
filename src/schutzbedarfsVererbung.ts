/**
 * Block 4 — CIA-Triade & Schutzbedarfsvererbung
 *
 * Hilfsfunktionen für das dreistufige BSI-Schutzbedarfsmodell
 * (Vertraulichkeit / Integrität / Verfügbarkeit) und die automatische
 * Vererbung des höchsten Niveaus auf abhängige Systeme.
 */

import type { AppState, CIASchutzbedarf, SchutzbedarfNiveau, CloudFields } from './types';

const NIVEAU_ORDER: SchutzbedarfNiveau[] = ['', 'Unklar', 'Normal', 'Hoch', 'Sehr hoch'];

/**
 * Gibt den höheren der beiden Schutzbedarf-Niveaus zurück.
 * Reihenfolge: '' < 'Unklar' < 'Normal' < 'Hoch' < 'Sehr hoch'
 */
export function maxNiveau(a: SchutzbedarfNiveau, b: SchutzbedarfNiveau): SchutzbedarfNiveau {
  const ia = NIVEAU_ORDER.indexOf(a);
  const ib = NIVEAU_ORDER.indexOf(b);
  return ia >= ib ? a : b;
}

/**
 * Extrahiert den effektiven Schutzbedarf als einfachen String aus einem
 * CloudFields-Objekt — unabhängig davon, ob schutzbedarf ein String-Literal
 * oder ein CIASchutzbedarf-Objekt ist.
 *
 * Für CIA-Objekte: gibt das Maximum der drei Dimensionen zurück (Maximumprinzip).
 */
export function getEffektiverSchutzbedarf(item: CloudFields): SchutzbedarfNiveau {
  const sb = item.schutzbedarf;
  if (!sb) return '';
  if (typeof sb === 'string') return sb as SchutzbedarfNiveau;
  // CIA-Objekt — Maximumprinzip
  return maxNiveau(maxNiveau(sb.vertraulichkeit, sb.integritaet), sb.verfuegbarkeit);
}

/**
 * Konvertiert einen alten String-Schutzbedarf in ein CIASchutzbedarf-Objekt,
 * indem dasselbe Niveau für alle drei Dimensionen gesetzt wird.
 */
export function stringZuCIA(niveau: SchutzbedarfNiveau): CIASchutzbedarf {
  return {
    vertraulichkeit: niveau,
    integritaet: niveau,
    verfuegbarkeit: niveau,
    begruendung: 'Automatisch migriert — bitte präzisieren.',
    vererbt: false,
  };
}

/**
 * Berechnet die Schutzbedarfsvererbung für den gesamten AppState.
 *
 * Logik (vereinfacht nach BSI IT-Grundschutz Maximumprinzip):
 * - Server erben den höchsten Schutzbedarf der darauf laufenden Anwendungen
 * - Clients erben den höchsten Schutzbedarf der Anwendungen
 *
 * Gibt einen neuen AppState zurück (immutable — originale Items bleiben unverändert
 * wenn kein Erben nötig ist).
 */
export function berechneVererbung(state: AppState): AppState {
  // Baue Lookup: SystemId → höchster Schutzbedarf der zugeordneten Anwendungen
  const anwendungSB = new Map<string, SchutzbedarfNiveau>();

  for (const anw of state.anwendungen) {
    const eff = getEffektiverSchutzbedarf(anw);
    for (const srvId of (anw.itSysteme ?? [])) {
      const prev = anwendungSB.get(srvId) ?? '';
      anwendungSB.set(srvId, maxNiveau(prev, eff));
    }
  }

  // Server: wenn kein Schutzbedarf gesetzt, vererben
  const newServer = state.server.map((srv) => {
    const erbNiveau = anwendungSB.get(srv.id);
    if (!erbNiveau) return srv;
    const effSrv = getEffektiverSchutzbedarf(srv);
    const inherited = maxNiveau(effSrv, erbNiveau);
    if (inherited === effSrv) return srv; // kein Update nötig
    const ciaSrv: CIASchutzbedarf = typeof srv.schutzbedarf === 'object' && srv.schutzbedarf
      ? { ...srv.schutzbedarf }
      : { vertraulichkeit: effSrv, integritaet: effSrv, verfuegbarkeit: effSrv };
    ciaSrv.vertraulichkeit = maxNiveau(ciaSrv.vertraulichkeit, erbNiveau);
    ciaSrv.integritaet     = maxNiveau(ciaSrv.integritaet,     erbNiveau);
    ciaSrv.verfuegbarkeit  = maxNiveau(ciaSrv.verfuegbarkeit,  erbNiveau);
    ciaSrv.vererbt = true;
    ciaSrv.begruendung = `Vererbt von Anwendungen (Maximumprinzip, BSI IT-Grundschutz).`;
    return { ...srv, schutzbedarf: ciaSrv };
  });

  return { ...state, server: newServer };
}
