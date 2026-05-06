import { $createHeadingNode, HeadingNode } from '@lexical/rich-text';
import {
  $createNodeSelection,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isTextNode,
  $setSelection,
  createEditor,
} from 'lexical';
import { describe, expect, it } from 'vitest';
import { getActiveBlockType, setBlockType } from '../lexical/commands/block-commands';
import { $createVariableNode, VariableNode } from '../variables/variable-node';

function createTestEditor() {
  const editor = createEditor({
    namespace: 'block-commands-test',
    nodes: [HeadingNode, VariableNode],
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

  it('uses inline styles for a partial selection inside a heading', async () => {
    const editor = createTestEditor();

    editor.update(() => {
      const root = $getRoot();
      const heading = $createHeadingNode('h1');
      const text = $createTextNode('Heading tail');
      heading.append(text);
      root.append(heading);
      text.select(8, 12);
    }, { discrete: true });

    setBlockType(editor, 'paragraph');
    await Promise.resolve();

    editor.getEditorState().read(() => {
      const [node] = $getRoot().getChildren();
      expect(node.getType()).toBe('heading');
      const textNodes = node.getChildren().filter($isTextNode);
      const tailNode = textNodes.find(textNode => textNode.getTextContent() === 'tail');
      expect(tailNode?.getStyle()).toContain('--lex4-block-type: paragraph');
      expect(tailNode?.getStyle()).toContain('font-size: 12pt');
      expect(tailNode?.getStyle()).toContain('font-weight: 400');
    });
    expect(getActiveBlockType(editor)).toBe('paragraph');
  });

  it('keeps semantic block conversion for a full heading selection', async () => {
    const editor = createTestEditor();

    editor.update(() => {
      const root = $getRoot();
      const heading = $createHeadingNode('h1');
      const text = $createTextNode('Title');
      heading.append(text);
      root.append(heading);
      text.select(0, 5);
    }, { discrete: true });

    setBlockType(editor, 'paragraph');
    await Promise.resolve();

    editor.getEditorState().read(() => {
      const [node] = $getRoot().getChildren();
      expect(node.getType()).toBe('paragraph');
      const [textNode] = node.getChildren().filter($isTextNode);
      expect(textNode.getStyle()).toBe('');
    });
    expect(getActiveBlockType(editor)).toBe('paragraph');
  });

  it('converts a standalone selected variable block semantically', async () => {
    const editor = createTestEditor();

    editor.update(() => {
      const root = $getRoot();
      const paragraph = $createParagraphNode();
      const variable = $createVariableNode('customer.name');
      paragraph.append(variable);
      root.append(paragraph);

      const selection = $createNodeSelection();
      selection.add(variable.getKey());
      $setSelection(selection);
    }, { discrete: true });

    setBlockType(editor, 'h1');
    await Promise.resolve();

    editor.getEditorState().read(() => {
      const [node] = $getRoot().getChildren();
      expect(node.getType()).toBe('heading');
      const variable = node.getChildren()[0] as VariableNode;
      expect(variable.getStyle()).toContain('--lex4-block-type: h1');
      expect(variable.getStyle()).toContain('font-size: 22.5pt');
    });
    expect(getActiveBlockType(editor)).toBe('h1');
  });

  it('applies inline block styles to a selected variable inside surrounding text', async () => {
    const editor = createTestEditor();

    editor.update(() => {
      const root = $getRoot();
      const paragraph = $createParagraphNode();
      const variable = $createVariableNode('customer.name');
      paragraph.append($createTextNode('Hello '), variable, $createTextNode(' world'));
      root.append(paragraph);

      const selection = $createNodeSelection();
      selection.add(variable.getKey());
      $setSelection(selection);
    }, { discrete: true });

    setBlockType(editor, 'h1');
    await Promise.resolve();

    editor.getEditorState().read(() => {
      const [node] = $getRoot().getChildren();
      expect(node.getType()).toBe('paragraph');
      const variable = node.getChildren().find(child => child instanceof VariableNode) as VariableNode;
      expect(variable.getStyle()).toContain('--lex4-block-type: h1');
      expect(variable.getStyle()).toContain('font-size: 22.5pt');
      expect(variable.getStyle()).toContain('font-weight: 700');
    });
    expect(getActiveBlockType(editor)).toBe('h1');
  });

  it('styles a standalone variable block when the caret applies a semantic block type', async () => {
    const editor = createTestEditor();

    editor.update(() => {
      const root = $getRoot();
      const paragraph = $createParagraphNode();
      const variable = $createVariableNode('customer.name');
      paragraph.append(variable);
      root.append(paragraph);
      paragraph.selectStart();
    }, { discrete: true });

    setBlockType(editor, 'h1');
    await Promise.resolve();

    editor.getEditorState().read(() => {
      const [node] = $getRoot().getChildren();
      expect(node.getType()).toBe('heading');
      const variable = node.getChildren()[0] as VariableNode;
      expect(variable.getStyle()).toContain('--lex4-block-type: h1');
      expect(variable.getStyle()).toContain('font-size: 22.5pt');
      expect(variable.getStyle()).toContain('font-weight: 700');
    });
  });
});
