import { describe, expect, it, vi } from 'vitest';
import type { LexicalEditor } from 'lexical';
import { readSelectedVariableFormatting } from '../variables/variable-formatting';

const selectionState = {
  selection: null as unknown,
};

vi.mock('lexical', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lexical')>();

  return {
    ...actual,
    $getSelection: () => selectionState.selection,
    $isNodeSelection: (selection: unknown) =>
      !!selection && (selection as { kind?: string }).kind === 'node',
  };
});

vi.mock('../variables/variable-node', () => ({
  $isVariableNode: () => true,
}));

describe('readSelectedVariableFormatting', () => {
  it('reads selected variable styles inside the lexical read cycle', () => {
    let canReadNode = false;

    const node = {
      getStyle: vi.fn(() => {
        if (!canReadNode) {
          throw new Error('read outside editor state');
        }

        return 'font-family: Inter; font-size: 16pt';
      }),
    };

    selectionState.selection = {
      kind: 'node',
      getNodes: () => [node],
    };

    const editor = {
      getEditorState: () => ({
        read: (callback: () => void) => {
          canReadNode = true;
          try {
            callback();
          } finally {
            canReadNode = false;
          }
        },
      }),
      getRootElement: () => null,
    } as unknown as LexicalEditor;

    expect(readSelectedVariableFormatting(editor)).toEqual({
      fontFamily: 'Inter',
      fontSize: 16,
    });
    expect(node.getStyle).toHaveBeenCalledTimes(1);
  });
});
