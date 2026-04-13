import {
  createCommand,
  type LexicalEditor,
} from 'lexical';

/**
 * Command to insert a variable node at the current selection.
 * Payload is the variable key string (e.g. "customer.name").
 */
export const INSERT_VARIABLE_COMMAND = createCommand<string>('INSERT_VARIABLE');

/**
 * Inserts a variable node at the current cursor position.
 */
export function insertVariable(editor: LexicalEditor, variableKey: string): void {
  editor.dispatchCommand(INSERT_VARIABLE_COMMAND, variableKey);
}
