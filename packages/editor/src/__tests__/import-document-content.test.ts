import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { $createParagraphNode, $createTextNode, $getRoot, createEditor } from 'lexical';
import { describe, expect, it } from 'vitest';
import { insertDocumentContent } from '../lexical/utils/import-document-content';
import type { Lex4Document } from '../types/document';
import { VariableNode } from '../variables/variable-node';

function createTestEditor() {
  const editor = createEditor({
    namespace: 'import-document-content-test',
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, VariableNode],
    onError: (error) => {
      throw error;
    },
  });
  const rootElement = document.createElement('div');
  document.body.appendChild(rootElement);
  editor.setRootElement(rootElement);
  return editor;
}

describe('insertDocumentContent', () => {
  it('inserts serialized body content with headings and variables', async () => {
    const editor = createTestEditor();

    editor.update(() => {
      const root = $getRoot();
      const paragraph = $createParagraphNode();
      const text = $createTextNode('Before ');
      paragraph.append(text);
      root.append(paragraph);
      paragraph.selectEnd();
    }, { discrete: true });

    const document: Lex4Document = {
      headerFooterEnabled: false,
      pageCounterMode: 'none',
      defaultHeaderState: null,
      defaultFooterState: null,
      defaultHeaderHeight: 0,
      defaultFooterHeight: 0,
      pages: [
        {
          id: 'page-1',
          headerState: null,
          footerState: null,
          headerHeight: 0,
          footerHeight: 0,
          bodySyncVersion: 0,
          headerSyncVersion: 0,
          footerSyncVersion: 0,
          bodyState: {
            root: {
              type: 'root',
              format: '',
              indent: 0,
              version: 1,
              direction: null,
              children: [
                {
                  type: 'heading',
                  tag: 'h6',
                  format: 'center',
                  indent: 0,
                  version: 1,
                  direction: null,
                  children: [{ type: 'text', text: 'Inserted heading', format: 0, style: '', version: 1, detail: 0, mode: 'normal' }],
                },
                {
                  type: 'paragraph',
                  format: '',
                  indent: 0,
                  version: 1,
                  direction: null,
                  children: [
                    { type: 'text', text: 'Hello ', format: 0, style: '', version: 1, detail: 0, mode: 'normal' },
                    {
                      type: 'variable-node',
                      version: 1,
                      variableKey: 'customer.name',
                      format: 9,
                      style: 'font-family: Inter; font-size: 14pt',
                    },
                  ],
                },
              ],
            },
          },
        },
      ],
    };

    expect(insertDocumentContent(editor, document)).toBe(true);
    await Promise.resolve();

    const serialized = editor.getEditorState().toJSON();
    const children = serialized.root.children;

    expect(children).toHaveLength(3);
    expect(children[1]).toMatchObject({
      type: 'heading',
      tag: 'h6',
      format: 'center',
    });
    expect(children[2]).toMatchObject({
      type: 'paragraph',
      children: [
        { type: 'text', text: 'Hello ' },
        {
          type: 'variable-node',
          variableKey: 'customer.name',
          format: 9,
          style: 'font-family: Inter; font-size: 14pt',
        },
      ],
    });
  });

  it('returns false when the document has no body content', () => {
    const editor = createTestEditor();

    const document: Lex4Document = {
      headerFooterEnabled: false,
      pageCounterMode: 'none',
      defaultHeaderState: null,
      defaultFooterState: null,
      defaultHeaderHeight: 0,
      defaultFooterHeight: 0,
      pages: [],
    };

    expect(insertDocumentContent(editor, document)).toBe(false);
  });
});
