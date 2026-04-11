import React, { useReducer, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { Lex4Document } from '../types/document';
import type { LexicalEditor } from 'lexical';
import { createEmptyDocument } from '../types/document';
import { DocumentContext, type DocumentAction, type EditorRegistry } from './document-context';
import { documentReducer } from './document-reducer';

interface DocumentProviderProps {
  initialDocument?: Lex4Document;
  onDocumentChange?: (doc: Lex4Document) => void;
  children: React.ReactNode;
}

const HISTORY_LIMIT = 100;
const HISTORY_MERGE_MS = 300;
const HISTORY_RESTORE_SUPPRESSION_MS = 100;

function cloneDocumentSnapshot(document: Lex4Document): Lex4Document {
  return structuredClone(document);
}

export const DocumentProvider: React.FC<DocumentProviderProps> = ({
  initialDocument,
  onDocumentChange,
  children,
}) => {
  const [document, baseDispatch] = useReducer(
    documentReducer,
    initialDocument ?? createEmptyDocument(),
  );
  const documentRef = useRef(document);
  const [activePageId, setActivePageIdRaw] = useState<string | null>(
    initialDocument?.pages[0]?.id ?? null,
  );
  const [globalSelectionActive, setGlobalSelectionActive] = useState(false);
  const activeEditorRef = useRef<LexicalEditor | null>(null);
  const [, forceUpdate] = useState(0);
  const undoStackRef = useRef<Lex4Document[]>([]);
  const redoStackRef = useRef<Lex4Document[]>([]);
  const historySuppressedRef = useRef(false);
  const historyReleaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSnapshotAtRef = useRef(0);
  const lastSnapshotSignatureRef = useRef<string | null>(null);

  const editorMapRef = useRef(new Map<string, LexicalEditor>());
  const editorRegistry: EditorRegistry = useMemo(() => ({
    register: (pageId: string, editor: LexicalEditor) => {
      editorMapRef.current.set(pageId, editor);
    },
    unregister: (pageId: string) => {
      editorMapRef.current.delete(pageId);
    },
    get: (pageId: string) => editorMapRef.current.get(pageId),
    all: () => Array.from(editorMapRef.current.values()),
  }), []);

  const setActivePageId = useCallback((id: string | null) => {
    setActivePageIdRaw(id);
  }, []);

  const setActiveEditor = useCallback((editor: LexicalEditor | null) => {
    activeEditorRef.current = editor;
    forceUpdate(n => n + 1);
  }, []);

  const suppressHistoryTemporarily = useCallback(() => {
    historySuppressedRef.current = true;
    if (historyReleaseTimerRef.current) {
      clearTimeout(historyReleaseTimerRef.current);
    }
    historyReleaseTimerRef.current = setTimeout(() => {
      historySuppressedRef.current = false;
      historyReleaseTimerRef.current = null;
    }, HISTORY_RESTORE_SUPPRESSION_MS);
  }, []);

  const dispatch = useCallback((action: DocumentAction) => {
    if (!historySuppressedRef.current) {
      const snapshot = cloneDocumentSnapshot(documentRef.current);
      const snapshotSignature = JSON.stringify(snapshot);
      const now = Date.now();
      const canMergeIntoPrevious =
        now - lastSnapshotAtRef.current <= HISTORY_MERGE_MS;

      if (snapshotSignature !== lastSnapshotSignatureRef.current && !canMergeIntoPrevious) {
        undoStackRef.current.push(snapshot);
        if (undoStackRef.current.length > HISTORY_LIMIT) {
          undoStackRef.current.shift();
        }
        redoStackRef.current = [];
        lastSnapshotSignatureRef.current = snapshotSignature;
        lastSnapshotAtRef.current = now;
      } else if (undoStackRef.current.length === 0 && snapshotSignature !== lastSnapshotSignatureRef.current) {
        undoStackRef.current.push(snapshot);
        lastSnapshotSignatureRef.current = snapshotSignature;
        lastSnapshotAtRef.current = now;
      }
    }

    baseDispatch(action);
  }, []);

  const restoreDocument = useCallback((snapshot: Lex4Document) => {
    suppressHistoryTemporarily();
    activeEditorRef.current = null;
    forceUpdate(n => n + 1);
    lastSnapshotSignatureRef.current = JSON.stringify(snapshot);
    lastSnapshotAtRef.current = Date.now();
    baseDispatch({ type: 'SET_DOCUMENT', document: cloneDocumentSnapshot(snapshot) });
  }, [suppressHistoryTemporarily]);

  const undo = useCallback(() => {
    const snapshot = undoStackRef.current.pop();
    if (!snapshot) {
      return;
    }

    redoStackRef.current.push(cloneDocumentSnapshot(documentRef.current));
    restoreDocument(snapshot);
  }, [restoreDocument]);

  const redo = useCallback(() => {
    const snapshot = redoStackRef.current.pop();
    if (!snapshot) {
      return;
    }

    undoStackRef.current.push(cloneDocumentSnapshot(documentRef.current));
    restoreDocument(snapshot);
  }, [restoreDocument]);

  useEffect(() => {
    documentRef.current = document;
    onDocumentChange?.(document);
  }, [document, onDocumentChange]);

  useEffect(() => {
    const firstPageId = document.pages[0]?.id ?? null;
    const activePageStillExists = activePageId !== null
      && document.pages.some(page => page.id === activePageId);

    if (!activePageStillExists) {
      setActivePageIdRaw(firstPageId);
      activeEditorRef.current = null;
      forceUpdate(n => n + 1);
    }
  }, [activePageId, document.pages]);

  useEffect(
    () => () => {
      if (historyReleaseTimerRef.current) {
        clearTimeout(historyReleaseTimerRef.current);
      }
    },
    [],
  );

  return (
    <DocumentContext.Provider value={{
      document,
      dispatch,
      activePageId,
      setActivePageId,
      activeEditor: activeEditorRef.current,
      setActiveEditor,
      globalSelectionActive,
      setGlobalSelectionActive,
      undo,
      redo,
      editorRegistry,
    }}>
      {children}
    </DocumentContext.Provider>
  );
};
