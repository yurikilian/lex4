import { describe, it, expect } from 'vitest';
import { serializeDocument } from '../ast/document-serializer';
import { AST_VERSION } from '../ast/types';
import type { Lex4Document } from '../types/document';
import type { VariableDefinition } from '../variables/types';

function makeEditorState(children: unknown[]) {
  return {
    root: {
      type: 'root',
      version: 1,
      children,
      direction: null,
      format: '',
      indent: 0,
    },
  } as never;
}

describe('document-serializer', () => {
  it('serializes empty document', () => {
    const doc: Lex4Document = {
      pages: [
        {
          id: 'p1',
          bodyState: null,
          headerState: null,
          footerState: null,
          bodySyncVersion: 0,
        },
      ],
      headerFooterEnabled: false,
      pageCounterMode: 'none',
    };

    const ast = serializeDocument(doc);

    expect(ast.version).toBe(AST_VERSION);
    expect(ast.page.format).toBe('A4');
    expect(ast.page.widthMm).toBe(210);
    expect(ast.page.heightMm).toBe(297);
    expect(ast.headerFooter.enabled).toBe(false);
    expect(ast.pages).toHaveLength(1);
    expect(ast.pages[0].pageIndex).toBe(0);
    expect(ast.pages[0].body).toEqual([]);
    expect(ast.pages[0].header).toBeNull();
    expect(ast.pages[0].footer).toBeNull();
    expect(ast.metadata.variables).toEqual({});
  });

  it('serializes document with body content', () => {
    const doc: Lex4Document = {
      pages: [
        {
          id: 'p1',
          bodyState: makeEditorState([
            {
              type: 'paragraph',
              children: [{ type: 'text', text: 'Hello world', format: 0 }],
              direction: null,
              format: '',
              indent: 0,
              version: 1,
            },
          ]),
          headerState: null,
          footerState: null,
          bodySyncVersion: 0,
        },
      ],
      headerFooterEnabled: false,
      pageCounterMode: 'none',
    };

    const ast = serializeDocument(doc);

    expect(ast.pages[0].body).toHaveLength(1);
    expect(ast.pages[0].body[0]).toEqual({
      type: 'paragraph',
      children: [{ type: 'text', text: 'Hello world' }],
    });
  });

  it('serializes document with header and footer', () => {
    const headerState = makeEditorState([
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Header', format: 0 }],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      },
    ]);
    const footerState = makeEditorState([
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Footer', format: 0 }],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      },
    ]);

    const doc: Lex4Document = {
      pages: [
        {
          id: 'p1',
          bodyState: null,
          headerState,
          footerState,
          bodySyncVersion: 0,
        },
      ],
      headerFooterEnabled: true,
      pageCounterMode: 'footer',
    };

    const ast = serializeDocument(doc);

    expect(ast.headerFooter.enabled).toBe(true);
    expect(ast.headerFooter.pageCounterMode).toBe('footer');
    expect(ast.headerFooter.defaultHeader).not.toBeNull();
    expect(ast.headerFooter.defaultHeader!.blocks).toHaveLength(1);
    expect(ast.pages[0].header).not.toBeNull();
    expect(ast.pages[0].footer).not.toBeNull();
  });

  it('serializes multiple pages', () => {
    const doc: Lex4Document = {
      pages: [
        { id: 'p1', bodyState: null, headerState: null, footerState: null, bodySyncVersion: 0 },
        { id: 'p2', bodyState: null, headerState: null, footerState: null, bodySyncVersion: 0 },
        { id: 'p3', bodyState: null, headerState: null, footerState: null, bodySyncVersion: 0 },
      ],
      headerFooterEnabled: false,
      pageCounterMode: 'none',
    };

    const ast = serializeDocument(doc);

    expect(ast.pages).toHaveLength(3);
    expect(ast.pages[0].pageIndex).toBe(0);
    expect(ast.pages[1].pageIndex).toBe(1);
    expect(ast.pages[2].pageIndex).toBe(2);
  });

  it('serializes variable metadata', () => {
    const doc: Lex4Document = {
      pages: [
        { id: 'p1', bodyState: null, headerState: null, footerState: null, bodySyncVersion: 0 },
      ],
      headerFooterEnabled: false,
      pageCounterMode: 'none',
    };

    const variableDefs: VariableDefinition[] = [
      {
        key: 'customer.name',
        label: 'Customer Name',
        description: 'Full name of the customer',
        valueType: 'string',
        group: 'Customer',
      },
      {
        key: 'proposal.date',
        label: 'Proposal Date',
        valueType: 'date',
        group: 'Proposal',
      },
    ];

    const ast = serializeDocument(doc, variableDefs);

    expect(ast.metadata.variables['customer.name']).toEqual({
      key: 'customer.name',
      label: 'Customer Name',
      description: 'Full name of the customer',
      valueType: 'string',
      group: 'Customer',
    });
    expect(ast.metadata.variables['proposal.date']).toEqual({
      key: 'proposal.date',
      label: 'Proposal Date',
      valueType: 'date',
      group: 'Proposal',
    });
  });

  it('serializes page margins', () => {
    const doc: Lex4Document = {
      pages: [
        { id: 'p1', bodyState: null, headerState: null, footerState: null, bodySyncVersion: 0 },
      ],
      headerFooterEnabled: false,
      pageCounterMode: 'none',
    };

    const ast = serializeDocument(doc);

    expect(ast.page.margins.topMm).toBeGreaterThan(0);
    expect(ast.page.margins.rightMm).toBeGreaterThan(0);
    expect(ast.page.margins.bottomMm).toBeGreaterThan(0);
    expect(ast.page.margins.leftMm).toBeGreaterThan(0);
  });

  it('preserves variable nodes in body content', () => {
    const doc: Lex4Document = {
      pages: [
        {
          id: 'p1',
          bodyState: makeEditorState([
            {
              type: 'paragraph',
              children: [
                { type: 'text', text: 'Dear ', format: 0 },
                { type: 'variable-node', version: 1, variableKey: 'customer.name' },
                { type: 'text', text: ', welcome!', format: 0 },
              ],
              direction: null,
              format: '',
              indent: 0,
              version: 1,
            },
          ]),
          headerState: null,
          footerState: null,
          bodySyncVersion: 0,
        },
      ],
      headerFooterEnabled: false,
      pageCounterMode: 'none',
    };

    const ast = serializeDocument(doc);
    const para = ast.pages[0].body[0];

    expect(para.type).toBe('paragraph');
    if (para.type === 'paragraph') {
      expect(para.children).toHaveLength(3);
      expect(para.children[0]).toEqual({ type: 'text', text: 'Dear ' });
      expect(para.children[1]).toEqual({ type: 'variable', key: 'customer.name' });
      expect(para.children[2]).toEqual({ type: 'text', text: ', welcome!' });
    }
  });

  it('preserves formatted text with font family and size', () => {
    const doc: Lex4Document = {
      pages: [
        {
          id: 'p1',
          bodyState: makeEditorState([
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: 'Styled',
                  format: 3, // bold + italic
                  style: 'font-family: Georgia; font-size: 18pt',
                },
              ],
              direction: null,
              format: '',
              indent: 0,
              version: 1,
            },
          ]),
          headerState: null,
          footerState: null,
          bodySyncVersion: 0,
        },
      ],
      headerFooterEnabled: false,
      pageCounterMode: 'none',
    };

    const ast = serializeDocument(doc);
    const para = ast.pages[0].body[0];

    if (para.type === 'paragraph') {
      expect(para.children[0]).toEqual({
        type: 'text',
        text: 'Styled',
        marks: {
          bold: true,
          italic: true,
          fontFamily: 'Georgia',
          fontSize: 18,
        },
      });
    }
  });
});
