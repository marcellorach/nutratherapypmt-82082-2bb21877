import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ScrollText } from 'lucide-react';

export interface ProgressLogEntry {
  ts: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

interface Props {
  entries: ProgressLogEntry[];
  defaultOpen?: boolean;
  title?: string;
  forceOpen?: boolean;
}

const CohortProgressLog: React.FC<Props> = ({ entries, defaultOpen = false, title = 'Log de execução', forceOpen }) => {
  const [open, setOpen] = useState(defaultOpen || !!forceOpen);
  const isOpen = forceOpen ?? open;
  if (!entries || entries.length === 0) return null;
  return (
    <div className="border rounded">
      <button
        type="button"
        onClick={() => !forceOpen && setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
      >
        <span className="flex items-center gap-1.5">
          <ScrollText className="h-3 w-3" />
          {title} ({entries.length})
        </span>
        {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {isOpen && (
        <div className="max-h-40 overflow-y-auto px-2 py-1.5 text-[10px] font-mono space-y-0.5 bg-gray-50 border-t">
          {entries.slice().reverse().map((entry, i) => (
            <div key={i} className={
              entry.level === 'error' ? 'text-red-700'
              : entry.level === 'warn' ? 'text-amber-700'
              : 'text-gray-700'
            }>
              <span className="text-gray-400">{entry.ts.slice(11, 19)}</span>{' '}
              [{entry.level}] {entry.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CohortProgressLog;