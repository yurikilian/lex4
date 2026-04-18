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
    <div ref={containerRef} className="lex4-variable-picker">
      <button
        type="button"
        className="lex4-variable-picker-btn"
        data-testid="variable-picker-button"
        disabled={disabled || definitions.length === 0}
        onClick={() => setOpen(!open)}
        title="Insert variable"
      >
        {'{x}'}
      </button>

      {open && (
        <div
          className="lex4-variable-picker-dropdown"
          data-testid="variable-picker-dropdown"
        >
          <div className="lex4-variable-picker-search">
            <input
              type="text"
              placeholder="Search variables..."
              data-testid="variable-picker-search"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              autoFocus
            />
          </div>

          <div className="lex4-variable-picker-list">
            {Object.keys(grouped).length === 0 && (
              <div className="lex4-variable-picker-empty">No variables found</div>
            )}
            {Object.entries(grouped).map(([group, defs]) => (
              <div key={group}>
                <div className="lex4-variable-picker-group-label" data-variable-group={group}>
                  {group}
                </div>
                {defs.map(def => (
                  <button
                    key={def.key}
                    type="button"
                    className="lex4-variable-picker-option"
                    data-testid={`variable-option-${def.key}`}
                    data-variable-group={group}
                    onClick={() => handleInsert(def.key)}
                  >
                    <span className="lex4-variable-picker-key">{`{{${def.key}}}`}</span>
                    <span className="lex4-variable-picker-label">{def.label}</span>
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
