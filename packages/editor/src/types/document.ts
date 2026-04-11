import type { SerializedEditorState } from 'lexical';

export type PageCounterMode = 'none' | 'header' | 'footer' | 'both';

export interface PageChromeTemplate {
  headerState: SerializedEditorState | null;
  footerState: SerializedEditorState | null;
  headerHeight: number;
  footerHeight: number;
}

/** State for a single page in the document */
export interface PageState {
  id: string;
  bodyState: SerializedEditorState | null;
  headerState: SerializedEditorState | null;
  footerState: SerializedEditorState | null;
  headerHeight: number;
  footerHeight: number;
  /** Incremented on external body state changes (reflow/undo) to force editor remount */
  bodySyncVersion: number;
  /** Incremented on external header state changes (copy/clear) to force editor remount */
  headerSyncVersion: number;
  /** Incremented on external footer state changes (copy/clear) to force editor remount */
  footerSyncVersion: number;
}

/** Top-level document state */
export interface Lex4Document {
  pages: PageState[];
  headerFooterEnabled: boolean;
  pageCounterMode: PageCounterMode;
  defaultHeaderState: SerializedEditorState | null;
  defaultFooterState: SerializedEditorState | null;
  defaultHeaderHeight: number;
  defaultFooterHeight: number;
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
    bodySyncVersion: 0,
    headerSyncVersion: 0,
    footerSyncVersion: 0,
  };
}

/** Creates a new page that inherits header/footer chrome from a document default template. */
export function createPageFromTemplate(template?: PageChromeTemplate): PageState {
  return {
    ...createEmptyPage(),
    headerState: template?.headerState ?? null,
    footerState: template?.footerState ?? null,
    headerHeight: template?.headerHeight ?? 0,
    footerHeight: template?.footerHeight ?? 0,
  };
}

/** Creates a default empty document */
export function createEmptyDocument(): Lex4Document {
  return {
    pages: [createEmptyPage()],
    headerFooterEnabled: false,
    pageCounterMode: 'none',
    defaultHeaderState: null,
    defaultFooterState: null,
    defaultHeaderHeight: 0,
    defaultFooterHeight: 0,
  };
}
