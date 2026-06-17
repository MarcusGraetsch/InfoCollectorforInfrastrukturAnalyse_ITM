import React from 'react';
import type { CategoryHelp } from '../categories';

interface Props {
  help?: CategoryHelp;
}

export const HelpPanel: React.FC<Props> = ({ help }) => {
  if (!help) return null;
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm space-y-3">
      <p className="text-gray-700">{help.intro}</p>

      <div>
        <p className="font-semibold text-blue-800 flex items-center gap-1">
          <span>📘</span> Warum ist das wichtig? (BSI)
        </p>
        <p className="text-gray-600 mt-0.5">{help.bsiWhy}</p>
      </div>

      <div>
        <p className="font-semibold text-sky-800 flex items-center gap-1">
          <span>☁️</span> Bedeutung für die Cloud-Strategie
        </p>
        <p className="text-gray-600 mt-0.5">{help.cloudWhy}</p>
      </div>

      <div>
        <p className="font-semibold text-gray-800 flex items-center gap-1">
          <span>❓</span> Mögliche Fragen vor Ort
        </p>
        <ul className="list-disc list-inside text-gray-600 mt-0.5 space-y-0.5">
          {help.interviewQuestions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-gray-500">
        <span className="font-semibold">Ansprechpartner:</span> {help.ansprechpartner}
      </p>
    </div>
  );
};
