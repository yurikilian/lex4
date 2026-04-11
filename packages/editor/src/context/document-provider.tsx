import React, { useReducer, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { Lex4Document } from '../types/document';
import type { LexicalEditor } from 'lexical';
import { createEmptyDocument } from '../types/document';
import { DocumentContext, type EditorRegistry } from './document-context';
import { documentReducer } from './document-reducer';

interface DocumentProviderProps {
  initialDocument?: Lex4Document;
  onDocumentChange?: (doc: Lex4Document) => void;
  children: React.ReactNode;
}

export const DocumentProvider: React.FC<DocumentProviderProps> = ({
  initialDocument,
  onDocumentChange,
  children,
}) => {
  const [document, dispatch] = useReducer(
    documentReducer,
    initialDocument ?? createEmptyDocument(),
  );
  const [activePageId, setActivePageIdRaw] = useState<string | null>(
    initialDocument?.pages[0]?.id ?? null,
  );
  const activeEditorRef = useRef<LexicalEditor | null>(null);
  const [, forceUpdate] = useState(0);

  const editorMapRef = useRef(new Map<string, LexicalEditor>());
  const editorRegistry: EditorRegistry = useMemo(() => ({
    register: (pageId: string, editor: LexicalEditor) => {
      editorMapRef.current.set(pageId, editor);
    },
    unregister: (pageId: string) => {
      editorMapRef.current.delete(pageId);
    },
    get: (pageId: string) => editorMapRef.current.get(pageId),
  }), []);

  const setActivePageId = useCallback((id: string | null) => {
    setActivePageIdRaw(id);
  }, []);

  const setActiveEditor = useCallback((editor: LexicalEditor | null) => {
    activeEditorRef.current = editor;
    forceUpdate(n => n + 1);
  }, []);

  useEffect(() => {
    onDocumentChange?.(document);
  }, [document, onDocumentChange]);

  return (
    <DocumentContext.Provider value={{
      document,
      dispatch,
      activePageId,
      setActivePageId,
      activeEditor: activeEditorRef.current,
      setActiveEditor,
      editorRegistry,
    }}>
      {children}
    </DocumentContext.Provider>
  );
};
