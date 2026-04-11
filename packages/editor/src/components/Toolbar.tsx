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
    editorRegistry,
    globalSelectionActive,
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

  const handleToggle = (enabled: boolean) => {
    dispatch({ type: 'SET_HEADER_FOOTER_ENABLED', enabled });
  };

  const handleCopyHeaderToAll = () => {
    if (activePageId) dispatch({ type: 'COPY_HEADER_TO_ALL', sourcePageId: activePageId });
  };
  const handleCopyFooterToAll = () => {
    if (activePageId) dispatch({ type: 'COPY_FOOTER_TO_ALL', sourcePageId: activePageId });
  };
  const handleClearHeader = () => {
    if (activePageId) dispatch({ type: 'CLEAR_HEADER', pageId: activePageId });
  };
  const handleClearFooter = () => {
    if (activePageId) dispatch({ type: 'CLEAR_FOOTER', pageId: activePageId });
  };
  const handleClearAllHeaders = () => dispatch({ type: 'CLEAR_ALL_HEADERS' });
  const handleClearAllFooters = () => dispatch({ type: 'CLEAR_ALL_FOOTERS' });
  const handlePageCounterModeChange = useCallback((mode: PageCounterMode) => {
    dispatch({ type: 'SET_PAGE_COUNTER_MODE', mode });
  }, [dispatch]);

  const handleBold = useCallback(() => {
    debug('toolbar', `bold (globalSelection=${globalSelectionActive}, editors=${editorRegistry.all().length}, hasEditor=${!!activeEditor})`);
    applyToBodyEditors(toggleBold);
  }, [activeEditor, applyToBodyEditors, editorRegistry, globalSelectionActive]);

  const handleItalic = useCallback(() => {
    debug('toolbar', `italic (globalSelection=${globalSelectionActive}, hasEditor=${!!activeEditor})`);
    applyToBodyEditors(toggleItalic);
  }, [activeEditor, applyToBodyEditors, globalSelectionActive]);

  const handleUnderline = useCallback(() => {
    debug('toolbar', `underline (globalSelection=${globalSelectionActive}, hasEditor=${!!activeEditor})`);
    applyToBodyEditors(toggleUnderline);
  }, [activeEditor, applyToBodyEditors, globalSelectionActive]);

  const handleStrikethrough = useCallback(() => {
    debug('toolbar', `strikethrough (globalSelection=${globalSelectionActive}, hasEditor=${!!activeEditor})`);
    applyToBodyEditors(toggleStrikethrough);
  }, [activeEditor, applyToBodyEditors, globalSelectionActive]);

  const handleAlignLeft = useCallback(() => {
    applyToBodyEditors(editor => setAlignment(editor, 'left'));
  }, [applyToBodyEditors]);

  const handleAlignCenter = useCallback(() => {
    applyToBodyEditors(editor => setAlignment(editor, 'center'));
  }, [applyToBodyEditors]);

  const handleAlignRight = useCallback(() => {
    applyToBodyEditors(editor => setAlignment(editor, 'right'));
  }, [applyToBodyEditors]);

  const handleAlignJustify = useCallback(() => {
    applyToBodyEditors(editor => setAlignment(editor, 'justify'));
  }, [applyToBodyEditors]);

  const handleListNumber = useCallback(() => {
    applyToBodyEditors(editor => insertList(editor, 'number'));
  }, [applyToBodyEditors]);

  const handleListBullet = useCallback(() => {
    applyToBodyEditors(editor => insertList(editor, 'bullet'));
  }, [applyToBodyEditors]);

  const handleIndent = useCallback(() => {
    applyToBodyEditors(indentContent);
  }, [applyToBodyEditors]);

  const handleOutdent = useCallback(() => {
    applyToBodyEditors(outdentContent);
  }, [applyToBodyEditors]);

  const handleFontChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      applyToBodyEditors(editor => applyFontFamily(editor, e.target.value as FontFamily));
    },
    [applyToBodyEditors],
  );

  return (
    <div
      className="lex4-toolbar sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-2
                 flex flex-wrap items-center gap-4"
      data-testid="toolbar"
    >
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

const Divider: React.FC = () => (
  <div className="w-px h-6 bg-gray-300" />
);
