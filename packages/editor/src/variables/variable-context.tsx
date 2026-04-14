import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { VariableDefinition, VariableContextValue } from './types';

const EMPTY_CONTEXT: VariableContextValue = {
  definitions: [],
  refreshDefinitions: () => { /* no-op when variables extension not loaded */ },
  getDefinition: () => undefined,
};

const VariableContext = createContext<VariableContextValue>(EMPTY_CONTEXT);

interface VariableProviderProps {
  initialDefinitions?: VariableDefinition[];
  children: React.ReactNode;
}

/**
 * VariableProvider — Manages the variable catalog.
 *
 * Host apps provide variable definitions via props.
 * The picker reads from this context. Definitions can be refreshed
 * at runtime without re-mounting the editor.
 */
export const VariableProvider: React.FC<VariableProviderProps> = ({
  initialDefinitions = [],
  children,
}) => {
  const [definitions, setDefinitions] = useState<VariableDefinition[]>(initialDefinitions);

  const refresh = useCallback((newDefinitions: VariableDefinition[]) => {
    setDefinitions(newDefinitions);
  }, []);

  const getDefinition = useCallback(
    (key: string): VariableDefinition | undefined => {
      return definitions.find(d => d.key === key);
    },
    [definitions],
  );

  const value = useMemo<VariableContextValue>(
    () => ({ definitions, refreshDefinitions: refresh, getDefinition }),
    [definitions, refresh, getDefinition],
  );

  return (
    <VariableContext.Provider value={value}>
      {children}
    </VariableContext.Provider>
  );
};

/**
 * Hook to access the variable catalog from within the editor tree.
 * Returns empty defaults when called outside a VariableProvider.
 */
export function useVariables(): VariableContextValue {
  return useContext(VariableContext);
}
