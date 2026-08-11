import {
  $applyNodeReplacement,
  TextNode,
  type NodeKey,
  type SerializedLexicalNode,
  type SerializedTextNode,
} from 'lexical';

const CARET_ANCHOR = '\u2060';

export interface SerializedVariableCaretNode extends SerializedTextNode {
  type: 'variable-caret';
  version: 1;
}

/**
 * Internal text anchor used to give the browser a stable DOM caret position
 * beside an inline, non-editable variable/optional segment.
 *
 * It serializes as a regular TextNode with the anchor stripped, so saved
 * documents never depend on this implementation detail.
 */
export class VariableCaretNode extends TextNode {
  static getType(): string {
    return 'variable-caret';
  }

  static clone(node: VariableCaretNode): VariableCaretNode {
    return new VariableCaretNode(node.__text, node.__key);
  }

  static importJSON(
    serializedNode: SerializedLexicalNode & Record<string, unknown>,
  ): VariableCaretNode {
    const text = typeof serializedNode.text === 'string' ? serializedNode.text : '';
    const node = $createVariableCaretNode();
    node.updateFromJSON(serializedNode as SerializedTextNode);
    node.setTextContent(`${CARET_ANCHOR}${text.replaceAll(CARET_ANCHOR, '')}`);
    return node;
  }

  constructor(text = '', key?: NodeKey) {
    super(`${CARET_ANCHOR}${text.replaceAll(CARET_ANCHOR, '')}`, key);
  }

  exportJSON(): SerializedVariableCaretNode {
    const serialized = super.exportJSON();
    return {
      ...serialized,
      type: 'variable-caret',
      version: 1,
      text: serialized.text.replaceAll(CARET_ANCHOR, ''),
    };
  }

  getAnchorOffset(): number {
    return this.getLatest().__text.indexOf(CARET_ANCHOR) + CARET_ANCHOR.length;
  }

  getTextWithoutAnchor(): string {
    return this.getLatest().__text.replaceAll(CARET_ANCHOR, '');
  }
}

export function $createVariableCaretNode(text = ''): VariableCaretNode {
  return $applyNodeReplacement(new VariableCaretNode(text));
}

export function $isVariableCaretNode(
  node: unknown,
): node is VariableCaretNode {
  return node instanceof VariableCaretNode;
}
