import React, { useCallback, useEffect } from 'react';
import type { Lex4Extension, ExtensionContext } from './types';
import type { VariableDefinition } from '../variables/types';
import { VariableNode } from '../variables/variable-node';
import { VariablePlugin } from '../variables/variable-plugin';
import { VariableProvider, useVariables } from '../variables/variable-context';
import { VariablePicker } from '../components/VariablePicker';
import { VariablePanel } from '../components/VariablePanel';
import { INSERT_VARIABLE_COMMAND } from '../variables/variable-commands';
import { useDocument } from '../context/document-context';
import { useExtensionState } from './extension-context';

/**
 * Toolbar item contributed by the variables extension.
 * Wires the VariablePicker to the active editor and document context.
 */
const VariableToolbarItem: React.FC = () => {
  const { activeEditor, runHistoryAction } = useDocument();

  const handleInsert = useCallback((variableKey: string) => {
    runHistoryAction(
      { label: `Insert variable ${variableKey}`, source: 'toolbar', region: 'document' },
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
 * - VariablePicker toolbar item
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
      <VariableProvider initialDefinitions={definitions}>
        <VariableDefinitionsSync>
          {children}
        </VariableDefinitionsSync>
      </VariableProvider>
    );
  };

  return {
    name: 'variables',
    nodes: [VariableNode],
    bodyPlugins: [VariablePlugin],
    toolbarItems: [VariableToolbarItem],
    sidePanel: VariablePanel,
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
