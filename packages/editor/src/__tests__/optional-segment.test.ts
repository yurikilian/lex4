import { describe, it, expect } from 'vitest';
import { OptionalSegmentNode } from '../variables/optional-segment-node';
import { mapInlineNode, mapInlineNodes } from '../ast/inline-mapper';
import { mapBlockNode } from '../ast/block-mapper';

describe('OptionalSegmentNode', () => {
  describe('static getType', () => {
    it('returns optional-segment', () => {
      expect(OptionalSegmentNode.getType()).toBe('optional-segment');
    });
  });

  describe('behavior flags', () => {
    // Node construction requires an active editor; the flag methods are
    // stateless, so exercise them via the prototype.
    const proto = OptionalSegmentNode.prototype;

    it('is inline', () => {
      expect(proto.isInline.call(proto)).toBe(true);
    });

    it('cannot be empty', () => {
      expect(proto.canBeEmpty.call(proto)).toBe(false);
    });

    it('does not accept text insertion at its edges', () => {
      expect(proto.canInsertTextBefore.call(proto)).toBe(false);
      expect(proto.canInsertTextAfter.call(proto)).toBe(false);
    });
  });

  describe('serialized format', () => {
    it('has expected shape (the B2/B3 contract)', () => {
      const serialized = {
        type: 'optional-segment',
        version: 1,
        children: [
          { type: 'text', text: ', ', format: 0 },
          { type: 'variable-node', version: 1, variableKey: 'party.client.address.complement' },
        ],
      };

      expect(serialized.type).toBe('optional-segment');
      expect(serialized.children).toHaveLength(2);
    });
  });
});

describe('inline-mapper: optional-segment', () => {
  it('maps an optional segment with its children', () => {
    const result = mapInlineNode({
      type: 'optional-segment',
      children: [
        { type: 'text', text: ', ', format: 0 },
        { type: 'variable-node', version: 1, variableKey: 'customer.complement' },
      ],
    } as never);

    expect(result).toEqual({
      type: 'optional-segment',
      children: [
        { type: 'text', text: ', ' },
        { type: 'variable', key: 'customer.complement' },
      ],
    });
  });

  it('maps an optional segment with no children to an empty children array', () => {
    const result = mapInlineNode({ type: 'optional-segment' } as never);
    expect(result).toEqual({ type: 'optional-segment', children: [] });
  });

  it('preserves marks on children inside a segment', () => {
    const result = mapInlineNodes([
      {
        type: 'optional-segment',
        children: [{ type: 'text', text: 'bold', format: 1 }],
      } as never,
    ]);

    expect(result).toEqual([
      {
        type: 'optional-segment',
        children: [{ type: 'text', text: 'bold', marks: { bold: true } }],
      },
    ]);
  });

  it('maps segments nested in paragraph children through the block mapper', () => {
    const result = mapBlockNode({
      type: 'paragraph',
      children: [
        { type: 'text', text: 'Address', format: 0 },
        {
          type: 'optional-segment',
          children: [
            { type: 'text', text: ', ', format: 0 },
            { type: 'variable-node', version: 1, variableKey: 'customer.complement' },
          ],
        },
      ],
    } as never);

    expect(result).toEqual({
      type: 'paragraph',
      children: [
        { type: 'text', text: 'Address' },
        {
          type: 'optional-segment',
          children: [
            { type: 'text', text: ', ' },
            { type: 'variable', key: 'customer.complement' },
          ],
        },
      ],
    });
  });
});
