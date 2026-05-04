/**
 * Inline mapper — Converts Lexical serialized inline nodes to AST inline nodes.
 *
 * Handles:
 * - TextNode → TextRunAst (decodes format bitmask + parses CSS style)
 * - VariableNode → VariableAst
 * - LineBreakNode → LineBreakAst
 */

import type { InlineNodeAst, TextMarks, TextRunAst, VariableAst, LineBreakAst } from './types';
import type { SerializedVariableNode } from '../variables/variable-node';
import {
  extractFontFamilyFromStyle,
  extractFontSizePtFromStyle,
} from '../utils/text-style';

// Lexical format bitmask constants
const IS_BOLD = 1;
const IS_ITALIC = 2;
const IS_STRIKETHROUGH = 4;
const IS_UNDERLINE = 8;

/** Serialized Lexical text node shape (subset of fields we need). */
interface SerializedTextNode {
  type: 'text';
  text: string;
  format: number;
  style?: string;
  [key: string]: unknown;
}

interface SerializedLineBreak {
  type: 'linebreak';
  [key: string]: unknown;
}

type SerializedInlineNode = SerializedTextNode | SerializedVariableNode | SerializedLineBreak;

/**
 * Decodes Lexical's format bitmask into named boolean marks.
 */
export function decodeFormatBitmask(format: number): Pick<TextMarks, 'bold' | 'italic' | 'underline' | 'strikethrough'> {
  const marks: Pick<TextMarks, 'bold' | 'italic' | 'underline' | 'strikethrough'> = {};
  if (format & IS_BOLD) marks.bold = true;
  if (format & IS_ITALIC) marks.italic = true;
  if (format & IS_UNDERLINE) marks.underline = true;
  if (format & IS_STRIKETHROUGH) marks.strikethrough = true;
  return marks;
}

/**
 * Extracts font-family from a CSS style string.
 */
export function extractFontFamily(style: string): string | undefined {
  return extractFontFamilyFromStyle(style);
}

/**
 * Extracts font-size (in pt) from a CSS style string.
 */
export function extractFontSizePt(style: string): number | undefined {
  return extractFontSizePtFromStyle(style);
}

/**
 * Builds TextMarks from a Lexical format bitmask and style string.
 */
export function buildTextMarks(format: number, style?: string): TextMarks | undefined {
  const formatMarks = decodeFormatBitmask(format);
  const fontFamily = style ? extractFontFamily(style) : undefined;
  const fontSize = style ? extractFontSizePt(style) : undefined;

  const marks: TextMarks = {
    ...formatMarks,
    ...(fontFamily ? { fontFamily } : {}),
    ...(fontSize ? { fontSize } : {}),
  };

  return Object.keys(marks).length > 0 ? marks : undefined;
}

/**
 * Maps a single serialized Lexical inline node to an AST inline node.
 */
export function mapInlineNode(node: SerializedInlineNode): InlineNodeAst {
  switch (node.type) {
    case 'text':
      return mapTextNode(node as SerializedTextNode);
    case 'variable-node':
      return mapVariableNode(node as SerializedVariableNode);
    case 'linebreak':
      return mapLineBreak();
    default:
      // Fallback: treat unknown inline nodes as empty text
      return { type: 'text', text: '' };
  }
}

function mapTextNode(node: SerializedTextNode): TextRunAst {
  const marks = buildTextMarks(node.format, node.style);
  return {
    type: 'text',
    text: node.text,
    ...(marks ? { marks } : {}),
  };
}

function mapVariableNode(node: SerializedVariableNode): VariableAst {
  const marks = buildTextMarks(node.format ?? 0, node.style);
  return {
    type: 'variable',
    key: node.variableKey,
    ...(marks ? { marks } : {}),
  };
}

function mapLineBreak(): LineBreakAst {
  return { type: 'linebreak' };
}

/**
 * Maps an array of serialized Lexical inline nodes to AST inline nodes.
 */
export function mapInlineNodes(nodes: SerializedInlineNode[]): InlineNodeAst[] {
  return nodes.map(mapInlineNode);
}
