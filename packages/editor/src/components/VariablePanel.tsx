import React, { useCallback, useMemo, useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { EditorSidebar } from './EditorSidebar';
import { useVariables } from '../variables/variable-context';
import { useDocument } from '../context/document-context';
import { useTranslations, interpolate } from '../i18n';
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
export const VariablePanel: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const { definitions } = useVariables();
  const { activeEditor, runHistoryAction } = useDocument();
  const t = useTranslations();
  const [filter, setFilter] = useState('');

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
        { label: interpolate(t.variables.insertVariable, { key }), source: 'toolbar', region: 'document' },
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
      title={t.variables.title}
      subtitle={interpolate(t.variables.available, { count: String(definitions.length) })}
      open={open}
      onClose={onClose}
      testId="variable-panel"
      headerActions={
        <button
          type="button"
          className="lex4-sidebar-action-btn"
          title={t.variables.refreshVariables}
          data-testid="btn-refresh-variables"
        >
          <RefreshCw size={12} />
        </button>
      }
    >
      <div className="lex4-variable-search-container">
        <div className="lex4-variable-search-wrapper">
          <Search size={14} className="lex4-variable-search-icon" />
          <input
            type="text"
            className="lex4-variable-search-input"
            placeholder={t.variables.searchPlaceholder}
            data-testid="variable-panel-search"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="lex4-variable-list">
        {Object.keys(grouped).length === 0 && (
          <div className="lex4-variable-list-empty">{t.variables.noVariablesFound}</div>
        )}
        {Object.entries(grouped).map(([group, defs]) => (
          <div key={group} className="lex4-variable-group">
            <div>
              {defs.map(def => (
                <button
                  key={def.key}
                  type="button"
                  className="lex4-variable-list-item"
                  data-testid={`variable-panel-${def.key}`}
                  onClick={() => handleInsert(def.key)}
                  disabled={!activeEditor}
                >
                  <span className="lex4-variable-badge">
                    {def.label}
                  </span>
                  <span className="lex4-variable-group-label">{group}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </EditorSidebar>
  );
};
