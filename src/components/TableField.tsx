import React from 'react';

interface TableRow { [key: string]: string }

interface ColumnDef {
  key: string;
  label: string;
  type?: 'text' | 'select';
  options?: string[];
}

interface Props {
  columns: ColumnDef[];
  value: TableRow[];
  onChange: (rows: TableRow[]) => void;
  label: string;
}

export const TableField: React.FC<Props> = ({ columns, value, onChange }) => {
  const handleCellChange = (rowIdx: number, colKey: string, cellVal: string) => {
    const updated = value.map((row, i) =>
      i === rowIdx ? { ...row, [colKey]: cellVal } : row
    );
    onChange(updated);
  };

  const handleAddRow = () => {
    const emptyRow: TableRow = {};
    for (const col of columns) emptyRow[col.key] = '';
    onChange([...value, emptyRow]);
  };

  const handleDeleteRow = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const inputClass = 'w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-hi-accent bg-white transition-colors';

  return (
    <div className="space-y-2">
      {value.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50">
                {columns.map(col => (
                  <th key={col.key} className="text-left px-2 py-1.5 font-semibold text-hi-navy border-b border-gray-200 whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
                <th className="px-2 py-1.5 border-b border-gray-200 w-8" />
              </tr>
            </thead>
            <tbody>
              {value.map((row, rowIdx) => (
                <tr key={rowIdx} className="border-t border-gray-100 hover:bg-gray-50/60 transition-colors">
                  {columns.map(col => (
                    <td key={col.key} className="px-2 py-1">
                      {col.type === 'select' && col.options ? (
                        <select
                          value={row[col.key] ?? ''}
                          onChange={e => handleCellChange(rowIdx, col.key, e.target.value)}
                          className={inputClass}
                        >
                          <option value="">—</option>
                          {col.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={row[col.key] ?? ''}
                          onChange={e => handleCellChange(rowIdx, col.key, e.target.value)}
                          className={inputClass}
                        />
                      )}
                    </td>
                  ))}
                  <td className="px-2 py-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(rowIdx)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                      title="Zeile löschen"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">Noch keine Einträge. Zeile hinzufügen um zu beginnen.</p>
      )}
      <button
        type="button"
        onClick={handleAddRow}
        className="flex items-center gap-1.5 text-xs font-semibold text-hi-teal hover:text-teal-700 transition-colors px-2 py-1 rounded hover:bg-teal-50"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Zeile hinzufügen
      </button>
    </div>
  );
};
