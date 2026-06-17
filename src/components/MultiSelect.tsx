import React, { useState } from 'react';

interface Item {
  kuerzel: string;
  name: string;
}

interface MultiSelectProps {
  value: string[];
  onChange: (val: string[]) => void;
  items: Item[];
  label: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ value, onChange, items, label }) => {
  const [open, setOpen] = useState(false);

  const toggle = (kuerzel: string) => {
    if (value.includes(kuerzel)) {
      onChange(value.filter((v) => v !== kuerzel));
    } else {
      onChange([...value, kuerzel]);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full border border-gray-300 rounded px-3 py-2 text-left bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[38px]"
      >
        {value.length === 0 ? (
          <span className="text-gray-400">-- {label} auswählen --</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {value.map((v) => (
              <span key={v} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                {v}
              </span>
            ))}
          </div>
        )}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-3 py-2 text-gray-400 text-sm">Keine Einträge vorhanden</div>
          ) : (
            items.map((item) => (
              <label
                key={item.kuerzel}
                className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={value.includes(item.kuerzel)}
                  onChange={() => toggle(item.kuerzel)}
                  className="accent-blue-600"
                />
                <span className="font-mono text-blue-700 text-xs">{item.kuerzel}</span>
                <span className="text-gray-700">{item.name}</span>
              </label>
            ))
          )}
        </div>
      )}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  );
};
