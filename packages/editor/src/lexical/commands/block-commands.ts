import { $patchStyleText, $setBlocksType } from '@lexical/selection';
import {
  $createRangeSelectionFromDom,
  $createNodeSelection,
  $createParagraphNode,
  $isElementNode,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  type ElementNode,
  type LexicalEditor,
  type RangeSelection,
} from 'lexical';
import {
  $createHeadingNode,
  $isHeadingNode,
} from '@lexical/rich-text';
import type { BlockType } from './block-types';
import {
  createInlineBlockTypeStylePatch,
  extractInlineBlockTypeFromStyle,
  mergeInlineBlockTypeStyle,
} from '../../utils/text-style';
import { $isVariableNode, type VariableNode } from '../../variables/variable-node';

function getElementBlockType(element: ElementNode): BlockType {
  if ($isHeadingNode(element)) {
    return element.getTag();
  }
  return 'paragraph';
}

function getVariableTopLevelElement(variable: VariableNode): ElementNode | null {
  const topLevelElement = variable.getTopLevelElementOrThrow();
  return $isElementNode(topLevelElement) ? topLevelElement : null;
}

function replaceTopLevelBlockType(element: ElementNode, blockType: BlockType): void {
  const currentType = getElementBlockType(element);
  if (currentType === blockType) {
    return;
  }

  const nextElement = blockType === 'paragraph'
    ? $createParagraphNode()
    : $createHeadingNode(blockType);
  nextElement.setFormat(element.getFormatType());
  nextElement.setIndent(element.getIndent());

  const children = element.getChildren();
  for (const child of children) {
    nextElement.append(child);
  }

  element.replace(nextElement);
}

function isPartialSingleBlockSelection(selection: RangeSelection): boolean {
  if (selection.isCollapsed()) {
    return false;
  }

  const anchorTopLevel = selection.anchor.getNode().getTopLevelElementOrThrow();
  const focusTopLevel = selection.focus.getNode().getTopLevelElementOrThrow();
  if (!anchorTopLevel.is(focusTopLevel)) {
    return false;
  }

  const selectedText = selection.getTextContent().trim();
  const blockText = anchorTopLevel.getTextContent().trim();
  return selectedText.length > 0 && selectedText.length < blockText.length;
}

function applySemanticBlockType(selection: RangeSelection, blockType: BlockType): void {
  if (blockType === 'paragraph') {
    $setBlocksType(selection, () => $createParagraphNode());
    return;
  }

  $setBlocksType(selection, () => $createHeadingNode(blockType));
}

function selectedVariablesOccupyEntireBlock(
  variables: VariableNode[],
  topLevelElement: ElementNode,
): boolean {
  const selectedKeys = new Set(variables.map(variable => variable.getKey()));
  const meaningfulChildren = topLevelElement.getChildren().filter(
    child => !($isTextNode(child) && child.getTextContent().trim() === ''),
  );

  if (meaningfulChildren.length === 0) {
    return false;
  }

  return meaningfulChildren.every(
    child => $isVariableNode(child) && selectedKeys.has(child.getKey()),
  );
}

function getStandaloneVariableChildren(topLevelElement: ElementNode): VariableNode[] | null {
  const meaningfulChildren = topLevelElement.getChildren().filter(
    child => !($isTextNode(child) && child.getTextContent().trim() === ''),
  );

  if (meaningfulChildren.length === 0 || !meaningfulChildren.every($isVariableNode)) {
    return null;
  }

  return meaningfulChildren;
}

export function setBlockType(editor: LexicalEditor, blockType: BlockType): void {
  editor.update(() => {
    const currentSelection = $getSelection();
    const selection = $isNodeSelection(currentSelection)
      ? currentSelection
      : $createRangeSelectionFromDom(window.getSelection(), editor) ?? currentSelection;

    if ($isRangeSelection(selection)) {
      $setSelection(selection);
    }

    if ($isNodeSelection(selection)) {
      const variables = selection.getNodes().filter($isVariableNode);
      if (variables.length === 0) {
        return;
      }

      const firstTopLevelElement = getVariableTopLevelElement(variables[0]);
      if (!firstTopLevelElement) {
        return;
      }
      const sameTopLevelElement = variables.every(
        variable => getVariableTopLevelElement(variable)?.is(firstTopLevelElement) ?? false,
      );

      if (sameTopLevelElement && selectedVariablesOccupyEntireBlock(variables, firstTopLevelElement)) {
        for (const variable of variables) {
          variable.setStyle(mergeInlineBlockTypeStyle(variable.getStyle(), blockType));
        }
        replaceTopLevelBlockType(firstTopLevelElement, blockType);
        const nextSelection = $createNodeSelection();
        for (const variable of variables) {
          nextSelection.add(variable.getKey());
        }
        $setSelection(nextSelection);
        return;
      }

      for (const variable of variables) {
        variable.setStyle(mergeInlineBlockTypeStyle(variable.getStyle(), blockType));
      }
      return;
    }

    if (!$isRangeSelection(selection)) {
      return;
    }

    const anchorTopLevel = selection.anchor.getNode().getTopLevelElementOrThrow();
    const standaloneVariables = $isElementNode(anchorTopLevel)
      ? getStandaloneVariableChildren(anchorTopLevel)
      : null;

    if (isPartialSingleBlockSelection(selection)) {
      $patchStyleText(selection, createInlineBlockTypeStylePatch(blockType));
      return;
    }

    for (const variable of standaloneVariables ?? []) {
      variable.setStyle(mergeInlineBlockTypeStyle(variable.getStyle(), blockType));
    }

    applySemanticBlockType(selection, blockType);
  });
}

export function getActiveBlockType(editor: LexicalEditor): BlockType {
  let blockType: BlockType = 'paragraph';

  editor.getEditorState().read(() => {
    const selection = $getSelection();
    if ($isNodeSelection(selection)) {
      const firstVariableNode = selection.getNodes().filter($isVariableNode)[0];
      if (!firstVariableNode) {
        return;
      }

      const topLevelElement = getVariableTopLevelElement(firstVariableNode);
      blockType = extractInlineBlockTypeFromStyle(firstVariableNode.getStyle())
        ?? (topLevelElement ? getElementBlockType(topLevelElement) : 'paragraph');
      return;
    }

    if (!$isRangeSelection(selection)) {
      return;
    }

    const anchorNode = selection.anchor.getNode();
    const styleTarget = ($isTextNode(anchorNode) || $isVariableNode(anchorNode))
      ? anchorNode
      : selection.getNodes().find(node => $isTextNode(node) || $isVariableNode(node));
    const style = selection.style
      || (($isTextNode(styleTarget) || $isVariableNode(styleTarget)) ? styleTarget.getStyle() : '');
    blockType = extractInlineBlockTypeFromStyle(style)
      ?? getElementBlockType(anchorNode.getTopLevelElementOrThrow());
  });

  return blockType;
}
