import {
  $getRoot,
  $isElementNode,
  $isTextNode,
  $getNearestNodeFromDOMNode,
  $splitNode,
  type LexicalNode,
  type SerializedLexicalNode,
  type ElementNode,
} from 'lexical';
import { $isListNode } from '@lexical/list';
import { debug, debugWarn } from '../../utils/debug';

/**
 * Result of finding a split point inside a block element.
 */
interface DomSplitPoint {
  /** The DOM Text node containing the split offset */
  textNode: Text;
  /** Character offset within the text node */
  offset: number;
}

/**
 * Finds the character position inside a block element where content
 * crosses the available height boundary.
 *
 * Uses a binary search with Range.getBoundingClientRect() for efficiency.
 * Returns the offset backed up to the nearest word boundary.
 *
 * @returns The DOM text node and offset, or null if no valid split found
 */
export function findMidBlockSplitPoint(
  blockElement: HTMLElement,
  availableHeight: number,
): DomSplitPoint | null {
  const blockRect = blockElement.getBoundingClientRect();
  const maxBottom = blockRect.top + availableHeight;

  // Collect all text nodes in the block
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(blockElement, NodeFilter.SHOW_TEXT);
  let walkNode: Text | null;
  while ((walkNode = walker.nextNode() as Text | null)) {
    if (walkNode.length > 0) {
      textNodes.push(walkNode);
    }
  }

  if (textNodes.length === 0) return null;

  // Find the text node that contains the split boundary
  const range = document.createRange();

  for (const textNode of textNodes) {
    // Quick check: does this text node cross the boundary?
    range.selectNodeContents(textNode);
    const nodeRect = range.getBoundingClientRect();

    if (nodeRect.bottom <= maxBottom) {
      continue; // Entire text node fits
    }

    if (nodeRect.top >= maxBottom) {
      // This text node starts after the boundary — split at offset 0
      return backupToWordBoundary(textNode, 0);
    }

    // This text node crosses the boundary — binary search for exact offset
    let low = 0;
    let high = textNode.length;

    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      range.setStart(textNode, 0);
      range.setEnd(textNode, mid + 1);
      const testRect = range.getBoundingClientRect();

      if (testRect.bottom > maxBottom) {
        high = mid;
      } else {
        low = mid + 1;
      }
    }

    // 'low' is the first character that doesn't fit
    return backupToWordBoundary(textNode, low);
  }

  return null;
}

/**
 * Backs up a split offset to the nearest word boundary (whitespace).
 * Ensures at least one character remains on each side.
 */
function backupToWordBoundary(
  textNode: Text,
  offset: number,
): DomSplitPoint | null {
  const text = textNode.textContent || '';
  if (offset <= 0 || offset >= text.length) {
    // Can't back up — split at the raw offset if valid
    if (offset > 0 && offset < text.length) {
      return { textNode, offset };
    }
    // offset is at an edge — try the raw value
    if (offset > 0) return { textNode, offset };
    return null;
  }

  // Scan backwards for whitespace
  let adjusted = offset;
  while (adjusted > 0 && !/\s/.test(text[adjusted - 1])) {
    adjusted--;
  }

  // If backing up to 0 would leave nothing on this page, use original offset
  if (adjusted <= 0) {
    adjusted = offset;
  }

  return { textNode, offset: adjusted };
}

/**
 * Recursively serializes a Lexical node and all its children.
 */
function serializeNodeTree(node: LexicalNode): SerializedLexicalNode {
  const json = node.exportJSON();
  if ($isElementNode(node)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (json as any).children = node.getChildren().map(serializeNodeTree);
  }
  return json;
}

/**
 * Finds the split point for a ListNode by checking which ListItem
 * crosses the height boundary.
 *
 * @returns The child index to split at, or -1 if no valid split
 */
function findListSplitIndex(
  listElement: HTMLElement,
  availableHeight: number,
): number {
  const listRect = listElement.getBoundingClientRect();
  const maxBottom = listRect.top + availableHeight;
  const children = Array.from(listElement.children) as HTMLElement[];

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const childRect = child.getBoundingClientRect();
    if (childRect.bottom > maxBottom && i > 0) {
      return i;
    }
  }

  return -1;
}

/**
 * Performs a mid-block split on the first overflowing block in the editor.
 *
 * Handles two cases:
 * 1. Paragraph/Heading: splits at a text offset using Range measurement
 * 2. List: splits at a ListItem boundary
 *
 * Must be called inside an editor.update() context.
 *
 * @returns Serialized overflow nodes, or null if split wasn't possible
 */
export function performMidBlockSplit(
  rootElement: HTMLElement,
  availableHeight: number,
  overflowBlockIndex: number,
): SerializedLexicalNode[] | null {
  const root = $getRoot();
  const allChildren = root.getChildren();
  const blockNode = allChildren[overflowBlockIndex];

  if (!blockNode || !$isElementNode(blockNode)) {
    debugWarn('overflow', 'target node is not an ElementNode');
    return null;
  }

  const blockElements = Array.from(rootElement.children) as HTMLElement[];
  const blockElement = blockElements[overflowBlockIndex];
  if (!blockElement) {
    debugWarn('overflow', 'no DOM element for block index');
    return null;
  }

  // Compute available height for this specific block
  const blockTop = blockElement.offsetTop;
  const heightForBlock = availableHeight - blockTop;

  if (heightForBlock <= 0) {
    debugWarn('overflow', 'no space for block');
    return null;
  }

  // Try list splitting first
  if ($isListNode(blockNode)) {
    return splitListNode(blockNode as ElementNode, blockElement, heightForBlock);
  }

  // Paragraph/Heading splitting via text measurement
  return splitParagraphNode(blockNode as ElementNode, blockElement, heightForBlock);
}

