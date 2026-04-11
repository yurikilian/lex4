import React, { useReducer, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { Lex4Document } from '../types/document';
import type {
  CaretPosition,
  CaretSelection,
  HistoryActionDescriptor,
  HistoryState,
} from '../types/history';
import { $createRangeSelectionFromDom, $getSelection, $isRangeSelection } from 'lexical';
import type { LexicalEditor } from 'lexical';
import { createEmptyDocument } from '../types/document';
import { DocumentContext, type DocumentAction, type EditorRegistry } from './document-context';
import { documentReducer } from './document-reducer';
import {
  clearHistoryState,
  createHistoryState,
  jumpToHistoryEntry,
  recordHistoryEntry,
  redoHistory,
  undoHistory,
} from '../utils/history-manager';

interface DocumentProviderProps {
  initialDocument?: Lex4Document;
  onDocumentChange?: (doc: Lex4Document) => void;
  children: React.ReactNode;
}

const HISTORY_RESTORE_SUPPRESSION_MS = 100;
const HISTORY_BATCH_FLUSH_MS = 16;

function cloneDocumentSnapshot(document: Lex4Document): Lex4Document {
  return structuredClone(document);
}

function captureUndoSnapshot(
  document: Lex4Document,
  activeEditor: LexicalEditor | null,
  caretPosition: CaretPosition | null,
): Lex4Document {
  const snapshot = cloneDocumentSnapshot(document);
  if (!activeEditor || !caretPosition) {
    return snapshot;
  }

  const page = snapshot.pages.find(candidate => candidate.id === caretPosition.pageId);
  if (!page) {
    return snapshot;
  }

  const editorState = activeEditor.getEditorState().toJSON();
  if (caretPosition.region === 'body') {
    page.bodyState = editorState;
  } else if (caretPosition.region === 'header') {
    page.headerState = editorState;
  } else {
    page.footerState = editorState;
  }

  return snapshot;
}

function captureCaretSelection(editor: LexicalEditor | null): CaretSelection | null {
  if (!editor) {
    return null;
  }

  const rootElement = editor.getRootElement();
  const domSelection = window.getSelection();
  const selectionInRoot = (node: Node | null) =>
    !!node && !!rootElement && (node === rootElement || rootElement.contains(node));
  const getTextOffset = (node: Node, offset: number) => {
    if (!rootElement) {
      return 0;
    }

    const range = document.createRange();
    range.setStart(rootElement, 0);
    range.setEnd(node, offset);
    return range.toString().length;
  };

  let caretSelection: CaretSelection | null = null;
  editor.getEditorState().read(() => {
    const selection = $createRangeSelectionFromDom(window.getSelection(), editor) ?? $getSelection();
    if (!$isRangeSelection(selection)) {
      return;
    }

    caretSelection = {
      anchor: {
        key: selection.anchor.key,
        offset: selection.anchor.offset,
        type: selection.anchor.type,
      },
      focus: {
        key: selection.focus.key,
        offset: selection.focus.offset,
        type: selection.focus.type,
      },
      anchorTextOffset:
        domSelection && selectionInRoot(domSelection.anchorNode)
          ? getTextOffset(domSelection.anchorNode!, domSelection.anchorOffset)
          : 0,
      focusTextOffset:
        domSelection && selectionInRoot(domSelection.focusNode)
          ? getTextOffset(domSelection.focusNode!, domSelection.focusOffset)
          : 0,
      format: selection.format,
      style: selection.style,
    };
  });

  return caretSelection;
}

function getPageNumber(document: Lex4Document, pageId?: string): number | null {
  if (!pageId) {
    return null;
  }

  const index = document.pages.findIndex(page => page.id === pageId);
  return index >= 0 ? index + 1 : null;
}

function describeAction(
  action: DocumentAction,
  document: Lex4Document,
): HistoryActionDescriptor {
  switch (action.type) {
    case 'UPDATE_PAGE_BODY': {
      const pageNumber = getPageNumber(document, action.pageId);
      return {
        label: pageNumber ? `Edited body - Page ${pageNumber}` : 'Edited body',
        source: 'body',
        pageId: action.pageId,
        region: 'body',
      };
    }
    case 'UPDATE_PAGE_HEADER':
    case 'UPDATE_PAGE_HEADER_CONTENT': {
      const pageNumber = getPageNumber(document, action.pageId);
      return {
        label: pageNumber ? `Edited header - Page ${pageNumber}` : 'Edited header',
        source: 'header',
        pageId: action.pageId,
        region: 'header',
      };
    }
    case 'UPDATE_PAGE_FOOTER':
    case 'UPDATE_PAGE_FOOTER_CONTENT': {
      const pageNumber = getPageNumber(document, action.pageId);
      return {
        label: pageNumber ? `Edited footer - Page ${pageNumber}` : 'Edited footer',
        source: 'footer',
        pageId: action.pageId,
        region: 'footer',
      };
    }
    case 'SET_HEADER_FOOTER_ENABLED':
      return {
        label: action.enabled ? 'Enabled headers and footers' : 'Disabled headers and footers',
        source: 'document',
        region: 'document',
      };
    case 'SET_PAGE_COUNTER_MODE':
      return {
        label: `Page counter set to ${action.mode}`,
        source: 'document',
        region: 'document',
      };
    case 'COPY_HEADER_TO_ALL':
      return {
        label: 'Copied header to all pages',
        source: 'toolbar',
        pageId: action.sourcePageId,
        region: 'header',
      };
    case 'COPY_FOOTER_TO_ALL':
      return {
        label: 'Copied footer to all pages',
        source: 'toolbar',
        pageId: action.sourcePageId,
        region: 'footer',
      };
    case 'CLEAR_HEADER': {
      const pageNumber = getPageNumber(document, action.pageId);
      return {
        label: pageNumber ? `Cleared header - Page ${pageNumber}` : 'Cleared header',
        source: 'toolbar',
        pageId: action.pageId,
        region: 'header',
      };
    }
    case 'CLEAR_FOOTER': {
      const pageNumber = getPageNumber(document, action.pageId);
      return {
        label: pageNumber ? `Cleared footer - Page ${pageNumber}` : 'Cleared footer',
        source: 'toolbar',
        pageId: action.pageId,
        region: 'footer',
      };
    }
    case 'CLEAR_ALL_HEADERS':
      return {
        label: 'Cleared all headers',
        source: 'toolbar',
        region: 'header',
      };
    case 'CLEAR_ALL_FOOTERS':
      return {
        label: 'Cleared all footers',
        source: 'toolbar',
        region: 'footer',
      };
    case 'CLEAR_DOCUMENT_CONTENT':
      return {
        label: 'Cleared document body',
        source: 'document',
        region: 'document',
      };
    case 'SET_HEADER_HEIGHT': {
      const pageNumber = getPageNumber(document, action.pageId);
      return {
        label: pageNumber ? `Resized header - Page ${pageNumber}` : 'Resized header',
        source: 'header',
        pageId: action.pageId,
        region: 'header',
      };
    }
    case 'SET_FOOTER_HEIGHT': {
      const pageNumber = getPageNumber(document, action.pageId);
      return {
        label: pageNumber ? `Resized footer - Page ${pageNumber}` : 'Resized footer',
        source: 'footer',
        pageId: action.pageId,
        region: 'footer',
      };
    }
    case 'ADD_PAGE':
      return {
        label: 'Added page',
        source: 'overflow',
        region: 'document',
      };
    case 'REMOVE_PAGE':
      return {
        label: 'Removed page',
        source: 'overflow',
        region: 'document',
      };
    case 'SET_DOCUMENT':
      return {
        label: 'Document reflow',
        source: 'overflow',
        region: 'document',
      };
    default:
      return {
        label: 'Updated document',
        source: 'document',
        region: 'document',
      };
  }
}

function documentsAreEqual(current: Lex4Document, next: Lex4Document): boolean {
  return JSON.stringify(current) === JSON.stringify(next);
}

export const DocumentProvider: React.FC<DocumentProviderProps> = ({
  initialDocument,
  onDocumentChange,
  children,
}) => {
  const initialSnapshot = initialDocument ?? createEmptyDocument();
  const [document, baseDispatch] = useReducer(documentReducer, initialSnapshot);
  const [historyState, setHistoryState] = useState<HistoryState>(() => createHistoryState(initialSnapshot));
  const documentRef = useRef(document);
  const historyStateRef = useRef(historyState);
  const [activePageId, setActivePageIdRaw] = useState<string | null>(
    initialSnapshot.pages[0]?.id ?? null,
  );
  const activePageIdRef = useRef<string | null>(initialSnapshot.pages[0]?.id ?? null);
  const [globalSelectionActive, setGlobalSelectionActive] = useState(false);
  const [historySidebarOpen, setHistorySidebarOpen] = useState(true);
  const activeEditorRef = useRef<LexicalEditor | null>(null);
  const activeCaretPositionRef = useRef<CaretPosition | null>(null);
  const pendingCaretPositionRef = useRef<CaretPosition | null>(null);
  const pendingCaretSelectionRef = useRef<CaretSelection | null>(null);
  const [, forceUpdate] = useState(0);
  const historySuppressedRef = useRef(false);
  const historyReleaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingHistoryActionRef = useRef<HistoryActionDescriptor | null>(null);
  const pendingUndoSnapshotRef = useRef<Lex4Document | null>(null);
  const pendingUndoCaretPositionRef = useRef<CaretPosition | null>(null);
  const pendingUndoCaretSelectionRef = useRef<CaretSelection | null>(null);
  const historyBatchRef = useRef<{
    descriptor: HistoryActionDescriptor;
    nextDocument: Lex4Document | null;
    undoSnapshot: Lex4Document | null;
    undoCaretPosition: CaretPosition | null;
    undoCaretSelection: CaretSelection | null;
    hasMutation: boolean;
  } | null>(null);

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
    activePageIdRef.current = id;
    setActivePageIdRaw(id);
  }, []);

  const setActiveEditor = useCallback((
    editor: LexicalEditor | null,
    caretPosition: CaretPosition | null = null,
  ) => {
    activeEditorRef.current = editor;
    activeCaretPositionRef.current = caretPosition;
    forceUpdate(n => n + 1);
  }, []);

  const consumePendingCaretPosition = useCallback((caretPosition: CaretPosition) => {
    const pendingCaretPosition = pendingCaretPositionRef.current;
    if (
      !pendingCaretPosition
      || pendingCaretPosition.pageId !== caretPosition.pageId
      || pendingCaretPosition.region !== caretPosition.region
    ) {
      return undefined;
    }

    pendingCaretPositionRef.current = null;
    const pendingCaretSelection = pendingCaretSelectionRef.current;
    pendingCaretSelectionRef.current = null;
    return pendingCaretSelection;
  }, []);

  const flushHistoryBatch = useCallback(() => {
    if (historyFlushTimerRef.current) {
      clearTimeout(historyFlushTimerRef.current);
      historyFlushTimerRef.current = null;
    }

    const batch = historyBatchRef.current;
    historyBatchRef.current = null;
    pendingHistoryActionRef.current = null;
    pendingUndoSnapshotRef.current = null;
    pendingUndoCaretPositionRef.current = null;
    pendingUndoCaretSelectionRef.current = null;

    if (!batch || historySuppressedRef.current || !batch.hasMutation || !batch.nextDocument) {
      return;
    }

    const undoSnapshot = batch.undoSnapshot ?? batch.nextDocument;

    setHistoryState(previousHistory => {
      const nextHistory = recordHistoryEntry(
        previousHistory,
        batch.nextDocument as Lex4Document,
        batch.descriptor,
        undoSnapshot,
        activeCaretPositionRef.current,
        captureCaretSelection(activeEditorRef.current),
        batch.undoCaretPosition,
        batch.undoCaretSelection,
      );
      historyStateRef.current = nextHistory;
      return nextHistory;
    });
  }, []);

  const scheduleHistoryBatchFlush = useCallback(() => {
    if (historyFlushTimerRef.current) {
      clearTimeout(historyFlushTimerRef.current);
    }

    historyFlushTimerRef.current = setTimeout(() => {
      flushHistoryBatch();
    }, HISTORY_BATCH_FLUSH_MS);
  }, [flushHistoryBatch]);

  const queueHistoryAction = useCallback((action: HistoryActionDescriptor | null) => {
    pendingHistoryActionRef.current = action;
    pendingUndoSnapshotRef.current = action
      ? captureUndoSnapshot(
        documentRef.current,
        activeEditorRef.current,
        activeCaretPositionRef.current,
      )
      : null;
    pendingUndoCaretPositionRef.current = action ? activeCaretPositionRef.current : null;
    pendingUndoCaretSelectionRef.current = action ? captureCaretSelection(activeEditorRef.current) : null;
  }, []);

  const runHistoryAction = useCallback((action: HistoryActionDescriptor, callback: () => void) => {
    if (historyBatchRef.current) {
      callback();
      return;
    }

    historyBatchRef.current = {
      descriptor: action,
      nextDocument: null,
      undoSnapshot: captureUndoSnapshot(
        documentRef.current,
        activeEditorRef.current,
        activeCaretPositionRef.current,
      ),
      undoCaretPosition: activeCaretPositionRef.current,
      undoCaretSelection: captureCaretSelection(activeEditorRef.current),
      hasMutation: false,
    };

    pendingHistoryActionRef.current = action;
    pendingUndoSnapshotRef.current = null;
    pendingUndoCaretPositionRef.current = null;
    pendingUndoCaretSelectionRef.current = null;

    try {
      callback();
    } finally {
      scheduleHistoryBatchFlush();
    }
  }, [scheduleHistoryBatchFlush]);

  const suppressHistoryTemporarily = useCallback(() => {
    historySuppressedRef.current = true;
    pendingHistoryActionRef.current = null;
    pendingUndoSnapshotRef.current = null;
    pendingUndoCaretPositionRef.current = null;
    pendingUndoCaretSelectionRef.current = null;
    historyBatchRef.current = null;
    if (historyFlushTimerRef.current) {
      clearTimeout(historyFlushTimerRef.current);
      historyFlushTimerRef.current = null;
    }
    if (historyReleaseTimerRef.current) {
      clearTimeout(historyReleaseTimerRef.current);
    }
    historyReleaseTimerRef.current = setTimeout(() => {
      historySuppressedRef.current = false;
      historyReleaseTimerRef.current = null;
    }, HISTORY_RESTORE_SUPPRESSION_MS);
  }, []);

  const dispatch = useCallback((action: DocumentAction) => {
    const currentDocument = documentRef.current;
    const nextDocument = documentReducer(currentDocument, action);
    const changed = !documentsAreEqual(currentDocument, nextDocument);
    const suppressPassiveBodyHistory =
      action.type === 'UPDATE_PAGE_BODY'
      && action.pageId !== activePageIdRef.current
      && !historyBatchRef.current
      && !pendingHistoryActionRef.current;

    documentRef.current = nextDocument;

    if (changed && !historySuppressedRef.current && !suppressPassiveBodyHistory) {
      if (historyBatchRef.current) {
        historyBatchRef.current.nextDocument = cloneDocumentSnapshot(nextDocument);
        historyBatchRef.current.hasMutation = true;
        scheduleHistoryBatchFlush();
      } else if (pendingHistoryActionRef.current) {
        historyBatchRef.current = {
          descriptor: pendingHistoryActionRef.current,
          nextDocument: cloneDocumentSnapshot(nextDocument),
          undoSnapshot: pendingUndoSnapshotRef.current,
          undoCaretPosition: pendingUndoCaretPositionRef.current,
          undoCaretSelection: pendingUndoCaretSelectionRef.current,
          hasMutation: true,
        };
        scheduleHistoryBatchFlush();
      } else {
        const descriptor = describeAction(action, currentDocument);
        setHistoryState(previousHistory => {
          const nextHistory = recordHistoryEntry(
            previousHistory,
            nextDocument,
            descriptor,
            captureUndoSnapshot(
              currentDocument,
              activeEditorRef.current,
              activeCaretPositionRef.current,
            ),
            activeCaretPositionRef.current,
            captureCaretSelection(activeEditorRef.current),
            activeCaretPositionRef.current,
            captureCaretSelection(activeEditorRef.current),
          );
          historyStateRef.current = nextHistory;
          return nextHistory;
        });
      }
    } else {
      pendingHistoryActionRef.current = null;
      pendingUndoSnapshotRef.current = null;
      pendingUndoCaretPositionRef.current = null;
      pendingUndoCaretSelectionRef.current = null;
    }

    baseDispatch(action);
  }, [scheduleHistoryBatchFlush]);

  const restoreDocument = useCallback((
    snapshot: Lex4Document,
    caretPosition: CaretPosition | null,
    caretSelection: CaretSelection | null,
  ) => {
    suppressHistoryTemporarily();
    pendingCaretPositionRef.current = caretPosition;
    pendingCaretSelectionRef.current = caretSelection;
    activeEditorRef.current = null;
    activeCaretPositionRef.current = caretPosition;
    forceUpdate(n => n + 1);
    documentRef.current = cloneDocumentSnapshot(snapshot);
    baseDispatch({ type: 'SET_DOCUMENT', document: cloneDocumentSnapshot(snapshot) });
  }, [suppressHistoryTemporarily]);

  const undo = useCallback(() => {
    flushHistoryBatch();
    const result = undoHistory(historyStateRef.current);
    if (!result) {
      return;
    }

    historyStateRef.current = result.history;
    setHistoryState(result.history);
    restoreDocument(result.document, result.caretPosition, result.caretSelection);
  }, [flushHistoryBatch, restoreDocument]);

  const redo = useCallback(() => {
    flushHistoryBatch();
    const result = redoHistory(historyStateRef.current);
    if (!result) {
      return;
    }

    historyStateRef.current = result.history;
    setHistoryState(result.history);
    restoreDocument(result.document, result.caretPosition, result.caretSelection);
  }, [flushHistoryBatch, restoreDocument]);

  const clearHistory = useCallback(() => {
    flushHistoryBatch();
    const nextHistory = clearHistoryState(documentRef.current, activeCaretPositionRef.current);
    historyStateRef.current = nextHistory;
    setHistoryState(nextHistory);
  }, [flushHistoryBatch]);

  const handleJumpToHistoryEntry = useCallback((entryIndex: number) => {
    flushHistoryBatch();
    const result = jumpToHistoryEntry(historyStateRef.current, entryIndex);
    if (!result) {
      return;
    }

    historyStateRef.current = result.history;
    setHistoryState(result.history);
    restoreDocument(result.document, result.caretPosition, result.caretSelection);
  }, [flushHistoryBatch, restoreDocument]);

  useEffect(() => {
    documentRef.current = document;
    onDocumentChange?.(document);
  }, [document, onDocumentChange]);

  useEffect(() => {
    historyStateRef.current = historyState;
  }, [historyState]);

  useEffect(() => {
    const firstPageId = document.pages[0]?.id ?? null;
    const activePageStillExists = activePageId !== null
      && document.pages.some(page => page.id === activePageId);

    if (!activePageStillExists) {
      activePageIdRef.current = firstPageId;
      setActivePageIdRaw(firstPageId);
      activeEditorRef.current = null;
      activeCaretPositionRef.current = null;
      forceUpdate(n => n + 1);
    }
  }, [activePageId, document.pages]);

  useEffect(
    () => () => {
      if (historyFlushTimerRef.current) {
        clearTimeout(historyFlushTimerRef.current);
      }
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
      consumePendingCaretPosition,
      setActiveEditor,
      globalSelectionActive,
      setGlobalSelectionActive,
      historyEntries: historyState.entries,
      historyCursor: historyState.cursor,
      canUndo: historyState.cursor > 0,
      canRedo: historyState.cursor < historyState.entries.length,
      queueHistoryAction,
      runHistoryAction,
      jumpToHistoryEntry: handleJumpToHistoryEntry,
      clearHistory,
      historySidebarOpen,
      setHistorySidebarOpen,
      undo,
      redo,
      editorRegistry,
    }}>
      {children}
    </DocumentContext.Provider>
  );
};
