import React, { useMemo, useState } from 'react';
import type { AppState, Anwendung, Liefergegenstand, Meeting, MeetingTOP, NIS2Assessment, Stakeholder, TCODaten } from '../types';
import { ProjectTracker } from './ProjectTracker';
import { StakeholderRegister } from './StakeholderRegister';
import { MeetingProtokolle } from './MeetingProtokolle';
import { InfrastrukturBericht } from './InfrastrukturBericht';
import { InterviewFragenliste } from './InterviewFragenliste';
import { ExecutiveSummary } from './ExecutiveSummary';
import { TOPsUebersicht } from './TOPsUebersicht';
import { InfrastrukturLandkarte } from './InfrastrukturLandkarte';
import { SchnittstellenMatrix } from './SchnittstellenMatrix';
import { LizenzKostenAnalyse } from './LizenzKostenAnalyse';
import { TCOModell } from './TCOModell';
import { SecurityGovernanceArchitektur } from './SecurityGovernanceArchitektur';
import { ZielarchitekturBetrieb } from './ZielarchitekturBetrieb';
import { VollstaendigkeitsCockpit } from './VollstaendigkeitsCockpit';
import { NIS2Check } from './NIS2Check';
import { EuAiActInventar } from './EuAiActInventar';
import { SouveraenitaetsBewertung } from './SouveraenitaetsBewertung';
import { NachweisKatalog } from './NachweisKatalog';
import { QuellenBibliothek } from './QuellenBibliothek';
import { NachhaltigkeitsModul } from './NachhaltigkeitsModul';
import { VersionControl } from './VersionControl';
import { DORARegister } from './DORARegister';
import { countItemsWithOpenFields } from '../cloudFields';
import { EncryptionSettings } from './EncryptionSettings';

type SubTab =
  | 'liefergegenstaende' | 'cockpit' | 'stakeholder' | 'meetings' | 'tops'
  | 'fragenliste' | 'landkarte' | 'schnittstellen' | 'lizenz' | 'tco' | 'security' | 'zielarchitektur'
  | 'nis2' | 'euaiact' | 'souveraenitaet' | 'nachweise' | 'quellen' | 'nachhaltigkeit' | 'dora'
  | 'bericht' | 'executive' | 'snapshots' | 'einstellungen';

interface Props {
  state: AppState;
  onUpdateLG: (id: number, changes: Partial<Liefergegenstand>) => void;
  onUpdateStakeholder: (stakeholder: Stakeholder[]) => void;
  onUpdateMeetings: (meetings: Meeting[]) => void;
  onUpdateAnwendung: (id: string, changes: Partial<Anwendung>) => void;
  onUpdateTCO: (tco: TCODaten) => void;
  onUpdateNIS2: (a: NIS2Assessment) => void;
  onUpdateNachweise: (status: Record<string, { vorhanden: boolean; notiz: string }>) => void;
  onUpdateIKT: (d: import('../types').IKTDienstleister[]) => void;
  onOpenCloudWizard: (id: string) => void;
  onRestore: (state: AppState) => void;
  onReload: () => void;
}

