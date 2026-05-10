import { ListNode, type SerializedListNode } from '@lexical/list';
import {
  $applyNodeReplacement,
  type EditorConfig,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type Spread,
} from 'lexical';

export type SerializedAlphaListNode = Spread<
  {
    markerStyle: 'alpha';
  },
  SerializedListNode
>;

function decorateAlphaListDom(dom: HTMLElement): void {
  dom.classList.add('lex4-list-alpha');
  dom.setAttribute('data-lex4-list-variant', 'alpha');
}

export class AlphaListNode extends ListNode {
  static getType(): string {
    return 'alpha-list';
  }

  static clone(node: AlphaListNode): AlphaListNode {
    return new AlphaListNode(node.getStart(), node.__key);
  }

  static importJSON(serializedNode: SerializedAlphaListNode): AlphaListNode {
    const node = $createAlphaListNode(
      typeof serializedNode.start === 'number' ? serializedNode.start : 1,
    );
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }

  constructor(start = 1, key?: NodeKey) {
    super('number', start, key);
  }

  createDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const dom = super.createDOM(config, editor);
    decorateAlphaListDom(dom);
    return dom;
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
    const replaced = super.updateDOM(prevNode, dom, config);
    if (replaced) {
      return true;
    }
    decorateAlphaListDom(dom);
    return false;
  }

  exportJSON(): SerializedAlphaListNode {
    return {
      ...super.exportJSON(),
      type: 'alpha-list',
      markerStyle: 'alpha',
    };
  }
}

export function $createAlphaListNode(start = 1): AlphaListNode {
  return $applyNodeReplacement(new AlphaListNode(start));
}

export function $isAlphaListNode(
  node: LexicalNode | null | undefined,
): node is AlphaListNode {
  return node instanceof AlphaListNode;
}
