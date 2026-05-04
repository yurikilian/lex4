import {
  $getSelection,
  $isNodeSelection,
  type LexicalEditor,
  type TextFormatType,
} from 'lexical';
import {
  extractFontFamilyFromStyle,
  extractFontSizePtFromStyle,
  mergeFontFamilyStyle,
  mergeFontSizeStyle,
} from '../utils/text-style';
import { $isVariableNode, type VariableNode } from './variable-node';

const FORMAT_MASKS: Partial<Record<TextFormatType, number>> = {
  bold: 1,
  italic: 2,
  strikethrough: 4,
  underline: 8,
};

function withSelectedVariableNodes(
  editor: LexicalEditor,
  updater: (nodes: VariableNode[]) => void,
): boolean {
  let updated = false;

  editor.update(() => {
    const selection = $getSelection();
    if (!$isNodeSelection(selection)) {
      return;
    }

    const nodes = selection.getNodes().filter($isVariableNode);
    if (nodes.length === 0) {
      return;
    }

    updater(nodes);
    updated = true;
  });

  return updated;
}

export function getSelectedVariableNodes(editor: LexicalEditor): VariableNode[] {
  let nodes: VariableNode[] = [];

  editor.getEditorState().read(() => {
    const selection = $getSelection();
    if (!$isNodeSelection(selection)) {
      return;
    }

    nodes = selection.getNodes().filter($isVariableNode);
  });

  return nodes;
}

export function toggleSelectedVariableFormat(
  editor: LexicalEditor,
  format: TextFormatType,
): boolean {
  const mask = FORMAT_MASKS[format];
  if (!mask) {
    return false;
  }

  return withSelectedVariableNodes(editor, (nodes) => {
    const shouldEnable = nodes.some((node) => (node.getFormat() & mask) === 0);

    for (const node of nodes) {
      const nextFormat = shouldEnable
        ? node.getFormat() | mask
        : node.getFormat() & ~mask;
      node.setFormat(nextFormat);
    }
  });
}

export function applyFontFamilyToSelectedVariables(
  editor: LexicalEditor,
  fontFamily: string,
): boolean {
  return withSelectedVariableNodes(editor, (nodes) => {
    for (const node of nodes) {
      node.setStyle(mergeFontFamilyStyle(node.getStyle(), fontFamily));
    }
  });
}

export function applyFontSizeToSelectedVariables(
  editor: LexicalEditor,
  size: number,
): boolean {
  return withSelectedVariableNodes(editor, (nodes) => {
    for (const node of nodes) {
      node.setStyle(mergeFontSizeStyle(node.getStyle(), size));
    }
  });
}

export function readSelectedVariableFormatting(editor: LexicalEditor): {
  fontFamily?: string;
  fontSize?: number;
} {
  const firstNode = getSelectedVariableNodes(editor)[0];
  if (!firstNode) {
    return {};
  }

  const style = firstNode.getStyle();
  return {
    fontFamily: extractFontFamilyFromStyle(style),
    fontSize: extractFontSizePtFromStyle(style),
  };
}
