import { $createParagraphNode, $createTextNode, $getRoot, $isTextNode, createEditor } from 'lexical';
import { ListItemNode, ListNode, registerList } from '@lexical/list';
import { describe, expect, it } from 'vitest';
import { readToolbarStyleSnapshot } from '../context/toolbar-style-snapshot';
import { insertList } from '../lexical/commands/list-commands';
import { AlphaListNode } from '../lexical/nodes/alpha-list-node';

function createTestEditor() {
  const editor = createEditor({
    namespace: 'alpha-list-test',
    nodes: [ListNode, ListItemNode, AlphaListNode],
    onError: (error) => {
      throw error;
    },
  });
  const rootElement = document.createElement('div');
  document.body.appendChild(rootElement);
  editor.setRootElement(rootElement);
  registerList(editor);
  return { editor, rootElement };
}

function seedParagraph(editor: ReturnType<typeof createEditor>, text: string) {
  editor.update(() => {
    const root = $getRoot();
    const paragraph = $createParagraphNode();
    const textNode = $createTextNode(text);
    paragraph.append(textNode);
    root.append(paragraph);
    textNode.select();
  }, { discrete: true });
}

function selectFirstText(editor: ReturnType<typeof createEditor>) {
  editor.update(() => {
    const firstText = $getRoot().getFirstDescendant();
    if ($isTextNode(firstText)) {
      firstText.select();
    }
  }, { discrete: true });
}

describe('alpha list behavior', () => {
  it('creates an alphabetic list with alpha DOM markers', async () => {
    const { editor, rootElement } = createTestEditor();
    seedParagraph(editor, 'Alpha item');

    insertList(editor, 'alpha');
    await Promise.resolve();

    const serialized = editor.getEditorState().toJSON();
    expect(serialized.root.children[0]).toMatchObject({
      type: 'alpha-list',
      listType: 'number',
      markerStyle: 'alpha',
      tag: 'ol',
    });

    const domList = rootElement.querySelector('ol');
    expect(domList?.getAttribute('data-lex4-list-variant')).toBe('alpha');
    expect(domList?.classList.contains('lex4-list-alpha')).toBe(true);
  });

  it('toggles an alphabetic list off on second insert', async () => {
    const { editor } = createTestEditor();
    seedParagraph(editor, 'Toggle me');

    insertList(editor, 'alpha');
    await Promise.resolve();
    selectFirstText(editor);

    insertList(editor, 'alpha');
    await Promise.resolve();

    expect(editor.getEditorState().toJSON().root.children[0]).toMatchObject({
      type: 'paragraph',
      children: [{ type: 'text', text: 'Toggle me' }],
    });
  });

  it('converts an alphabetic list back to a plain ordered list', async () => {
    const { editor, rootElement } = createTestEditor();
    seedParagraph(editor, 'Ordered item');

    insertList(editor, 'alpha');
    await Promise.resolve();
    selectFirstText(editor);

    insertList(editor, 'number');
    await Promise.resolve();

    const serialized = editor.getEditorState().toJSON();
    expect(serialized.root.children[0]).toMatchObject({
      type: 'list',
      listType: 'number',
      tag: 'ol',
    });
    expect(serialized.root.children[0]).not.toHaveProperty('markerStyle');

    const domList = rootElement.querySelector('ol');
    expect(domList?.getAttribute('data-lex4-list-variant')).toBeNull();
    expect(domList?.classList.contains('lex4-list-alpha')).toBe(false);
  });

  it('converts an alphabetic list to a plain bullet list', async () => {
    const { editor, rootElement } = createTestEditor();
    seedParagraph(editor, 'Bullet item');

    insertList(editor, 'alpha');
    await Promise.resolve();
    selectFirstText(editor);

    insertList(editor, 'bullet');
    await Promise.resolve();

    const serialized = editor.getEditorState().toJSON();
    expect(serialized.root.children[0]).toMatchObject({
      type: 'list',
      listType: 'bullet',
      tag: 'ul',
    });
    expect(serialized.root.children[0]).not.toHaveProperty('markerStyle');

    const domList = rootElement.querySelector('ul');
    expect(domList?.getAttribute('data-lex4-list-variant')).toBeNull();
    expect(domList?.classList.contains('lex4-list-alpha')).toBe(false);
  });

  it('round-trips alpha list JSON through parseEditorState', async () => {
    const { editor } = createTestEditor();
    seedParagraph(editor, 'Round trip');

    insertList(editor, 'alpha');
    await Promise.resolve();

    const serialized = editor.getEditorState().toJSON();
    const parsed = editor.parseEditorState(JSON.stringify(serialized));
    editor.setEditorState(parsed);
    await Promise.resolve();

    expect(editor.getEditorState().toJSON()).toEqual(serialized);
  });

  it('reports the active list type from the live editor selection', async () => {
    const { editor } = createTestEditor();
    seedParagraph(editor, 'Active list');

    insertList(editor, 'number');
    await Promise.resolve();
    expect(readToolbarStyleSnapshot(editor).activeList).toBe('number');

    insertList(editor, 'alpha');
    await Promise.resolve();
    expect(readToolbarStyleSnapshot(editor).activeList).toBe('alpha');
  });
});
