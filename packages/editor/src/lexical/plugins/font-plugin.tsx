import React, { useCallback, useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
  type LexicalEditor,
} from 'lexical';

const SUPPORTED_FONTS = [
  'Calibri',
  'Inter',
  'Times New Roman',
  'Arial',
  'Georgia',
  'Courier New',
] as const;

export type FontFamily = (typeof SUPPORTED_FONTS)[number];

export { SUPPORTED_FONTS };

/**
 * Applies a font family to the current text selection by setting
 * inline CSS style on each selected text node.
 */
export function applyFontFamily(editor: LexicalEditor, fontFamily: FontFamily): void {
  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    const nodes = selection.getNodes();
    for (const node of nodes) {
      if ($isTextNode(node)) {
        node.setStyle(`font-family: ${fontFamily}`);
      }
    }
  });
}

interface FontPluginProps {
  onFontChange?: (font: string) => void;
}

/**
 * FontPlugin — tracks the current selection's font and exposes a callback
 * for the toolbar to display the active font.
 */
export const FontPlugin: React.FC<FontPluginProps> = ({ onFontChange }) => {
  const [editor] = useLexicalComposerContext();

  const reportFont = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const node = selection.getNodes()[0];
      if ($isTextNode(node)) {
        const style = node.getStyle();
        const match = style.match(/font-family:\s*([^;]+)/);
        onFontChange?.(match ? match[1].trim() : 'Calibri');
      }
    });
  }, [editor, onFontChange]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        reportFont();
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, reportFont]);

  return null;
};
