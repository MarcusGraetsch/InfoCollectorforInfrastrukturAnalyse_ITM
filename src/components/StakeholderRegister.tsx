import React, { useState } from 'react';
import type { AppState, Stakeholder } from '../types';
import { generateId } from '../store';
import { esc, openPrintWindow, printHeader, printFooter } from '../utils/safePrint';

interface Props {
  state: AppState;
  onUpdate: (stakeholder: Stakeholder[]) => void;
}

const LG_LABELS: Record<number, string> = {
  1: 'Kick-off-Workshop', 2: 'Infrastruktur-Bericht', 3: 'Infra-Landkarte',
  4: 'Cloud-Readiness-Workshop', 5: 'Lizenz- & Kostenanalyse', 6: 'TCO-Modell',
  7: 'Business Case', 8: 'Priorisierungsmatrix & Roadmap', 9: 'Security-Architektur',
  10: 'Betriebs-/Backup-Konzept', 11: 'Exit-Konzept', 12: 'Strategie-Workshop',
  13: 'Transformationsplanung', 14: 'Executive Summary', 15: 'Technische Langfassung',
  16: 'Change-Strategie', 17: 'Lenkungsausschuss', 18: 'Jour Fixe', 19: 'Abschlussbericht',
};

export const StakeholderRegister: React.FC<Props> = ({ state, onUpdate }) => {
  const [editId, setEditId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newSh, setNewSh] = useState<Omit<Stakeholder, 'id'>>({
    name: '', rolle: '', bereich: '', email: '', telefon: '', lgIds: [], notizen: '',
  });

  const stakeholder = state.stakeholder;
  const lgs = state.liefergegenstaende;

  const handleFieldChange = (id: string, field: keyof Stakeholder, value: unknown) => {
    onUpdate(stakeholder.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleLgToggle = (shId: string, lgId: number) => {
    const sh = stakeholder.find(s => s.id === shId);
    if (!sh) return;
    const next = sh.lgIds.includes(lgId)
      ? sh.lgIds.filter(id => id !== lgId)
      : [...sh.lgIds, lgId].sort((a, b) => a - b);
    handleFieldChange(shId, 'lgIds', next);
  };

  const handleAdd = () => {
    const sh: Stakeholder = { ...newSh, id: generateId() };
    onUpdate([...stakeholder, sh]);
    setNewSh({ name: '', rolle: '', bereich: '', email: '', telefon: '', lgIds: [], notizen: '' });
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    onUpdate(stakeholder.filter(s => s.id !== id));
  };

  // LGs ohne zugewiesenen Stakeholder
  const uncoveredLGs = lgs.filter(lg => !stakeholder.some(s => s.lgIds.includes(lg.id)));
  // Stakeholder ohne E-Mail
  const missingEmail = stakeholder.filter(s => s.name.trim() && !s.email.trim());

  const handlePrint = () => {
    const rows = stakeholder.filter(s => s.name.trim()).map(s =>
      `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${esc(s.name)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${esc(s.rolle)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${esc(s.bereich)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${esc(s.email)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${esc(s.telefon)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${s.lgIds.map(id => `LG ${id}`).join(', ')}</td>
      </tr>`
    ).join('');
    const body = `${printHeader('Stakeholder-Register', state.customerName)}
      <table><thead><tr><th>Name</th><th>Rolle</th><th>Bereich</th><th>E-Mail</th><th>Telefon</th><th>Zuständig</th></tr></thead>
      <tbody>${rows}</tbody></table>${printFooter()}`;
    openPrintWindow(`Stakeholder – ${state.customerName}`, body);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-hi-navy mb-1">Stakeholder-Register</h2>
          <p className="text-sm text-gray-500">Ansprechpartner auf Kundenseite mit Zuständigkeiten je Liefergegenstand</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(uncoveredLGs.length > 0 || missingEmail.length > 0) && (
            <button
              onClick={() => setShowEmailModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-300 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              E-Mail: fehlende Kontakte
              <span className="bg-amber-200 text-amber-800 text-xs px-1.5 py-0.5 rounded-full font-bold">
                {uncoveredLGs.length + missingEmail.length}
              </span>
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Drucken / PDF
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-4 py-2 bg-hi-accent text-white rounded-lg text-sm font-medium hover:bg-hi-accent/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Person hinzufügen
          </button>
        </div>
      </div>

      {showEmailModal && (
        <StakeholderEmailModal
          customerName={state.customerName}
          uncoveredLGs={uncoveredLGs}
          missingEmail={missingEmail}
          onClose={() => setShowEmailModal(false)}
        />
      )}

      {showAdd && (
        <AddForm
          value={newSh}
          lgs={lgs}
          onChange={setNewSh}
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
        />
      )}

      <div className="space-y-3">
        {stakeholder.map(sh => (
          <StakeholderCard
            key={sh.id}
            sh={sh}
            lgs={lgs}
            expanded={editId === sh.id}
            onToggle={() => setEditId(editId === sh.id ? null : sh.id)}
            onChange={(field, value) => handleFieldChange(sh.id, field, value)}
            onLgToggle={lgId => handleLgToggle(sh.id, lgId)}
            onDelete={() => handleDelete(sh.id)}
          />
        ))}
      </div>
    </div>
  );
};

interface CardProps {
  sh: Stakeholder;
  lgs: AppState['liefergegenstaende'];
  expanded: boolean;
  onToggle: () => void;
  onChange: (field: keyof Stakeholder, value: unknown) => void;
  onLgToggle: (lgId: number) => void;
  onDelete: () => void;
}

const StakeholderCard: React.FC<CardProps> = ({ sh, lgs, expanded, onToggle, onChange, onLgToggle, onDelete }) => {
  const nameDisplay = sh.name || <span className="text-gray-400 italic">Name noch nicht eingetragen</span>;
  const hasName = sh.name.trim().length > 0;

  return (
    <div className={`bg-white rounded-xl border shadow-sm transition-all ${expanded ? 'border-hi-accent/40 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={onToggle}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${hasName ? 'bg-hi-navy text-white' : 'bg-gray-100 text-gray-400'}`}>
          {hasName ? sh.name.trim().charAt(0).toUpperCase() : '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-800 truncate">{nameDisplay}</div>
          <div className="text-xs text-gray-500 truncate">{sh.rolle}{sh.bereich && sh.bereich !== sh.rolle ? ` · ${sh.bereich}` : ''}</div>
        </div>
        <div className="flex gap-1 flex-wrap justify-end max-w-xs hidden sm:flex">
          {sh.lgIds.slice(0, 5).map(id => (
            <span key={id} className="text-xs bg-hi-navy/10 text-hi-navy px-1.5 py-0.5 rounded font-medium">
              LG {id}
            </span>
          ))}
          {sh.lgIds.length > 5 && (
            <span className="text-xs text-gray-400">+{sh.lgIds.length - 5}</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Name" value={sh.name} onChange={v => onChange('name', v)} placeholder="Vorname Nachname" />
            <Field label="Rolle / Funktion" value={sh.rolle} onChange={v => onChange('rolle', v)} placeholder="z.B. IT-Leitung" />
            <Field label="Bereich / Abteilung" value={sh.bereich} onChange={v => onChange('bereich', v)} placeholder="z.B. IT-Abteilung" />
            <Field label="E-Mail" value={sh.email} onChange={v => onChange('email', v)} placeholder="name@beispiel.de" type="email" />
            <Field label="Telefon" value={sh.telefon} onChange={v => onChange('telefon', v)} placeholder="+49 30 …" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Zuständig für Liefergegenstände</label>
            <div className="flex flex-wrap gap-2">
              {lgs.map(lg => {
                const active = sh.lgIds.includes(lg.id);
                return (
                  <button
                    key={lg.id}
                    onClick={() => onLgToggle(lg.id)}
                    title={lg.titel}
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                      active
                        ? 'bg-hi-navy text-white border-hi-navy'
                        : 'bg-gray-50 text-gray-500 border-gray-300 hover:border-hi-navy/40'
                    }`}
                  >
                    LG {lg.id}
                  </button>
                );
              })}
            </div>
            {sh.lgIds.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {sh.lgIds.map(id => (
                  <li key={id} className="text-xs text-gray-500">
                    <span className="font-medium text-hi-navy">LG {id}:</span> {LG_LABELS[id] ?? ''}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notizen / Mitwirkungspflichten</label>
            <textarea
              value={sh.notizen}
              onChange={e => onChange('notizen', e.target.value)}
              rows={2}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-hi-accent focus:border-transparent outline-none resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={onDelete}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eintrag entfernen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}

const Field: React.FC<FieldProps> = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-hi-accent focus:border-transparent outline-none"
    />
  </div>
);

interface EmailModalProps {
  customerName: string;
  uncoveredLGs: import('../types').Liefergegenstand[];
  missingEmail: import('../types').Stakeholder[];
  onClose: () => void;
}

const StakeholderEmailModal: React.FC<EmailModalProps> = ({ customerName, uncoveredLGs, missingEmail, onClose }) => {
  const lgList = uncoveredLGs.map(lg => `  - LG ${lg.id}: ${lg.titel}`).join('\n');
  const emailList = missingEmail.map(s => `  - ${s.name} (${s.rolle})`).join('\n');

  const emailText = `Betreff: Ansprechpartner Infrastruktur-Analyse – ${customerName || 'Ihr Unternehmen'}

Guten Tag,

im Rahmen unserer gemeinsamen Infrastrukturanalyse benötigen wir noch Ansprechpartner für die folgenden Liefergegenstände:

${lgList || '  (alle abgedeckt)'}

${missingEmail.length > 0 ? `Außerdem fehlt uns noch die E-Mail-Adresse der folgenden Personen:\n${emailList}\n\n` : ''}Könnten Sie uns bitte die zuständigen Ansprechpartner (Name, Rolle, E-Mail, Telefon) mitteilen?

Mit freundlichen Grüßen`;

  const handleCopy = () => {
    navigator.clipboard.writeText(emailText).then(() => alert('E-Mail-Text kopiert!'));
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-hi-navy">E-Mail: Fehlende Stakeholder anfragen</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {uncoveredLGs.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-800 mb-1">LGs ohne Ansprechpartner ({uncoveredLGs.length})</p>
              <div className="flex flex-wrap gap-1">
                {uncoveredLGs.map(lg => (
                  <span key={lg.id} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">LG {lg.id}: {lg.titel}</span>
                ))}
              </div>
            </div>
          )}
          {missingEmail.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-orange-800 mb-1">Stakeholder ohne E-Mail ({missingEmail.length})</p>
              <div className="flex flex-wrap gap-1">
                {missingEmail.map(s => (
                  <span key={s.id} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{s.name}</span>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Entwurf (bearbeitbar)</label>
            <textarea
              defaultValue={emailText}
              rows={14}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-hi-accent outline-none resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Schließen</button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-hi-navy text-white rounded-lg text-sm font-medium hover:bg-hi-navy/90"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Text kopieren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AddFormProps {
  value: Omit<Stakeholder, 'id'>;
  lgs: AppState['liefergegenstaende'];
  onChange: (v: Omit<Stakeholder, 'id'>) => void;
  onSave: () => void;
  onCancel: () => void;
}

const AddForm: React.FC<AddFormProps> = ({ value, lgs, onChange, onSave, onCancel }) => (
  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
    <h4 className="text-sm font-semibold text-blue-800">Neue Person</h4>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {([['name', 'Name', 'Vorname Nachname'], ['rolle', 'Rolle', 'z.B. IT-Leitung'], ['bereich', 'Bereich', 'z.B. IT-Abteilung'], ['email', 'E-Mail', 'name@beispiel.de']] as const).map(([field, label, ph]) => (
        <div key={field}>
          <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
          <input
            type={field === 'email' ? 'email' : 'text'}
            value={value[field]}
            onChange={e => onChange({ ...value, [field]: e.target.value })}
            placeholder={ph}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-hi-accent focus:border-transparent outline-none bg-white"
          />
        </div>
      ))}
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-2">Zuständig für Liefergegenstände</label>
      <div className="flex flex-wrap gap-2">
        {lgs.map(lg => {
          const active = value.lgIds.includes(lg.id);
          return (
            <button
              key={lg.id}
              type="button"
              onClick={() => {
                const next = active ? value.lgIds.filter(id => id !== lg.id) : [...value.lgIds, lg.id].sort((a, b) => a - b);
                onChange({ ...value, lgIds: next });
              }}
              title={lg.titel}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${active ? 'bg-hi-navy text-white border-hi-navy' : 'bg-white text-gray-500 border-gray-300'}`}
            >
              LG {lg.id}
            </button>
          );
        })}
      </div>
    </div>
    <div className="flex gap-2 justify-end">
      <button onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800">Abbrechen</button>
      <button onClick={onSave} className="px-4 py-1.5 text-sm bg-hi-accent text-white rounded-lg font-medium hover:bg-hi-accent/90">Speichern</button>
    </div>
  </div>
);
