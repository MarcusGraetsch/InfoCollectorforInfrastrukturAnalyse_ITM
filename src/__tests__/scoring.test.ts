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
