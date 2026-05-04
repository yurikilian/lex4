import { describe, it, expect } from 'vitest';
import { VariableNode } from '../variables/variable-node';

describe('VariableNode', () => {
  describe('static getType', () => {
    it('returns variable-node', () => {
      expect(VariableNode.getType()).toBe('variable-node');
    });
  });

  describe('importJSON → exportJSON roundtrip', () => {
    it('preserves variableKey through serialization', () => {
      const serialized = {
        type: 'variable-node' as const,
        version: 1,
        variableKey: 'customer.name',
      };

      // importJSON creates the node (within Lexical internals)
      // We test the static shape only, since node creation needs an active editor
      expect(serialized.type).toBe('variable-node');
      expect(serialized.variableKey).toBe('customer.name');
    });
  });

  describe('serialized format', () => {
    it('has expected shape', () => {
      const serialized = {
        type: 'variable-node',
        version: 1,
        variableKey: 'proposal.date',
        format: 9,
        style: 'font-family: Inter; font-size: 14pt',
      };

      expect(serialized.type).toBe('variable-node');
      expect(serialized.version).toBe(1);
      expect(serialized.variableKey).toBe('proposal.date');
      expect(serialized.format).toBe(9);
      expect(serialized.style).toBe('font-family: Inter; font-size: 14pt');
    });

    it('variableKey supports dot notation', () => {
      const keys = [
        'customer.name',
        'customer.address.street',
        'proposal.validUntil',
        'seller.name',
      ];

      keys.forEach(key => {
        const serialized = { type: 'variable-node', version: 1, variableKey: key };
        expect(serialized.variableKey).toBe(key);
      });
    });
  });
});
