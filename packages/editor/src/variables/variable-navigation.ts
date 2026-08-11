import {
  $createNodeSelection,
  $getSelection,
  $isElementNode,
  $isNodeSelection,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  type LexicalNode,
  type RangeSelection,
} from 'lexical';
import {
  $createVariableCaretNode,
  $isVariableCaretNode,
} from './variable-caret-node';
import { $isOptionalSegmentNode } from './optional-segment-node';
import { $isVariableNode, type VariableNode } from './variable-node';

export type VariableNavigationDirection = 'previous' | 'next';

function $selectVariable(node: VariableNode): void {
  const selection = $createNodeSelection();
  selection.add(node.getKey());
  $setSelection(selection);
}

function $selectEditableBeside(
  boundary: LexicalNode,
  direction: VariableNavigationDirection,
): boolean {
  const sibling = direction === 'previous'
    ? boundary.getPreviousSibling()
    : boundary.getNextSibling();

  if ($isVariableCaretNode(sibling)) {
    const offset = direction === 'previous' ? 0 : sibling.getAnchorOffset();
    sibling.select(offset, offset);
    return true;
  }

  if ($isTextNode(sibling)) {
    const offset = direction === 'previous' ? sibling.getTextContentSize() : 0;
    sibling.select(offset, offset);
    return true;
  }

  const caretNode = $createVariableCaretNode();
  if (direction === 'previous') {
    boundary.insertBefore(caretNode);
    const offset = caretNode.getAnchorOffset();
    caretNode.select(offset, offset);
  } else {
    boundary.insertAfter(caretNode);
    const offset = caretNode.getAnchorOffset();
    caretNode.select(offset, offset);
  }
  return true;
}

function $descendToEdge(
  node: LexicalNode | null,
  direction: VariableNavigationDirection,
): LexicalNode | null {
  let current = node;

  while ($isElementNode(current) && current.isInline()) {
    current = direction === 'previous'
      ? current.getLastChild()
      : current.getFirstChild();
  }

  return current;
}

function $getAdjacentNode(
  selection: RangeSelection,
  direction: VariableNavigationDirection,
): LexicalNode | null {
  const point = selection.anchor;
  const pointNode = point.getNode();

  if ($isTextNode(pointNode)) {
    if ($isVariableCaretNode(pointNode)) {
      const anchorOffset = pointNode.getAnchorOffset();
      if (direction === 'previous' && point.offset <= anchorOffset) {
        return pointNode.getPreviousSibling();
      }
      if (direction === 'next' && point.offset <= anchorOffset) {
        return pointNode.getNextSibling();
      }
    }

    const atBoundary = direction === 'previous'
      ? point.offset === 0
      : point.offset === pointNode.getTextContentSize();
    if (!atBoundary) {
      return null;
    }
    return direction === 'previous'
      ? pointNode.getPreviousSibling()
      : pointNode.getNextSibling();
  }

  if ($isElementNode(pointNode)) {
    return pointNode.getChildAtIndex(
      direction === 'previous' ? point.offset - 1 : point.offset,
    );
  }

  return null;
}

function $isAtInlineEdge(
  node: LexicalNode,
  direction: VariableNavigationDirection,
): boolean {
  if ($isTextNode(node)) {
    const selection = $getSelection();
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
      return false;
    }
    return direction === 'previous'
      ? selection.anchor.offset === 0
      : selection.anchor.offset === node.getTextContentSize();
  }

  if ($isElementNode(node)) {
    const selection = $getSelection();
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
      return false;
    }
    return direction === 'previous'
      ? selection.anchor.offset === 0
      : selection.anchor.offset === node.getChildrenSize();
  }

  return false;
}

function $selectOutsideOptionalSegment(
  selection: RangeSelection,
  direction: VariableNavigationDirection,
): boolean {
  let edgeNode: LexicalNode = selection.anchor.getNode();
  if (!$isAtInlineEdge(edgeNode, direction)) {
    return false;
  }

  let parent = edgeNode.getParent();
  while ($isOptionalSegmentNode(parent)) {
    const sibling = direction === 'previous'
      ? edgeNode.getPreviousSibling()
      : edgeNode.getNextSibling();
    if (sibling !== null) {
      return false;
    }

    const segment = parent;
    if (!$isElementNode(segment.getParent())) {
      return false;
    }
    return $selectEditableBeside(segment, direction);
  }

  return false;
}

function $selectBesideVariable(
  variable: VariableNode,
  direction: VariableNavigationDirection,
): boolean {
  let boundary: LexicalNode = variable;
  let parent = boundary.getParent();

  while ($isOptionalSegmentNode(parent)) {
    const sibling = direction === 'previous'
      ? boundary.getPreviousSibling()
      : boundary.getNextSibling();
    if (sibling !== null) {
      break;
    }
    boundary = parent;
    parent = boundary.getParent();
  }

  if (!$isElementNode(parent)) {
    return false;
  }
  return $selectEditableBeside(boundary, direction);
}

/**
 * Treats a variable chip as one explicit keyboard stop.
 *
 * A collapsed caret moving towards a variable selects the whole chip. The
 * following arrow moves to a real editable position beside it. If the chip
 * is the edge child of an optional segment, that position is outside the
 * segment so the caret cannot become trapped between its visual brackets.
 */
export function $handleVariableArrowNavigation(
  direction: VariableNavigationDirection,
): boolean {
  const selection = $getSelection();

  if ($isNodeSelection(selection)) {
    const variables = selection.getNodes().filter($isVariableNode);
    if (variables.length === 0) {
      return false;
    }
    const variable = direction === 'previous'
      ? variables[0]
      : variables[variables.length - 1];
    return $selectBesideVariable(variable, direction);
  }

  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return false;
  }

  const adjacent = $descendToEdge($getAdjacentNode(selection, direction), direction);
  if ($isVariableNode(adjacent)) {
    $selectVariable(adjacent);
    return true;
  }

  return $selectOutsideOptionalSegment(selection, direction);
}
