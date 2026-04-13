import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { VariableDefinition, VariableContextValue } from './types';

const VariableContext = createContext<VariableContextValue | null>(null);

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
 */
export function useVariables(): VariableContextValue {
  const ctx = useContext(VariableContext);
  if (!ctx) {
    throw new Error('useVariables must be used within a VariableProvider');
  }
  return ctx;
}
