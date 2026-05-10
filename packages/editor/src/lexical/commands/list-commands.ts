import {
  $createListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  type ListNode,
} from '@lexical/list';
import { $findMatchingParent } from '@lexical/utils';
import {
  $getSelection,
  $isRangeSelection,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical';
import { $createAlphaListNode, $isAlphaListNode } from '../nodes/alpha-list-node';

export type ListType = 'number' | 'bullet' | 'alpha';
type PlainListType = Exclude<ListType, 'alpha'>;

function getNearestListNode(node: LexicalNode): ListNode | null {
  if ($isListNode(node)) {
    return node;
  }
  const listNode = $findMatchingParent(node, $isListNode);
  return $isListNode(listNode) ? listNode : null;
}

function getSelectedListNodes(): ListNode[] {
  const selection = $getSelection();
  if (!selection) {
    return [];
  }

  const listNodes = new Map<string, ListNode>();
  const nodes = selection.getNodes();
  if ($isRangeSelection(selection)) {
    nodes.push(selection.anchor.getNode(), selection.focus.getNode());
  }

  for (const node of nodes) {
    const listNode = getNearestListNode(node);
    if (listNode) {
      listNodes.set(listNode.getKey(), listNode);
    }
  }

  return Array.from(listNodes.values());
}

function replaceWithAlphaList(listNode: ListNode): void {
  if ($isAlphaListNode(listNode) || listNode.getListType() !== 'number') {
    return;
  }

  const alphaList = $createAlphaListNode(listNode.getStart());
  alphaList.setFormat(listNode.getFormatType());
  alphaList.setIndent(listNode.getIndent());
  alphaList.setDirection(listNode.getDirection());
  alphaList.append(...listNode.getChildren());
  listNode.replace(alphaList);
}

function replaceWithPlainList(listNode: ListNode, listType: PlainListType): void {
  if (!$isAlphaListNode(listNode) && listNode.getListType() === listType) {
    return;
  }

  const plainList = $createListNode(
    listType,
    listType === 'number' ? listNode.getStart() : 1,
  );
  plainList.setFormat(listNode.getFormatType());
  plainList.setIndent(listNode.getIndent());
  plainList.setDirection(listNode.getDirection());
  plainList.append(...listNode.getChildren());
  listNode.replace(plainList);
}

function insertAlphaList(editor: LexicalEditor): void {
  const hasAlphaListSelection = editor.getEditorState().read(() =>
    getSelectedListNodes().some($isAlphaListNode),
  );

  if (hasAlphaListSelection) {
    removeList(editor);
    return;
  }

  editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  editor.update(() => {
    getSelectedListNodes().forEach(replaceWithAlphaList);
  });
}

function normalizeSelectedAlphaLists(editor: LexicalEditor, listType: PlainListType): boolean {
  const hasAlphaListSelection = editor.getEditorState().read(() =>
    getSelectedListNodes().some($isAlphaListNode),
  );

  if (!hasAlphaListSelection) {
    return false;
  }

  editor.update(() => {
    getSelectedListNodes().forEach(listNode => replaceWithPlainList(listNode, listType));
  });
  return true;
}

/**
 * Inserts a list of the given type into the editor.
 */
export function insertList(editor: LexicalEditor, type: ListType): void {
  if (type === 'alpha') {
    insertAlphaList(editor);
  } else if (normalizeSelectedAlphaLists(editor, type)) {
    return;
  } else if (type === 'number') {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  } else {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  }
}

/**
 * Removes the current list formatting.
 */
export function removeList(editor: LexicalEditor): void {
  editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
}

/**
 * Indents the current selection.
 *
 * Paragraphs are rendered as first-line indents by the paragraph indent plugin,
 * while list items keep Lexical's native nesting behavior.
 */
export function indentContent(editor: LexicalEditor): void {
  editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
}

/**
 * Outdents the current selection.
 *
 * Paragraphs are rendered as first-line indents by the paragraph indent plugin,
 * while list items keep Lexical's native un-nesting behavior.
 */
export function outdentContent(editor: LexicalEditor): void {
  editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
}
