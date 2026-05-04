import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  $insertNodes,
  type LexicalEditor,
  type LexicalNode,
  type SerializedEditorState,
} from 'lexical';
import {
  $createHeadingNode,
  $createQuoteNode,
  type HeadingTagType,
} from '@lexical/rich-text';
import { $createListItemNode, $createListNode } from '@lexical/list';
import type { Lex4Document } from '../../types/document';
import { $createVariableNode } from '../../variables/variable-node';

interface SerializedLexicalBaseNode {
  type: string;
  children?: SerializedLexicalBaseNode[];
  format?: number | string;
  indent?: number;
  listType?: string;
  start?: number;
  text?: string;
  style?: string;
  variableKey?: string;
  [key: string]: unknown;
}

function appendChildren(
  parent: LexicalNode & { append: (...nodes: LexicalNode[]) => void },
  children: SerializedLexicalBaseNode[] = [],
): void {
  const nodes = children
    .map(buildLexicalNode)
    .filter((node): node is LexicalNode => node !== null);

  if (nodes.length > 0) {
    parent.append(...nodes);
  }
}

function applyElementFormatting(
  node: LexicalNode & { setFormat?: (format: 'left' | 'center' | 'right' | 'justify') => void; setIndent?: (indent: number) => void },
  serializedNode: SerializedLexicalBaseNode,
): void {
  if (
    typeof serializedNode.format === 'string'
    && ['left', 'center', 'right', 'justify'].includes(serializedNode.format)
    && node.setFormat
  ) {
    node.setFormat(serializedNode.format as 'left' | 'center' | 'right' | 'justify');
  }

  if (typeof serializedNode.indent === 'number' && serializedNode.indent > 0 && node.setIndent) {
    node.setIndent(serializedNode.indent);
  }
}

function buildLexicalNode(serializedNode: SerializedLexicalBaseNode): LexicalNode | null {
  switch (serializedNode.type) {
    case 'paragraph': {
      const node = $createParagraphNode();
      applyElementFormatting(node, serializedNode);
      appendChildren(node, serializedNode.children);
      return node;
    }
    case 'heading': {
      const tag = typeof serializedNode.tag === 'string'
        && /^h[1-6]$/.test(serializedNode.tag)
        ? serializedNode.tag as HeadingTagType
        : 'h1';
      const node = $createHeadingNode(tag);
      applyElementFormatting(node, serializedNode);
      appendChildren(node, serializedNode.children);
      return node;
    }
    case 'quote': {
      const node = $createQuoteNode();
      applyElementFormatting(node, serializedNode);
      appendChildren(node, serializedNode.children);
      return node;
    }
    case 'list': {
      const listType = serializedNode.listType === 'number' ? 'number' : 'bullet';
      const node = $createListNode(listType, typeof serializedNode.start === 'number' ? serializedNode.start : 1);
      appendChildren(node, serializedNode.children);
      return node;
    }
    case 'listitem': {
      const node = $createListItemNode();
      appendChildren(node, serializedNode.children);
      return node;
    }
    case 'text': {
      const node = $createTextNode(serializedNode.text ?? '');
      if (typeof serializedNode.format === 'number' && serializedNode.format > 0) {
        node.setFormat(serializedNode.format);
      }
      if (typeof serializedNode.style === 'string' && serializedNode.style.trim() !== '') {
        node.setStyle(serializedNode.style);
      }
      return node;
    }
    case 'linebreak':
      return $createLineBreakNode();
    case 'variable-node':
      return $createVariableNode(
        serializedNode.variableKey ?? '',
        typeof serializedNode.format === 'number' ? serializedNode.format : 0,
        typeof serializedNode.style === 'string' ? serializedNode.style : '',
      );
    default:
      return null;
  }
}

function getBodyChildren(pageState: SerializedEditorState | null): SerializedLexicalBaseNode[] {
  const root = pageState?.root as { children?: SerializedLexicalBaseNode[] } | undefined;
  return root?.children ?? [];
}

export function insertDocumentContent(editor: LexicalEditor, document: Lex4Document): boolean {
  let inserted = false;

  editor.update(() => {
    const nodes = document.pages.flatMap((page) => getBodyChildren(page.bodyState))
      .map(buildLexicalNode)
      .filter((node): node is LexicalNode => node !== null);

    if (nodes.length === 0) {
      return;
    }

    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      if (selection.isCollapsed()) {
        selection.insertParagraph();
      }

      const nextSelection = $getSelection();
      if ($isRangeSelection(nextSelection) || $isNodeSelection(nextSelection)) {
        nextSelection.insertNodes(nodes);
      } else {
        $insertNodes(nodes);
      }
    } else if ($isNodeSelection(selection)) {
      selection.insertNodes(nodes);
    } else {
      $insertNodes(nodes);
    }
    inserted = true;
  });

  return inserted;
}
