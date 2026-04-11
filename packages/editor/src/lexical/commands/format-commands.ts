import {
  FORMAT_TEXT_COMMAND,
  type LexicalEditor,
  type TextFormatType,
} from 'lexical';
import { FORMAT_ELEMENT_COMMAND, type ElementFormatType } from 'lexical';

/**
 * Dispatches a text formatting command to the given Lexical editor.
 */
export function toggleFormat(editor: LexicalEditor, format: TextFormatType): void {
  editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
}

export function toggleBold(editor: LexicalEditor): void {
  toggleFormat(editor, 'bold');
}

export function toggleItalic(editor: LexicalEditor): void {
  toggleFormat(editor, 'italic');
}

export function toggleUnderline(editor: LexicalEditor): void {
  toggleFormat(editor, 'underline');
}

export function toggleStrikethrough(editor: LexicalEditor): void {
  toggleFormat(editor, 'strikethrough');
}

/**
 * Dispatches an element alignment command.
 */
export function setAlignment(editor: LexicalEditor, alignment: ElementFormatType): void {
  editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
}