/**
 * Splits a ListNode at a ListItem boundary.
 */
function splitListNode(
  listNode: ElementNode,
  listElement: HTMLElement,
  availableHeight: number,
): SerializedLexicalNode[] | null {
  const splitIndex = findListSplitIndex(listElement, availableHeight);
  if (splitIndex <= 0) {
    debug('overflow', 'cannot split list — first item exceeds height');
    return null;
  }

  const [, overflowList] = $splitNode(listNode, splitIndex);

  // Serialize the overflow list and all subsequent siblings
  const overflowNodes: SerializedLexicalNode[] = [];
  const toRemove: LexicalNode[] = [];

  overflowNodes.push(serializeNodeTree(overflowList));
  toRemove.push(overflowList);

  // Collect remaining siblings after the overflow list
  let nextSibling = overflowList.getNextSibling();
  while (nextSibling) {
    overflowNodes.push(serializeNodeTree(nextSibling));
    toRemove.push(nextSibling);
    nextSibling = nextSibling.getNextSibling();
  }

  for (const node of toRemove) {
    node.remove();
  }

  debug('overflow', `split list at item ${splitIndex}, extracted ${overflowNodes.length} overflow nodes`);
  return overflowNodes;
}

/**
 * Splits a paragraph or heading node at a text boundary.
 */
function splitParagraphNode(
  blockNode: ElementNode,
  blockElement: HTMLElement,
  availableHeight: number,
): SerializedLexicalNode[] | null {
  const splitPoint = findMidBlockSplitPoint(blockElement, availableHeight);
  if (!splitPoint) {
    debug('overflow', 'no valid split point found in paragraph');
    return null;
  }

  // Map DOM text node to Lexical TextNode
  const lexicalNode = $getNearestNodeFromDOMNode(splitPoint.textNode);
  if (!lexicalNode || !$isTextNode(lexicalNode)) {
    debugWarn('overflow', 'could not map DOM text node to Lexical TextNode');
    return null;
  }

  // Split the text node
  const [, afterText] = lexicalNode.splitText(splitPoint.offset);
  if (!afterText) {
    debugWarn('overflow', 'splitText returned no second half');
    return null;
  }

  // Find afterText's index in the parent
  const parent = afterText.getParent();
  if (!parent || !$isElementNode(parent)) {
    debugWarn('overflow', 'split text has no element parent');
    return null;
  }

  // Walk up from the text to find the direct child of blockNode
  let directChild: LexicalNode = afterText;
  let directChildParent = parent;

  while (directChildParent && directChildParent.getKey() !== blockNode.getKey()) {
    directChild = directChildParent;
    const next = directChildParent.getParent();
    if (!next || !$isElementNode(next)) {
      debugWarn('overflow', 'could not find block node in parent chain');
      return null;
    }
    directChildParent = next;
  }

  // Now directChild is the child of blockNode that contains (or is) afterText
  const splitChildIndex = blockNode.getChildren().indexOf(directChild);

  if (splitChildIndex <= 0) {
    debug('overflow', 'split index is 0 or not found — nothing to keep on this page');
    return null;
  }

  // If the direct child is not afterText itself, we need to split intermediate nodes
  if (directChild !== afterText) {
    // Split each level from the text's parent up to (but not including) blockNode
    let current: ElementNode = parent;
    let childToSplitAt: LexicalNode = afterText;

    while (current.getKey() !== blockNode.getKey()) {
      const childIdx = current.getChildren().indexOf(childToSplitAt);
      if (childIdx > 0) {
        $splitNode(current, childIdx);
      }
      childToSplitAt = current;
      const next = current.getParent();
      if (!next || !$isElementNode(next)) break;
      current = next;
    }
  }

  // Re-find the split index after potential intermediate splits
  // Find the child of blockNode that contains afterText
  let finalSplitChild: LexicalNode = afterText;
  let p = afterText.getParent();
  while (p && p.getKey() !== blockNode.getKey()) {
    finalSplitChild = p;
    p = p.getParent() as ElementNode | null;
  }
  const finalSplitIndex = blockNode.getChildren().indexOf(finalSplitChild);

  if (finalSplitIndex <= 0) {
    debug('overflow', 'final split index is 0 or not found — nothing to keep on this page');
    return null;
  }

  const [, overflowBlock] = $splitNode(blockNode, finalSplitIndex);

  // Serialize the overflow block and any subsequent nodes
  const overflowNodes: SerializedLexicalNode[] = [];
  const toRemove: LexicalNode[] = [];

  overflowNodes.push(serializeNodeTree(overflowBlock));
  toRemove.push(overflowBlock);

  // Collect remaining siblings after the split
  let nextSibling = overflowBlock.getNextSibling();
  while (nextSibling) {
    overflowNodes.push(serializeNodeTree(nextSibling));
    toRemove.push(nextSibling);
    nextSibling = nextSibling.getNextSibling();
  }

  for (const node of toRemove) {
    node.remove();
  }

  debug(
    'overflow',
    `split paragraph at offset ${splitPoint.offset}, extracted ${overflowNodes.length} overflow nodes`,
  );
  return overflowNodes;
}
