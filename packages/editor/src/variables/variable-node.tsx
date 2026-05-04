import {
  $applyNodeReplacement,
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  DecoratorNode,
  type DOMConversionMap,
  type DOMExportOutput,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical';
import {
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { useCallback, useEffect, useMemo, type MouseEvent } from 'react';
import { useVariables } from './variable-context';
import {
  extractFontFamilyFromStyle,
  extractFontSizePtFromStyle,
} from '../utils/text-style';

export type SerializedVariableNode = Spread<
  {
    variableKey: string;
    format?: number;
    style?: string;
  },
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
  __format: number;
  __style: string;

  static getType(): string {
    return 'variable-node';
  }

  static clone(node: VariableNode): VariableNode {
    return new VariableNode(node.__variableKey, node.__format, node.__style, node.__key);
  }

  constructor(variableKey: string, format = 0, style = '', key?: NodeKey) {
    super(key);
    this.__variableKey = variableKey;
    this.__format = format;
    this.__style = style;
  }

  getVariableKey(): string {
    return this.getLatest().__variableKey;
  }

  getFormat(): number {
    return this.getLatest().__format;
  }

  setFormat(format: number): this {
    const writable = this.getWritable();
    writable.__format = format;
    return writable;
  }

  getStyle(): string {
    return this.getLatest().__style;
  }

  setStyle(style: string): this {
    const writable = this.getWritable();
    writable.__style = style;
    return writable;
  }

  // -- Serialization --

  static importJSON(serializedNode: SerializedVariableNode): VariableNode {
    return $createVariableNode(
      serializedNode.variableKey,
      serializedNode.format ?? 0,
      serializedNode.style ?? '',
    );
  }

  exportJSON(): SerializedVariableNode {
    return {
      type: 'variable-node',
      version: 1,
      variableKey: this.__variableKey,
      format: this.__format,
      style: this.__style,
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
      <VariableChip
        nodeKey={this.__key}
        variableKey={this.__variableKey}
        format={this.__format}
        styleValue={this.__style}
      />
    );
  }
}

function VariableChip({
  nodeKey,
  variableKey,
  format,
  styleValue,
}: {
  nodeKey: NodeKey;
  variableKey: string;
  format: number;
  styleValue: string;
}): JSX.Element {
  const { getDefinition } = useVariables();
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearOtherSelections] = useLexicalNodeSelection(nodeKey);
  const def = getDefinition(variableKey);
  const label = def?.label ?? variableKey;
  const group = def?.group;
  const style = useMemo(() => {
    const fontFamily = extractFontFamilyFromStyle(styleValue);
    const fontSize = extractFontSizePtFromStyle(styleValue);
    return {
      ...(fontFamily ? { fontFamily } : {}),
      ...(fontSize ? { fontSize: `${fontSize}pt` } : {}),
    };
  }, [styleValue]);
  const className = [
    'lex4-variable-chip',
    isSelected && 'lex4-variable-chip-selected',
    format & 1 ? 'lex4-text-bold' : '',
    format & 2 ? 'lex4-text-italic' : '',
    format & 8 ? 'lex4-text-underline' : '',
    format & 4 ? 'lex4-text-strikethrough' : '',
  ].filter(Boolean).join(' ');

  const handleClick = useCallback((event: MouseEvent<HTMLSpanElement>) => {
    event.preventDefault();

    if (!event.shiftKey) {
      clearOtherSelections();
    }

    setSelected(!isSelected);
  }, [clearOtherSelections, isSelected, setSelected]);

  useEffect(() => {
    const removeSelectedNodes = () => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isNodeSelection(selection)) {
          const node = $getNodeByKey(nodeKey);
          if ($isVariableNode(node)) {
            node.remove();
          }
          return;
        }

        for (const node of selection.getNodes()) {
          if ($isVariableNode(node)) {
            node.remove();
          }
        }
      });
    };

    const unregisterBackspace = editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      () => {
        if (!isSelected) {
          return false;
        }
        removeSelectedNodes();
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );

    const unregisterDelete = editor.registerCommand(
      KEY_DELETE_COMMAND,
      () => {
        if (!isSelected) {
          return false;
        }
        removeSelectedNodes();
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );

    return () => {
      unregisterBackspace();
      unregisterDelete();
    };
  }, [editor, isSelected, nodeKey]);

  return (
    <span
      className={className}
      data-testid={`variable-chip-${variableKey}`}
      data-variable-group={group}
      title={variableKey}
      style={style}
      onMouseDown={(event) => event.preventDefault()}
      onClick={handleClick}
    >
      {label}
    </span>
  );
}

export function $createVariableNode(
  variableKey: string,
  format = 0,
  style = '',
): VariableNode {
  return $applyNodeReplacement(new VariableNode(variableKey, format, style));
}

export function $isVariableNode(
  node: LexicalNode | null | undefined,
): node is VariableNode {
  return node instanceof VariableNode;
}
