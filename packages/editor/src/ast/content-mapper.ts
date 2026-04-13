/**
 * Content mapper — Converts a Lexical SerializedEditorState to AST content.
 *
 * This module bridges the gap between Lexical's serialized state
 * (which has a root → children hierarchy) and the flat BlockNodeAst[]
 * used in the AST contract.
 */

import type { SerializedEditorState } from 'lexical';
import type { BlockNodeAst, ContentAst } from './types';
import { mapBlockNodes } from './block-mapper';

/**
 * Converts a Lexical SerializedEditorState into a ContentAst.
 *
 * Returns null if the state is null/undefined (e.g. disabled header).
 */
export function mapEditorStateToContent(
  state: SerializedEditorState | null | undefined,
): ContentAst | null {
  if (!state || !state.root || !state.root.children) {
    return null;
  }

  const blocks = mapBlockNodes(state.root.children as never[]);
  return { blocks };
}

/**
 * Converts a Lexical SerializedEditorState to flat BlockNodeAst[].
 *
 * Used for body content where we need the array directly
 * rather than wrapped in a ContentAst.
 */
export function mapEditorStateToBlocks(
  state: SerializedEditorState | null | undefined,
): BlockNodeAst[] {
  if (!state || !state.root || !state.root.children) {
    return [];
  }

  return mapBlockNodes(state.root.children as never[]);
}
