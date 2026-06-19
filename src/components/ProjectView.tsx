import React, { useMemo, useState } from 'react';
import type { AppState, Liefergegenstand, Meeting, MeetingTOP, Stakeholder } from '../types';
import { ProjectTracker } from './ProjectTracker';
import { StakeholderRegister } from './StakeholderRegister';
import { MeetingProtokolle } from './MeetingProtokolle';
import { InfrastrukturBericht } from './InfrastrukturBericht';
import { InterviewFragenliste } from './InterviewFragenliste';
import { ExecutiveSummary } from './ExecutiveSummary';
import { TOPsUebersicht } from './TOPsUebersicht';
import { countItemsWithOpenFields } from '../cloudFields';

type SubTab = 'liefergegenstaende' | 'stakeholder' | 'meetings' | 'tops' | 'fragenliste' | 'bericht' | 'executive';

interface Props {
  state: AppState;
  onUpdateLG: (id: number, changes: Partial<Liefergegenstand>) => void;
  onUpdateStakeholder: (stakeholder: Stakeholder[]) => void;
  onUpdateMeetings: (meetings: Meeting[]) => void;
}

const GROUPS = [
  {
    label: 'Projektsteuerung',
    tabs: [
      {
        key: 'liefergegenstaende' as SubTab,
        label: 'Liefergegenstände',
        icon: (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        key: 'stakeholder' as SubTab,
        label: 'Stakeholder',
        icon: (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
      {
        key: 'meetings' as SubTab,
        label: 'Protokolle',
        icon: (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
      {
        key: 'tops' as SubTab,
        label: 'Aktionspunkte',
        icon: (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Liefergegenstände',
    tabs: [
      {
        key: 'fragenliste' as SubTab,
        label: 'Fragenliste (LG 4)',
        icon: (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        key: 'bericht' as SubTab,
        label: 'Infra-Bericht (LG 2/3)',
        icon: (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        ),
      },
      {
        key: 'executive' as SubTab,
        label: 'Executive Summary (LG 14)',
        icon: (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        ),
      },
    ],
  },
];

export const ProjectView: React.FC<Props> = ({ state, onUpdateLG, onUpdateStakeholder, onUpdateMeetings }) => {
  const [subTab, setSubTab] = useState<SubTab>('liefergegenstaende');

  const lgStats = {
    abgenommen: state.liefergegenstaende.filter(l => l.status === 'Abgenommen').length,
    gesamt: state.liefergegenstaende.length,
  };

  const offeneTOPs = useMemo(() =>
    (state.meetings ?? []).flatMap(m => m.tops).filter(t => t.status === 'Offen' && t.titel?.trim()).length,
    [state.meetings]
  );

  const offeneFelder = useMemo(() => countItemsWithOpenFields(state), [state]);

  const handleUpdateTOP = (meetingId: string, topId: string, changes: Partial<MeetingTOP>) => {
    const updated = (state.meetings ?? []).map(m =>
      m.id === meetingId
        ? { ...m, tops: m.tops.map(t => t.id === topId ? { ...t, ...changes } : t) }
        : m
    );
    onUpdateMeetings(updated);
  };

  const badge = (key: SubTab): React.ReactNode => {
    if (key === 'liefergegenstaende') return `${lgStats.abgenommen}/${lgStats.gesamt}`;
    if (key === 'stakeholder') return `${state.stakeholder.filter(s => s.name.trim()).length}/${state.stakeholder.length}`;
    if (key === 'meetings' && state.meetings.length > 0) return `${state.meetings.length}`;
    if (key === 'tops' && offeneTOPs > 0) return `${offeneTOPs}`;
    if (key === 'fragenliste' && offeneFelder > 0) return `${offeneFelder}`;
    return null;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Sub-Navigation — zweizeilig gruppiert */}
      <div className="bg-white border-b border-gray-200 px-4 pt-3 pb-0 flex-shrink-0">
        <div className="flex flex-wrap gap-x-6 gap-y-0">
          {GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1 mb-1">{group.label}</p>
              <div className="flex gap-0.5">
                {group.tabs.map(t => {
                  const b = badge(t.key);
                  return (
                    <button
                      key={t.key}
                      onClick={() => setSubTab(t.key)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                        subTab === t.key
                          ? 'border-hi-accent text-hi-accent bg-hi-accent/5'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {t.icon}
                      {t.label}
                      {b !== null && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                          subTab === t.key ? 'bg-hi-accent/20 text-hi-accent' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {b}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-hi-gray">
        {subTab === 'liefergegenstaende' && <ProjectTracker state={state} onUpdateLG={onUpdateLG} />}
        {subTab === 'stakeholder'        && <StakeholderRegister state={state} onUpdate={onUpdateStakeholder} />}
        {subTab === 'meetings'           && <MeetingProtokolle state={state} onUpdate={onUpdateMeetings} />}
        {subTab === 'tops'               && <TOPsUebersicht state={state} onUpdateTOP={handleUpdateTOP} />}
        {subTab === 'fragenliste'        && <InterviewFragenliste state={state} />}
        {subTab === 'bericht'            && <InfrastrukturBericht state={state} />}
        {subTab === 'executive'          && <ExecutiveSummary state={state} />}
      </div>
    </div>
  );
};
