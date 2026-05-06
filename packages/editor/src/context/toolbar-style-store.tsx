import React, { createContext, useContext, useRef } from 'react';
import type { ElementFormatType } from 'lexical';
import { useStore } from 'zustand';
import { createStore, type StoreApi } from 'zustand/vanilla';
import type { BlockType } from '../lexical/commands/block-types';
import type { FontFamily } from '../lexical/plugins/font-plugin';
import { DEFAULT_FONT_SIZE } from '../lexical/plugins/font-size-plugin';

export interface ToolbarStyleSnapshot {
  blockType: BlockType;
  fontFamily: FontFamily;
  fontSize: number;
  alignment: ElementFormatType;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  hasSelectedVariable: boolean;
}

export const DEFAULT_TOOLBAR_STYLE_SNAPSHOT: ToolbarStyleSnapshot = {
  blockType: 'paragraph',
  fontFamily: 'Calibri',
  fontSize: DEFAULT_FONT_SIZE,
  alignment: 'left',
  isBold: false,
  isItalic: false,
  isUnderline: false,
  isStrikethrough: false,
  hasSelectedVariable: false,
};

export interface ToolbarStyleStoreState extends ToolbarStyleSnapshot {
  setSnapshot: (snapshot: ToolbarStyleSnapshot) => void;
  reset: () => void;
}

export function createToolbarStyleStore(
  initialSnapshot: ToolbarStyleSnapshot = DEFAULT_TOOLBAR_STYLE_SNAPSHOT,
): StoreApi<ToolbarStyleStoreState> {
  return createStore<ToolbarStyleStoreState>((set) => ({
    ...initialSnapshot,
    setSnapshot: (snapshot) => set(snapshot),
    reset: () => set(DEFAULT_TOOLBAR_STYLE_SNAPSHOT),
  }));
}

const ToolbarStyleStoreContext = createContext<StoreApi<ToolbarStyleStoreState> | null>(null);

export const ToolbarStyleStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const storeRef = useRef<StoreApi<ToolbarStyleStoreState> | null>(null);

  if (!storeRef.current) {
    storeRef.current = createToolbarStyleStore();
  }

  return (
    <ToolbarStyleStoreContext.Provider value={storeRef.current}>
      {children}
    </ToolbarStyleStoreContext.Provider>
  );
};

export function useToolbarStyleStore<T>(selector: (state: ToolbarStyleStoreState) => T): T {
  const store = useContext(ToolbarStyleStoreContext);
  if (!store) {
    throw new Error('useToolbarStyleStore must be used within a ToolbarStyleStoreProvider');
  }
  return useStore(store, selector);
}

export function useToolbarStyleStoreApi(): StoreApi<ToolbarStyleStoreState> {
  const store = useContext(ToolbarStyleStoreContext);
  if (!store) {
    throw new Error('useToolbarStyleStoreApi must be used within a ToolbarStyleStoreProvider');
  }
  return store;
}
