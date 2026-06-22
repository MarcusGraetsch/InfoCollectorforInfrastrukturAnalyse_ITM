/**
 * Block 10 — KI-Anreicherungs-Assistent Einstellungen
 *
 * Settings panel for the optional AI assistant.
 * Strictly optional: when not configured, zero network requests.
 */
import React, { useState, useEffect } from 'react';
import type { AIConfig } from '../types';
import { loadAIConfig, saveAIConfig, clearAIConfig, isAIConfigured } from '../integrations/aiSuggest';

interface Props {
  onClose: () => void;
}

export const AIAssistantSettings: React.FC<Props> = ({ onClose }) => {
  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState<'openai' | 'custom'>('openai');
  const [endpoint, setEndpoint] = useState('');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    const config = loadAIConfig();
    if (config) {
      setEnabled(config.enabled);
      setProvider(config.provider);
      setEndpoint(config.endpoint ?? '');
      setModel(config.model ?? '');
    }
    setConfigured(isAIConfigured());
  }, []);

  const handleSave = () => {
    const config: AIConfig = { enabled, provider, endpoint: endpoint || undefined, model: model || undefined };
    saveAIConfig(config, apiKey);
    setSaved(true);
    setConfigured(isAIConfigured());
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    clearAIConfig();
    setEnabled(false);
    setApiKey('');
    setConfigured(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <div className="bg-hi-navy px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold">KI-Anreicherungs-Assistent</h3>
            <p className="text-white/60 text-xs mt-0.5">Optionaler AI-Assistent für Vorschläge in Cloud-Feldern</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Status */}
          <div className={`text-xs px-3 py-2 rounded-lg font-semibold ${configured ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
            Status: {configured ? 'Konfiguriert und aktiv' : 'Nicht konfiguriert — keine Netzwerkanfragen'}
          </div>

          {/* Privacy notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1">
            <p className="font-semibold">Datenschutz-Hinweise:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>API-Key wird NUR in diesem Browser gespeichert (localStorage)</li>
              <li>API-Key wird NIEMALS im JSON-Export gespeichert</li>
              <li>Ohne Konfiguration: null Netzwerkanfragen</li>
              <li>Systemname und Kategorie werden an den AI-Provider gesendet</li>
            </ul>
          </div>

          {/* Enable toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEnabled(!enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-hi-accent' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm font-medium text-hi-navy">KI-Assistent aktivieren</span>
          </div>

          {enabled && (
            <div className="space-y-3">
              {/* Provider */}
              <div>
                <label className="block text-xs font-semibold text-hi-slate mb-1">Provider</label>
                <div className="flex gap-2">
                  <button onClick={() => setProvider('openai')} className={`px-3 py-1.5 text-xs rounded-lg border ${provider === 'openai' ? 'bg-hi-accent text-white border-hi-accent' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                    OpenAI-kompatibel
                  </button>
                  <button onClick={() => setProvider('custom')} className={`px-3 py-1.5 text-xs rounded-lg border ${provider === 'custom' ? 'bg-hi-accent text-white border-hi-accent' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                    Custom Endpoint
                  </button>
                </div>
              </div>

              {provider === 'custom' && (
                <div>
                  <label className="block text-xs font-semibold text-hi-slate mb-1">API-Endpunkt URL</label>
                  <input
                    type="url"
                    value={endpoint}
                    onChange={e => setEndpoint(e.target.value)}
                    placeholder="https://your-endpoint/v1/chat/completions"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-hi-accent"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-hi-slate mb-1">Modell (optional)</label>
                <input
                  type="text"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  placeholder={provider === 'openai' ? 'gpt-4o-mini' : 'default'}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-hi-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-hi-slate mb-1">API-Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="sk-... oder eigener Key"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-hi-accent"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">Wird nur lokal gespeichert. Nie in Export oder Backup.</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-hi-accent text-white hover:bg-hi-blue'}`}>
              {saved ? 'Gespeichert!' : 'Speichern'}
            </button>
            {configured && (
              <button onClick={handleClear} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50">
                Konfiguration löschen
              </button>
            )}
            <button onClick={onClose} className="px-4 py-2 border border-gray-200 text-gray-500 rounded-lg text-sm hover:bg-gray-50 ml-auto">
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
