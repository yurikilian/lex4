import {
  $createNodeSelection,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  $setSelection,
  createEditor,
} from 'lexical';
import { describe, expect, it } from 'vitest';
import { $createOptionalSegmentNode, OptionalSegmentNode } from '../variables/optional-segment-node';
import { $createVariableNode, VariableNode } from '../variables/variable-node';
import { VariableCaretNode } from '../variables/variable-caret-node';
import { $handleVariableArrowNavigation } from '../variables/variable-navigation';

function createTestEditor() {
  return createEditor({
    namespace: 'variable-navigation-test',
    nodes: [VariableNode, VariableCaretNode, OptionalSegmentNode],
    onError: (error) => {
      throw error;
    },
  });
}

describe('$handleVariableArrowNavigation', () => {
  it('moves right from a selected edge variable to after its optional segment', () => {
    const editor = createTestEditor();

    editor.update(() => {
      const paragraph = $createParagraphNode();
      const prefix = $createTextNode('Hello ');
      const segment = $createOptionalSegmentNode();
      const variable = $createVariableNode('customer.name');
      segment.append(variable);
      paragraph.append(prefix, segment);
      $getRoot().append(paragraph);

      const nodeSelection = $createNodeSelection();
      nodeSelection.add(variable.getKey());
      $setSelection(nodeSelection);

      expect($handleVariableArrowNavigation('next')).toBe(true);
      const selection = $getSelection();
      expect($isRangeSelection(selection)).toBe(true);
      if ($isRangeSelection(selection)) {
        expect(selection.anchor.type).toBe('text');
        expect(selection.anchor.offset).toBe(1);
        expect(selection.anchor.getNode().getType()).toBe('variable-caret');
        expect(selection.anchor.getNode().exportJSON()).toMatchObject({
          type: 'variable-caret',
          text: '',
        });
      }
    }, { discrete: true });
  });

  it('selects an adjacent variable as one atomic keyboard stop', () => {
    const editor = createTestEditor();

    editor.update(() => {
      const paragraph = $createParagraphNode();
      const variable = $createVariableNode('customer.name');
      const suffix = $createTextNode(' after');
      paragraph.append(variable, suffix);
      $getRoot().append(paragraph);
      suffix.select(0, 0);

      expect($handleVariableArrowNavigation('previous')).toBe(true);
      const selection = $getSelection();
      expect($isNodeSelection(selection)).toBe(true);
      if ($isNodeSelection(selection)) {
        expect(selection.has(variable.getKey())).toBe(true);
      }
    }, { discrete: true });
  });
});
