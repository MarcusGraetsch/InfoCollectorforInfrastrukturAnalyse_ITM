import { describe, it, expect } from 'vitest';
import { assess } from '../cloudReadiness';
import { esc } from '../utils/safePrint';
import { sanitizeCsvCell } from '../utils/export';

describe('cloudReadiness.assess', () => {
  it('gibt Hoch zurück für eine gut bewertete Anwendung', () => {
    const result = assess(
      {
        bereitstellung: 'SaaS',
        lizenzCloudfaehig: 'Ja',
        migrationskomplexitaet: 'Niedrig',
        lebenszyklus: 'Aktuell',
        internetfaehig: 'Ja',
        datensouveraenitaet: 'EU',
      },
      'anwendungen'
    );
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.level).toBe('Hoch');
  });

  it('gibt Niedrig zurück für eine schlecht bewertete Anwendung', () => {
    const result = assess(
      {
        bereitstellung: 'On-Premises (physisch)',
        lizenzCloudfaehig: 'Nein',
        migrationskomplexitaet: 'Hoch',
        lebenszyklus: 'End of Life',
        internetfaehig: 'Nein',
      },
      'anwendungen'
    );
    expect(result.score).toBeLessThan(45);
    expect(result.level).toBe('Niedrig');
  });

  it('gibt Unbewertet zurück wenn keine Felder gesetzt sind', () => {
    const result = assess({}, 'anwendungen');
    expect(result.level).toBe('Unbewertet');
  });
});

describe('esc (XSS-Escaping)', () => {
  it('escaped HTML-Sonderzeichen', () => {
    expect(esc('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(esc('"test"')).toBe('&quot;test&quot;');
    expect(esc("it's")).toBe('it&#x27;s');
  });

  it('gibt leeren String für null/undefined zurück', () => {
    expect(esc(null)).toBe('');
    expect(esc(undefined)).toBe('');
  });
});

describe('sanitizeCsvCell (Formel-Injection-Schutz)', () => {
  it('neutralisiert Formeln mit führendem =', () => {
    const result = sanitizeCsvCell('=1+1');
    expect(String(result)).toBe("'=1+1");
  });

  it('lässt normale Werte unverändert', () => {
    expect(sanitizeCsvCell('Normaler Text')).toBe('Normaler Text');
    expect(sanitizeCsvCell(42)).toBe(42);
    expect(sanitizeCsvCell(null)).toBeNull();
  });

  it('neutralisiert Formeln mit führendem +, - und @', () => {
    expect(String(sanitizeCsvCell('+CMD'))).toMatch(/^\+CMD|^'\+CMD/);
    expect(String(sanitizeCsvCell('@SUM(1)'))).toMatch(/^@|^'@/);
  });
});

import { berechneBuchwert, parseNum, summiereObjektkosten } from '../wirtschaftlichkeit';
import { createDefaultState } from '../store';

describe('wirtschaftlichkeit.berechneBuchwert', () => {
  it('berechnet lineare AfA (50% nach halber Nutzungsdauer)', () => {
    const start = new Date('2024-06-22');
    const stichtag = new Date('2026-06-22'); // 2 Jahre später, Dauer 4 → 50%
    const r = berechneBuchwert('2024-06-22', '10000 €', '4', stichtag);
    expect(r).not.toBeNull();
    expect(r!.jahresAfa).toBe(2500);
    expect(r!.buchwert).toBeGreaterThan(4900);
    expect(r!.buchwert).toBeLessThan(5100);
    expect(r!.restlaufzeit).toBeGreaterThan(1.9);
    expect(r!.restlaufzeit).toBeLessThan(2.1);
    void start;
  });

  it('Buchwert nie unter 0 (über Nutzungsdauer hinaus)', () => {
    const r = berechneBuchwert('2010-01-01', '5000', '3', new Date('2026-06-22'));
    expect(r!.buchwert).toBe(0);
    expect(r!.abgeschrieben).toBe(true);
  });

  it('gibt null bei fehlenden Pflichtwerten', () => {
    expect(berechneBuchwert(undefined, '1000', '3')).toBeNull();
    expect(berechneBuchwert('2024-01-01', '', '3')).toBeNull();
    expect(berechneBuchwert('2024-01-01', '1000', '0')).toBeNull();
  });

  it('parseNum toleriert dt. Format und Einheiten', () => {
    expect(parseNum('1.234,56 €')).toBeCloseTo(1234.56, 1);
    expect(parseNum('10000')).toBe(10000);
    expect(parseNum('')).toBe(0);
  });
});

describe('wirtschaftlichkeit.summiereObjektkosten', () => {
  it('aggregiert Anschaffung/Betrieb/Lizenz über Kategorien', () => {
    const s = createDefaultState();
    s.server.push({
      id: 's1', kuerzel: 'S-001', name: 'DB-Server', erlaeuterung: '', tags: '',
      status: 'Aktiv', anzahl: '1', plattform: '', verantwortlicher: '', benutzer: '',
      anwendungen: [], itSysteme: [], netzverbindungen: [], raeume: [], gebaeude: [],
      anschaffungspreis: '10000', abschreibungsdauer: '5', anschaffungsdatum: '2025-06-22',
      wartungskostenJahr: '500', betriebskostenJahr: '300',
    });
    s.anwendungen.push({
      id: 'a1', kuerzel: 'A-001', name: 'ERP', erlaeuterung: '', tags: '',
      status: 'Aktiv', typ: '', verantwortlicher: '', benutzer: '',
      anwendungen: [], itSysteme: [], netzverbindungen: [], lizenzkosten: '2000',
    });
    const o = summiereObjektkosten(s);
    expect(o.anschaffungGesamt).toBe(10000);
    expect(o.lizenzkostenJahr).toBe(2000);
    expect(o.wartungskostenJahr).toBe(500);
    expect(o.jahresAfaGesamt).toBe(2000);
    expect(o.zeilen.length).toBe(2);
  });
});
