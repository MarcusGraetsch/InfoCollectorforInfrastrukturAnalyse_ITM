import type { NIS2Assessment, NIS2Einstufung, NIS2MassnahmeStatus } from '../types';

/**
 * NIS2-/BSIG-Betroffenheits- und Readiness-Logik.
 *
 * Grundlage: NIS2-Richtlinie (EU) 2022/2555, Anhang I (Sektoren mit hoher
 * Kritikalität → "besonders wichtige Einrichtungen") und Anhang II (sonstige
 * kritische Sektoren → "wichtige Einrichtungen"), umgesetzt im deutschen
 * NIS2-Umsetzungsgesetz (BSIG, in Kraft seit 06.12.2025).
 *
 * Hinweis: Dies ist eine vereinfachte Orientierungshilfe für das Erstgespräch,
 * keine rechtsverbindliche Einstufung. Im Mandat verifizieren.
 */

export interface SektorGruppe {
  label: string;
  anhang: 'I' | 'II';
  sektoren: string[];
}

export const NIS2_SEKTOR_GRUPPEN: SektorGruppe[] = [
  {
    label: 'Anhang I — Sektoren mit hoher Kritikalität',
    anhang: 'I',
    sektoren: [
      'Energie',
      'Verkehr',
      'Bankwesen',
      'Finanzmarktinfrastruktur',
      'Gesundheitswesen',
      'Trinkwasser',
      'Abwasser',
      'Digitale Infrastruktur',
      'Verwaltung von IKT-Diensten (B2B)',
      'Öffentliche Verwaltung',
      'Weltraum',
    ],
  },
  {
    label: 'Anhang II — Sonstige kritische Sektoren',
    anhang: 'II',
    sektoren: [
      'Post- und Kurierdienste',
      'Abfallbewirtschaftung',
      'Produktion/Handel mit chemischen Stoffen',
      'Produktion/Verarbeitung von Lebensmitteln',
      'Verarbeitendes Gewerbe / Herstellung von Waren',
      'Anbieter digitaler Dienste',
      'Forschung',
    ],
  },
];

export const NIS2_SEKTOR_ANHANG: Record<string, 'I' | 'II'> = (() => {
  const map: Record<string, 'I' | 'II'> = {};
  for (const g of NIS2_SEKTOR_GRUPPEN) {
    for (const s of g.sektoren) map[s] = g.anhang;
  }
  return map;
})();

export interface NIS2Massnahme {
  key: string;
  label: string;
  hilfe: string;
}

/** Die 10 Mindestmaßnahmen nach Art. 21 NIS2 / §30 BSIG. */
export const NIS2_MASSNAHMEN: NIS2Massnahme[] = [
  { key: 'risikoanalyse', label: 'Risikoanalyse & Informationssicherheitskonzept', hilfe: 'Dokumentierte Risikobewertung und Sicherheitsrichtlinien für Informationssysteme.' },
  { key: 'incident', label: 'Incident-Behandlung & Meldepflicht', hilfe: 'Prozesse zur Erkennung und Bewältigung von Sicherheitsvorfällen. Meldefristen: Frühwarnung 24h, Meldung 72h, Abschlussbericht 1 Monat.' },
  { key: 'bcm', label: 'Business Continuity, Backup & Krisenmanagement', hilfe: 'Backup-Management, Notfallwiederherstellung (Disaster Recovery) und Krisenmanagement.' },
  { key: 'lieferkette', label: 'Sicherheit der Lieferkette', hilfe: 'Sicherheitsanforderungen an Lieferanten und Dienstleister (siehe auch DORA-Modul für Finanzunternehmen).' },
  { key: 'einkauf', label: 'Sicherheit bei Beschaffung, Entwicklung & Wartung', hilfe: 'Security in Erwerb, Entwicklung und Wartung von IT-Systemen inkl. Schwachstellenbehandlung.' },
  { key: 'wirksamkeit', label: 'Bewertung der Wirksamkeit der Maßnahmen', hilfe: 'Konzepte und Verfahren zur Messung der Wirksamkeit von Risikomanagementmaßnahmen.' },
  { key: 'kryptografie', label: 'Kryptografie & Verschlüsselung', hilfe: 'Konzepte für den Einsatz von Kryptografie und ggf. Verschlüsselung.' },
  { key: 'personal', label: 'Personalsicherheit & Zugriffskontrolle', hilfe: 'Personalsicherheit, Zugriffskontrollkonzepte und Anlagenverwaltung (Asset Management).' },
  { key: 'mfa', label: 'Multi-Faktor-Authentifizierung', hilfe: 'Einsatz von MFA bzw. kontinuierlicher Authentifizierung und gesicherter Kommunikation (Sprache/Video/Text).' },
  { key: 'schulung', label: 'Schulung & Cyberhygiene', hilfe: 'Grundlegende Cyberhygiene-Praktiken und regelmäßige Schulungen im Bereich Cybersicherheit.' },
];

