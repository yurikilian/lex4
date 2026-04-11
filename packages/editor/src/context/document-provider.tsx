import React, { useReducer, useState, useCallback, useEffect } from 'react';
import type { Lex4Document } from '../types/document';
import { createEmptyDocument } from '../types/document';
import { DocumentContext } from './document-context';
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

  const setActivePageId = useCallback((id: string | null) => {
    setActivePageIdRaw(id);
  }, []);

  useEffect(() => {
    onDocumentChange?.(document);
  }, [document, onDocumentChange]);

  return (
    <DocumentContext.Provider value={{ document, dispatch, activePageId, setActivePageId }}>
      {children}
    </DocumentContext.Provider>
  );
};
