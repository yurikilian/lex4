import { describe, it, expect } from 'vitest';
import {
  decodeFormatBitmask,
  extractFontFamily,
  extractFontSizePt,
  buildTextMarks,
  mapInlineNode,
  mapInlineNodes,
} from '../ast/inline-mapper';

describe('inline-mapper', () => {
  describe('decodeFormatBitmask', () => {
    it('returns empty object for format 0', () => {
      expect(decodeFormatBitmask(0)).toEqual({});
    });

    it('decodes bold (1)', () => {
      expect(decodeFormatBitmask(1)).toEqual({ bold: true });
    });

    it('decodes italic (2)', () => {
      expect(decodeFormatBitmask(2)).toEqual({ italic: true });
    });

    it('decodes strikethrough (4)', () => {
      expect(decodeFormatBitmask(4)).toEqual({ strikethrough: true });
    });

    it('decodes underline (8)', () => {
      expect(decodeFormatBitmask(8)).toEqual({ underline: true });
    });

    it('decodes bold + italic (3)', () => {
      expect(decodeFormatBitmask(3)).toEqual({ bold: true, italic: true });
    });

    it('decodes all format marks (15)', () => {
      expect(decodeFormatBitmask(15)).toEqual({
        bold: true,
        italic: true,
        underline: true,
        strikethrough: true,
      });
    });

    it('decodes bold + underline (9)', () => {
      expect(decodeFormatBitmask(9)).toEqual({ bold: true, underline: true });
    });
  });

  describe('extractFontFamily', () => {
    it('extracts font family from style string', () => {
      expect(extractFontFamily('font-family: Arial')).toBe('Arial');
    });

    it('extracts font family with quotes', () => {
      expect(extractFontFamily("font-family: 'Times New Roman'")).toBe('Times New Roman');
    });

    it('extracts font family from compound style', () => {
      expect(extractFontFamily('font-size: 14pt; font-family: Calibri')).toBe('Calibri');
    });

    it('returns undefined when no font family', () => {
      expect(extractFontFamily('font-size: 14pt')).toBeUndefined();
    });

    it('returns undefined for empty string', () => {
      expect(extractFontFamily('')).toBeUndefined();
    });
  });

  describe('extractFontSizePt', () => {
    it('extracts font size in pt', () => {
      expect(extractFontSizePt('font-size: 14pt')).toBe(14);
    });

    it('extracts decimal font size', () => {
      expect(extractFontSizePt('font-size: 10.5pt')).toBe(10.5);
    });

    it('extracts from compound style', () => {
      expect(extractFontSizePt('font-family: Arial; font-size: 18pt')).toBe(18);
    });

    it('returns undefined when no font size', () => {
      expect(extractFontSizePt('font-family: Arial')).toBeUndefined();
    });

    it('returns undefined for px units (only pt supported)', () => {
      expect(extractFontSizePt('font-size: 14px')).toBeUndefined();
    });
  });

  describe('buildTextMarks', () => {
    it('returns undefined when no marks', () => {
      expect(buildTextMarks(0)).toBeUndefined();
    });

    it('builds marks from format only', () => {
      expect(buildTextMarks(1)).toEqual({ bold: true });
    });

    it('builds marks from style only', () => {
      expect(buildTextMarks(0, 'font-family: Arial')).toEqual({ fontFamily: 'Arial' });
    });

    it('builds marks from format and style', () => {
      expect(buildTextMarks(3, 'font-family: Arial; font-size: 14pt')).toEqual({
        bold: true,
        italic: true,
        fontFamily: 'Arial',
        fontSize: 14,
      });
    });
  });

  describe('mapInlineNode', () => {
    it('maps text node to TextRunAst', () => {
      const result = mapInlineNode({
        type: 'text',
        text: 'Hello',
        format: 0,
      });
      expect(result).toEqual({ type: 'text', text: 'Hello' });
    });

    it('maps text node with formatting', () => {
      const result = mapInlineNode({
        type: 'text',
        text: 'Bold',
        format: 1,
        style: 'font-family: Arial',
      });
      expect(result).toEqual({
        type: 'text',
        text: 'Bold',
        marks: { bold: true, fontFamily: 'Arial' },
      });
    });

    it('maps variable node to VariableAst', () => {
      const result = mapInlineNode({
        type: 'variable-node',
        version: 1,
        variableKey: 'customer.name',
      } as never);
      expect(result).toEqual({
        type: 'variable',
        key: 'customer.name',
      });
    });

    it('maps linebreak to LineBreakAst', () => {
      const result = mapInlineNode({ type: 'linebreak' } as never);
      expect(result).toEqual({ type: 'linebreak' });
    });

    it('maps unknown node type as empty text', () => {
      const result = mapInlineNode({ type: 'unknown' } as never);
      expect(result).toEqual({ type: 'text', text: '' });
    });
  });

  describe('mapInlineNodes', () => {
    it('maps empty array', () => {
      expect(mapInlineNodes([])).toEqual([]);
    });

    it('maps multiple nodes', () => {
      const result = mapInlineNodes([
        { type: 'text', text: 'Hello ', format: 0 },
        { type: 'text', text: 'world', format: 1 },
      ] as never[]);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ type: 'text', text: 'Hello ' });
      expect(result[1]).toEqual({ type: 'text', text: 'world', marks: { bold: true } });
    });
  });
});
