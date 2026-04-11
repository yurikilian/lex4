import React, { useCallback, useEffect, useRef } from 'react';
import type { Lex4EditorProps } from '../types/editor-props';
import { DocumentProvider } from '../context/document-provider';
import { useDocument } from '../context/document-context';
import { Toolbar } from './Toolbar';
import { DocumentView } from './DocumentView';
import '../styles.css';

function selectEntireDocument(
  rootElement: HTMLDivElement | null,
  selectionBuffer: HTMLTextAreaElement | null,
) {
  if (!rootElement || !selectionBuffer) {
    return;
  }

  const bodyRoots = Array.from(
    rootElement.querySelectorAll<HTMLElement>('[data-testid^="page-body-"] [data-lexical-editor="true"]'),
  );

  if (bodyRoots.length === 0) {
    return;
  }

  selectionBuffer.value = bodyRoots
    .map(bodyRoot => bodyRoot.innerText.trim())
    .filter(Boolean)
    .join('\n');
  selectionBuffer.focus();
  selectionBuffer.select();
}

const GLOBAL_SELECTION_BACKGROUND = 'rgb(191, 219, 254)';
const GLOBAL_SELECTION_FOREGROUND = 'rgb(30, 64, 175)';

const EditorChrome: React.FC<{ className?: string }> = ({ className }) => {
  const {
    document,
    dispatch,
    globalSelectionActive,
    setGlobalSelectionActive,
    undo,
    redo,
  } = useDocument();
  const rootRef = useRef<HTMLDivElement>(null);
  const selectionBufferRef = useRef<HTMLTextAreaElement>(null);

  const clearGlobalSelection = useCallback(() => {
    setGlobalSelectionActive(false);
    selectionBufferRef.current?.blur();
  }, [setGlobalSelectionActive]);

  const handleKeyDownCapture = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    const tagName = target?.tagName;
    const isGlobalSelectionBufferTarget = target === selectionBufferRef.current;

    if (!isGlobalSelectionBufferTarget && (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT')) {
      return;
    }

    const key = event.key.toLowerCase();

    if (isGlobalSelectionBufferTarget && (key === 'backspace' || key === 'delete')) {
      event.preventDefault();
      event.stopPropagation();
      dispatch({ type: 'CLEAR_DOCUMENT_CONTENT' });
      clearGlobalSelection();
      return;
    }

    const hasModifier = event.metaKey || event.ctrlKey;
    if (!hasModifier) {
      return;
    }

    if (key === 'a') {
      if (document.pages.length <= 1) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      requestAnimationFrame(() => {
        const activeElement = window.document.activeElement;
        if (activeElement instanceof HTMLElement && activeElement.isContentEditable) {
          activeElement.blur();
        }
        selectEntireDocument(rootRef.current, selectionBufferRef.current);
        setGlobalSelectionActive(true);
      });
      return;
    }

    if (key === 'z') {
      event.preventDefault();
      event.stopPropagation();
      clearGlobalSelection();
      if (event.shiftKey) {
        redo();
      } else {
        undo();
      }
      return;
    }

    if (!event.metaKey && key === 'y') {
      event.preventDefault();
      event.stopPropagation();
      clearGlobalSelection();
      redo();
    }
  }, [clearGlobalSelection, dispatch, document.pages.length, redo, setGlobalSelectionActive, undo]);

  const handleMouseDownCapture = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!globalSelectionActive) {
      return;
    }

    const target = event.target as HTMLElement | null;
    const clickedToolbar = target?.closest('[data-testid="toolbar"]');

    if (event.target !== selectionBufferRef.current && !clickedToolbar) {
      clearGlobalSelection();
    }
  }, [clearGlobalSelection, globalSelectionActive]);

  useEffect(() => {
    const editableRoots =
      rootRef.current?.querySelectorAll<HTMLElement>(
        '[data-testid^="page-body-"] [data-lexical-editor="true"]',
      ) ?? [];

    editableRoots.forEach((editableRoot) => {
      editableRoot.style.backgroundColor = globalSelectionActive ? GLOBAL_SELECTION_BACKGROUND : '';
      editableRoot.style.color = globalSelectionActive ? GLOBAL_SELECTION_FOREGROUND : '';
      editableRoot.style.caretColor = globalSelectionActive ? 'transparent' : '';
    });
  }, [globalSelectionActive, document.pages.length]);

  return (
    <div
      ref={rootRef}
      className={`lex4-editor flex flex-col h-full ${className ?? ''}`}
      data-testid="lex4-editor"
      data-global-selection-active={globalSelectionActive ? 'true' : 'false'}
      onKeyDownCapture={handleKeyDownCapture}
      onMouseDownCapture={handleMouseDownCapture}
    >
      <textarea
        ref={selectionBufferRef}
        aria-hidden="true"
        data-testid="global-selection-buffer"
        readOnly
        tabIndex={-1}
        className="pointer-events-none fixed -left-[9999px] top-0 h-0 w-0 opacity-0"
      />
      <Toolbar />
      <div className="flex-1 overflow-auto bg-gray-200">
        <DocumentView />
      </div>
    </div>
  );
};

/**
 * Lex4Editor — The main public component.
 *
 * A Microsoft Word-like paginated document editor built on Meta Lexical.
 * Each page is a true discrete A4 page with its own Lexical editor instance.
 */
export const Lex4Editor: React.FC<Lex4EditorProps> = ({
  initialDocument,
  onDocumentChange,
  className,
}) => {
  return (
    <DocumentProvider
      initialDocument={initialDocument}
      onDocumentChange={onDocumentChange}
    >
      <EditorChrome className={className} />
    </DocumentProvider>
  );
};
