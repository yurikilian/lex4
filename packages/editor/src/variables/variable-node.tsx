import {
  $applyNodeReplacement,
  DecoratorNode,
  type DOMConversionMap,
  type DOMExportOutput,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical';
import { useVariables } from './variable-context';

export type SerializedVariableNode = Spread<
  { variableKey: string },
  SerializedLexicalNode
>;

/**
 * VariableNode — a custom Lexical DecoratorNode that represents
 * a document variable/placeholder (e.g. "customer.name").
 *
 * Variables are atomic, non-editable inline tokens that:
 * - Display as styled chips in the editor
 * - Serialize to a structured node in JSON (not plain text)
 * - Participate in copy/paste, undo/redo, and overflow
 * - Return {{key}} as text content for clipboard
 */
export class VariableNode extends DecoratorNode<JSX.Element> {
  __variableKey: string;

  static getType(): string {
    return 'variable-node';
  }

  static clone(node: VariableNode): VariableNode {
    return new VariableNode(node.__variableKey, node.__key);
  }

  constructor(variableKey: string, key?: NodeKey) {
    super(key);
    this.__variableKey = variableKey;
  }

  getVariableKey(): string {
    return this.__variableKey;
  }

  // -- Serialization --

  static importJSON(serializedNode: SerializedVariableNode): VariableNode {
    return $createVariableNode(serializedNode.variableKey);
  }

  exportJSON(): SerializedVariableNode {
    return {
      type: 'variable-node',
      version: 1,
      variableKey: this.__variableKey,
    };
  }

  // -- DOM --

  createDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'lex4-variable';
    span.setAttribute('data-variable-key', this.__variableKey);
    span.setAttribute('data-testid', `variable-${this.__variableKey}`);
    span.contentEditable = 'false';
    return span;
  }

  updateDOM(): false {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const span = document.createElement('span');
    span.setAttribute('data-variable-key', this.__variableKey);
    span.textContent = `{{${this.__variableKey}}}`;
    return { element: span };
  }

  static importDOM(): DOMConversionMap | null {
    return null;
  }

  // -- Behavior --

  isInline(): boolean {
    return true;
  }

  isKeyboardSelectable(): boolean {
    return true;
  }

  getTextContent(): string {
    return `{{${this.__variableKey}}}`;
  }

  // -- Rendering --

  decorate(): JSX.Element {
    return (
      <VariableChip variableKey={this.__variableKey} />
    );
  }
}

function VariableChip({ variableKey }: { variableKey: string }): JSX.Element {
  const { getDefinition } = useVariables();
  const def = getDefinition(variableKey);
  const label = def?.label ?? variableKey;
  const group = def?.group;

  return (
    <span
      className="lex4-variable-chip"
      data-testid={`variable-chip-${variableKey}`}
      data-variable-group={group}
      title={variableKey}
    >
      {label}
    </span>
  );
}

export function $createVariableNode(variableKey: string): VariableNode {
  return $applyNodeReplacement(new VariableNode(variableKey));
}

export function $isVariableNode(
  node: LexicalNode | null | undefined,
): node is VariableNode {
  return node instanceof VariableNode;
}
