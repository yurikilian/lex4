import { describe, it, expect } from 'vitest';
import {
  getTopLevelNodes,
  countTopLevelNodes,
  createEditorStateFromNodes,
  splitEditorState,
  mergeEditorStates,
  appendNodes,
  removeLastNodes,
  removeFirstNodes,
  splitBlockNode,
} from '../utils/editor-state-utils';
import type { SerializedEditorState, SerializedLexicalNode } from 'lexical';

// Helper to create a mock paragraph node
function mockParagraph(text: string): SerializedLexicalNode {
  return {
    type: 'paragraph',
    version: 1,
    children: [{ type: 'text', text, version: 1 }],
    direction: null,
    format: '',
    indent: 0,
    textFormat: 0,
    textStyle: '',
  } as unknown as SerializedLexicalNode;
}

// Helper to create a mock editor state with N paragraphs
function mockState(count: number): SerializedEditorState {
  const nodes = Array.from({ length: count }, (_, i) =>
    mockParagraph(`Paragraph ${i + 1}`),
  );
  return createEditorStateFromNodes(nodes);
}

describe('editor-state-utils', () => {
  describe('getTopLevelNodes', () => {
    it('returns empty array for null state', () => {
      expect(getTopLevelNodes(null)).toEqual([]);
    });

    it('returns children from a valid state', () => {
      const state = mockState(3);
      expect(getTopLevelNodes(state)).toHaveLength(3);
    });
  });

  describe('countTopLevelNodes', () => {
    it('returns 0 for null', () => {
      expect(countTopLevelNodes(null)).toBe(0);
    });

    it('counts nodes correctly', () => {
      expect(countTopLevelNodes(mockState(5))).toBe(5);
    });
  });

  describe('createEditorStateFromNodes', () => {
    it('creates a valid root structure', () => {
      const nodes = [mockParagraph('Hello')];
      const state = createEditorStateFromNodes(nodes);
      expect((state.root as any).type).toBe('root');
      expect((state.root as any).children).toHaveLength(1);
    });
  });

  describe('splitEditorState', () => {
    it('splits at given index', () => {
      const state = mockState(4);
      const [before, after] = splitEditorState(state, 2);
      expect(countTopLevelNodes(before)).toBe(2);
      expect(countTopLevelNodes(after)).toBe(2);
    });

    it('returns [null, state] when splitIndex <= 0', () => {
      const state = mockState(3);
      const [before, after] = splitEditorState(state, 0);
      expect(before).toBeNull();
      expect(countTopLevelNodes(after)).toBe(3);
    });

    it('returns [state, null] when splitIndex >= length', () => {
      const state = mockState(3);
      const [before, after] = splitEditorState(state, 5);
      expect(countTopLevelNodes(before)).toBe(3);
      expect(after).toBeNull();
    });

    it('handles null input', () => {
      const [before, after] = splitEditorState(null, 2);
      expect(before).toBeNull();
      expect(after).toBeNull();
    });
  });

  describe('mergeEditorStates', () => {
    it('merges two states', () => {
      const a = mockState(2);
      const b = mockState(3);
      const merged = mergeEditorStates(a, b);
      expect(countTopLevelNodes(merged)).toBe(5);
    });

    it('handles null first state', () => {
      const b = mockState(2);
      const merged = mergeEditorStates(null, b);
      expect(countTopLevelNodes(merged)).toBe(2);
    });

    it('handles null second state', () => {
      const a = mockState(2);
      const merged = mergeEditorStates(a, null);
      expect(countTopLevelNodes(merged)).toBe(2);
    });

    it('returns null when both are null', () => {
      expect(mergeEditorStates(null, null)).toBeNull();
    });
  });

  describe('appendNodes', () => {
    it('adds nodes to existing state', () => {
      const state = mockState(2);
      const result = appendNodes(state, [mockParagraph('New')]);
      expect(countTopLevelNodes(result)).toBe(3);
    });

    it('creates state from null', () => {
      const result = appendNodes(null, [mockParagraph('New')]);
      expect(countTopLevelNodes(result)).toBe(1);
    });
  });

  describe('removeLastNodes', () => {
    it('removes last N nodes', () => {
      const state = mockState(5);
      const [remaining, removed] = removeLastNodes(state, 2);
      expect(countTopLevelNodes(remaining)).toBe(3);
      expect(removed).toHaveLength(2);
    });

    it('returns null and all nodes when count >= length', () => {
      const state = mockState(3);
      const [remaining, removed] = removeLastNodes(state, 5);
      expect(remaining).toBeNull();
      expect(removed).toHaveLength(3);
    });
  });

  describe('removeFirstNodes', () => {
    it('removes first N nodes', () => {
      const state = mockState(5);
      const [removed, remaining] = removeFirstNodes(state, 2);
      expect(removed).toHaveLength(2);
      expect(countTopLevelNodes(remaining)).toBe(3);
    });

    it('returns all nodes and null when count >= length', () => {
      const state = mockState(3);
      const [removed, remaining] = removeFirstNodes(state, 5);
      expect(removed).toHaveLength(3);
      expect(remaining).toBeNull();
    });
  });

  describe('splitBlockNode', () => {
    function mockParagraphWithChildren(count: number): SerializedLexicalNode {
      const children = Array.from({ length: count }, (_, i) => ({
        type: 'text',
        text: `child-${i}`,
        version: 1,
      }));
      return {
        type: 'paragraph',
        version: 1,
        children,
        direction: null,
        format: '',
        indent: 0,
        textFormat: 0,
        textStyle: '',
      } as unknown as SerializedLexicalNode;
    }

    it('splits children at the given offset', () => {
      const block = mockParagraphWithChildren(4);
      const [before, after] = splitBlockNode(block, 2);
      expect(before).not.toBeNull();
      expect(after).not.toBeNull();
      expect((before as any).children).toHaveLength(2);
      expect((after as any).children).toHaveLength(2);
      expect((before as any).children[0].text).toBe('child-0');
      expect((after as any).children[0].text).toBe('child-2');
    });

    it('preserves node type, format, direction, and indent', () => {
      const block = {
        type: 'heading',
        version: 1,
        children: [
          { type: 'text', text: 'a', version: 1 },
          { type: 'text', text: 'b', version: 1 },
        ],
        direction: 'ltr',
        format: 'center',
        indent: 2,
        tag: 'h2',
      } as unknown as SerializedLexicalNode;

      const [before, after] = splitBlockNode(block, 1);
      expect((before as any).type).toBe('heading');
      expect((before as any).direction).toBe('ltr');
      expect((before as any).format).toBe('center');
      expect((before as any).indent).toBe(2);
      expect((before as any).tag).toBe('h2');
      expect((after as any).type).toBe('heading');
      expect((after as any).tag).toBe('h2');
    });

    it('returns [null, copy] when offset is 0', () => {
      const block = mockParagraphWithChildren(3);
      const [before, after] = splitBlockNode(block, 0);
      expect(before).toBeNull();
      expect(after).not.toBeNull();
      expect((after as any).children).toHaveLength(3);
    });

    it('returns [copy, null] when offset >= children length', () => {
      const block = mockParagraphWithChildren(3);
      const [before, after] = splitBlockNode(block, 5);
      expect(before).not.toBeNull();
      expect(after).toBeNull();
      expect((before as any).children).toHaveLength(3);
    });

    it('does not mutate the original block', () => {
      const block = mockParagraphWithChildren(4);
      const originalChildren = (block as any).children.length;
      splitBlockNode(block, 2);
      expect((block as any).children).toHaveLength(originalChildren);
    });
  });
});
