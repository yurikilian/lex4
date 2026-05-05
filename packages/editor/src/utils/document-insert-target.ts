import type { LexicalEditor } from 'lexical';
import type { EditorRegistry } from '../context/document-context';
import type { CaretPosition } from '../types/history';

interface ResolveDocumentInsertTargetOptions {
  activeEditor: LexicalEditor | null;
  activeCaretPosition: CaretPosition | null;
  activePageId: string | null;
  editorRegistry: EditorRegistry;
}

export function resolveDocumentInsertTarget({
  activeEditor,
  activeCaretPosition,
  activePageId,
  editorRegistry,
}: ResolveDocumentInsertTargetOptions): LexicalEditor | null {
  if (activeEditor && activeCaretPosition?.region === 'body') {
    return activeEditor;
  }

  if (activePageId) {
    return editorRegistry.get(activePageId) ?? null;
  }

  return editorRegistry.all()[0] ?? null;
}
