import React, { useCallback } from 'react';
import { useDocument } from '../context/document-context';
import { HeaderFooterToggle } from './HeaderFooterToggle';
import { HeaderFooterActions } from './HeaderFooterActions';
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
  const { document, dispatch, activePageId, activeEditor } = useDocument();

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

  const handleBold = useCallback(() => {
    debug('toolbar', `bold (hasEditor=${!!activeEditor})`);
    if (activeEditor) toggleBold(activeEditor);
  }, [activeEditor]);

  const handleItalic = useCallback(() => {
    debug('toolbar', `italic (hasEditor=${!!activeEditor})`);
    if (activeEditor) toggleItalic(activeEditor);
  }, [activeEditor]);

  const handleUnderline = useCallback(() => {
    debug('toolbar', `underline (hasEditor=${!!activeEditor})`);
    if (activeEditor) toggleUnderline(activeEditor);
  }, [activeEditor]);

  const handleStrikethrough = useCallback(() => {
    debug('toolbar', `strikethrough (hasEditor=${!!activeEditor})`);
    if (activeEditor) toggleStrikethrough(activeEditor);
  }, [activeEditor]);

  const handleAlignLeft = useCallback(() => {
    if (activeEditor) setAlignment(activeEditor, 'left');
  }, [activeEditor]);

  const handleAlignCenter = useCallback(() => {
    if (activeEditor) setAlignment(activeEditor, 'center');
  }, [activeEditor]);

  const handleAlignRight = useCallback(() => {
    if (activeEditor) setAlignment(activeEditor, 'right');
  }, [activeEditor]);

  const handleAlignJustify = useCallback(() => {
    if (activeEditor) setAlignment(activeEditor, 'justify');
  }, [activeEditor]);

  const handleListNumber = useCallback(() => {
    if (activeEditor) insertList(activeEditor, 'number');
  }, [activeEditor]);

  const handleListBullet = useCallback(() => {
    if (activeEditor) insertList(activeEditor, 'bullet');
  }, [activeEditor]);

  const handleIndent = useCallback(() => {
    if (activeEditor) indentContent(activeEditor);
  }, [activeEditor]);

  const handleOutdent = useCallback(() => {
    if (activeEditor) outdentContent(activeEditor);
  }, [activeEditor]);

  const handleFontChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (activeEditor) {
        applyFontFamily(activeEditor, e.target.value as FontFamily);
      }
    },
    [activeEditor],
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
