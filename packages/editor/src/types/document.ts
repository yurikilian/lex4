import type { SerializedEditorState } from 'lexical';

/** State for a single page in the document */
export interface PageState {
  id: string;
  bodyState: SerializedEditorState | null;
  headerState: SerializedEditorState | null;
  footerState: SerializedEditorState | null;
  headerHeight: number;
  footerHeight: number;
  /** Incremented on external header state changes (copy/clear) to force editor remount */
  headerSyncVersion: number;
  /** Incremented on external footer state changes (copy/clear) to force editor remount */
  footerSyncVersion: number;
}

/** Top-level document state */
export interface Lex4Document {
  pages: PageState[];
  headerFooterEnabled: boolean;
}

/** Creates a default empty page */
export function createEmptyPage(id?: string): PageState {
  return {
    id: id ?? crypto.randomUUID(),
    bodyState: null,
    headerState: null,
    footerState: null,
    headerHeight: 0,
    footerHeight: 0,
    headerSyncVersion: 0,
    footerSyncVersion: 0,
  };
}

/** Creates a default empty document */
export function createEmptyDocument(): Lex4Document {
  return {
    pages: [createEmptyPage()],
    headerFooterEnabled: false,
  };
}