/** Vereinfachte Betroffenheitsprüfung. */
export function berechneEinstufung(a: NIS2Assessment): NIS2Einstufung {
  if (a.kritis === 'Ja') return 'Besonders wichtig';
  if (!a.sektor) return 'Unklar';

  const anhang = NIS2_SEKTOR_ANHANG[a.sektor];
  if (!anhang) return 'Nicht betroffen';

  const gross = a.mitarbeiter === '≥250' || a.umsatzMio === '≥50';
  const mittel = a.mitarbeiter === '50-249' || a.umsatzMio === '10-49';

  // Kleinstunternehmen (<50 MA und <10 Mio) fallen i.d.R. aus dem Anwendungsbereich
  if (!gross && !mittel) {
    // Ohne Größenangabe lieber als unklar markieren statt fälschlich entwarnen
    if (!a.mitarbeiter && !a.umsatzMio) return 'Unklar';
    return 'Nicht betroffen';
  }

  if (anhang === 'I') {
    return gross ? 'Besonders wichtig' : 'Wichtig';
  }
  // Anhang II → maximal "wichtig"
  return 'Wichtig';
}

export interface NIS2GapAmpel {
  vorhanden: number;
  teilweise: number;
  fehlend: number;
  na: number;
  offen: number;          // teilweise + fehlend
  bewertbar: number;      // ohne N/A
  erfuellungsgrad: number; // 0–100 (vorhanden + 0.5*teilweise) / bewertbar
}

export function nis2GapAmpel(massnahmen: Record<string, NIS2MassnahmeStatus>): NIS2GapAmpel {
  let vorhanden = 0, teilweise = 0, fehlend = 0, na = 0;
  for (const m of NIS2_MASSNAHMEN) {
    const status = massnahmen[m.key];
    if (status === 'Vorhanden') vorhanden++;
    else if (status === 'Teilweise') teilweise++;
    else if (status === 'N/A') na++;
    else fehlend++; // 'Fehlend' oder nicht gesetzt
  }
  const bewertbar = NIS2_MASSNAHMEN.length - na;
  const erfuellungsgrad = bewertbar > 0
    ? Math.round(((vorhanden + 0.5 * teilweise) / bewertbar) * 100)
    : 0;
  return { vorhanden, teilweise, fehlend, na, offen: teilweise + fehlend, bewertbar, erfuellungsgrad };
}

export interface EinstufungInfo {
  farbe: 'emerald' | 'amber' | 'red' | 'gray';
  kurz: string;
  pflichten: string;
  bussgeld: string;
}

export const EINSTUFUNG_INFO: Record<NIS2Einstufung, EinstufungInfo> = {
  'Besonders wichtig': {
    farbe: 'red',
    kurz: 'Besonders wichtige Einrichtung',
    pflichten: 'Registrierungspflicht beim BSI, Melde- und Nachweispflichten, proaktive Aufsicht durch das BSI.',
    bussgeld: 'Bußgelder bis 10 Mio. € oder 2 % des weltweiten Jahresumsatzes (höherer Wert).',
  },
  'Wichtig': {
    farbe: 'amber',
    kurz: 'Wichtige Einrichtung',
    pflichten: 'Registrierungspflicht beim BSI, Melde- und Nachweispflichten, reaktive Aufsicht.',
    bussgeld: 'Bußgelder bis 7 Mio. € oder 1,4 % des weltweiten Jahresumsatzes (höherer Wert).',
  },
  'Nicht betroffen': {
    farbe: 'emerald',
    kurz: 'Voraussichtlich nicht betroffen',
    pflichten: 'Keine unmittelbaren NIS2-Pflichten. Vertragliche Anforderungen aus der Lieferkette können dennoch greifen.',
    bussgeld: '—',
  },
  'Unklar': {
    farbe: 'gray',
    kurz: 'Einstufung noch offen',
    pflichten: 'Bitte Sektor und Unternehmensgröße angeben, um die Betroffenheit zu ermitteln.',
    bussgeld: '—',
  },
};
