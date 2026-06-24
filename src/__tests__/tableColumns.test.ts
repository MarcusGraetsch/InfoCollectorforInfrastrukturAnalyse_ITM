import { describe, it, expect } from 'vitest';
import { CATEGORIES } from '../categories';

describe('Lizenz-Tabellenspalten (Anwendungen)', () => {
  const anwendungen = CATEGORIES.find(c => c.key === 'anwendungen')!;
  const lizenzen = anwendungen.fields.find(f => f.key === 'lizenzen')!;

  it('Lizenzen ist ein Tabellenfeld', () => {
    expect(lizenzen.type).toBe('table');
    expect(lizenzen.tableColumns?.length).toBeGreaterThan(0);
  });

  it('Ablaufdatum wird als Datumsauswahl (type=date) gerendert', () => {
    const ablauf = lizenzen.tableColumns!.find(c => c.key === 'ablauf')!;
    expect(ablauf.type).toBe('date');
  });

  it('Anbieter-Spalte ist als "Lizenzgeber / Vertragspartner" geklärt und hat eine Hilfe', () => {
    const anbieter = lizenzen.tableColumns!.find(c => c.key === 'anbieter')!;
    expect(anbieter.label).toMatch(/Lizenzgeber/);
    expect(anbieter.tooltip).toBeTruthy();
  });
});
