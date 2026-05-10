import { describe, expect, it, vi } from 'vitest';
import type { LexicalEditor } from 'lexical';
import { readToolbarStyleSnapshot } from '../context/toolbar-style-snapshot';

const selectionState = {
  selection: null as unknown,
  domSelection: null as unknown,
};

vi.mock('lexical', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lexical')>();

  return {
    ...actual,
    $getSelection: () => selectionState.selection,
    $createRangeSelectionFromDom: () => selectionState.domSelection,
    $isNodeSelection: (selection: unknown) =>
      !!selection && (selection as { kind?: string }).kind === 'node',
    $isRangeSelection: (selection: unknown) =>
      !!selection && (selection as { kind?: string }).kind === 'range',
    $isElementNode: (node: unknown) =>
      !!node && (node as { kind?: string }).kind !== undefined,
    $isTextNode: (node: unknown) =>
      !!node && (node as { kind?: string }).kind === 'text',
  };
});

vi.mock('@lexical/rich-text', () => ({
  $isHeadingNode: (node: unknown) => !!node && (node as { kind?: string }).kind === 'heading',
}));

vi.mock('@lexical/list', () => ({
  $isListNode: (node: unknown) => !!node && (node as { kind?: string }).kind === 'list',
}));

vi.mock('@lexical/utils', () => ({
  $findMatchingParent: (node: { getParent?: () => unknown } | null | undefined, predicate: (candidate: unknown) => boolean) => {
    let current = node?.getParent?.() ?? null;
    while (current) {
      if (predicate(current)) {
        return current;
      }
      current = (current as { getParent?: () => unknown }).getParent?.() ?? null;
    }
    return null;
  },
}));

vi.mock('../variables/variable-node', () => ({
  $isVariableNode: (node: unknown) => !!node && (node as { kind?: string }).kind === 'variable',
}));

vi.mock('../lexical/nodes/alpha-list-node', () => ({
  $isAlphaListNode: (node: unknown) => !!node && (node as { variant?: string }).variant === 'alpha',
}));

function createEditor(): LexicalEditor {
  return {
    getEditorState: () => ({
      read: (callback: () => void) => callback(),
    }),
  } as unknown as LexicalEditor;
}

describe('toolbar-style-snapshot', () => {
  it('reads the effective block and inline format state from a range selection', () => {
    const topLevel = {
      kind: 'heading',
      getTag: () => 'h1',
      getFormatType: () => 'center',
    };
    const textNode = {
      kind: 'text',
      getStyle: () => 'font-size: 12pt; --lex4-block-type: paragraph',
      getTopLevelElementOrThrow: () => topLevel,
    };

    selectionState.selection = {
      kind: 'range',
      style: '',
      isCollapsed: () => false,
      anchor: {
        getNode: () => textNode,
      },
      getNodes: () => [textNode],
      hasFormat: (format: string) => format === 'bold' || format === 'underline',
    };

    expect(readToolbarStyleSnapshot(createEditor())).toEqual({
      blockType: 'paragraph',
      fontFamily: 'Inter',
      fontSize: 12,
      alignment: 'center',
      activeList: 'none',
      isBold: true,
      isItalic: false,
      isUnderline: true,
      isStrikethrough: false,
      hasSelectedVariable: false,
    });
  });

  it('reads collapsed inline formats from the DOM-backed range selection', () => {
    const topLevel = {
      kind: 'paragraph',
      getFormatType: () => 'left',
    };
    const textNode = {
      kind: 'text',
      getStyle: () => '',
      getTopLevelElementOrThrow: () => topLevel,
      hasFormat: (format: string) => format === 'bold',
    };

    selectionState.selection = null;
    selectionState.domSelection = {
      kind: 'range',
      style: '',
      isCollapsed: () => true,
      anchor: {
        getNode: () => textNode,
      },
      getNodes: () => [textNode],
      hasFormat: () => false,
    };

    expect(readToolbarStyleSnapshot(createEditor())).toEqual({
      blockType: 'paragraph',
      fontFamily: 'Inter',
      fontSize: 12,
      alignment: 'left',
      activeList: 'none',
      isBold: true,
      isItalic: false,
      isUnderline: false,
      isStrikethrough: false,
      hasSelectedVariable: false,
    });

    selectionState.domSelection = null;
  });

  it('reads selected variable state from a node selection', () => {
    const topLevel = {
      kind: 'paragraph',
      getFormatType: () => 'right',
    };
    const variableNode = {
      kind: 'variable',
      getStyle: () => 'font-family: Georgia; font-size: 22.5pt; --lex4-block-type: h1',
      getTopLevelElementOrThrow: () => topLevel,
      getFormat: () => 9,
    };

    selectionState.selection = {
      kind: 'node',
      getNodes: () => [variableNode],
    };

    expect(readToolbarStyleSnapshot(createEditor())).toEqual({
      blockType: 'h1',
      fontFamily: 'Georgia',
      fontSize: 22.5,
      alignment: 'right',
      activeList: 'none',
      isBold: true,
      isItalic: false,
      isUnderline: true,
      isStrikethrough: false,
      hasSelectedVariable: true,
    });
  });

  it('reads active list state from a collapsed selection inside an alpha list', () => {
    const alphaList = {
      kind: 'list',
      variant: 'alpha',
      getListType: () => 'number',
    };
    const listItem = {
      kind: 'element',
      getFormatType: () => 'left',
      getParent: () => alphaList,
    };
    const textNode = {
      kind: 'text',
      getStyle: () => '',
      getTopLevelElementOrThrow: () => listItem,
      hasFormat: () => false,
      getParent: () => listItem,
    };

    selectionState.selection = {
      kind: 'range',
      style: '',
      isCollapsed: () => true,
      anchor: {
        getNode: () => textNode,
      },
      getNodes: () => [textNode],
      hasFormat: () => false,
    };

    expect(readToolbarStyleSnapshot(createEditor())).toEqual({
      blockType: 'paragraph',
      fontFamily: 'Inter',
      fontSize: 12,
      alignment: 'left',
      activeList: 'alpha',
      isBold: false,
      isItalic: false,
      isUnderline: false,
      isStrikethrough: false,
      hasSelectedVariable: false,
    });
  });
});
