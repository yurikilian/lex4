import React, { useCallback } from 'react';
import { $selectAll, type LexicalEditor } from 'lexical';
import { useDocument } from '../context/document-context';
import { HeaderFooterToggle } from './HeaderFooterToggle';
import { HeaderFooterActions } from './HeaderFooterActions';
import type { PageCounterMode } from '../types/document';
import { SUPPORTED_FONTS } from '../lexical/plugins/font-plugin';
import { applyFontFamily, type FontFamily } from '../lexical/plugins/font-plugin';
import { toggleBold, toggleItalic, toggleUnderline, toggleStrikethrough, setAlignment } from '../lexical/commands/format-commands';
import { insertList, indentContent, outdentContent } from '../lexical/commands/list-commands';
import { debug } from '../utils/debug';

/**
 * Toolbar — Main formatting toolbar for the Lex4 editor.
 *
 * Contains formatting buttons, alignment, font selector,
 * list controls, and header/footer management.
 * Dispatches Lexical commands to the active editor via DocumentContext.
 */
export const Toolbar: React.FC = () => {
  const {
    document,
    dispatch,
    activePageId,
    activeEditor,
    canRedo,
    canUndo,
    clearHistory,
    editorRegistry,
    globalSelectionActive,
    historySidebarOpen,
    redo,
    runHistoryAction,
    setHistorySidebarOpen,
    undo,
  } = useDocument();

  const withBodySelection = useCallback(
    (editor: LexicalEditor, action: (targetEditor: LexicalEditor) => void) => {
      editor.update(() => {
        $selectAll();
      });
      action(editor);
    },
    [],
  );

  const applyToBodyEditors = useCallback(
    (action: (targetEditor: LexicalEditor) => void) => {
      const targetEditors = globalSelectionActive
        ? editorRegistry.all()
        : activeEditor
          ? [activeEditor]
          : [];

      targetEditors.forEach(editor => {
        if (globalSelectionActive) {
          withBodySelection(editor, action);
        } else {
          action(editor);
        }
      });
    },
    [activeEditor, editorRegistry, globalSelectionActive, withBodySelection],
  );

  const runToolbarAction = useCallback(
    (label: string, callback: () => void) => {
      runHistoryAction(
        {
          label,
          source: 'toolbar',
          region: 'document',
        },
        callback,
      );
    },
    [runHistoryAction],
  );

  const handleToggle = (enabled: boolean) => {
    runToolbarAction(
      enabled ? 'Enabled headers and footers' : 'Disabled headers and footers',
      () => {
        dispatch({ type: 'SET_HEADER_FOOTER_ENABLED', enabled });
      },
    );
  };

  const handleCopyHeaderToAll = () => {
    if (activePageId) {
      runToolbarAction('Copied header to all pages', () => {
        dispatch({ type: 'COPY_HEADER_TO_ALL', sourcePageId: activePageId });
      });
    }
  };
  const handleCopyFooterToAll = () => {
    if (activePageId) {
      runToolbarAction('Copied footer to all pages', () => {
        dispatch({ type: 'COPY_FOOTER_TO_ALL', sourcePageId: activePageId });
      });
    }
  };
  const handleClearHeader = () => {
    if (activePageId) {
      runToolbarAction('Cleared header', () => {
        dispatch({ type: 'CLEAR_HEADER', pageId: activePageId });
      });
    }
  };
  const handleClearFooter = () => {
    if (activePageId) {
      runToolbarAction('Cleared footer', () => {
        dispatch({ type: 'CLEAR_FOOTER', pageId: activePageId });
      });
    }
  };
  const handleClearAllHeaders = () => runToolbarAction('Cleared all headers', () => {
    dispatch({ type: 'CLEAR_ALL_HEADERS' });
  });
  const handleClearAllFooters = () => runToolbarAction('Cleared all footers', () => {
    dispatch({ type: 'CLEAR_ALL_FOOTERS' });
  });
  const handlePageCounterModeChange = useCallback((mode: PageCounterMode) => {
    runToolbarAction(`Page counter set to ${mode}`, () => {
      dispatch({ type: 'SET_PAGE_COUNTER_MODE', mode });
    });
  }, [dispatch, runToolbarAction]);

  const handleBold = useCallback(() => {
    debug('toolbar', `bold (globalSelection=${globalSelectionActive}, editors=${editorRegistry.all().length}, hasEditor=${!!activeEditor})`);
    runToolbarAction('Bold applied', () => {
      applyToBodyEditors(toggleBold);
    });
  }, [activeEditor, applyToBodyEditors, editorRegistry, globalSelectionActive, runToolbarAction]);

  const handleItalic = useCallback(() => {
    debug('toolbar', `italic (globalSelection=${globalSelectionActive}, hasEditor=${!!activeEditor})`);
    runToolbarAction('Italic applied', () => {
      applyToBodyEditors(toggleItalic);
    });
  }, [activeEditor, applyToBodyEditors, globalSelectionActive, runToolbarAction]);

  const handleUnderline = useCallback(() => {
    debug('toolbar', `underline (globalSelection=${globalSelectionActive}, hasEditor=${!!activeEditor})`);
    runToolbarAction('Underline applied', () => {
      applyToBodyEditors(toggleUnderline);
    });
  }, [activeEditor, applyToBodyEditors, globalSelectionActive, runToolbarAction]);

  const handleStrikethrough = useCallback(() => {
    debug('toolbar', `strikethrough (globalSelection=${globalSelectionActive}, hasEditor=${!!activeEditor})`);
    runToolbarAction('Strikethrough applied', () => {
      applyToBodyEditors(toggleStrikethrough);
    });
  }, [activeEditor, applyToBodyEditors, globalSelectionActive, runToolbarAction]);

  const handleAlignLeft = useCallback(() => {
    runToolbarAction('Aligned left', () => {
      applyToBodyEditors(editor => setAlignment(editor, 'left'));
    });
  }, [applyToBodyEditors, runToolbarAction]);

  const handleAlignCenter = useCallback(() => {
    runToolbarAction('Aligned center', () => {
      applyToBodyEditors(editor => setAlignment(editor, 'center'));
    });
  }, [applyToBodyEditors, runToolbarAction]);

  const handleAlignRight = useCallback(() => {
    runToolbarAction('Aligned right', () => {
      applyToBodyEditors(editor => setAlignment(editor, 'right'));
    });
  }, [applyToBodyEditors, runToolbarAction]);

  const handleAlignJustify = useCallback(() => {
    runToolbarAction('Justified text', () => {
      applyToBodyEditors(editor => setAlignment(editor, 'justify'));
    });
  }, [applyToBodyEditors, runToolbarAction]);

  const handleListNumber = useCallback(() => {
    runToolbarAction('Inserted numbered list', () => {
      applyToBodyEditors(editor => insertList(editor, 'number'));
    });
  }, [applyToBodyEditors, runToolbarAction]);

  const handleListBullet = useCallback(() => {
    runToolbarAction('Inserted bullet list', () => {
      applyToBodyEditors(editor => insertList(editor, 'bullet'));
    });
  }, [applyToBodyEditors, runToolbarAction]);

  const handleIndent = useCallback(() => {
    runToolbarAction('Indented content', () => {
      applyToBodyEditors(indentContent);
    });
  }, [applyToBodyEditors, runToolbarAction]);

  const handleOutdent = useCallback(() => {
    runToolbarAction('Outdented content', () => {
      applyToBodyEditors(outdentContent);
    });
  }, [applyToBodyEditors, runToolbarAction]);

  const handleFontChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      runToolbarAction(`Font changed to ${e.target.value}`, () => {
        applyToBodyEditors(editor => applyFontFamily(editor, e.target.value as FontFamily));
      });
    },
    [applyToBodyEditors, runToolbarAction],
  );

  return (
    <div
      className="lex4-toolbar sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-2
                 flex flex-wrap items-center gap-4"
      data-testid="toolbar"
    >
      <div className="flex items-center gap-1" data-testid="history-controls">
        <IconButton
          title="Undo"
          ariaLabel="Undo"
          testId="btn-undo"
          disabled={!canUndo}
          onClick={undo}
        >
          <UndoIcon />
        </IconButton>
        <IconButton
          title="Redo"
          ariaLabel="Redo"
          testId="btn-redo"
          disabled={!canRedo}
          onClick={redo}
        >
          <RedoIcon />
        </IconButton>
        <button
          type="button"
          className={`rounded border px-2 py-1 text-xs transition-colors ${
            historySidebarOpen
              ? 'border-blue-300 bg-blue-50 text-blue-700'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
          }`}
          data-testid="toggle-history-sidebar"
          onClick={() => setHistorySidebarOpen(!historySidebarOpen)}
        >
          History
        </button>
        <button
          type="button"
          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-100"
          data-testid="clear-history"
          onClick={() => clearHistory('manual')}
        >
          Clear History
        </button>
      </div>

      <Divider />

      {/* Formatting group */}
      <div className="flex items-center gap-1" data-testid="format-group">
        <ToolbarButton label="B" title="Bold (Ctrl+B)" testId="btn-bold" className="font-bold" onClick={handleBold} />
        <ToolbarButton label="I" title="Italic (Ctrl+I)" testId="btn-italic" className="italic" onClick={handleItalic} />
        <ToolbarButton label="U" title="Underline (Ctrl+U)" testId="btn-underline" className="underline" onClick={handleUnderline} />
        <ToolbarButton label="S" title="Strikethrough" testId="btn-strike" className="line-through" onClick={handleStrikethrough} />
      </div>

      <Divider />

      {/* Alignment group */}
      <div className="flex items-center gap-1" data-testid="align-group">
        <ToolbarButton label="≡←" title="Align Left" testId="btn-align-left" onClick={handleAlignLeft} />
        <ToolbarButton label="≡↔" title="Align Center" testId="btn-align-center" onClick={handleAlignCenter} />
        <ToolbarButton label="≡→" title="Align Right" testId="btn-align-right" onClick={handleAlignRight} />
        <ToolbarButton label="≡≡" title="Justify" testId="btn-align-justify" onClick={handleAlignJustify} />
      </div>

      <Divider />

      {/* Font selector */}
      <select
        className="text-sm border border-gray-300 rounded px-2 py-1"
        data-testid="font-selector"
        defaultValue="Arial"
        onChange={handleFontChange}
      >
        {SUPPORTED_FONTS.map(font => (
          <option key={font} value={font} style={{ fontFamily: font }}>
            {font}
          </option>
        ))}
      </select>

      <Divider />

      {/* List controls */}
      <div className="flex items-center gap-1" data-testid="list-group">
        <ToolbarButton label="1." title="Numbered List" testId="btn-list-number" onClick={handleListNumber} />
        <ToolbarButton label="•" title="Bullet List" testId="btn-list-bullet" onClick={handleListBullet} />
        <ToolbarButton label="→" title="Indent" testId="btn-indent" onClick={handleIndent} />
        <ToolbarButton label="←" title="Outdent" testId="btn-outdent" onClick={handleOutdent} />
      </div>

      <Divider />

      {/* Header/footer toggle */}
      <HeaderFooterToggle
        enabled={document.headerFooterEnabled}
        onToggle={handleToggle}
      />

      {/* Header/footer actions (only shown when enabled) */}
      {document.headerFooterEnabled && (
        <HeaderFooterActions
          activePageId={activePageId}
          pageCounterMode={document.pageCounterMode}
          onPageCounterModeChange={handlePageCounterModeChange}
          onCopyHeaderToAll={handleCopyHeaderToAll}
          onCopyFooterToAll={handleCopyFooterToAll}
          onClearHeader={handleClearHeader}
          onClearFooter={handleClearFooter}
          onClearAllHeaders={handleClearAllHeaders}
          onClearAllFooters={handleClearAllFooters}
        />
      )}
    </div>
  );
};

