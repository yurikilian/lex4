import type { SerializedEditorState } from 'lexical';

/** State for a single page in the document */
export interface PageState {
  id: string;
  bodyState: SerializedEditorState | null;
  headerState: SerializedEditorState | null;
  footerState: SerializedEditorState | null;
  headerHeight: number;
  footerHeight: number;
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
  };
}

/** Creates a default empty document */
export function createEmptyDocument(): Lex4Document {
  return {
    pages: [createEmptyPage()],
    headerFooterEnabled: false,
  };
}
