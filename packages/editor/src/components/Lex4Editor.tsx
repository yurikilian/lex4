import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import type { Lex4EditorProps } from '../types/editor-props';
import type { Lex4EditorHandle } from '../types/editor-handle';
import { DocumentProvider } from '../context/document-provider';
import { useDocument } from '../context/document-context';
import { useTranslations } from '../i18n';
import { HistorySidebar } from './HistorySidebar';
import { Toolbar } from './Toolbar';
import { DocumentView } from './DocumentView';
import {
  ExtensionProvider,
  ExtensionStateProvider,
  useExtensions,
  useExtensionContext,
} from '../extensions/extension-context';
import { TranslationsProvider } from '../i18n';
import { serializeDocument } from '../ast/document-serializer';
import { serializeDocumentJson } from '../ast/payload-builder';
import { ToolbarConfigProvider } from '../context/toolbar-config';
import { insertDocumentContent } from '../lexical/utils/import-document-content';
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

const GLOBAL_SELECTION_BACKGROUND = 'hsl(214 95% 87%)';
const GLOBAL_SELECTION_FOREGROUND = 'hsl(224 71% 25%)';

function isFormFieldTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  const tagName = element?.tagName;
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
}

const EditorChrome: React.FC<{
  captureHistoryShortcutsOnWindow: boolean;
  onSave?: Lex4EditorProps['onSave'];
  className?: string;
}> = ({
  captureHistoryShortcutsOnWindow,
  onSave,
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
  const { sidePanels, cssVariables, rootClassNames } = useExtensions();
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

    if (key === 's' && onSave) {
      event.preventDefault();
      event.stopPropagation();
      const ast = serializeDocument(document);
      const json = serializeDocumentJson(ast);
      onSave({ document, ast, json });
      return;
    }

    if (handleHistoryShortcut(event)) {
      return;
    }
  }, [
    document,
    dispatch,
    handleHistoryShortcut,
    onSave,
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

    const root = rootRef.current;
    const styles = root ? getComputedStyle(root) : null;
    const selBg = styles?.getPropertyValue('--color-selection-bg').trim() || GLOBAL_SELECTION_BACKGROUND;
    const selFg = styles?.getPropertyValue('--color-selection-text').trim() || GLOBAL_SELECTION_FOREGROUND;

    editableRoots.forEach((editableRoot) => {
      editableRoot.style.backgroundColor = globalSelectionActive ? selBg : '';
      editableRoot.style.color = globalSelectionActive ? selFg : '';
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

  const rootClassName = ['lex4-editor', ...rootClassNames, className].filter(Boolean).join(' ');
  const extensionStyle = Object.keys(cssVariables).length > 0
    ? cssVariables as React.CSSProperties
    : undefined;

  return (
    <div
      ref={rootRef}
      className={rootClassName}
      style={extensionStyle}
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
        className="lex4-selection-buffer"
      />
      <Toolbar />
      <div className="lex4-canvas">
        <div className="lex4-canvas-scroll">
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
  onSave?: Lex4EditorProps['onSave'];
  className?: string;
}>(({ captureHistoryShortcutsOnWindow, onSave, className }, ref) => {
  const {
    document: doc,
    activeEditor,
    activeCaretPosition,
    historySidebarOpen,
    runHistoryAction,
    setHistorySidebarOpen,
  } = useDocument();
  const { handleFactories } = useExtensions();
  const t = useTranslations();

  const getDocument = useCallback(() => doc, [doc]);
  const getActiveEditor = useCallback(() => activeEditor, [activeEditor]);
  const extensionCtx = useExtensionContext(getDocument, getActiveEditor);

  useImperativeHandle(ref, () => {
    const handle: Record<string, (...args: never[]) => unknown> = {
      setHistorySidebarOpen: (open: boolean) => {
        setHistorySidebarOpen(open);
      },
      toggleHistorySidebar: () => {
        setHistorySidebarOpen(!historySidebarOpen);
      },
      insertDocumentContent: (documentToInsert) => {
        if (!activeEditor || activeCaretPosition?.region !== 'body') {
          return false;
        }

        let inserted = false;
        runHistoryAction(
          {
            label: t.history.actions.insertedDocumentContent,
            source: 'toolbar',
            region: 'document',
          },
          () => {
            inserted = insertDocumentContent(activeEditor, documentToInsert);
          },
        );
        return inserted;
      },
    };

    for (const factory of handleFactories) {
      const methods = factory(extensionCtx);
      Object.assign(handle, methods);
    }

    return handle as unknown as Lex4EditorHandle;
  }, [
    activeCaretPosition?.region,
    activeEditor,
    extensionCtx,
    handleFactories,
    historySidebarOpen,
    runHistoryAction,
    setHistorySidebarOpen,
    t.history.actions.insertedDocumentContent,
  ]);

  return (
    <EditorChrome
      captureHistoryShortcutsOnWindow={captureHistoryShortcutsOnWindow}
      onSave={onSave}
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
  onSave,
  extensions,
  translations,
  toolbar,
  className,
}, ref) => {
  return (
    <TranslationsProvider translations={translations}>
      <ToolbarConfigProvider toolbar={toolbar}>
        <ExtensionStateProvider>
          <ExtensionProvider extensions={extensions}>
            <DocumentProvider
              initialDocument={initialDocument}
              onDocumentChange={onDocumentChange}
            >
              <EditorWithHandle
                ref={ref}
                captureHistoryShortcutsOnWindow={captureHistoryShortcutsOnWindow}
                onSave={onSave}
                className={className}
              />
            </DocumentProvider>
          </ExtensionProvider>
        </ExtensionStateProvider>
      </ToolbarConfigProvider>
    </TranslationsProvider>
  );
});

Lex4Editor.displayName = 'Lex4Editor';
