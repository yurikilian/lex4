import {
  $getNodeByKey,
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

function dedupeVariableNodes(nodes: VariableNode[]): VariableNode[] {
  return Array.from(new Map(nodes.map(node => [node.getKey(), node])).values());
}

function getSelectedVariableNodesFromSelection(
  selection: ReturnType<typeof $getSelection>,
): VariableNode[] {
  if (
    !selection
    || typeof selection !== 'object'
    || !('getNodes' in selection)
    || typeof selection.getNodes !== 'function'
  ) {
    return [];
  }

  return dedupeVariableNodes(selection.getNodes().filter($isVariableNode));
}

export function getVisuallySelectedVariableNodes(editor: LexicalEditor): VariableNode[] {
  const rootElement = editor.getRootElement();
  if (!rootElement) {
    return [];
  }

  const nodes: VariableNode[] = [];
  rootElement
    .querySelectorAll<HTMLElement>('.lex4-variable-chip-selected')
    .forEach((chip) => {
      const variableElement = chip.closest<HTMLElement>('[data-node-key]');
      const nodeKey = variableElement?.dataset.nodeKey;
      if (!nodeKey) {
        return;
      }

      const node = $getNodeByKey(nodeKey);
      if ($isVariableNode(node)) {
        nodes.push(node);
      }
    });

  return dedupeVariableNodes(nodes);
}

function withSelectedVariableNodes(
  editor: LexicalEditor,
  updater: (nodes: VariableNode[]) => void,
): boolean {
  let updated = false;

  editor.update(() => {
    const nodes = [
      ...getSelectedVariableNodesFromSelection($getSelection()),
      ...getVisuallySelectedVariableNodes(editor),
    ];
    const uniqueNodes = dedupeVariableNodes(nodes);
    if (uniqueNodes.length === 0) {
      return;
    }

    updater(uniqueNodes);
    updated = true;
  });

  return updated;
}

export function getSelectedVariableNodes(editor: LexicalEditor): VariableNode[] {
  let nodes: VariableNode[] = [];

  editor.getEditorState().read(() => {
    nodes = dedupeVariableNodes([
      ...getSelectedVariableNodesFromSelection($getSelection()),
      ...getVisuallySelectedVariableNodes(editor),
    ]);
    if (nodes.length === 0) {
      return;
    }
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
  let formatting: {
    fontFamily?: string;
    fontSize?: number;
  } = {};

  editor.getEditorState().read(() => {
    const selection = $getSelection();
    if (!$isNodeSelection(selection)) {
      return;
    }

    const firstNode = selection.getNodes().filter($isVariableNode)[0];
    if (!firstNode) {
      return;
    }

    const style = firstNode.getStyle();
    formatting = {
      fontFamily: extractFontFamilyFromStyle(style),
      fontSize: extractFontSizePtFromStyle(style),
    };
  });

  return formatting;
}
