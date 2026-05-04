import React, { useCallback, useEffect, useState } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $selectAll,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
  type LexicalEditor,
} from 'lexical';
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
  History,
  Type,
  ALargeSmall,
} from 'lucide-react';
import { useDocument } from '../context/document-context';
import { useToolbarConfig } from '../context/toolbar-config';
import { useExtensions } from '../extensions/extension-context';
import { useTranslations, interpolate } from '../i18n';
import { SUPPORTED_FONTS } from '../lexical/plugins/font-plugin';
import { applyFontFamily, type FontFamily } from '../lexical/plugins/font-plugin';
import {
  applyFontSize,
  DEFAULT_FONT_SIZE,
  SUPPORTED_FONT_SIZES,
  type FontSize,
} from '../lexical/plugins/font-size-plugin';
import {
  toggleBold,
  toggleItalic,
  toggleUnderline,
  toggleStrikethrough,
  setAlignment,
} from '../lexical/commands/format-commands';
import { insertList, indentContent, outdentContent } from '../lexical/commands/list-commands';
import {
  getActiveBlockType,
  setBlockType,
  type BlockType,
} from '../lexical/commands/block-commands';
import {
  applyFontFamilyToSelectedVariables,
  applyFontSizeToSelectedVariables,
  getSelectedVariableNodes,
  readSelectedVariableFormatting,
  toggleSelectedVariableFormat,
} from '../variables/variable-formatting';
import {
  extractFontFamilyFromStyle,
  extractFontSizePtFromStyle,
} from '../utils/text-style';
import { debug } from '../utils/debug';
import { CanvasControls } from './CanvasControls';

