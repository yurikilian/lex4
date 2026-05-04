import { describe, it, expect } from 'vitest';
import { mapBlockNode, mapBlockNodes } from '../ast/block-mapper';

describe('block-mapper', () => {
  describe('mapBlockNode — paragraph', () => {
    it('maps empty paragraph', () => {
      const result = mapBlockNode({
        type: 'paragraph',
        children: [],
      });
      expect(result).toEqual({ type: 'paragraph', children: [] });
    });

    it('maps paragraph with text child', () => {
      const result = mapBlockNode({
        type: 'paragraph',
        children: [{ type: 'text', text: 'Hello', format: 0 }],
      });
      expect(result).toEqual({
        type: 'paragraph',
        children: [{ type: 'text', text: 'Hello' }],
      });
    });

    it('preserves alignment', () => {
      const result = mapBlockNode({
        type: 'paragraph',
        format: 2, // center
        children: [],
      });
      expect(result).toEqual({ type: 'paragraph', alignment: 'center', children: [] });
    });

    it('preserves string alignment', () => {
      const result = mapBlockNode({
        type: 'paragraph',
        format: 'right',
        children: [],
      });
      expect(result).toEqual({ type: 'paragraph', alignment: 'right', children: [] });
    });

    it('preserves indent', () => {
      const result = mapBlockNode({
        type: 'paragraph',
        indent: 2,
        children: [],
      });
      expect(result).toEqual({ type: 'paragraph', indent: 2, children: [] });
    });

    it('omits zero indent', () => {
      const result = mapBlockNode({
        type: 'paragraph',
        indent: 0,
        children: [],
      });
      expect(result).toEqual({ type: 'paragraph', children: [] });
    });
  });

  describe('mapBlockNode — heading', () => {
    it('maps h1', () => {
      const result = mapBlockNode({
        type: 'heading',
        tag: 'h1',
        children: [{ type: 'text', text: 'Title', format: 0 }],
      });
      expect(result).toEqual({
        type: 'heading',
        level: 1,
        children: [{ type: 'text', text: 'Title' }],
      });
    });

    it('maps h3 with alignment', () => {
      const result = mapBlockNode({
        type: 'heading',
        tag: 'h3',
        format: 2,
        children: [],
      });
      expect(result).toEqual({
        type: 'heading',
        level: 3,
        alignment: 'center',
        children: [],
      });
    });

    it('defaults to level 1 if tag missing', () => {
      const result = mapBlockNode({
        type: 'heading',
        children: [],
      });
      expect(result).toEqual({
        type: 'heading',
        level: 1,
        children: [],
      });
    });

    it('maps h6', () => {
      const result = mapBlockNode({
        type: 'heading',
        tag: 'h6',
        children: [{ type: 'text', text: 'Small title', format: 0 }],
      });
      expect(result).toEqual({
        type: 'heading',
        level: 6,
        children: [{ type: 'text', text: 'Small title' }],
      });
    });
  });

  describe('mapBlockNode — list', () => {
    it('maps ordered list', () => {
      const result = mapBlockNode({
        type: 'list',
        listType: 'number',
        children: [
          {
            type: 'listitem',
            children: [{ type: 'text', text: 'Item 1', format: 0 }],
          },
        ],
      });
      expect(result).toEqual({
        type: 'list',
        listType: 'ordered',
        items: [
          {
            type: 'list-item',
            children: [{ type: 'text', text: 'Item 1' }],
          },
        ],
      });
    });

    it('maps unordered list', () => {
      const result = mapBlockNode({
        type: 'list',
        listType: 'bullet',
        children: [
          {
            type: 'listitem',
            children: [{ type: 'text', text: 'Bullet', format: 0 }],
          },
        ],
      });
      expect(result).toEqual({
        type: 'list',
        listType: 'unordered',
        items: [
          {
            type: 'list-item',
            children: [{ type: 'text', text: 'Bullet' }],
          },
        ],
      });
    });

    it('maps nested list', () => {
      const result = mapBlockNode({
        type: 'list',
        listType: 'number',
        children: [
          {
            type: 'listitem',
            children: [
              { type: 'text', text: 'Parent', format: 0 },
              {
                type: 'list',
                listType: 'bullet',
                children: [
                  {
                    type: 'listitem',
                    children: [{ type: 'text', text: 'Child', format: 0 }],
                  },
                ],
              },
            ],
          },
        ],
      });
      expect(result).toEqual({
        type: 'list',
        listType: 'ordered',
        items: [
          {
            type: 'list-item',
            children: [{ type: 'text', text: 'Parent' }],
            nestedList: {
              type: 'list',
              listType: 'unordered',
              items: [
                {
                  type: 'list-item',
                  children: [{ type: 'text', text: 'Child' }],
                },
              ],
            },
          },
        ],
      });
    });

    it('skips non-listitem children', () => {
      const result = mapBlockNode({
        type: 'list',
        listType: 'number',
        children: [
          { type: 'paragraph', children: [] },
          { type: 'listitem', children: [{ type: 'text', text: 'Valid', format: 0 }] },
        ],
      });
      expect(result).toEqual({
        type: 'list',
        listType: 'ordered',
        items: [
          { type: 'list-item', children: [{ type: 'text', text: 'Valid' }] },
        ],
      });
    });
  });

  describe('mapBlockNode — blockquote', () => {
    it('maps quote', () => {
      const result = mapBlockNode({
        type: 'quote',
        children: [{ type: 'text', text: 'Quote text', format: 0 }],
      });
      expect(result).toEqual({
        type: 'blockquote',
        children: [{ type: 'text', text: 'Quote text' }],
      });
    });
  });

  describe('mapBlockNode — unknown', () => {
    it('maps unknown as paragraph fallback', () => {
      const result = mapBlockNode({
        type: 'unknown-block',
        children: [{ type: 'text', text: 'Fallback', format: 0 }],
      });
      expect(result).toEqual({
        type: 'paragraph',
        children: [{ type: 'text', text: 'Fallback' }],
      });
    });
  });

  describe('mapBlockNodes', () => {
    it('maps multiple blocks', () => {
      const result = mapBlockNodes([
        { type: 'paragraph', children: [{ type: 'text', text: 'P1', format: 0 }] },
        { type: 'heading', tag: 'h2', children: [{ type: 'text', text: 'H2', format: 0 }] },
      ]);
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('paragraph');
      expect(result[1].type).toBe('heading');
    });
  });
});
