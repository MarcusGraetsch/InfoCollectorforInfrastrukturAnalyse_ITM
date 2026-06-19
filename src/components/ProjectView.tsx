import React, { useState } from 'react';
import type { AppState, Liefergegenstand, Meeting, Stakeholder } from '../types';
import { ProjectTracker } from './ProjectTracker';
import { StakeholderRegister } from './StakeholderRegister';
import { MeetingProtokolle } from './MeetingProtokolle';
import { InfrastrukturBericht } from './InfrastrukturBericht';

type SubTab = 'liefergegenstaende' | 'stakeholder' | 'meetings' | 'bericht';

interface Props {
  state: AppState;
  onUpdateLG: (id: number, changes: Partial<Liefergegenstand>) => void;
  onUpdateStakeholder: (stakeholder: Stakeholder[]) => void;
  onUpdateMeetings: (meetings: Meeting[]) => void;
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
  {
    key: 'meetings',
    label: 'Protokolle',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    key: 'bericht',
    label: 'Bericht LG 2/3',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export const ProjectView: React.FC<Props> = ({ state, onUpdateLG, onUpdateStakeholder, onUpdateMeetings }) => {
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
              {t.key === 'meetings' && state.meetings.length > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  subTab === t.key ? 'bg-hi-accent/20 text-hi-accent' : 'bg-gray-100 text-gray-500'
                }`}>
                  {state.meetings.length}
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
        {subTab === 'meetings' && (
          <MeetingProtokolle state={state} onUpdate={onUpdateMeetings} />
        )}
        {subTab === 'bericht' && (
          <InfrastrukturBericht state={state} />
        )}
      </div>
    </div>
  );
};