const GROUPS = [
  {
    label: 'Projektsteuerung',
    tabs: [
      { key: 'liefergegenstaende' as SubTab, label: 'Liefergegenstände',
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
      { key: 'cockpit' as SubTab, label: 'Fortschritt',
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
      { key: 'stakeholder' as SubTab, label: 'Stakeholder',
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
      { key: 'meetings' as SubTab, label: 'Protokolle',
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
      { key: 'snapshots' as SubTab, label: 'Versionierung & Delta', group: 'Projektsteuerung' },
      { key: 'tops' as SubTab, label: 'Aktionspunkte',
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
    ],
  },
  {
    label: 'Analyse & Strategie',
    tabs: [
      { key: 'fragenliste' as SubTab, label: 'Fragenliste (LG 4)',
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
      { key: 'landkarte' as SubTab, label: 'Landkarte (LG 3)',
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg> },
      { key: 'schnittstellen' as SubTab, label: 'Schnittstellen-Matrix',
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 9h16M4 14h16M9 4v16M14 4v16" /></svg> },
      { key: 'lizenz' as SubTab, label: 'Lizenz & Kosten (LG 5)',
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg> },
      { key: 'tco' as SubTab, label: 'TCO-Modell (LG 6)',
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> },
      { key: 'security' as SubTab, label: 'Security & Gov. (LG 9)',
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
      { key: 'zielarchitektur' as SubTab, label: 'Zielarchitektur (LG 10)',
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg> },
    ],
  },
  {
    label: 'Compliance & Regulatorik',
    tabs: [
      { key: 'nis2' as SubTab, label: 'NIS2-Check',
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
      { key: 'euaiact' as SubTab, label: 'EU AI Act',
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
      { key: 'souveraenitaet' as SubTab, label: 'Cloud-Souveränität',
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg> },
      { key: 'nachweise' as SubTab, label: 'Nachweis-Katalog',
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
      { key: 'quellen' as SubTab, label: 'Quellen-Bibliothek',
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
      { key: 'nachhaltigkeit' as SubTab, label: 'Nachhaltigkeit (EnEfG)',
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
      { key: 'dora' as SubTab, label: 'DORA IKT-Register',
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
    ],
  },
  {
    label: 'Berichte',
    tabs: [
      { key: 'bericht' as SubTab, label: 'Infra-Bericht (LG 2/3)',
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg> },
      { key: 'executive' as SubTab, label: 'Executive Summary (LG 14)',
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> },
    ],
  },
  {
    label: 'Einstellungen',
    tabs: [
      { key: 'einstellungen' as SubTab, label: 'Datenverschlüsselung',
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> },
    ],
  },
];

export const ProjectView: React.FC<Props> = ({ state, onUpdateLG, onUpdateStakeholder, onUpdateMeetings, onUpdateAnwendung, onUpdateTCO, onUpdateNIS2, onUpdateNachweise, onUpdateIKT, onOpenCloudWizard, onRestore, onReload }) => {
  const [subTab, setSubTab] = useState<SubTab>('liefergegenstaende');
  const [activeGroup, setActiveGroup] = useState<string>(GROUPS[0].label);

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
    if (key === 'lizenz' && state.anwendungen.length > 0) return `${state.anwendungen.length}`;
    if (key === 'landkarte') {
      const total = (['anwendungen','server','clients','netzkomponenten'] as const).reduce((n, k) => n + state[k].length, 0);
      return total > 0 ? `${total}` : null;
    }
    if (key === 'schnittstellen' && (state.schnittstellen?.length ?? 0) > 0) return `${state.schnittstellen.length}`;
    return null;
  };

  const currentGroup = GROUPS.find(g => g.label === activeGroup) ?? GROUPS[0];

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, tabs: typeof currentGroup.tabs) => {
    const currentIdx = tabs.findIndex(t => t.key === subTab);
    if (e.key === 'ArrowRight') {
      const next = tabs[(currentIdx + 1) % tabs.length];
      setSubTab(next.key);
    } else if (e.key === 'ArrowLeft') {
      const prev = tabs[(currentIdx - 1 + tabs.length) % tabs.length];
      setSubTab(prev.key);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Primary nav: group selector */}
      <div className="bg-hi-navy px-4 pt-2 pb-0 flex-shrink-0">
        <div className="flex gap-1 overflow-x-auto">
          {GROUPS.map(group => (
            <button
              key={group.label}
              onClick={() => {
                setActiveGroup(group.label);
                // Auto-select first tab in group if current tab not in this group
                if (!group.tabs.some(t => t.key === subTab)) {
                  setSubTab(group.tabs[0].key);
                }
              }}
              aria-selected={activeGroup === group.label}
              className={`flex-shrink-0 px-4 py-2 text-xs font-semibold rounded-t-lg whitespace-nowrap transition-colors ${
                activeGroup === group.label
                  ? 'bg-white text-hi-navy'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {group.label}
              {group.tabs.some(t => t.key === subTab) && activeGroup !== group.label && (
                <span className="ml-1.5 w-1.5 h-1.5 bg-hi-accent rounded-full inline-block" />
              )}
            </button>
          ))}
        </div>
      </div>
      {/* Secondary nav: subtabs of active group */}
      <div className="bg-white border-b border-gray-200 px-4 pt-0 pb-0 flex-shrink-0">
        <div
          role="tablist"
          aria-label={currentGroup.label}
          className="flex gap-0.5 overflow-x-auto"
          onKeyDown={e => handleTabKeyDown(e, currentGroup.tabs)}
        >
          {currentGroup.tabs.map((t, idx) => {
            const b = badge(t.key);
            const isActive = subTab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                id={`tab-${t.key}`}
                aria-selected={isActive}
                aria-controls={`tabpanel-${t.key}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setSubTab(t.key)}
                data-tab-idx={idx}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-hi-accent text-hi-accent bg-hi-accent/5'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t.icon}
                {t.label}
                {b !== null && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${isActive ? 'bg-hi-accent/20 text-hi-accent' : 'bg-gray-100 text-gray-500'}`}>
                    {b}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-hi-gray">
        {subTab === 'liefergegenstaende' && <ProjectTracker state={state} onUpdateLG={onUpdateLG} onNavigate={tab => setSubTab(tab as SubTab)} />}
        {subTab === 'cockpit'            && <VollstaendigkeitsCockpit state={state} onNavigate={tab => setSubTab(tab as SubTab)} />}
        {subTab === 'stakeholder'        && <StakeholderRegister state={state} onUpdate={onUpdateStakeholder} />}
        {subTab === 'meetings'           && <MeetingProtokolle state={state} onUpdate={onUpdateMeetings} />}
        {subTab === 'tops'               && <TOPsUebersicht state={state} onUpdateTOP={handleUpdateTOP} />}
        {subTab === 'fragenliste'        && <InterviewFragenliste state={state} />}
        {subTab === 'landkarte'          && <InfrastrukturLandkarte state={state} />}
        {subTab === 'schnittstellen'     && <SchnittstellenMatrix state={state} />}
        {subTab === 'lizenz'             && <LizenzKostenAnalyse state={state} onUpdateAnwendung={onUpdateAnwendung} />}
        {subTab === 'tco'                && <TCOModell state={state} onUpdate={onUpdateTCO} />}
        {subTab === 'security'           && <SecurityGovernanceArchitektur state={state} onOpenCloudWizard={onOpenCloudWizard} />}
        {subTab === 'zielarchitektur'    && <ZielarchitekturBetrieb state={state} onOpenCloudWizard={onOpenCloudWizard} />}
        {subTab === 'nis2'               && <NIS2Check state={state} assessment={state.nis2Assessment ?? { sektor: '', mitarbeiter: '', umsatzMio: '', kritis: 'Unklar', einstufung: 'Unklar', massnahmen: {}, notizen: '', erstelltAm: '' }} onUpdate={onUpdateNIS2} />}
        {subTab === 'euaiact'            && <EuAiActInventar state={state} onUpdateAnwendung={onUpdateAnwendung} />}
        {subTab === 'souveraenitaet'     && <SouveraenitaetsBewertung state={state} />}
        {subTab === 'nachweise'          && <NachweisKatalog state={state} onUpdate={onUpdateNachweise} />}
        {subTab === 'quellen'            && <QuellenBibliothek />}
        {subTab === 'nachhaltigkeit'      && <NachhaltigkeitsModul state={state} />}
        {subTab === 'dora'               && <DORARegister state={state} onUpdate={onUpdateIKT} />}
        {subTab === 'snapshots'            && <VersionControl state={state} onRestore={onRestore} />}
        {subTab === 'bericht'            && <InfrastrukturBericht state={state} />}
        {subTab === 'executive'          && <ExecutiveSummary state={state} />}
        {subTab === 'einstellungen'      && <EncryptionSettings onReload={onReload} />}
      </div>
    </div>
  );
};
