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
  const { definitions, refreshDefinitions } = useVariables();
  const { activeEditor, runHistoryAction } = useDocument();
  const t = useTranslations();
  const [filter, setFilter] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [draft, setDraft] = useState<{
    label: string;
    key: string;
    group: string;
    valueType: NonNullable<VariableDefinition['valueType']>;
  }>({
    label: '',
    key: '',
    group: '',
    valueType: 'string',
  });

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

  const resetCreateState = useCallback(() => {
    setDraft({
      label: '',
      key: '',
      group: '',
      valueType: 'string',
    });
    setCreateError(null);
    setCreating(false);
  }, []);

  const handleCreateVariable = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const label = draft.label.trim();
    const key = draft.key.trim();
    const group = draft.group.trim();

    if (!label || !key) {
      setCreateError(t.variables.createVariableMissingFields);
      return;
    }

    if (definitions.some(def => def.key === key)) {
      setCreateError(interpolate(t.variables.createVariableDuplicateKey, { key }));
      return;
    }

    refreshDefinitions([
      ...definitions,
      {
        key,
        label,
        group: group || undefined,
        valueType: draft.valueType,
      },
    ]);

    resetCreateState();
  }, [
    definitions,
    draft.group,
    draft.key,
    draft.label,
    draft.valueType,
    refreshDefinitions,
    resetCreateState,
    t.variables.createVariableDuplicateKey,
    t.variables.createVariableMissingFields,
  ]);

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
      <div className="lex4-variable-panel-content">
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
            <div key={group} className="lex4-variable-group" data-variable-group={group}>
              <div className="lex4-variable-group-label">{group}</div>
              <div className="lex4-variable-group-items">
                {defs.map(def => (
                  <button
                    key={def.key}
                    type="button"
                    className="lex4-variable-list-item"
                    data-testid={`variable-panel-${def.key}`}
                    data-variable-group={group}
                    onClick={() => handleInsert(def.key)}
                    disabled={!activeEditor}
                    title={def.key}
                  >
                    {def.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="lex4-variable-create">
          {creating ? (
            <form className="lex4-variable-create-form" onSubmit={handleCreateVariable}>
              <div className="lex4-variable-create-title">{t.variables.createVariableTitle}</div>
              <label className="lex4-variable-create-field">
                <span>{t.variables.createVariableLabel}</span>
                <input
                  value={draft.label}
                  onChange={(e) => {
                    setDraft(current => ({ ...current, label: e.target.value }));
                    if (createError) {
                      setCreateError(null);
                    }
                  }}
                />
              </label>
              <label className="lex4-variable-create-field">
                <span>{t.variables.createVariableKey}</span>
                <input
                  value={draft.key}
                  onChange={(e) => {
                    setDraft(current => ({ ...current, key: e.target.value }));
                    if (createError) {
                      setCreateError(null);
                    }
                  }}
                />
              </label>
              <div className="lex4-variable-create-row">
                <label className="lex4-variable-create-field">
                  <span>{t.variables.createVariableGroup}</span>
                  <input
                    value={draft.group}
                    onChange={(e) => {
                      setDraft(current => ({ ...current, group: e.target.value }));
                    }}
                  />
                </label>
                <label className="lex4-variable-create-field">
                  <span>{t.variables.createVariableType}</span>
                  <select
                    value={draft.valueType}
                    onChange={(e) => {
                      setDraft(current => ({
                        ...current,
                        valueType: e.target.value as NonNullable<VariableDefinition['valueType']>,
                      }));
                    }}
                  >
                    <option value="string">string</option>
                    <option value="number">number</option>
                    <option value="date">date</option>
                    <option value="boolean">boolean</option>
                  </select>
                </label>
              </div>
              {createError && <div className="lex4-variable-create-error">{createError}</div>}
              <div className="lex4-variable-create-actions">
                <button type="button" className="lex4-variable-create-cancel" onClick={resetCreateState}>
                  {t.variables.createVariableCancel}
                </button>
                <button type="submit" className="lex4-variable-create-submit">
                  {t.variables.createVariableSave}
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              className="lex4-variable-create-toggle"
              onClick={() => setCreating(true)}
            >
              + {t.variables.newVariable}
            </button>
          )}
        </div>
      </div>
    </EditorSidebar>
  );
};
