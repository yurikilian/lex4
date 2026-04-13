import { describe, it, expect } from 'vitest';
import { buildSavePayload, serializeDocumentJson } from '../ast/payload-builder';
import type { DocumentAst } from '../ast/types';

function makeMinimalAst(): DocumentAst {
  return {
    version: '1.0.0',
    page: {
      format: 'A4',
      widthMm: 210,
      heightMm: 297,
      margins: { topMm: 10.6, rightMm: 10.6, bottomMm: 10.6, leftMm: 10.6 },
    },
    headerFooter: {
      enabled: false,
      pageCounterMode: 'none',
      defaultHeader: null,
      defaultFooter: null,
    },
    pages: [
      { pageIndex: 0, body: [], header: null, footer: null },
    ],
    metadata: { variables: {} },
  };
}

describe('payload-builder', () => {
  describe('buildSavePayload', () => {
    it('wraps AST with no options', () => {
      const ast = makeMinimalAst();
      const payload = buildSavePayload(ast);

      expect(payload.document).toBe(ast);
      expect(payload.exportTarget).toBeUndefined();
      expect(payload.documentId).toBeUndefined();
      expect(payload.metadata).toBeUndefined();
    });

    it('includes exportTarget', () => {
      const ast = makeMinimalAst();
      const payload = buildSavePayload(ast, { exportTarget: 'pdf' });

      expect(payload.exportTarget).toBe('pdf');
    });

    it('includes documentId', () => {
      const ast = makeMinimalAst();
      const payload = buildSavePayload(ast, { documentId: 'doc-123' });

      expect(payload.documentId).toBe('doc-123');
    });

    it('includes custom metadata', () => {
      const ast = makeMinimalAst();
      const payload = buildSavePayload(ast, {
        metadata: { author: 'John', template: 'proposal' },
      });

      expect(payload.metadata).toEqual({ author: 'John', template: 'proposal' });
    });

    it('includes all options', () => {
      const ast = makeMinimalAst();
      const payload = buildSavePayload(ast, {
        exportTarget: 'docx',
        documentId: 'doc-456',
        metadata: { version: '2' },
      });

      expect(payload.exportTarget).toBe('docx');
      expect(payload.documentId).toBe('doc-456');
      expect(payload.metadata).toEqual({ version: '2' });
    });
  });

  describe('serializeDocumentJson', () => {
    it('returns valid JSON', () => {
      const ast = makeMinimalAst();
      const json = serializeDocumentJson(ast);
      const parsed = JSON.parse(json);

      expect(parsed.version).toBe('1.0.0');
      expect(parsed.page.format).toBe('A4');
    });

    it('is formatted with 2-space indent', () => {
      const ast = makeMinimalAst();
      const json = serializeDocumentJson(ast);

      expect(json).toContain('\n');
      expect(json).toContain('  ');
    });
  });
});
