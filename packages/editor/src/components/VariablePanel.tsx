import React, { useCallback, useMemo, useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { EditorSidebar } from './EditorSidebar';
import { useVariables } from '../variables/variable-context';
import { useDocument } from '../context/document-context';
import { INSERT_VARIABLE_COMMAND } from '../variables/variable-commands';
import type { VariableDefinition } from '../variables/types';

/**
 * VariablePanel — Right sidebar for browsing and inserting variables.
 *
 * Features:
 * - Search/filter variables by name or key
 * - Grouped list with colored badges
 * - Click-to-insert into the active editor
 * - Refresh button for reloading definitions
 */
export const VariablePanel: React.FC = () => {
  const { definitions } = useVariables();
  const { activeEditor, runHistoryAction } = useDocument();
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(true);

  const filtered = useMemo(() => {
    if (!filter) return definitions;
    const lower = filter.toLowerCase();
    return definitions.filter(
      d => d.key.toLowerCase().includes(lower) || d.label.toLowerCase().includes(lower),
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
      if (!activeEditor) return;
      runHistoryAction(
        { label: `Insert variable ${key}`, source: 'toolbar', region: 'document' },
        () => {
          activeEditor.dispatchCommand(INSERT_VARIABLE_COMMAND, key);
        },
      );
    },
    [activeEditor, runHistoryAction],
  );

  if (definitions.length === 0) return null;

  return (
    <EditorSidebar
      title="Variables"
      subtitle={`${definitions.length} available`}
      open={open}
      onClose={() => setOpen(false)}
      testId="variable-panel"
      headerActions={
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded text-gray-400
                     transition-colors hover:bg-gray-100 hover:text-gray-600"
          title="Refresh variables"
          data-testid="btn-refresh-variables"
        >
          <RefreshCw size={12} />
        </button>
      }
    >
      <div className="p-3">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-xs
                       placeholder-gray-400 focus:border-blue-400 focus:bg-white focus:outline-none
                       focus:ring-1 focus:ring-blue-400"
            placeholder="Search variables..."
            data-testid="variable-panel-search"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="px-3 pb-3">
        {Object.keys(grouped).length === 0 && (
          <div className="py-4 text-center text-xs text-gray-400">No variables found</div>
        )}
        {Object.entries(grouped).map(([group, defs]) => (
          <div key={group} className="mb-3">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {group}
            </div>
            <div className="flex flex-col gap-1">
              {defs.map(def => (
                <button
                  key={def.key}
                  type="button"
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs
                             transition-colors hover:bg-blue-50 group"
                  data-testid={`variable-panel-${def.key}`}
                  onClick={() => handleInsert(def.key)}
                  disabled={!activeEditor}
                >
                  <span
                    className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50
                               px-2 py-0.5 text-[11px] font-medium text-blue-700
                               group-hover:border-blue-300 group-hover:bg-blue-100"
                  >
                    {`{{${def.key}}}`}
                  </span>
                  <span className="text-gray-500 truncate">{def.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </EditorSidebar>
  );
};
