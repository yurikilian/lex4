import React, { createContext, useContext, useEffect, useState } from 'react';
import { Braces } from 'lucide-react';
import type { Lex4Extension, ExtensionContext } from './types';
import type { VariableDefinition } from '../variables/types';
import { VariableNode } from '../variables/variable-node';
import { VariablePlugin } from '../variables/variable-plugin';
import { VariableProvider, useVariables } from '../variables/variable-context';
import { VariablePanel } from '../components/VariablePanel';
import { INSERT_VARIABLE_COMMAND } from '../variables/variable-commands';

declare module '../types/editor-handle' {
  interface Lex4EditorHandle {
    insertVariable: (key: string) => void;
    refreshVariables: (newDefs: VariableDefinition[]) => void;
    setVariablePanelOpen: (open: boolean) => void;
    toggleVariablePanel: () => void;
  }
}
import { useExtensionState } from './extension-context';
import { useTranslations } from '../i18n';

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
 * Toolbar toggle contributed by the variables extension.
 * Opens and closes the variables side panel from the toolbar end area.
 */
const VariableToolbarToggle: React.FC = () => {
  const { panelOpen, setPanelOpen } = useVariablePanelState();
  const t = useTranslations();

  return (
    <button
      type="button"
      className={`lex4-toolbar-toggle-btn${panelOpen ? ' active' : ''}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => setPanelOpen(!panelOpen)}
      data-testid="toggle-variable-panel"
      title={panelOpen ? t.variables.closePanel : t.variables.openPanel}
      aria-label={panelOpen ? t.variables.closePanel : t.variables.openPanel}
    >
      <Braces size={14} />
      Variables
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

const VariablePanelStateSync: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { panelOpen, setPanelOpen } = useVariablePanelState();
  const extState = useExtensionState();

  useEffect(() => {
    extState.set('variablePanelOpen', panelOpen);
    extState.set('setVariablePanelOpen', setPanelOpen);
  }, [extState, panelOpen, setPanelOpen]);

  return <>{children}</>;
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
 * - Variables side panel plus toolbar toggle
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
          <VariablePanelStateSync>
            <VariableDefinitionsSync>
              {children}
            </VariableDefinitionsSync>
          </VariablePanelStateSync>
        </VariableProvider>
      </VariablePanelStateProvider>
    );
  };

  return {
    name: 'variables',
    nodes: [VariableNode],
    bodyPlugins: [VariablePlugin],
    toolbarEndItems: [VariableToolbarToggle],
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
      setVariablePanelOpen: (open: boolean) => {
        const setter = ctx.getExtensionState<(open: boolean) => void>('setVariablePanelOpen');
        setter?.(open);
      },
      toggleVariablePanel: () => {
        const current = ctx.getExtensionState<boolean>('variablePanelOpen') ?? false;
        const setter = ctx.getExtensionState<(open: boolean) => void>('setVariablePanelOpen');
        setter?.(!current);
      },
    }),
  };
}
