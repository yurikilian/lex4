import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import type { Lex4EditorProps } from '../types/editor-props';
import type { Lex4EditorHandle } from '../types/editor-handle';
import { DocumentProvider } from '../context/document-provider';
import { useDocument } from '../context/document-context';
import { HistorySidebar } from './HistorySidebar';
import { Toolbar } from './Toolbar';
import { DocumentView } from './DocumentView';
import {
  ExtensionProvider,
  ExtensionStateProvider,
  useExtensions,
  useExtensionContext,
} from '../extensions/extension-context';
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

function isFormFieldTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  const tagName = element?.tagName;
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
}

const EditorChrome: React.FC<{
  captureHistoryShortcutsOnWindow: boolean;
  className?: string;
}> = ({
  captureHistoryShortcutsOnWindow,
  className,
}) => {
  const {
    document,
    dispatch,
    globalSelectionActive,
    setGlobalSelectionActive,
    undo,
    redo,
  } = useDocument();
  const { sidePanels } = useExtensions();
  const rootRef = useRef<HTMLDivElement>(null);
  const selectionBufferRef = useRef<HTMLTextAreaElement>(null);

  const clearGlobalSelection = useCallback(() => {
    setGlobalSelectionActive(false);
    selectionBufferRef.current?.blur();
  }, [setGlobalSelectionActive]);

  const handleHistoryShortcut = useCallback((event: { key: string; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; preventDefault: () => void; stopPropagation?: () => void }) => {
    const key = event.key.toLowerCase();

    if (key === 'z') {
      event.preventDefault();
      event.stopPropagation?.();
      clearGlobalSelection();
      if (event.shiftKey) {
        redo();
      } else {
        undo();
      }
      return true;
    }

    if (key === 'y') {
      event.preventDefault();
      event.stopPropagation?.();
      clearGlobalSelection();
      redo();
      return true;
    }

    return false;
  }, [clearGlobalSelection, redo, undo]);

  const handleKeyDownCapture = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    const isGlobalSelectionBufferTarget = target === selectionBufferRef.current;

    if (!isGlobalSelectionBufferTarget && isFormFieldTarget(target)) {
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

    if (handleHistoryShortcut(event)) {
      return;
    }
  }, [
    dispatch,
    handleHistoryShortcut,
    setGlobalSelectionActive,
  ]);

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

  useEffect(() => {
    if (!captureHistoryShortcutsOnWindow) {
      return;
    }

    const handleWindowKeyDown = (event: KeyboardEvent) => {
      const hasModifier = event.metaKey || event.ctrlKey;
      if (!hasModifier) {
        return;
      }

      handleHistoryShortcut(event);
    };

    window.addEventListener('keydown', handleWindowKeyDown, { capture: true });
    const handleWindowBeforeInput = (event: InputEvent) => {
      if (event.inputType === 'historyUndo') {
        event.preventDefault();
        clearGlobalSelection();
        undo();
      } else if (event.inputType === 'historyRedo') {
        event.preventDefault();
        clearGlobalSelection();
        redo();
      }
    };

    window.addEventListener('beforeinput', handleWindowBeforeInput, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown, { capture: true });
      window.removeEventListener('beforeinput', handleWindowBeforeInput, { capture: true });
    };
  }, [captureHistoryShortcutsOnWindow, clearGlobalSelection, handleHistoryShortcut, redo, undo]);

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
      <div className="flex min-h-0 flex-1 overflow-hidden bg-gray-200">
        <div className="min-w-0 flex-1 overflow-auto">
          <DocumentView />
        </div>
        {sidePanels.map((Panel, idx) => (
          <Panel key={idx} />
        ))}
        <HistorySidebar />
      </div>
    </div>
  );
};

/**
 * EditorWithHandle — Inner component that wires the imperative handle.
 * Has access to DocumentProvider and extension contexts.
 */
const EditorWithHandle = forwardRef<Lex4EditorHandle, {
  captureHistoryShortcutsOnWindow: boolean;
  className?: string;
}>(({ captureHistoryShortcutsOnWindow, className }, ref) => {
  const { document: doc, activeEditor } = useDocument();
  const { handleFactories } = useExtensions();

  const getDocument = useCallback(() => doc, [doc]);
  const getActiveEditor = useCallback(() => activeEditor, [activeEditor]);
  const extensionCtx = useExtensionContext(getDocument, getActiveEditor);

  useImperativeHandle(ref, () => {
    const handle: Record<string, (...args: never[]) => unknown> = {};

    for (const factory of handleFactories) {
      const methods = factory(extensionCtx);
      Object.assign(handle, methods);
    }

    return handle as unknown as Lex4EditorHandle;
  }, [extensionCtx, handleFactories]);

  return (
    <EditorChrome
      captureHistoryShortcutsOnWindow={captureHistoryShortcutsOnWindow}
      className={className}
    />
  );
});

EditorWithHandle.displayName = 'EditorWithHandle';

/**
 * Lex4Editor — The main public component.
 *
 * A paginated A4 document editor built on Meta Lexical.
 * Each page is a true discrete A4 page with its own Lexical editor instance.
 *
 * Uses an extension system for AST export, variables, and theming.
 * Pass extensions via the `extensions` prop:
 * @example
 * ```tsx
 * <Lex4Editor extensions={[defaultTheme(), astExtension(), variablesExtension(defs)]} />
 * ```
 */
export const Lex4Editor = forwardRef<Lex4EditorHandle, Lex4EditorProps>(({
  captureHistoryShortcutsOnWindow = true,
  initialDocument,
  onDocumentChange,
  extensions,
  className,
}, ref) => {
  return (
    <ExtensionStateProvider>
      <ExtensionProvider extensions={extensions}>
        <DocumentProvider
          initialDocument={initialDocument}
          onDocumentChange={onDocumentChange}
        >
          <EditorWithHandle
            ref={ref}
            captureHistoryShortcutsOnWindow={captureHistoryShortcutsOnWindow}
            className={className}
          />
        </DocumentProvider>
      </ExtensionProvider>
    </ExtensionStateProvider>
  );
});

Lex4Editor.displayName = 'Lex4Editor';