export const Toolbar: React.FC = () => {
  const {
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
  const { toolbarItems, toolbarEndItems } = useExtensions();
  const toolbarConfig = useToolbarConfig();
  const t = useTranslations();
  const [activeBlockType, setActiveBlockType] = useState<BlockType>('paragraph');
  const [activeFontFamily, setActiveFontFamily] = useState<FontFamily>('Calibri');
  const [activeFontSize, setActiveFontSize] = useState<number>(DEFAULT_FONT_SIZE);

  const normalizeFontFamily = useCallback((fontFamily?: string): FontFamily => {
    if (fontFamily && SUPPORTED_FONTS.includes(fontFamily as FontFamily)) {
      return fontFamily as FontFamily;
    }
    return 'Calibri';
  }, []);

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

  useEffect(() => {
    if (!activeEditor) {
      setActiveBlockType('paragraph');
      setActiveFontFamily('Calibri');
      setActiveFontSize(DEFAULT_FONT_SIZE);
      return;
    }

    const updateSelectionState = () => {
      const selectedVariables = getSelectedVariableNodes(activeEditor);
      if (selectedVariables.length > 0) {
        const formatting = readSelectedVariableFormatting(activeEditor);
        setActiveBlockType('paragraph');
        setActiveFontFamily(normalizeFontFamily(formatting.fontFamily));
        setActiveFontSize(formatting.fontSize ?? DEFAULT_FONT_SIZE);
        return;
      }

      setActiveBlockType(getActiveBlockType(activeEditor));

      let nextFontFamily: FontFamily = 'Calibri';
      let nextFontSize: number = DEFAULT_FONT_SIZE;
      activeEditor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return;
        }

        const textNode = selection.getNodes().find($isTextNode);
        if (!textNode) {
          return;
        }

        const style = textNode.getStyle();
        nextFontFamily = normalizeFontFamily(extractFontFamilyFromStyle(style));
        nextFontSize = extractFontSizePtFromStyle(style) ?? DEFAULT_FONT_SIZE;
      });

      setActiveFontFamily(nextFontFamily);
      setActiveFontSize(nextFontSize);
    };

    updateSelectionState();
    const unregisterSelectionChange = activeEditor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateSelectionState();
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
    const unregisterUpdateListener = activeEditor.registerUpdateListener(() => {
      updateSelectionState();
    });

    return () => {
      unregisterSelectionChange();
      unregisterUpdateListener();
    };
  }, [activeEditor, normalizeFontFamily]);

  const handleBold = useCallback(() => {
    debug('toolbar', `bold (globalSelection=${globalSelectionActive}, editors=${editorRegistry.all().length}, hasEditor=${!!activeEditor})`);
    runToolbarAction(t.history.actions.boldApplied, () => {
      if (activeEditor && toggleSelectedVariableFormat(activeEditor, 'bold')) {
        return;
      }
      applyToBodyEditors(toggleBold);
    });
  }, [activeEditor, applyToBodyEditors, editorRegistry, globalSelectionActive, runToolbarAction, t.history.actions.boldApplied]);

  const handleItalic = useCallback(() => {
    debug('toolbar', `italic (globalSelection=${globalSelectionActive}, hasEditor=${!!activeEditor})`);
    runToolbarAction(t.history.actions.italicApplied, () => {
      if (activeEditor && toggleSelectedVariableFormat(activeEditor, 'italic')) {
        return;
      }
      applyToBodyEditors(toggleItalic);
    });
  }, [activeEditor, applyToBodyEditors, globalSelectionActive, runToolbarAction, t.history.actions.italicApplied]);

  const handleUnderline = useCallback(() => {
    debug('toolbar', `underline (globalSelection=${globalSelectionActive}, hasEditor=${!!activeEditor})`);
    runToolbarAction(t.history.actions.underlineApplied, () => {
      if (activeEditor && toggleSelectedVariableFormat(activeEditor, 'underline')) {
        return;
      }
      applyToBodyEditors(toggleUnderline);
    });
  }, [activeEditor, applyToBodyEditors, globalSelectionActive, runToolbarAction, t.history.actions.underlineApplied]);

  const handleStrikethrough = useCallback(() => {
    debug('toolbar', `strikethrough (globalSelection=${globalSelectionActive}, hasEditor=${!!activeEditor})`);
    runToolbarAction(t.history.actions.strikethroughApplied, () => {
      if (activeEditor && toggleSelectedVariableFormat(activeEditor, 'strikethrough')) {
        return;
      }
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
      const fontFamily = e.target.value as FontFamily;
      runToolbarAction(interpolate(t.history.actions.fontChanged, { value: fontFamily }), () => {
        if (activeEditor && applyFontFamilyToSelectedVariables(activeEditor, fontFamily)) {
          return;
        }
        applyToBodyEditors(editor => applyFontFamily(editor, fontFamily));
      });
    },
    [activeEditor, applyToBodyEditors, runToolbarAction, t.history.actions.fontChanged],
  );

  const handleFontSizeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const size = parseInt(e.target.value, 10) as FontSize;
      runToolbarAction(interpolate(t.history.actions.fontSizeChanged, { value: String(size) }), () => {
        if (activeEditor && applyFontSizeToSelectedVariables(activeEditor, size)) {
          return;
        }
        applyToBodyEditors(editor => applyFontSize(editor, size));
      });
    },
    [activeEditor, applyToBodyEditors, runToolbarAction, t.history.actions.fontSizeChanged],
  );

  const handleBlockTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const blockType = e.target.value as BlockType;
      const labelMap: Record<BlockType, string> = {
        paragraph: t.toolbar.paragraph,
        h1: t.toolbar.heading1,
        h2: t.toolbar.heading2,
        h3: t.toolbar.heading3,
        h4: t.toolbar.heading4,
        h5: t.toolbar.heading5,
        h6: t.toolbar.heading6,
      };

      runToolbarAction(
        interpolate(t.history.actions.blockTypeChanged, { value: labelMap[blockType] }),
        () => {
          applyToBodyEditors(editor => setBlockType(editor, blockType));
        },
      );
    },
    [
      applyToBodyEditors,
      runToolbarAction,
      t.history.actions.blockTypeChanged,
      t.toolbar.heading1,
      t.toolbar.heading2,
      t.toolbar.heading3,
      t.toolbar.heading4,
      t.toolbar.heading5,
      t.toolbar.heading6,
      t.toolbar.paragraph,
    ],
  );

  const handleToggleHistory = useCallback(() => {
    setHistorySidebarOpen(!historySidebarOpen);
  }, [historySidebarOpen, setHistorySidebarOpen]);

  return (
    <div
      className="lex4-toolbar"
      data-testid="toolbar"
    >
      <div className="lex4-toolbar-row">
        <div className="lex4-toolbar-group" data-testid="history-controls">
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

        <div className="lex4-toolbar-group-gap lex4-toolbar-group-block">
          <select
            className="lex4-toolbar-select lex4-toolbar-select-block"
            data-testid="block-type-selector"
            aria-label={t.toolbar.blockType}
            value={activeBlockType}
            onChange={handleBlockTypeChange}
          >
            <option value="paragraph">{t.toolbar.paragraph}</option>
            <option value="h1">{t.toolbar.heading1}</option>
            <option value="h2">{t.toolbar.heading2}</option>
            <option value="h3">{t.toolbar.heading3}</option>
            <option value="h4">{t.toolbar.heading4}</option>
            <option value="h5">{t.toolbar.heading5}</option>
            <option value="h6">{t.toolbar.heading6}</option>
          </select>
        </div>

        <Divider />

        <div className="lex4-toolbar-group-gap">
          <Type size={14} className="lex4-toolbar-icon" />
          <select
            className="lex4-toolbar-select"
            data-testid="font-selector"
            value={activeFontFamily}
            onChange={handleFontChange}
          >
            {SUPPORTED_FONTS.map(font => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>

        <div className="lex4-toolbar-group-gap">
          <ALargeSmall size={14} className="lex4-toolbar-icon" />
          <select
            className="lex4-toolbar-select lex4-toolbar-select-narrow"
            data-testid="font-size-selector"
            value={String(activeFontSize)}
            onChange={handleFontSizeChange}
          >
            {SUPPORTED_FONT_SIZES.map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <Divider />

        <div className="lex4-toolbar-group" data-testid="format-group">
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

        <div className="lex4-toolbar-group" data-testid="align-group">
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

        <div className="lex4-toolbar-group" data-testid="list-group">
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

        {toolbarItems.length > 0 && (
          <>
            <Divider />
            {toolbarItems.map((ToolbarItem, idx) => (
              <ToolbarItem key={idx} />
            ))}
          </>
        )}

        <Divider />

        <CanvasControls />

        <div className="lex4-toolbar-end">
          {toolbarEndItems.map((EndItem, idx) => (
            <EndItem key={idx} />
          ))}
          {toolbarConfig.history.visible && (
            <button
              type="button"
              className={`lex4-toolbar-toggle-btn${historySidebarOpen ? ' active' : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleToggleHistory}
              data-testid="toggle-history-sidebar"
              title={historySidebarOpen ? t.toolbar.closeHistory : t.toolbar.openHistory}
              aria-label={historySidebarOpen ? t.toolbar.closeHistory : t.toolbar.openHistory}
            >
              <History size={14} />
              {toolbarConfig.history.showLabel && t.toolbar.history}
            </button>
          )}
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
    className={`lex4-toolbar-btn${active ? ' active' : ''}`}
    data-testid={testId}
  >
    {children}
  </button>
);

const Divider: React.FC = () => (
  <div className="lex4-toolbar-separator" />
);
