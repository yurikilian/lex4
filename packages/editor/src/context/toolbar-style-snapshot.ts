import {
  $createRangeSelectionFromDom,
  $getSelection,
  $isElementNode,
  $isNodeSelection,
  $isRangeSelection,
  $isTextNode,
  type ElementFormatType,
  type LexicalEditor,
  type EditorState,
  type LexicalNode,
} from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';
import type { ToolbarStyleSnapshot } from './toolbar-style-store';
import { DEFAULT_TOOLBAR_STYLE_SNAPSHOT } from './toolbar-style-store';
import type { BlockType } from '../lexical/commands/block-types';
import { SUPPORTED_FONTS, type FontFamily } from '../lexical/plugins/font-plugin';
import { DEFAULT_FONT_SIZE } from '../lexical/plugins/font-size-plugin';
import {
  extractFontFamilyFromStyle,
  extractFontSizePtFromStyle,
  extractInlineBlockTypeFromStyle,
} from '../utils/text-style';
import { $isVariableNode } from '../variables/variable-node';

const FORMAT_MASKS = {
  bold: 1,
  italic: 2,
  strikethrough: 4,
  underline: 8,
} as const;

function normalizeFontFamily(fontFamily?: string): FontFamily {
  if (fontFamily && SUPPORTED_FONTS.includes(fontFamily as FontFamily)) {
    return fontFamily as FontFamily;
  }
  return 'Inter';
}

function normalizeAlignment(alignment: string): ElementFormatType {
  if (alignment === 'center' || alignment === 'right' || alignment === 'justify') {
    return alignment;
  }
  return 'left';
}

function getElementBlockType(node: LexicalNode): BlockType {
  const topLevelElement = node.getTopLevelElementOrThrow();
  if ($isHeadingNode(topLevelElement)) {
    return topLevelElement.getTag();
  }
  return 'paragraph';
}

function getElementAlignment(node: LexicalNode): ElementFormatType {
  const topLevelElement = node.getTopLevelElementOrThrow();
  if ($isElementNode(topLevelElement)) {
    return normalizeAlignment(topLevelElement.getFormatType());
  }
  return 'left';
}

function getInlineStyleTarget(nodes: LexicalNode[], anchorNode: LexicalNode): LexicalNode | null {
  if ($isTextNode(anchorNode) || $isVariableNode(anchorNode)) {
    return anchorNode;
  }
  return nodes.find(node => $isTextNode(node) || $isVariableNode(node)) ?? null;
}

function getInlineStyleFromNode(node: LexicalNode | null): string {
  if ($isTextNode(node) || $isVariableNode(node)) {
    return node.getStyle();
  }
  return '';
}

function hasInlineFormat(node: LexicalNode | null, format: keyof typeof FORMAT_MASKS): boolean {
  if ($isVariableNode(node)) {
    return (node.getFormat() & FORMAT_MASKS[format]) !== 0;
  }

  if (
    $isTextNode(node)
    && 'hasFormat' in node
    && typeof node.hasFormat === 'function'
  ) {
    return node.hasFormat(format);
  }

  if (
    $isTextNode(node)
    && 'getFormat' in node
    && typeof node.getFormat === 'function'
  ) {
    return (node.getFormat() & FORMAT_MASKS[format]) !== 0;
  }

  return false;
}

export function readToolbarStyleSnapshot(
  editor: LexicalEditor,
  editorState: EditorState = editor.getEditorState(),
): ToolbarStyleSnapshot {
  let snapshot = DEFAULT_TOOLBAR_STYLE_SNAPSHOT;

  editorState.read(() => {
    const currentSelection = $getSelection();
    const selection = $isNodeSelection(currentSelection)
      ? currentSelection
      : $createRangeSelectionFromDom(window.getSelection(), editor) ?? currentSelection;

    if ($isNodeSelection(selection)) {
      const variableNodes = selection.getNodes().filter($isVariableNode);
      if (variableNodes.length === 0) {
        return;
      }

      const firstVariableNode = variableNodes[0];
      const style = firstVariableNode.getStyle();
      snapshot = {
        blockType: extractInlineBlockTypeFromStyle(style)
          ?? getElementBlockType(firstVariableNode),
        fontFamily: normalizeFontFamily(extractFontFamilyFromStyle(style)),
        fontSize: extractFontSizePtFromStyle(style) ?? DEFAULT_FONT_SIZE,
        alignment: getElementAlignment(firstVariableNode),
        isBold: variableNodes.every(node => (node.getFormat() & FORMAT_MASKS.bold) !== 0),
        isItalic: variableNodes.every(node => (node.getFormat() & FORMAT_MASKS.italic) !== 0),
        isUnderline: variableNodes.every(node => (node.getFormat() & FORMAT_MASKS.underline) !== 0),
        isStrikethrough: variableNodes.every(node => (node.getFormat() & FORMAT_MASKS.strikethrough) !== 0),
        hasSelectedVariable: true,
      };
      return;
    }

    if (!$isRangeSelection(selection)) {
      return;
    }

    const anchorNode = selection.anchor.getNode();
    const inlineStyleTarget = getInlineStyleTarget(selection.getNodes(), anchorNode);
    const style = selection.style || getInlineStyleFromNode(inlineStyleTarget);
    const isCollapsed = selection.isCollapsed();
    snapshot = {
      blockType: extractInlineBlockTypeFromStyle(style) ?? getElementBlockType(anchorNode),
      fontFamily: normalizeFontFamily(extractFontFamilyFromStyle(style)),
      fontSize: extractFontSizePtFromStyle(style) ?? DEFAULT_FONT_SIZE,
      alignment: getElementAlignment(anchorNode),
      isBold: selection.hasFormat('bold') || (isCollapsed && hasInlineFormat(inlineStyleTarget, 'bold')),
      isItalic: selection.hasFormat('italic') || (isCollapsed && hasInlineFormat(inlineStyleTarget, 'italic')),
      isUnderline: selection.hasFormat('underline') || (isCollapsed && hasInlineFormat(inlineStyleTarget, 'underline')),
      isStrikethrough:
        selection.hasFormat('strikethrough') || (isCollapsed && hasInlineFormat(inlineStyleTarget, 'strikethrough')),
      hasSelectedVariable: false,
    };
  });

  return snapshot;
}