interface ToolbarButtonProps {
  label: string;
  title: string;
  testId: string;
  className?: string;
  active?: boolean;
  onClick?: () => void;
}

interface IconButtonProps {
  title: string;
  ariaLabel: string;
  testId: string;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  label,
  title,
  testId,
  className = '',
  active = false,
  onClick,
}) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={`
      w-8 h-8 flex items-center justify-center text-sm rounded
      border border-transparent hover:border-gray-300 hover:bg-gray-100
      transition-colors ${active ? 'bg-blue-100 border-blue-300' : ''}
      ${className}
    `}
    data-testid={testId}
  >
    {label}
  </button>
);

const IconButton: React.FC<IconButtonProps> = ({
  title,
  ariaLabel,
  testId,
  disabled = false,
  onClick,
  children,
}) => (
  <button
    type="button"
    title={title}
    aria-label={ariaLabel}
    disabled={disabled}
    onClick={onClick}
    className={`
      flex h-8 w-8 items-center justify-center rounded border
      transition-colors
      ${disabled
        ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'}
    `}
    data-testid={testId}
  >
    {children}
  </button>
);

const UndoIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
    <path d="M9 7 4 12l5 5" />
    <path d="M4 12h9a7 7 0 1 1 0 14" />
  </svg>
);

const RedoIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
    <path d="m15 7 5 5-5 5" />
    <path d="M20 12h-9a7 7 0 1 0 0 14" />
  </svg>
);

const Divider: React.FC = () => (
  <div className="w-px h-6 bg-gray-300" />
);
