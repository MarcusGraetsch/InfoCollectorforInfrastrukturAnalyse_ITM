/**
 * Block 10 — Optionaler KI-Anreicherungs-Assistent
 *
 * WICHTIG:
 * - Kein Default-Endpoint, keine Default-API-Key
 * - Ohne Konfiguration: NULL Netzwerkanfragen
 * - API-Key NIEMALS in AppState — separater localStorage-Key 'it-sa-ai-config'
 * - Strikt optional: alle Funktionen prüfen zuerst ob AI konfiguriert ist
 */

import type { AIConfig } from '../types';

export const AI_CONFIG_KEY = 'it-sa-ai-config';

export function loadAIConfig(): AIConfig | null {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const { _apiKey: _k, ...config } = parsed;
    void _k;
    return config as unknown as AIConfig;
  } catch {
    return null;
  }
}

export function saveAIConfig(config: AIConfig, apiKey: string): void {
  const stored = { ...config, _apiKey: apiKey };
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(stored));
}

export function clearAIConfig(): void {
  localStorage.removeItem(AI_CONFIG_KEY);
}

function getStoredApiKey(): string | null {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { _apiKey?: string };
    return parsed._apiKey ?? null;
  } catch {
    return null;
  }
}

export function isAIConfigured(): boolean {
  const config = loadAIConfig();
  if (!config?.enabled) return false;
  return !!getStoredApiKey();
}

export interface AISuggestion {
  field: string;
  value: string;
  confidence: 'Hoch' | 'Mittel' | 'Niedrig';
  begruendung: string;
}

export async function getAISuggestions(
  itemName: string,
  itemKategorie: string,
  existingFields: Record<string, string>
): Promise<AISuggestion[] | null> {
  if (!isAIConfigured()) return null;

  const config = loadAIConfig()!;
  const apiKey = getStoredApiKey()!;

  const endpoint = config.provider === 'openai'
    ? 'https://api.openai.com/v1/chat/completions'
    : (config.endpoint ?? null);

  if (!endpoint) return null;

  const model = config.model ?? (config.provider === 'openai' ? 'gpt-4o-mini' : 'default');

  const systemPrompt = 'Du bist ein IT-Infrastruktur-Analyst. Ergaenze fehlende Cloud-Readiness-Felder. Antworte NUR mit einem JSON-Array: [{field, value, confidence, begruendung}]';
  const userPrompt = `System: "${itemName}" (${itemKategorie})\nVorhandene Felder: ${JSON.stringify(existingFields)}\nErgaenze: schutzbedarf, bereitstellung, migrationskomplexitaet, lebenszyklus, internetfaehig, datensouveraenitaet`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content ?? '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as AISuggestion[];
  } catch {
    return null;
  }
}
