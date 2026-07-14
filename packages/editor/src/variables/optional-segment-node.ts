import {
  $applyNodeReplacement,
  $isRangeSelection,
  ElementNode,
  type BaseSelection,
  type DOMConversionMap,
  type DOMExportOutput,
  type LexicalNode,
  type NodeKey,
  type RangeSelection,
  type SerializedElementNode,
} from 'lexical';

export type SerializedOptionalSegmentNode = SerializedElementNode;

/**
 * OptionalSegmentNode — an inline ElementNode that groups text and
 * variable chips into a conditional fragment.
 *
 * At generation time the whole segment (including its punctuation) is
 * dropped when any variable inside it resolves to an empty value;
 * otherwise its children render normally.
 *
 * Behaves like LinkNode: editable children, inline, cannot be empty.
 */
export class OptionalSegmentNode extends ElementNode {
  static getType(): string {
    return 'optional-segment';
  }

  static clone(node: OptionalSegmentNode): OptionalSegmentNode {
    return new OptionalSegmentNode(node.__key);
  }

  constructor(key?: NodeKey) {
    super(key);
  }

  // -- Serialization --

  static importJSON(serializedNode: SerializedOptionalSegmentNode): OptionalSegmentNode {
    const node = $createOptionalSegmentNode();
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }

  exportJSON(): SerializedOptionalSegmentNode {
    return {
      ...super.exportJSON(),
      type: 'optional-segment',
      version: 1,
    };
  }

  // -- DOM --

  createDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'lex4-optional-segment';
    span.setAttribute('data-lex4-optional-segment', 'true');
    span.setAttribute('data-testid', 'optional-segment');
    return span;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const span = document.createElement('span');
    span.setAttribute('data-lex4-optional-segment', 'true');
    return { element: span };
  }

  static importDOM(): DOMConversionMap | null {
    return null;
  }

  // -- Behavior --

  isInline(): true {
    return true;
  }

  canBeEmpty(): false {
    return false;
  }

  canInsertTextBefore(): false {
    return false;
  }

  canInsertTextAfter(): false {
    return false;
  }

  insertNewAfter(_: RangeSelection, restoreSelection = true): null | ElementNode {
    const segment = $createOptionalSegmentNode();
    this.insertAfter(segment, restoreSelection);
    return segment;
  }

  extractWithChild(
    _child: LexicalNode,
    selection: BaseSelection,
    _destination: 'clone' | 'html',
  ): boolean {
    if (!$isRangeSelection(selection)) {
      return false;
    }

    const anchorNode = selection.anchor.getNode();
    const focusNode = selection.focus.getNode();

    return (
      this.isParentOf(anchorNode)
      && this.isParentOf(focusNode)
      && selection.getTextContent().length > 0
    );
  }
}

export function $createOptionalSegmentNode(): OptionalSegmentNode {
  return $applyNodeReplacement(new OptionalSegmentNode());
}

export function $isOptionalSegmentNode(
  node: LexicalNode | null | undefined,
): node is OptionalSegmentNode {
  return node instanceof OptionalSegmentNode;
}
