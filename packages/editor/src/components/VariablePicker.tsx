import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { useVariables } from '../variables/variable-context';
import type { VariableDefinition } from '../variables/types';

interface VariablePickerProps {
  onInsert: (variableKey: string) => void;
  disabled?: boolean;
}

/**
 * VariablePicker — Dropdown UI for browsing and inserting variables.
 *
 * Groups variables by their `group` field and allows filtering by name.
 * Clicking a variable calls `onInsert` with its key.
 */
export const VariablePicker: React.FC<VariablePickerProps> = ({ onInsert, disabled = false }) => {
  const { definitions } = useVariables();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!filter) return definitions;
    const lower = filter.toLowerCase();
    return definitions.filter(
      d =>
        d.key.toLowerCase().includes(lower) ||
        d.label.toLowerCase().includes(lower),
    );
  }, [definitions, filter]);

  const grouped = useMemo(() => {
    const groups: Record<string, VariableDefinition[]> = {};
    for (const def of filtered) {
      const g = def.group ?? 'Other';
      if (!groups[g]) groups[g] = [];
      groups[g].push(def);
    }
    return groups;
  }, [filtered]);

  const handleInsert = useCallback(
    (key: string) => {
      onInsert(key);
      setOpen(false);
      setFilter('');
    },
    [onInsert],
  );

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFilter('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        className="h-7 rounded border border-gray-200 bg-white px-2 text-xs font-medium text-gray-700
                   hover:bg-gray-50 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400
                   disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid="variable-picker-button"
        disabled={disabled || definitions.length === 0}
        onClick={() => setOpen(!open)}
        title="Insert variable"
      >
        {'{x}'}
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-64 rounded-md border border-gray-200
                     bg-white shadow-lg"
          data-testid="variable-picker-dropdown"
        >
          <div className="border-b border-gray-100 p-2">
            <input
              type="text"
              className="w-full rounded border border-gray-200 px-2 py-1 text-xs
                         focus:border-blue-400 focus:outline-none"
              placeholder="Search variables..."
              data-testid="variable-picker-search"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              autoFocus
            />
          </div>

          <div className="max-h-48 overflow-y-auto p-1">
            {Object.keys(grouped).length === 0 && (
              <div className="px-2 py-1 text-xs text-gray-400">No variables found</div>
            )}
            {Object.entries(grouped).map(([group, defs]) => (
              <div key={group}>
                <div className="px-2 py-1 text-[10px] font-semibold uppercase text-gray-400">
                  {group}
                </div>
                {defs.map(def => (
                  <button
                    key={def.key}
                    type="button"
                    className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs
                               hover:bg-blue-50"
                    data-testid={`variable-option-${def.key}`}
                    onClick={() => handleInsert(def.key)}
                  >
                    <span className="font-medium text-blue-700">{`{{${def.key}}}`}</span>
                    <span className="text-gray-500">{def.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
