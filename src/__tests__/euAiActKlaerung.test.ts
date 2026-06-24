import { describe, it, expect } from 'vitest';
import { countOffeneKlaerung, AI_ROLLEN } from '../compliance/euAiAct';
import type { Anwendung } from '../types';

const base = (over: Partial<Anwendung> = {}): Anwendung => ({
  id: 'a1', kuerzel: 'A-001', name: 'KI-Tool', erlaeuterung: '', tags: '',
  status: 'Aktiv', typ: '', verantwortlicher: '', benutzer: '',
  anwendungen: [], itSysteme: [], netzverbindungen: [], istKISystem: true, ...over,
});

describe('EU AI Act — geführte Klärung (Paket 7)', () => {
  it('AI_ROLLEN deckt die EU-AI-Act-Rollen ab (Anbieter/Betreiber/Importeur/Händler/Nutzer)', () => {
    ['Anbieter', 'Betreiber', 'Importeur', 'Händler', 'Nutzer'].forEach(r =>
      expect(AI_ROLLEN).toContain(r));
  });

  it('countOffeneKlaerung zählt alle unklaren/leeren Schlüsselfelder', () => {
    // frisches KI-System ohne Angaben -> 6 offene Punkte
    expect(countOffeneKlaerung(base())).toBe(6);
  });

  it('vollständig geklärtes System hat 0 offene Punkte', () => {
    const a = base({
      aiRisikoklasse: 'Hoch', aiRolle: 'Betreiber', aiMenschlicheAufsicht: 'Vollständig',
      aiLoggingVorhanden: 'Ja', aiZweck: 'Dokumentenklassifizierung', aiPersonenbezug: 'Ja',
    });
    expect(countOffeneKlaerung(a)).toBe(0);
  });

  it('teilweise geklärt zählt korrekt herunter', () => {
    const a = base({ aiRisikoklasse: 'Hoch', aiRolle: 'Betreiber' });
    expect(countOffeneKlaerung(a)).toBe(4);
  });
});
