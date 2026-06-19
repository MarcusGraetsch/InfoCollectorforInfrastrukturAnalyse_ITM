import type { Anwendung } from '../types';

/**
 * EU AI Act (Verordnung (EU) 2024/1689) — Inventarisierung und Shadow-AI-Erkennung.
 *
 * Geltung gestaffelt: Verbote seit 02.02.2025, GPAI-Pflichten seit 02.08.2025,
 * Hochrisiko-Pflichten ab 2026/2027. Software-Sichtbarkeit ist Vorbedingung für
 * Compliance (Risikoregister, Art.-12-Logging).
 */

/** Schlüsselwörter zur heuristischen Erkennung wahrscheinlicher KI-Systeme. */
const AI_KEYWORDS = [
  'gpt', 'copilot', 'chatgpt', 'llm', 'genai', 'gen-ai', 'chatbot', 'neural',
  'deep learning', 'deeplearning', 'machine learning', 'machinelearning',
  'künstliche intelligenz', 'openai', 'anthropic', 'claude', 'gemini', 'llama',
  'mistral', 'watson', 'azure ai', 'azure openai', 'sagemaker', 'vertex ai',
  'bedrock', 'hugging face', 'huggingface', 'transformer', 'co-pilot',
  ' ki ', 'ki-', '-ki', 'a.i.', 'predictive', 'recommendation engine',
];

function textOf(a: Anwendung): string {
  return `${a.name} ${a.erlaeuterung ?? ''} ${a.tags ?? ''} ${a.typ ?? ''}`.toLowerCase();
}

/**
 * Liefert IDs von Anwendungen, die laut Name/Beschreibung/Tags wahrscheinlich
 * KI-Systeme sind, aber noch nicht als solche markiert wurden.
 */
export function erkenneShadowAI(anwendungen: Anwendung[]): string[] {
  return anwendungen
    .filter((a) => {
      if (a.istKISystem) return false; // bereits klassifiziert
      const t = ` ${textOf(a)} `;
      return AI_KEYWORDS.some((kw) => t.includes(kw));
    })
    .map((a) => a.id);
}

/** Welches Schlüsselwort hat getroffen (für Erklärungs-Tooltip). */
export function shadowAITreffer(a: Anwendung): string | null {
  const t = ` ${textOf(a)} `;
  return AI_KEYWORDS.find((kw) => t.includes(kw))?.trim() ?? null;
}

export const AI_RISIKOKLASSEN = ['Verboten', 'Hoch', 'Begrenzt', 'Minimal', 'Kein KI', 'Unklar'] as const;
export const AI_ROLLEN = ['Anbieter', 'Betreiber', 'Beides', 'Unklar'] as const;
export const AI_TRAININGSDATEN = ['Interne Daten', 'Öffentliche Daten', 'Drittanbieter', 'Unklar'] as const;
export const AI_AUFSICHT = ['Vollständig', 'Teilweise', 'Keine', 'Unklar'] as const;
export const AI_LOGGING = ['Ja', 'Nein', 'Teilweise', 'Unklar'] as const;

export const AI_HOCHRISIKO_BEISPIELE = [
  'Biometrie / Gesichtserkennung',
  'Kreditwürdigkeits-Scoring',
  'HR / Bewerberauswahl & Personalentscheidungen',
  'Steuerung kritischer Infrastruktur',
  'Strafverfolgung & Justiz',
  'Bildungs- & Prüfungsbewertung',
  'Medizinische Diagnose / Sicherheitskomponenten',
];

export const AI_RISIKO_ERKLAERUNG: { klasse: string; text: string }[] = [
  { klasse: 'Verboten', text: 'Inakzeptables Risiko (Art. 5): z.B. Social Scoring, manipulatives Verhalten, biometrische Echtzeit-Fernidentifikation im öffentlichen Raum. Einsatz untersagt.' },
  { klasse: 'Hoch', text: 'Hochrisiko (Art. 6 + Anhang III): strenge Pflichten — Risikomanagement, Daten-Governance, technische Dokumentation, Logging (Art. 12), menschliche Aufsicht, Konformitätsbewertung.' },
  { klasse: 'Begrenzt', text: 'Begrenztes Risiko: Transparenzpflichten — Nutzer müssen wissen, dass sie mit einer KI interagieren (z.B. Chatbots, Deepfake-Kennzeichnung).' },
  { klasse: 'Minimal', text: 'Minimales Risiko: keine besonderen Pflichten (z.B. Spamfilter, KI in Spielen). Freiwillige Verhaltenskodizes empfohlen.' },
];

export interface AiInventarSummary {
  gesamtKI: number;
  hochrisiko: number;
  verboten: number;
  betreiberRolle: number;
  ohneLogging: number;
  unklassifiziert: number; // istKISystem aber Risikoklasse unklar/leer
}

export function summarizeAiInventar(anwendungen: Anwendung[]): AiInventarSummary {
  const ki = anwendungen.filter((a) => a.istKISystem);
  return {
    gesamtKI: ki.length,
    hochrisiko: ki.filter((a) => a.aiRisikoklasse === 'Hoch').length,
    verboten: ki.filter((a) => a.aiRisikoklasse === 'Verboten').length,
    betreiberRolle: ki.filter((a) => a.aiRolle === 'Betreiber' || a.aiRolle === 'Beides').length,
    ohneLogging: ki.filter((a) => a.aiLoggingVorhanden === 'Nein').length,
    unklassifiziert: ki.filter((a) => !a.aiRisikoklasse || a.aiRisikoklasse === 'Unklar').length,
  };
}
