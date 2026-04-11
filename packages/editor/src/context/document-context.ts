import { createContext, useContext } from 'react';
import type { Lex4Document } from '../types/document';
import type { LexicalEditor } from 'lexical';

/** All actions the document reducer can handle */
export type DocumentAction =
  | { type: 'ADD_PAGE'; afterIndex?: number; page?: import('../types/document').PageState }
  | { type: 'REMOVE_PAGE'; pageId: string }
  | { type: 'UPDATE_PAGE_BODY'; pageId: string; bodyState: import('lexical').SerializedEditorState | null }
  | { type: 'UPDATE_PAGE_HEADER'; pageId: string; headerState: import('lexical').SerializedEditorState | null }
  | { type: 'UPDATE_PAGE_FOOTER'; pageId: string; footerState: import('lexical').SerializedEditorState | null }
  | { type: 'SET_HEADER_FOOTER_ENABLED'; enabled: boolean }
  | { type: 'COPY_HEADER_TO_ALL'; sourcePageId: string }
  | { type: 'COPY_FOOTER_TO_ALL'; sourcePageId: string }
  | { type: 'CLEAR_HEADER'; pageId: string }
  | { type: 'CLEAR_FOOTER'; pageId: string }
  | { type: 'CLEAR_ALL_HEADERS' }
  | { type: 'CLEAR_ALL_FOOTERS' }
  | { type: 'SET_HEADER_HEIGHT'; pageId: string; height: number }
  | { type: 'SET_FOOTER_HEIGHT'; pageId: string; height: number }
  | { type: 'SET_DOCUMENT'; document: Lex4Document };

/** Registry of page editors for direct cross-page content manipulation */
export interface EditorRegistry {
  register(pageId: string, editor: LexicalEditor): void;
  unregister(pageId: string): void;
  get(pageId: string): LexicalEditor | undefined;
}

/** Shape of the document context value */
export interface DocumentContextValue {
  document: Lex4Document;
  dispatch: React.Dispatch<DocumentAction>;
  activePageId: string | null;
  setActivePageId: (id: string | null) => void;
  activeEditor: LexicalEditor | null;
  setActiveEditor: (editor: LexicalEditor | null) => void;
  editorRegistry: EditorRegistry;
}

export const DocumentContext = createContext<DocumentContextValue | null>(null);

/** Hook to access the document context. Throws if used outside provider. */
export function useDocument(): DocumentContextValue {
  const ctx = useContext(DocumentContext);
  if (!ctx) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return ctx;
}
