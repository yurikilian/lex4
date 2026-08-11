import {
  $getSelection,
  $createNodeSelection,
  $isElementNode,
  $isNodeSelection,
  $isRangeSelection,
  $setSelection,
  createCommand,
  type LexicalNode,
} from 'lexical';
import {
  $createOptionalSegmentNode,
  $isOptionalSegmentNode,
  OptionalSegmentNode,
} from './optional-segment-node';
import { $isVariableNode } from './variable-node';

/**
 * Command that toggles an optional segment around the current selection.
 *
 * - Selection (or caret) inside an existing segment → unwraps that segment.
 * - Non-collapsed selection within a single block → wraps it in a segment.
 * - Cross-block selections and nesting are refused (no-op).
 */
export const TOGGLE_OPTIONAL_SEGMENT_COMMAND = createCommand<void>(
  'TOGGLE_OPTIONAL_SEGMENT',
);

/**
 * Returns the nearest OptionalSegmentNode ancestor (or the node itself).
 */
export function $getAncestorOptionalSegment(
  node: LexicalNode | null,
): OptionalSegmentNode | null {
  let current: LexicalNode | null = node;
  while (current !== null) {
    if ($isOptionalSegmentNode(current)) {
      return current;
    }
    // Defensive: tolerate partial node doubles (e.g. in tests).
    current = typeof current.getParent === 'function' ? current.getParent() : null;
  }
  return null;
}

/**
 * Replaces a segment with its children (unwrap).
 */
export function $unwrapOptionalSegment(segment: OptionalSegmentNode): void {
  for (const child of segment.getChildren()) {
    segment.insertBefore(child);
  }
  segment.remove();
}

function containsOptionalSegment(node: LexicalNode): boolean {
  if ($isOptionalSegmentNode(node)) {
    return true;
  }
  if ($isElementNode(node)) {
    return node.getChildren().some(containsOptionalSegment);
  }
  return false;
}

/**
 * Toggles an optional segment at the current selection.
 * Must be called inside editor.update(). Returns true when a change was made.
 */
export function $toggleOptionalSegment(): boolean {
  const selection = $getSelection();
  if ($isNodeSelection(selection)) {
    const variables = selection.getNodes().filter($isVariableNode);
    if (variables.length !== 1) {
      return false;
    }

    const variable = variables[0];
    const existingSegment = $getAncestorOptionalSegment(variable);
    if (existingSegment !== null) {
      $unwrapOptionalSegment(existingSegment);
      const nextSelection = $createNodeSelection();
      nextSelection.add(variable.getKey());
      $setSelection(nextSelection);
      return true;
    }

    const segment = $createOptionalSegmentNode();
    variable.insertBefore(segment);
    segment.append(variable);
    const nextSelection = $createNodeSelection();
    nextSelection.add(variable.getKey());
    $setSelection(nextSelection);
    return true;
  }

  if (!$isRangeSelection(selection)) {
    return false;
  }

  // Already inside a segment → unwrap it instead of nesting.
  const anchorSegment = $getAncestorOptionalSegment(selection.anchor.getNode());
  const focusSegment = $getAncestorOptionalSegment(selection.focus.getNode());
  if (anchorSegment !== null || focusSegment !== null) {
    if (anchorSegment !== null && focusSegment !== null && anchorSegment !== focusSegment) {
      return false;
    }
    $unwrapOptionalSegment(anchorSegment ?? (focusSegment as OptionalSegmentNode));
    return true;
  }

  if (selection.isCollapsed()) {
    return false;
  }

  // Refuse selections that cross block boundaries.
  const anchorTop = selection.anchor.getNode().getTopLevelElement();
  const focusTop = selection.focus.getNode().getTopLevelElement();
  if (anchorTop === null || anchorTop !== focusTop) {
    return false;
  }

  const extracted = selection.extract();

  // Keep only inline nodes; drop block elements and any node whose
  // ancestor is also part of the extraction (avoid double-wrapping).
  const inlineNodes = extracted.filter((node) => {
    if ($isElementNode(node) && !node.isInline()) {
      return false;
    }
    return !node.getParents().some(parent => extracted.includes(parent));
  });

  if (inlineNodes.length === 0) {
    return false;
  }

  // Refuse nesting: selection fully covering an existing segment.
  if (inlineNodes.some(containsOptionalSegment)) {
    return false;
  }

  const segment = $createOptionalSegmentNode();
  inlineNodes[0].insertBefore(segment);
  for (const node of inlineNodes) {
    segment.append(node);
  }
  segment.selectEnd();
  return true;
}
