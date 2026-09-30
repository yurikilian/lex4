import {
  $createNodeSelection,
  $createParagraphNode,
  $createRangeSelectionFromDom,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  $setSelection,
  createEditor,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { afterEach, describe, expect, it } from 'vitest';
import { $createOptionalSegmentNode, OptionalSegmentNode } from '../variables/optional-segment-node';
import { $createVariableNode, VariableNode } from '../variables/variable-node';
import { VariableCaretNode } from '../variables/variable-caret-node';
import {
  $createNavigationSelectionFromDom,
  $handleVariableArrowNavigation,
  registerTrailingVariableCaret,
} from '../variables/variable-navigation';

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

  describe('with the caret read from the DOM', () => {
    afterEach(() => {
      window.getSelection()?.removeAllRanges();
      document.body.innerHTML = '';
    });

    function mountTrailingVariableParagraph() {
      const editor = createTestEditor();
      const rootElement = document.createElement('div');
      rootElement.contentEditable = 'true';
      document.body.append(rootElement);
      editor.setRootElement(rootElement);

      let variableKey = '';
      let paragraphKey = '';
      let segmentKey = '';
      editor.update(() => {
        const paragraph = $createParagraphNode();
        const segment = $createOptionalSegmentNode();
        const variable = $createVariableNode('customer.name');
        segment.append($createTextNode(', '), variable);
        paragraph.append($createTextNode('Customer'), segment);
        $getRoot().append(paragraph);
        variableKey = variable.getKey();
        paragraphKey = paragraph.getKey();
        segmentKey = segment.getKey();
      }, { discrete: true });

      const paragraphElement = editor.getElementByKey(paragraphKey);
      if (paragraphElement === null) {
        throw new Error('paragraph was not rendered');
      }
      return { editor, paragraphElement, variableKey, segmentKey };
    }

    it('selects a trailing variable on ArrowLeft from the paragraph end', () => {
      const { editor, paragraphElement, variableKey } = mountTrailingVariableParagraph();
      // Where Linux Chromium puts the caret after End: after the optional
      // segment span, which ends with the variable chip.
      const domSelection = window.getSelection()!;
      domSelection.collapse(paragraphElement, paragraphElement.childNodes.length);

      editor.update(() => {
        const selection = $createNavigationSelectionFromDom(domSelection, editor);
        expect(selection).not.toBeNull();
        $setSelection(selection);

        expect($handleVariableArrowNavigation('previous')).toBe(true);
        const nodeSelection = $getSelection();
        expect($isNodeSelection(nodeSelection)).toBe(true);
        if ($isNodeSelection(nodeSelection)) {
          expect(nodeSelection.has(variableKey)).toBe(true);
        }
      }, { discrete: true });
    });

    it('keeps the selection read on a selection change after a trailing variable', () => {
      const { editor, paragraphElement, segmentKey } = mountTrailingVariableParagraph();
      registerTrailingVariableCaret(editor);
      const domSelection = window.getSelection()!;
      domSelection.collapse(paragraphElement, paragraphElement.childNodes.length);

      editor.update(() => {
        $setSelection($createRangeSelectionFromDom(domSelection, editor));
        editor.dispatchCommand(SELECTION_CHANGE_COMMAND, undefined);

        const selection = $getSelection();
        expect($isRangeSelection(selection)).toBe(true);
        if ($isRangeSelection(selection)) {
          expect(selection.anchor.key).toBe(segmentKey);
          expect(selection.anchor.offset).toBe(2);
          expect(selection.focus.offset).toBe(2);
        }
      }, { discrete: true });
    });

    it('leaves the optional segment on ArrowRight from the paragraph end', () => {
      const { editor, paragraphElement } = mountTrailingVariableParagraph();
      const domSelection = window.getSelection()!;
      domSelection.collapse(paragraphElement, paragraphElement.childNodes.length);

      editor.update(() => {
        const selection = $createNavigationSelectionFromDom(domSelection, editor);
        expect(selection).not.toBeNull();
        $setSelection(selection);

        expect($handleVariableArrowNavigation('next')).toBe(true);
        const rangeSelection = $getSelection();
        expect($isRangeSelection(rangeSelection)).toBe(true);
        if ($isRangeSelection(rangeSelection)) {
          const caret = rangeSelection.anchor.getNode();
          expect(caret.getType()).toBe('variable-caret');
          expect(caret.getParent()?.getType()).toBe('paragraph');
          expect(caret.getPreviousSibling()?.getType()).toBe('optional-segment');
        }
      }, { discrete: true });
    });
  });
});
