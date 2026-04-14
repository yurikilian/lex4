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
import { useExtensions } from '../extensions/extension-context';
import { useTranslations, interpolate } from '../i18n';
import type { PageCounterMode } from '../types/document';
import { SUPPORTED_FONTS } from '../lexical/plugins/font-plugin';
import { applyFontFamily, type FontFamily } from '../lexical/plugins/font-plugin';
import { applyFontSize, SUPPORTED_FONT_SIZES, type FontSize } from '../lexical/plugins/font-size-plugin';
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
  const { toolbarItems } = useExtensions();
  const t = useTranslations();

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
      enabled ? t.history.actions.enabledHeadersFooters : t.history.actions.disabledHeadersFooters,
      () => {
        dispatch({ type: 'SET_HEADER_FOOTER_ENABLED', enabled });
      },
    );
  };

  const handleCopyHeaderToAll = () => {
    if (activePageId) {
      runToolbarAction(t.history.actions.copiedHeaderToAll, () => {
        dispatch({ type: 'COPY_HEADER_TO_ALL', sourcePageId: activePageId });
      });
    }
  };
  const handleCopyFooterToAll = () => {
    if (activePageId) {
      runToolbarAction(t.history.actions.copiedFooterToAll, () => {
        dispatch({ type: 'COPY_FOOTER_TO_ALL', sourcePageId: activePageId });
      });
    }
  };
  const handleClearHeader = () => {
    if (activePageId) {
      runToolbarAction(t.history.actions.clearedHeader, () => {
        dispatch({ type: 'CLEAR_HEADER', pageId: activePageId });
      });
    }
  };
  const handleClearFooter = () => {
    if (activePageId) {
      runToolbarAction(t.history.actions.clearedFooter, () => {
        dispatch({ type: 'CLEAR_FOOTER', pageId: activePageId });
      });
    }
  };
  const handleClearAllHeaders = () => runToolbarAction(t.history.actions.clearedAllHeaders, () => {
    dispatch({ type: 'CLEAR_ALL_HEADERS' });
  });
  const handleClearAllFooters = () => runToolbarAction(t.history.actions.clearedAllFooters, () => {
    dispatch({ type: 'CLEAR_ALL_FOOTERS' });
  });
  const handlePageCounterModeChange = useCallback((mode: PageCounterMode) => {
    runToolbarAction(interpolate(t.history.actions.pageCounterSet, { value: mode }), () => {
      dispatch({ type: 'SET_PAGE_COUNTER_MODE', mode });
    });
  }, [dispatch, runToolbarAction, t.history.actions.pageCounterSet]);

  const handleBold = useCallback(() => {
    debug('toolbar', `bold (globalSelection=${globalSelectionActive}, editors=${editorRegistry.all().length}, hasEditor=${!!activeEditor})`);
    runToolbarAction(t.history.actions.boldApplied, () => {
      applyToBodyEditors(toggleBold);
    });
  }, [activeEditor, applyToBodyEditors, editorRegistry, globalSelectionActive, runToolbarAction, t.history.actions.boldApplied]);

  const handleItalic = useCallback(() => {
    debug('toolbar', `italic (globalSelection=${globalSelectionActive}, hasEditor=${!!activeEditor})`);
    runToolbarAction(t.history.actions.italicApplied, () => {
      applyToBodyEditors(toggleItalic);
    });
  }, [activeEditor, applyToBodyEditors, globalSelectionActive, runToolbarAction, t.history.actions.italicApplied]);

  const handleUnderline = useCallback(() => {
    debug('toolbar', `underline (globalSelection=${globalSelectionActive}, hasEditor=${!!activeEditor})`);
    runToolbarAction(t.history.actions.underlineApplied, () => {
      applyToBodyEditors(toggleUnderline);
    });
  }, [activeEditor, applyToBodyEditors, globalSelectionActive, runToolbarAction, t.history.actions.underlineApplied]);

  const handleStrikethrough = useCallback(() => {
    debug('toolbar', `strikethrough (globalSelection=${globalSelectionActive}, hasEditor=${!!activeEditor})`);
    runToolbarAction(t.history.actions.strikethroughApplied, () => {
      applyToBodyEditors(toggleStrikethrough);
    });
  }, [activeEditor, applyToBodyEditors, globalSelectionActive, runToolbarAction, t.history.actions.strikethroughApplied]);

  const handleAlignLeft = useCallback(() => {
    runToolbarAction(t.history.actions.alignedLeft, () => {
      applyToBodyEditors(editor => setAlignment(editor, 'left'));
    });
  }, [applyToBodyEditors, runToolbarAction, t.history.actions.alignedLeft]);

  const handleAlignCenter = useCallback(() => {
    runToolbarAction(t.history.actions.alignedCenter, () => {
      applyToBodyEditors(editor => setAlignment(editor, 'center'));
    });
  }, [applyToBodyEditors, runToolbarAction, t.history.actions.alignedCenter]);

  const handleAlignRight = useCallback(() => {
    runToolbarAction(t.history.actions.alignedRight, () => {
      applyToBodyEditors(editor => setAlignment(editor, 'right'));
    });
  }, [applyToBodyEditors, runToolbarAction, t.history.actions.alignedRight]);

  const handleAlignJustify = useCallback(() => {
    runToolbarAction(t.history.actions.justifiedText, () => {
      applyToBodyEditors(editor => setAlignment(editor, 'justify'));
    });
  }, [applyToBodyEditors, runToolbarAction, t.history.actions.justifiedText]);

  const handleListNumber = useCallback(() => {
    runToolbarAction(t.history.actions.insertedNumberedList, () => {
      applyToBodyEditors(editor => insertList(editor, 'number'));
    });
  }, [applyToBodyEditors, runToolbarAction, t.history.actions.insertedNumberedList]);

  const handleListBullet = useCallback(() => {
    runToolbarAction(t.history.actions.insertedBulletList, () => {
      applyToBodyEditors(editor => insertList(editor, 'bullet'));
    });
  }, [applyToBodyEditors, runToolbarAction, t.history.actions.insertedBulletList]);

  const handleIndent = useCallback(() => {
    runToolbarAction(t.history.actions.indentedContent, () => {
      applyToBodyEditors(indentContent);
    });
  }, [applyToBodyEditors, runToolbarAction, t.history.actions.indentedContent]);

  const handleOutdent = useCallback(() => {
    runToolbarAction(t.history.actions.outdentedContent, () => {
      applyToBodyEditors(outdentContent);
    });
  }, [applyToBodyEditors, runToolbarAction, t.history.actions.outdentedContent]);

  const handleFontChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      runToolbarAction(interpolate(t.history.actions.fontChanged, { value: e.target.value }), () => {
        applyToBodyEditors(editor => applyFontFamily(editor, e.target.value as FontFamily));
      });
    },
    [applyToBodyEditors, runToolbarAction, t.history.actions.fontChanged],
  );

  const handleFontSizeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const size = parseInt(e.target.value, 10) as FontSize;
      runToolbarAction(interpolate(t.history.actions.fontSizeChanged, { value: String(size) }), () => {
        applyToBodyEditors(editor => applyFontSize(editor, size));
      });
    },
    [applyToBodyEditors, runToolbarAction, t.history.actions.fontSizeChanged],
  );

  return (
    <div
      className="lex4-toolbar sticky top-0 z-10 bg-white border-b border-gray-200"
      data-testid="toolbar"
    >
      <div className="flex items-center gap-1 px-2 py-1.5">
        <div className="flex items-center gap-0.5" data-testid="history-controls">
          <ToolbarIconButton
            title={t.toolbar.undo}
            testId="btn-undo"
            disabled={!canUndo}
            onClick={undo}
          >
            <Undo2 size={15} />
          </ToolbarIconButton>
          <ToolbarIconButton
            title={t.toolbar.redo}
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
          defaultValue="Inter"
          onChange={handleFontChange}
        >
          {SUPPORTED_FONTS.map(font => (
            <option key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </option>
          ))}
        </select>

        <select
          className="h-7 w-16 rounded border border-gray-200 bg-white px-1 text-xs text-gray-700
                     focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          data-testid="font-size-selector"
          defaultValue="12"
          onChange={handleFontSizeChange}
        >
          {SUPPORTED_FONT_SIZES.map(size => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        <Divider />

        <div className="flex items-center gap-0.5" data-testid="format-group">
          <ToolbarIconButton title={t.toolbar.bold} testId="btn-bold" onClick={handleBold}>
            <Bold size={15} />
          </ToolbarIconButton>
          <ToolbarIconButton title={t.toolbar.italic} testId="btn-italic" onClick={handleItalic}>
            <Italic size={15} />
          </ToolbarIconButton>
          <ToolbarIconButton title={t.toolbar.underline} testId="btn-underline" onClick={handleUnderline}>
            <Underline size={15} />
          </ToolbarIconButton>
          <ToolbarIconButton title={t.toolbar.strikethrough} testId="btn-strike" onClick={handleStrikethrough}>
            <Strikethrough size={15} />
          </ToolbarIconButton>
        </div>

        <Divider />

        <div className="flex items-center gap-0.5" data-testid="align-group">
          <ToolbarIconButton title={t.toolbar.alignLeft} testId="btn-align-left" onClick={handleAlignLeft}>
            <AlignLeft size={15} />
          </ToolbarIconButton>
          <ToolbarIconButton title={t.toolbar.alignCenter} testId="btn-align-center" onClick={handleAlignCenter}>
            <AlignCenter size={15} />
          </ToolbarIconButton>
          <ToolbarIconButton title={t.toolbar.alignRight} testId="btn-align-right" onClick={handleAlignRight}>
            <AlignRight size={15} />
          </ToolbarIconButton>
          <ToolbarIconButton title={t.toolbar.justify} testId="btn-align-justify" onClick={handleAlignJustify}>
            <AlignJustify size={15} />
          </ToolbarIconButton>
        </div>

        <Divider />

        <div className="flex items-center gap-0.5" data-testid="list-group">
          <ToolbarIconButton title={t.toolbar.numberedList} testId="btn-list-number" onClick={handleListNumber}>
            <ListOrdered size={15} />
          </ToolbarIconButton>
          <ToolbarIconButton title={t.toolbar.bulletList} testId="btn-list-bullet" onClick={handleListBullet}>
            <List size={15} />
          </ToolbarIconButton>
          <ToolbarIconButton title={t.toolbar.indent} testId="btn-indent" onClick={handleIndent}>
            <IndentIncrease size={15} />
          </ToolbarIconButton>
          <ToolbarIconButton title={t.toolbar.outdent} testId="btn-outdent" onClick={handleOutdent}>
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

        {toolbarItems.length > 0 && (
          <>
            <Divider />
            {toolbarItems.map((ToolbarItem, idx) => (
              <ToolbarItem key={idx} />
            ))}
          </>
        )}

        <div className="ml-auto flex items-center">
          <ToolbarIconButton
            title={historySidebarOpen ? t.toolbar.closeHistory : t.toolbar.openHistory}
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