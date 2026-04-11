import type { SerializedEditorState, SerializedLexicalNode } from 'lexical';

/**
 * Utilities for splitting and merging Lexical editor states.
 *
 * A SerializedEditorState has shape:
 * { root: { children: [...], type: "root", ... } }
 *
 * Content flow between pages is achieved by manipulating
 * the root.children array — extracting, splitting, merging
 * top-level block nodes.
 */

/** Extract all top-level nodes from a serialized editor state */
export function getTopLevelNodes(state: SerializedEditorState | null): SerializedLexicalNode[] {
  if (!state) return [];
  return (state.root as any).children ?? [];
}

/** Count top-level nodes in a serialized editor state */
export function countTopLevelNodes(state: SerializedEditorState | null): number {
  return getTopLevelNodes(state).length;
}

/**
 * Create a SerializedEditorState from a list of top-level nodes.
 * Uses a standard root wrapper.
 */
export function createEditorStateFromNodes(
  nodes: SerializedLexicalNode[],
): SerializedEditorState {
  return {
    root: {
      children: nodes,
      direction: null,
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  } as SerializedEditorState;
}

/**
 * Split a serialized editor state at a given node index.
 *
 * Returns [before, after] where:
 * - before contains nodes 0..splitIndex-1
 * - after contains nodes splitIndex..end
 */
export function splitEditorState(
  state: SerializedEditorState | null,
  splitIndex: number,
): [SerializedEditorState | null, SerializedEditorState | null] {
  const nodes = getTopLevelNodes(state);

  if (splitIndex <= 0) {
    return [null, state];
  }
  if (splitIndex >= nodes.length) {
    return [state, null];
  }

  const before = nodes.slice(0, splitIndex);
  const after = nodes.slice(splitIndex);

  return [
    before.length > 0 ? createEditorStateFromNodes(before) : null,
    after.length > 0 ? createEditorStateFromNodes(after) : null,
  ];
}

/**
 * Merge two serialized editor states by concatenating their top-level nodes.
 * Returns a new state with all nodes from both states.
 */
export function mergeEditorStates(
  stateA: SerializedEditorState | null,
  stateB: SerializedEditorState | null,
): SerializedEditorState | null {
  const nodesA = getTopLevelNodes(stateA);
  const nodesB = getTopLevelNodes(stateB);

  const all = [...nodesA, ...nodesB];
  if (all.length === 0) return null;

  return createEditorStateFromNodes(all);
}

/**
 * Append nodes to the end of a serialized editor state.
 */
export function appendNodes(
  state: SerializedEditorState | null,
  nodes: SerializedLexicalNode[],
): SerializedEditorState {
  const existing = getTopLevelNodes(state);
  return createEditorStateFromNodes([...existing, ...nodes]);
}

/**
 * Remove the last N nodes from a serialized editor state.
 * Returns [trimmedState, removedNodes].
 */
export function removeLastNodes(
  state: SerializedEditorState | null,
  count: number,
): [SerializedEditorState | null, SerializedLexicalNode[]] {
  const nodes = getTopLevelNodes(state);
  if (count >= nodes.length) {
    return [null, [...nodes]];
  }

  const kept = nodes.slice(0, nodes.length - count);
  const removed = nodes.slice(nodes.length - count);

  return [
    kept.length > 0 ? createEditorStateFromNodes(kept) : null,
    removed,
  ];
}

/**
 * Remove the first N nodes from a serialized editor state.
 * Returns [removedNodes, remainingState].
 */
export function removeFirstNodes(
  state: SerializedEditorState | null,
  count: number,
): [SerializedLexicalNode[], SerializedEditorState | null] {
  const nodes = getTopLevelNodes(state);
  if (count >= nodes.length) {
    return [[...nodes], null];
  }

  const removed = nodes.slice(0, count);
  const remaining = nodes.slice(count);

  return [
    removed,
    remaining.length > 0 ? createEditorStateFromNodes(remaining) : null,
  ];
}
