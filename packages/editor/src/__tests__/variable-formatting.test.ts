import { $createNodeSelection, $createParagraphNode, $getRoot, $setSelection, createEditor } from 'lexical';
import { describe, expect, it } from 'vitest';
import {
  applyFontFamilyToSelectedVariables,
  applyFontSizeToSelectedVariables,
  getSelectedVariableNodes,
  readSelectedVariableFormatting,
  toggleSelectedVariableFormat,
} from '../variables/variable-formatting';
import { $createVariableNode, VariableNode } from '../variables/variable-node';

function createTestEditor() {
  const editor = createEditor({
    namespace: 'variable-formatting-test',
    nodes: [VariableNode],
    onError: (error) => {
      throw error;
    },
  });
  const rootElement = document.createElement('div');
  document.body.appendChild(rootElement);
  editor.setRootElement(rootElement);
  return editor;
}

describe('variable-formatting', () => {
  it('reads and updates formatting for selected variable nodes', async () => {
    const editor = createTestEditor();

    editor.update(() => {
      const root = $getRoot();
      const paragraph = $createParagraphNode();
      const variableNode = $createVariableNode('customer.name');
      paragraph.append(variableNode);
      root.append(paragraph);

      const selection = $createNodeSelection();
      selection.add(variableNode.getKey());
      $setSelection(selection);
    }, { discrete: true });

    await Promise.resolve();

    expect(getSelectedVariableNodes(editor)).toHaveLength(1);
    expect(toggleSelectedVariableFormat(editor, 'bold')).toBe(true);
    expect(applyFontFamilyToSelectedVariables(editor, 'Inter')).toBe(true);
    expect(applyFontSizeToSelectedVariables(editor, 14)).toBe(true);

    await Promise.resolve();

    editor.getEditorState().read(() => {
      const [selectedVariable] = getSelectedVariableNodes(editor);
      expect(selectedVariable.getFormat()).toBe(1);
      expect(selectedVariable.getStyle()).toContain('font-family: Inter');
      expect(selectedVariable.getStyle()).toContain('font-size: 14pt');
      expect(readSelectedVariableFormatting(editor)).toEqual({
        fontFamily: 'Inter',
        fontSize: 14,
      });
    });
  });

  it('returns false when there is no selected variable node', () => {
    const editor = createTestEditor();

    expect(toggleSelectedVariableFormat(editor, 'bold')).toBe(false);
    expect(applyFontFamilyToSelectedVariables(editor, 'Inter')).toBe(false);
    expect(applyFontSizeToSelectedVariables(editor, 14)).toBe(false);
    expect(readSelectedVariableFormatting(editor)).toEqual({});
  });
});
