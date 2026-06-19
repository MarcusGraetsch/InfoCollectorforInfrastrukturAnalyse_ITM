import React, { useState } from 'react';
import type { AppState, Liefergegenstand, Stakeholder } from '../types';
import { ProjectTracker } from './ProjectTracker';
import { StakeholderRegister } from './StakeholderRegister';

type SubTab = 'liefergegenstaende' | 'stakeholder';

interface Props {
  state: AppState;
  onUpdateLG: (id: number, changes: Partial<Liefergegenstand>) => void;
  onUpdateStakeholder: (stakeholder: Stakeholder[]) => void;
}

const TABS: { key: SubTab; label: string; icon: React.ReactNode }[] = [
  {
    key: 'liefergegenstaende',
    label: 'Liefergegenstände',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'stakeholder',
    label: 'Stakeholder',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export const ProjectView: React.FC<Props> = ({ state, onUpdateLG, onUpdateStakeholder }) => {
  const [subTab, setSubTab] = useState<SubTab>('liefergegenstaende');

  const lgStats = {
    abgenommen: state.liefergegenstaende.filter(l => l.status === 'Abgenommen').length,
    gesamt: state.liefergegenstaende.length,
  };

  return (
    <div className="h-full flex flex-col">
      {/* Sub-Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 pt-4 flex-shrink-0">
        <div className="flex items-center gap-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                subTab === t.key
                  ? 'border-hi-accent text-hi-accent bg-hi-accent/5'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t.icon}
              {t.label}
              {t.key === 'liefergegenstaende' && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  subTab === t.key ? 'bg-hi-accent/20 text-hi-accent' : 'bg-gray-100 text-gray-500'
                }`}>
                  {lgStats.abgenommen}/{lgStats.gesamt}
                </span>
              )}
              {t.key === 'stakeholder' && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  subTab === t.key ? 'bg-hi-accent/20 text-hi-accent' : 'bg-gray-100 text-gray-500'
                }`}>
                  {state.stakeholder.filter(s => s.name.trim()).length}/{state.stakeholder.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-hi-gray">
        {subTab === 'liefergegenstaende' && (
          <ProjectTracker state={state} onUpdateLG={onUpdateLG} />
        )}
        {subTab === 'stakeholder' && (
          <StakeholderRegister state={state} onUpdate={onUpdateStakeholder} />
        )}
      </div>
    </div>
  );
};
