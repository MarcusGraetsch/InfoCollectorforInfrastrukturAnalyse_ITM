import React, { useState } from 'react';
import type { CategoryHelp } from '../categories';

interface Props {
  help?: CategoryHelp;
}

export const HelpPanel: React.FC<Props> = ({ help }) => {
  const [expanded, setExpanded] = useState(false);
  if (!help) return null;

  return (
    <div className="rounded-xl border border-hi-accent/20 bg-gradient-to-br from-hi-navy/5 to-white overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-hi-navy/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-hi-accent/10 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-hi-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xs font-bold text-hi-navy uppercase tracking-wider">
            BSI-Hintergrund & Interview-Leitfaden
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-hi-slate transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-hi-accent/10 pt-3 text-sm">
          <p className="text-hi-navy leading-relaxed">{help.intro}</p>

          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <p className="font-bold text-hi-navy text-xs uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <svg className="w-3.5 h-3.5 text-hi-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Warum frage ich das? (BSI IT-Grundschutz)
            </p>
            <p className="text-hi-slate leading-relaxed">{help.bsiWhy}</p>
          </div>

          <div className="bg-sky-50 rounded-lg p-3 border border-sky-100">
            <p className="font-bold text-hi-navy text-xs uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <svg className="w-3.5 h-3.5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              Bedeutung für die Cloud-Strategie
            </p>
            <p className="text-hi-slate leading-relaxed">{help.cloudWhy}</p>
          </div>

          <div>
            <p className="font-bold text-hi-navy text-xs uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <svg className="w-3.5 h-3.5 text-hi-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Interview-Fragen vor Ort
            </p>
            <ul className="space-y-1.5">
              {help.interviewQuestions.map((q, i) => (
                <li key={i} className="flex items-start gap-2 text-hi-slate">
                  <span className="w-5 h-5 rounded-full bg-hi-teal/10 text-hi-teal text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {q}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-hi-slate bg-hi-gray rounded-lg px-3 py-2">
            <span className="font-bold text-hi-navy">Ansprechpartner:</span> {help.ansprechpartner}
          </p>
        </div>
      )}
    </div>
  );
};
