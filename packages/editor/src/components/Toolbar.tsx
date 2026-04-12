import React, { useCallback } from 'react';
import { $selectAll, type LexicalEditor } from 'lexical';
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ListOrdered,
  List,
  IndentIncrease,
  IndentDecrease,
  PanelRight,
} from 'lucide-react';
import { useDocument } from '../context/document-context';
import { HeaderFooterToggle } from './HeaderFooterToggle';
import { HeaderFooterActions } from './HeaderFooterActions';
import type { PageCounterMode } from '../types/document';
import { SUPPORTED_FONTS } from '../lexical/plugins/font-plugin';
import { applyFontFamily, type FontFamily } from '../lexical/plugins/font-plugin';
import { toggleBold, toggleItalic, toggleUnderline, toggleStrikethrough, setAlignment } from '../lexical/commands/format-commands';
import { insertList, indentContent, outdentContent } from '../lexical/commands/list-commands';
import { debug } from '../utils/debug';

export const Toolbar: React.FC = () => {
  const {
    document,
    dispatch,
    activePageId,
    activeEditor,
    canRedo,
    canUndo,
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
      className="lex4-toolbar sticky top-0 z-10 bg-white border-b border-gray-200"
      data-testid="toolbar"
    >
      <div className="flex items-center gap-1 px-2 py-1.5">
        <div className="flex items-center gap-0.5" data-testid="history-controls">
          <ToolbarIconButton
            title="Undo"
            testId="btn-undo"
            disabled={!canUndo}
            onClick={undo}
          >
            <Undo2 size={15} />
          </ToolbarIconButton>
          <ToolbarIconButton
            title="Redo"
            testId="btn-redo"
            disabled={!canRedo}
            onClick={redo}
          >
            <Redo2 size={15} />
          </ToolbarIconButton>
        </div>

        <Divider />

        <select
          className="h-7 rounded border border-gray-200 bg-white px-2 text-xs text-gray-700
                     focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
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

        <div className="flex items-center gap-0.5" data-testid="format-group">
          <ToolbarIconButton title="Bold (Ctrl+B)" testId="btn-bold" onClick={handleBold}>
            <Bold size={15} />
          </ToolbarIconButton>
          <ToolbarIconButton title="Italic (Ctrl+I)" testId="btn-italic" onClick={handleItalic}>
            <Italic size={15} />
          </ToolbarIconButton>
          <ToolbarIconButton title="Underline (Ctrl+U)" testId="btn-underline" onClick={handleUnderline}>
            <Underline size={15} />
          </ToolbarIconButton>
          <ToolbarIconButton title="Strikethrough" testId="btn-strike" onClick={handleStrikethrough}>
            <Strikethrough size={15} />
          </ToolbarIconButton>
        </div>

        <Divider />

        <div className="flex items-center gap-0.5" data-testid="align-group">
          <ToolbarIconButton title="Align Left" testId="btn-align-left" onClick={handleAlignLeft}>
            <AlignLeft size={15} />
          </ToolbarIconButton>
          <ToolbarIconButton title="Align Center" testId="btn-align-center" onClick={handleAlignCenter}>
            <AlignCenter size={15} />
          </ToolbarIconButton>
          <ToolbarIconButton title="Align Right" testId="btn-align-right" onClick={handleAlignRight}>
            <AlignRight size={15} />
          </ToolbarIconButton>
          <ToolbarIconButton title="Justify" testId="btn-align-justify" onClick={handleAlignJustify}>
            <AlignJustify size={15} />
          </ToolbarIconButton>
        </div>

        <Divider />

        <div className="flex items-center gap-0.5" data-testid="list-group">
          <ToolbarIconButton title="Numbered List" testId="btn-list-number" onClick={handleListNumber}>
            <ListOrdered size={15} />
          </ToolbarIconButton>
          <ToolbarIconButton title="Bullet List" testId="btn-list-bullet" onClick={handleListBullet}>
            <List size={15} />
          </ToolbarIconButton>
          <ToolbarIconButton title="Indent" testId="btn-indent" onClick={handleIndent}>
            <IndentIncrease size={15} />
          </ToolbarIconButton>
          <ToolbarIconButton title="Outdent" testId="btn-outdent" onClick={handleOutdent}>
            <IndentDecrease size={15} />
          </ToolbarIconButton>
        </div>

        <Divider />

        <HeaderFooterToggle
          enabled={document.headerFooterEnabled}
          onToggle={handleToggle}
        />

        {document.headerFooterEnabled && (
          <>
            <Divider />
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
          </>
        )}

        <div className="ml-auto flex items-center">
          <ToolbarIconButton
            title={historySidebarOpen ? 'Close History' : 'Open History'}
            testId="toggle-history-sidebar"
            active={historySidebarOpen}
            onClick={() => setHistorySidebarOpen(!historySidebarOpen)}
          >
            <PanelRight size={15} />
          </ToolbarIconButton>
        </div>
      </div>
    </div>
  );
};

interface ToolbarIconButtonProps {
  title: string;
  testId: string;
  disabled?: boolean;
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

const ToolbarIconButton: React.FC<ToolbarIconButtonProps> = ({
  title,
  testId,
  disabled = false,
  active = false,
  onClick,
  children,
}) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    disabled={disabled}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className={`
      flex h-7 w-7 items-center justify-center rounded transition-colors
      ${disabled
        ? 'cursor-not-allowed text-gray-300'
        : active
          ? 'bg-blue-50 text-blue-600'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
    `}
    data-testid={testId}
  >
    {children}
  </button>
);

const Divider: React.FC = () => (
  <div className="mx-0.5 h-5 w-px bg-gray-200" />
);