/**
 * Block mapper — Converts Lexical serialized block nodes to AST block nodes.
 *
 * Handles:
 * - ParagraphNode → ParagraphAst
 * - HeadingNode → HeadingAst
 * - ListNode → ListAst
 * - ListItemNode → ListItemAst (with nested list support)
 * - QuoteNode → BlockQuoteAst
 */

import type {
  BlockNodeAst,
  ParagraphAst,
  HeadingAst,
  ListAst,
  ListItemAst,
  BlockQuoteAst,
  Alignment,
  InlineNodeAst,
} from './types';
import { mapInlineNodes } from './inline-mapper';

// Lexical format bitmask for element alignment
const ALIGN_LEFT = 1;
const ALIGN_CENTER = 2;
const ALIGN_RIGHT = 3;
const ALIGN_JUSTIFY = 4;

/** Generic serialized Lexical element node shape. */
interface SerializedElementNode {
  type: string;
  children?: SerializedElementNode[];
  format?: number | string;
  indent?: number;
  direction?: string;
  tag?: string;
  listType?: string;
  start?: number;
  value?: number;
  [key: string]: unknown;
}

function decodeAlignment(format: number | string | undefined): Alignment | undefined {
  if (typeof format === 'string') {
    if (['left', 'center', 'right', 'justify'].includes(format)) {
      return format as Alignment;
    }
    return undefined;
  }
  if (typeof format !== 'number' || format === 0) return undefined;
  switch (format) {
    case ALIGN_LEFT: return 'left';
    case ALIGN_CENTER: return 'center';
    case ALIGN_RIGHT: return 'right';
    case ALIGN_JUSTIFY: return 'justify';
    default: return undefined;
  }
}

/**
 * Maps a single serialized Lexical block node to an AST block node.
 */
export function mapBlockNode(node: SerializedElementNode): BlockNodeAst {
  switch (node.type) {
    case 'paragraph':
      return mapParagraph(node);
    case 'heading':
      return mapHeading(node);
    case 'list':
      return mapList(node);
    case 'quote':
      return mapBlockQuote(node);
    default:
      // Fallback: treat as paragraph with empty children
      return {
        type: 'paragraph',
        children: mapInlineChildren(node),
      };
  }
}

function mapParagraph(node: SerializedElementNode): ParagraphAst {
  const alignment = decodeAlignment(node.format);
  const indent = node.indent && node.indent > 0 ? node.indent : undefined;
  return {
    type: 'paragraph',
    ...(alignment ? { alignment } : {}),
    ...(indent ? { indent } : {}),
    children: mapInlineChildren(node),
  };
}

function mapHeading(node: SerializedElementNode): HeadingAst {
  const alignment = decodeAlignment(node.format);
  const tagMatch = node.tag?.match(/^h(\d)$/);
  const level = tagMatch ? (parseInt(tagMatch[1], 10) as 1 | 2 | 3 | 4 | 5) : 1;
  return {
    type: 'heading',
    level,
    ...(alignment ? { alignment } : {}),
    children: mapInlineChildren(node),
  };
}

function mapList(node: SerializedElementNode): ListAst {
  const listType = node.listType === 'number' ? 'ordered' : 'unordered';
  const items = (node.children ?? [])
    .filter(c => c.type === 'listitem')
    .map(mapListItem);
  return {
    type: 'list',
    listType,
    items,
  };
}

function mapListItem(node: SerializedElementNode): ListItemAst {
  const inlineChildren: InlineNodeAst[] = [];
  let nestedList: ListAst | undefined;

  for (const child of node.children ?? []) {
    if (child.type === 'list') {
      nestedList = mapList(child);
    } else {
      // Inline children
      const mapped = mapInlineNodes([child as never]);
      inlineChildren.push(...mapped);
    }
  }

  return {
    type: 'list-item',
    children: inlineChildren,
    ...(nestedList ? { nestedList } : {}),
  };
}

function mapBlockQuote(node: SerializedElementNode): BlockQuoteAst {
  return {
    type: 'blockquote',
    children: mapInlineChildren(node),
  };
}

/** Extracts inline children from a block node. */
function mapInlineChildren(node: SerializedElementNode): InlineNodeAst[] {
  if (!node.children || node.children.length === 0) return [];
  return mapInlineNodes(node.children as never[]);
}

/**
 * Maps an array of serialized Lexical block nodes to AST block nodes.
 */
export function mapBlockNodes(nodes: SerializedElementNode[]): BlockNodeAst[] {
  return nodes.map(mapBlockNode);
}
