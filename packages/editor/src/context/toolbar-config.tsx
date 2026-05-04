import React, { createContext, useContext, useMemo } from 'react';
import type { Lex4ToolbarConfig, Lex4ToolbarControlConfig } from '../types/editor-props';

export interface ResolvedLex4ToolbarControlConfig {
  visible: boolean;
  showLabel: boolean;
}

export interface ResolvedLex4ToolbarConfig {
  history: ResolvedLex4ToolbarControlConfig;
  variables: ResolvedLex4ToolbarControlConfig;
  headerFooter: ResolvedLex4ToolbarControlConfig;
}

const DEFAULT_TOOLBAR_CONTROL_CONFIG: ResolvedLex4ToolbarControlConfig = {
  visible: true,
  showLabel: true,
};

const DEFAULT_TOOLBAR_CONFIG: ResolvedLex4ToolbarConfig = {
  history: DEFAULT_TOOLBAR_CONTROL_CONFIG,
  variables: DEFAULT_TOOLBAR_CONTROL_CONFIG,
  headerFooter: DEFAULT_TOOLBAR_CONTROL_CONFIG,
};

const ToolbarConfigContext = createContext<ResolvedLex4ToolbarConfig>(DEFAULT_TOOLBAR_CONFIG);

function resolveControlConfig(
  config?: Lex4ToolbarControlConfig,
): ResolvedLex4ToolbarControlConfig {
  return {
    visible: config?.visible ?? true,
    showLabel: config?.showLabel ?? true,
  };
}

export function normalizeToolbarConfig(
  config?: Lex4ToolbarConfig,
): ResolvedLex4ToolbarConfig {
  return {
    history: resolveControlConfig(config?.history),
    variables: resolveControlConfig(config?.variables),
    headerFooter: resolveControlConfig(config?.headerFooter),
  };
}

export const ToolbarConfigProvider: React.FC<{
  toolbar?: Lex4ToolbarConfig;
  children: React.ReactNode;
}> = ({ toolbar, children }) => {
  const resolvedConfig = useMemo(() => normalizeToolbarConfig(toolbar), [toolbar]);
  return (
    <ToolbarConfigContext.Provider value={resolvedConfig}>
      {children}
    </ToolbarConfigContext.Provider>
  );
};

export function useToolbarConfig(): ResolvedLex4ToolbarConfig {
  return useContext(ToolbarConfigContext);
}
