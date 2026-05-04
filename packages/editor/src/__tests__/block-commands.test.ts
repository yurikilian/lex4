import { HeadingNode } from '@lexical/rich-text';
import { $createParagraphNode, $createTextNode, $getRoot, createEditor } from 'lexical';
import { describe, expect, it } from 'vitest';
import { getActiveBlockType, setBlockType } from '../lexical/commands/block-commands';

function createTestEditor() {
  const editor = createEditor({
    namespace: 'block-commands-test',
    nodes: [HeadingNode],
    onError: (error) => {
      throw error;
    },
  });
  const rootElement = document.createElement('div');
  document.body.appendChild(rootElement);
  editor.setRootElement(rootElement);
  return editor;
}

describe('block-commands', () => {
  it('converts the selected block to h6', async () => {
    const editor = createTestEditor();

    editor.update(() => {
      const root = $getRoot();
      const paragraph = $createParagraphNode();
      const text = $createTextNode('Title');
      paragraph.append(text);
      root.append(paragraph);
      text.select();
    }, { discrete: true });

    setBlockType(editor, 'h6');
    await Promise.resolve();

    editor.getEditorState().read(() => {
      const [node] = $getRoot().getChildren();
      expect(node.getType()).toBe('heading');
    });
    expect(getActiveBlockType(editor)).toBe('h6');
  });

  it('returns paragraph when the selection is inside a paragraph', () => {
    const editor = createTestEditor();

    editor.update(() => {
      const root = $getRoot();
      const paragraph = $createParagraphNode();
      const text = $createTextNode('Body');
      paragraph.append(text);
      root.append(paragraph);
      text.select();
    }, { discrete: true });

    expect(getActiveBlockType(editor)).toBe('paragraph');
  });
});
