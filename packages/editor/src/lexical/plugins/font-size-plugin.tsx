import { useCallback, useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
  type LexicalEditor,
} from 'lexical';

export const SUPPORTED_FONT_SIZES = [
  8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72,
] as const;

export type FontSize = (typeof SUPPORTED_FONT_SIZES)[number];

export const DEFAULT_FONT_SIZE: FontSize = 12;

/**
 * Applies a font size to the current text selection by merging
 * into the existing inline CSS style on each selected text node.
 */
export function applyFontSize(editor: LexicalEditor, size: FontSize): void {
  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    const nodes = selection.getNodes();
    for (const node of nodes) {
      if ($isTextNode(node)) {
        const existing = node.getStyle();
        const updated = mergeFontSize(existing, size);
        node.setStyle(updated);
      }
    }
  });
}

function mergeFontSize(existingStyle: string, size: FontSize): string {
  const stripped = existingStyle.replace(/font-size:\s*[^;]+;?\s*/g, '').trim();
  const sizeDecl = `font-size: ${size}pt`;
  return stripped ? `${stripped}; ${sizeDecl}` : sizeDecl;
}

function extractFontSize(style: string): number | null {
  const match = style.match(/font-size:\s*(\d+(?:\.\d+)?)\s*pt/);
  return match ? parseFloat(match[1]) : null;
}

interface FontSizePluginProps {
  onFontSizeChange?: (size: number) => void;
}

/**
 * FontSizePlugin — tracks the current selection's font size
 * and exposes a callback for the toolbar to display the active size.
 */
export const FontSizePlugin: React.FC<FontSizePluginProps> = ({ onFontSizeChange }) => {
  const [editor] = useLexicalComposerContext();

  const reportFontSize = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const node = selection.getNodes()[0];
      if ($isTextNode(node)) {
        const style = node.getStyle();
        const size = extractFontSize(style);
        onFontSizeChange?.(size ?? DEFAULT_FONT_SIZE);
      }
    });
  }, [editor, onFontSizeChange]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        reportFontSize();
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, reportFontSize]);

  return null;
};
