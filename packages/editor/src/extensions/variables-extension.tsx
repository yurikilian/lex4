import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Braces } from 'lucide-react';
import type { Lex4Extension, ExtensionContext } from './types';
import type { VariableDefinition } from '../variables/types';
import { VariableNode } from '../variables/variable-node';
import { VariablePlugin } from '../variables/variable-plugin';
import { VariableProvider, useVariables } from '../variables/variable-context';
import { VariablePicker } from '../components/VariablePicker';
import { VariablePanel } from '../components/VariablePanel';
import { INSERT_VARIABLE_COMMAND } from '../variables/variable-commands';

declare module '../types/editor-handle' {
  interface Lex4EditorHandle {
    insertVariable: (key: string) => void;
    refreshVariables: (newDefs: VariableDefinition[]) => void;
  }
}
import { useDocument } from '../context/document-context';
import { useExtensionState } from './extension-context';
import { useTranslations, interpolate } from '../i18n';

// --- Variable panel open/close context ---

interface VariablePanelState {
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
}

const VariablePanelContext = createContext<VariablePanelState>({
  panelOpen: false,
  setPanelOpen: () => {},
});

export function useVariablePanelState(): VariablePanelState {
  return useContext(VariablePanelContext);
}

const VariablePanelStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [panelOpen, setPanelOpen] = useState(false);
  return (
    <VariablePanelContext.Provider value={{ panelOpen, setPanelOpen }}>
      {children}
    </VariablePanelContext.Provider>
  );
};

/**
 * Toolbar item contributed by the variables extension.
 * Wires the VariablePicker to the active editor and document context.
 */
const VariableToolbarItem: React.FC = () => {
  const { activeEditor, runHistoryAction } = useDocument();
  const t = useTranslations();

  const handleInsert = useCallback((variableKey: string) => {
    runHistoryAction(
      { label: interpolate(t.variables.insertVariable, { key: variableKey }), source: 'toolbar', region: 'document' },
      () => {
        if (activeEditor) {
          activeEditor.dispatchCommand(INSERT_VARIABLE_COMMAND, variableKey);
        }
      },
    );
  }, [activeEditor, runHistoryAction]);

  return (
    <VariablePicker
      onInsert={handleInsert}
      disabled={!activeEditor}
    />
  );
};

/**
 * Toolbar toggle button for the Variables side panel.
 */
const VariablePanelToggle: React.FC = () => {
  const { panelOpen, setPanelOpen } = useVariablePanelState();
  const t = useTranslations();

  return (
    <button
      type="button"
      title={panelOpen ? t.variables.closePanel : t.variables.openPanel}
      aria-label={panelOpen ? t.variables.closePanel : t.variables.openPanel}
      onMouseDown={e => e.preventDefault()}
      onClick={() => setPanelOpen(!panelOpen)}
      className={`lex4-toolbar-btn${panelOpen ? ' active' : ''}`}
      data-testid="toggle-variable-panel"
    >
      <Braces size={15} />
    </button>
  );
};

/**
 * Wrapped VariablePanel that reads open/close state from VariablePanelContext.
 */
const VariablePanelWithState: React.FC = () => {
  const { panelOpen, setPanelOpen } = useVariablePanelState();
  return <VariablePanel open={panelOpen} onClose={() => setPanelOpen(false)} />;
};

/**
 * Syncs the VariableProvider definitions into the extension state store
 * so astExtension can access them when building the AST.
 */
const VariableDefinitionsSync: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { definitions } = useVariables();
  const extState = useExtensionState();

  useEffect(() => {
    extState.set('variableDefinitions', definitions);
  }, [definitions, extState]);

  return <>{children}</>;
};

/**
 * Creates a variables extension that adds variable/placeholder support.
 *
 * Contributes:
 * - VariableNode (custom Lexical node)
 * - VariablePlugin (body plugin for insert command handling)
 * - VariableProvider (context provider for variable catalog)
 * - VariablePicker toolbar item + panel toggle button
 * - VariablePanel side panel with toggle state
 * - Handle methods: insertVariable, refreshVariables
 *
 * @param definitions Initial variable definitions to load
 *
 * @example
 * ```tsx
 * const defs = [
 *   { key: 'customer.name', label: 'Customer', group: 'Customer', valueType: 'string' },
 * ];
 * <Lex4Editor extensions={[variablesExtension(defs)]} />
 * ```
 */
export function variablesExtension(definitions: VariableDefinition[] = []): Lex4Extension {
  const ProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
      <VariablePanelStateProvider>
        <VariableProvider initialDefinitions={definitions}>
          <VariableDefinitionsSync>
            {children}
          </VariableDefinitionsSync>
        </VariableProvider>
      </VariablePanelStateProvider>
    );
  };

  return {
    name: 'variables',
    nodes: [VariableNode],
    bodyPlugins: [VariablePlugin],
    toolbarItems: [VariableToolbarItem],
    toolbarEndItems: [VariablePanelToggle],
    sidePanel: VariablePanelWithState,
    provider: ProviderWrapper,
    handleMethods: (ctx: ExtensionContext) => ({
      insertVariable: (key: string) => {
        const editor = ctx.getActiveEditor();
        if (editor) {
          editor.dispatchCommand(INSERT_VARIABLE_COMMAND, key);
        }
      },
      refreshVariables: (newDefs: VariableDefinition[]) => {
        ctx.setExtensionState('variableDefinitions', newDefs);
      },
    }),
  };
}
