import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import { INDENT_CONTENT_COMMAND, OUTDENT_CONTENT_COMMAND, type LexicalEditor } from 'lexical';

export type ListType = 'number' | 'bullet';

/**
 * Inserts a list of the given type into the editor.
 */
export function insertList(editor: LexicalEditor, type: ListType): void {
  if (type === 'number') {
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
 * Indents the current selection (used for list nesting).
 * Maps to Tab key behavior.
 */
export function indentContent(editor: LexicalEditor): void {
  editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
}

/**
 * Outdents the current selection (used for list un-nesting).
 * Maps to Shift+Tab key behavior.
 */
export function outdentContent(editor: LexicalEditor): void {
  editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
}
