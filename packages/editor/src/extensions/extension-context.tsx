import React, { createContext, useContext, useMemo, useRef } from 'react';
import type { ResolvedExtensions, ExtensionContext } from './types';
import { resolveExtensions } from './types';
import type { Lex4Extension } from './types';

const EMPTY_RESOLVED: ResolvedExtensions = {
  nodes: [],
  bodyPlugins: [],
  toolbarItems: [],
  sidePanels: [],
  providers: [],
  themeOverrides: {},
  cssVariables: {},
  rootClassNames: [],
  handleFactories: [],
};

const ExtensionResolvedContext = createContext<ResolvedExtensions>(EMPTY_RESOLVED);

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Provides resolved extension data to all child components.
 * Extensions are resolved when the set of extension names changes,
 * not on every array reference change — preventing unnecessary
 * editor re-initialization.
 */
export const ExtensionProvider: React.FC<{
  extensions?: Lex4Extension[];
  children: React.ReactNode;
}> = ({ extensions, children }) => {
  const prevNamesRef = useRef<string[]>([]);
  const resolvedRef = useRef<ResolvedExtensions>(EMPTY_RESOLVED);

  const currentNames = (extensions ?? []).map(e => e.name);
  if (!arraysEqual(currentNames, prevNamesRef.current)) {
    resolvedRef.current =
      extensions && extensions.length > 0 ? resolveExtensions(extensions) : EMPTY_RESOLVED;
    prevNamesRef.current = currentNames;
  }
  const resolved = resolvedRef.current;

  // Wrap children with extension providers (inside-out order)
  let wrapped = <>{children}</>;
  for (let i = resolved.providers.length - 1; i >= 0; i--) {
    const Provider = resolved.providers[i];
    wrapped = <Provider>{wrapped}</Provider>;
  }

  return (
    <ExtensionResolvedContext.Provider value={resolved}>
      {wrapped}
    </ExtensionResolvedContext.Provider>
  );
};

/**
 * Returns the resolved extension data.
 */
export function useExtensions(): ResolvedExtensions {
  return useContext(ExtensionResolvedContext);
}

// --- Extension state store ---

const ExtensionStateContext = createContext<React.MutableRefObject<Record<string, unknown>> | null>(null);

export const ExtensionStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const stateRef = useRef<Record<string, unknown>>({});
  return (
    <ExtensionStateContext.Provider value={stateRef}>
      {children}
    </ExtensionStateContext.Provider>
  );
};

/**
 * Hook to get/set extension shared state from any component within the editor tree.
 */
export function useExtensionState() {
  const stateRef = useContext(ExtensionStateContext);
  return {
    get: <T = unknown>(key: string): T | undefined => stateRef?.current[key] as T | undefined,
    set: <T = unknown>(key: string, value: T) => {
      if (stateRef) stateRef.current[key] = value;
    },
  };
}

/**
 * Builds an ExtensionContext for handle method factories.
 */
export function useExtensionContext(
  getDocument: ExtensionContext['getDocument'],
  getActiveEditor: ExtensionContext['getActiveEditor'],
): ExtensionContext {
  const stateRef = useContext(ExtensionStateContext);

  return useMemo(() => ({
    getDocument,
    getActiveEditor,
    getExtensionState: <T = unknown>(key: string) => stateRef?.current[key] as T | undefined,
    setExtensionState: <T = unknown>(key: string, value: T) => {
      if (stateRef) stateRef.current[key] = value;
    },
  }), [getDocument, getActiveEditor, stateRef]);
}
