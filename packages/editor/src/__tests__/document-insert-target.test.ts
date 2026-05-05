import { describe, expect, it } from 'vitest';
import type { LexicalEditor } from 'lexical';
import { resolveDocumentInsertTarget } from '../utils/document-insert-target';

function createEditorRegistry(editors: Record<string, LexicalEditor>) {
  return {
    register: () => {},
    unregister: () => {},
    get: (pageId: string) => editors[pageId],
    all: () => Object.values(editors),
  };
}

describe('resolveDocumentInsertTarget', () => {
  it('keeps the active body editor when the caret is already in the body', () => {
    const activeEditor = { id: 'active' } as unknown as LexicalEditor;

    const target = resolveDocumentInsertTarget({
      activeEditor,
      activeCaretPosition: { pageId: 'page-1', region: 'body' },
      activePageId: 'page-1',
      editorRegistry: createEditorRegistry({ 'page-1': activeEditor }),
    });

    expect(target).toBe(activeEditor);
  });

  it('falls back to the active page body editor when the active region is not the body', () => {
    const headerEditor = { id: 'header' } as unknown as LexicalEditor;
    const bodyEditor = { id: 'body' } as unknown as LexicalEditor;

    const target = resolveDocumentInsertTarget({
      activeEditor: headerEditor,
      activeCaretPosition: { pageId: 'page-1', region: 'header' },
      activePageId: 'page-1',
      editorRegistry: createEditorRegistry({ 'page-1': bodyEditor }),
    });

    expect(target).toBe(bodyEditor);
  });

  it('falls back to the first registered body editor when there is no active page yet', () => {
    const fallbackEditor = { id: 'fallback' } as unknown as LexicalEditor;

    const target = resolveDocumentInsertTarget({
      activeEditor: null,
      activeCaretPosition: null,
      activePageId: null,
      editorRegistry: createEditorRegistry({ 'page-1': fallbackEditor }),
    });

    expect(target).toBe(fallbackEditor);
  });
});
