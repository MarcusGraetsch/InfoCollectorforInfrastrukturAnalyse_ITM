import React, { useState } from 'react';
import { isEncrypted, encryptData, decryptData, clearEncryptionMeta } from '../crypto';

/** Retrieve the current raw localStorage value for the data key. */
function getDataKey(): string | null {
  const id = localStorage.getItem('it-strukturanalyse-install-id');
  if (!id) return null;
  return `it-strukturanalyse-data-${id}`;
}

interface Props {
  onReload: () => void;
}

type Mode = 'idle' | 'enabling' | 'disabling' | 'changing';

export const EncryptionSettings: React.FC<Props> = ({ onReload }) => {
  const [mode, setMode] = useState<Mode>('idle');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [oldPw, setOldPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const encrypted = isEncrypted();

  const resetForm = () => {
    setPw('');
    setPw2('');
    setOldPw('');
    setError(null);
    setSuccess(null);
    setMode('idle');
  };

  const handleEnable = async () => {
    if (pw.length < 8) { setError('Passwort muss mindestens 8 Zeichen haben.'); return; }
    if (pw !== pw2) { setError('Passwörter stimmen nicht überein.'); return; }
    const key = getDataKey();
    if (!key) { setError('Kein Datenschlüssel gefunden.'); return; }
    const raw = localStorage.getItem(key);
    if (!raw) { setError('Keine Daten zum Verschlüsseln vorhanden.'); return; }
    setBusy(true);
    setError(null);
    try {
      const cipher = await encryptData(raw, pw);
      localStorage.setItem(key, cipher);
      setSuccess('Daten wurden erfolgreich verschlüsselt.');
      resetForm();
      onReload();
    } catch (e) {
      setError('Verschlüsselung fehlgeschlagen: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    if (!oldPw) { setError('Bitte aktuelles Passwort eingeben.'); return; }
    const key = getDataKey();
    if (!key) { setError('Kein Datenschlüssel gefunden.'); return; }
    const raw = localStorage.getItem(key);
    if (!raw) { setError('Keine Daten vorhanden.'); return; }
    setBusy(true);
    setError(null);
    try {
      const plaintext = await decryptData(raw, oldPw);
      clearEncryptionMeta();
      localStorage.setItem(key, plaintext);
      setSuccess('Verschlüsselung wurde deaktiviert.');
      resetForm();
      onReload();
    } catch {
      setError('Falsches Passwort oder beschädigte Daten.');
    } finally {
      setBusy(false);
    }
  };

  const handleChange = async () => {
    if (!oldPw) { setError('Bitte aktuelles Passwort eingeben.'); return; }
    if (pw.length < 8) { setError('Neues Passwort muss mindestens 8 Zeichen haben.'); return; }
    if (pw !== pw2) { setError('Neue Passwörter stimmen nicht überein.'); return; }
    const key = getDataKey();
    if (!key) { setError('Kein Datenschlüssel gefunden.'); return; }
    const raw = localStorage.getItem(key);
    if (!raw) { setError('Keine Daten vorhanden.'); return; }
    setBusy(true);
    setError(null);
    try {
      const plaintext = await decryptData(raw, oldPw);
      clearEncryptionMeta();
      const cipher = await encryptData(plaintext, pw);
      localStorage.setItem(key, cipher);
      setSuccess('Passwort wurde erfolgreich geändert.');
      resetForm();
    } catch {
      setError('Falsches Passwort oder Fehler beim Verschlüsseln.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-hi-navy mb-1">Datenverschlüsselung</h2>
        <p className="text-sm text-hi-slate">
          Optionale AES-256-GCM-Verschlüsselung aller localStorage-Daten mit PBKDF2 (310.000 Iterationen).
          Das Passwort verlässt Ihren Browser niemals.
        </p>
      </div>

      <div className={`rounded-xl border p-4 flex items-center gap-3 ${encrypted ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
        <span className="text-2xl">{encrypted ? '🔒' : '🔓'}</span>
        <div>
          <p className={`font-semibold text-sm ${encrypted ? 'text-green-800' : 'text-amber-800'}`}>
            {encrypted ? 'Verschlüsselung aktiv' : 'Verschlüsselung nicht aktiv'}
          </p>
          <p className={`text-xs mt-0.5 ${encrypted ? 'text-green-700' : 'text-amber-700'}`}>
            {encrypted
              ? 'Daten sind im Browser verschlüsselt gespeichert.'
              : 'Daten liegen als Klartext im localStorage.'}
          </p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm">{success}</div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">{error}</div>
      )}

      {mode === 'idle' && (
        <div className="flex flex-wrap gap-3">
          {!encrypted && (
            <button
              onClick={() => { setMode('enabling'); setError(null); setSuccess(null); }}
              className="px-4 py-2 bg-hi-navy text-white rounded-lg text-sm font-medium hover:bg-hi-navy/90"
            >
              Verschlüsselung aktivieren
            </button>
          )}
          {encrypted && (
            <>
              <button
                onClick={() => { setMode('changing'); setError(null); setSuccess(null); }}
                className="px-4 py-2 bg-hi-navy text-white rounded-lg text-sm font-medium hover:bg-hi-navy/90"
              >
                Passwort ändern
              </button>
              <button
                onClick={() => { setMode('disabling'); setError(null); setSuccess(null); }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Verschlüsselung deaktivieren
              </button>
            </>
          )}
        </div>
      )}

      {mode === 'enabling' && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-hi-navy text-sm">Verschlüsselung aktivieren</h3>
          <PasswordField label="Passwort (mind. 8 Zeichen)" value={pw} onChange={setPw} />
          <PasswordField label="Passwort wiederholen" value={pw2} onChange={setPw2} />
          <FormButtons onConfirm={handleEnable} onCancel={resetForm} busy={busy} confirmLabel="Aktivieren" />
        </div>
      )}

      {mode === 'disabling' && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-hi-navy text-sm">Verschlüsselung deaktivieren</h3>
          <PasswordField label="Aktuelles Passwort" value={oldPw} onChange={setOldPw} />
          <FormButtons onConfirm={handleDisable} onCancel={resetForm} busy={busy} confirmLabel="Deaktivieren" danger />
        </div>
      )}

      {mode === 'changing' && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-hi-navy text-sm">Passwort ändern</h3>
          <PasswordField label="Aktuelles Passwort" value={oldPw} onChange={setOldPw} />
          <PasswordField label="Neues Passwort (mind. 8 Zeichen)" value={pw} onChange={setPw} />
          <PasswordField label="Neues Passwort wiederholen" value={pw2} onChange={setPw2} />
          <FormButtons onConfirm={handleChange} onCancel={resetForm} busy={busy} confirmLabel="Ändern" />
        </div>
      )}

      <div className="bg-hi-gray rounded-xl p-4 text-xs text-hi-slate space-y-1">
        <p className="font-semibold text-hi-navy">Hinweis</p>
        <p>Wenn Sie Ihr Passwort vergessen, sind die Daten unwiederbringlich verloren. Es gibt keine Wiederherstellungsoption.</p>
        <p>Sichern Sie Ihre Daten regelmäßig als unverschlüsselten JSON-Export über „JSON-Backup".</p>
      </div>
    </div>
  );
};

// --- Sub-components ---

interface PFProps { label: string; value: string; onChange: (v: string) => void; }
const PasswordField: React.FC<PFProps> = ({ label, value, onChange }) => (
  <div>
    <label className="block text-xs font-medium text-hi-slate mb-1">{label}</label>
    <input
      type="password"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hi-navy"
      autoComplete="new-password"
    />
  </div>
);

interface FBProps { onConfirm: () => void; onCancel: () => void; busy: boolean; confirmLabel: string; danger?: boolean; }
const FormButtons: React.FC<FBProps> = ({ onConfirm, onCancel, busy, confirmLabel, danger }) => (
  <div className="flex gap-2 pt-1">
    <button
      onClick={onConfirm}
      disabled={busy}
      className={`px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-hi-navy hover:bg-hi-navy/90'}`}
    >
      {busy ? 'Bitte warten…' : confirmLabel}
    </button>
    <button
      onClick={onCancel}
      disabled={busy}
      className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
    >
      Abbrechen
    </button>
  </div>
);
