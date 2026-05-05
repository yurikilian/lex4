import { fireEvent, render, screen } from '@testing-library/react';
import { KEY_DOWN_COMMAND } from 'lexical';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VariableNode } from '../variables/variable-node';

const mocks = vi.hoisted(() => ({
  selection: {
    isSelected: false,
  },
  editor: {
    registerCommand: vi.fn(() => () => {}),
    update: vi.fn((callback: () => void) => callback()),
  },
  node: null as unknown as {
    selectPrevious: ReturnType<typeof vi.fn>;
    selectNext: ReturnType<typeof vi.fn>;
  },
  clearOtherSelections: vi.fn(),
  setSelected: vi.fn(),
}));

vi.mock('@lexical/react/LexicalComposerContext', () => ({
  useLexicalComposerContext: () => [mocks.editor],
}));

vi.mock('@lexical/react/useLexicalNodeSelection', () => ({
  useLexicalNodeSelection: () => [
    mocks.selection.isSelected,
    mocks.setSelected,
    mocks.clearOtherSelections,
  ],
}));

vi.mock('../variables/variable-context', () => ({
  useVariables: () => ({
    getDefinition: () => ({
      label: 'Customer name',
      group: 'customer',
    }),
  }),
}));

vi.mock('lexical', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lexical')>();

  return {
    ...actual,
    $getNodeByKey: () => mocks.node,
    $getSelection: () => null,
    $isNodeSelection: () => false,
  };
});

function renderVariableChip() {
  return render(
    VariableNode.prototype.decorate.call({
      __key: 'variable-node-key',
      __variableKey: 'customer.name',
      __format: 0,
      __style: '',
    } as VariableNode),
  );
}

describe('VariableChip', () => {
  beforeEach(() => {
    mocks.selection.isSelected = false;
    vi.clearAllMocks();
    mocks.node = Object.assign(Object.create(VariableNode.prototype), {
      selectPrevious: vi.fn(),
      selectNext: vi.fn(),
    });
  });

  it('toggles node selection when clicked', () => {
    renderVariableChip();

    fireEvent.click(screen.getByTestId('variable-chip-customer.name'));

    expect(mocks.clearOtherSelections).toHaveBeenCalledTimes(1);
    expect(mocks.setSelected).toHaveBeenCalledWith(true);
  });

  it('moves the caret around a selected variable with arrow keys', () => {
    mocks.selection.isSelected = true;

    renderVariableChip();

    const keyDownHandler = mocks.editor.registerCommand.mock.calls.find(
      ([command]) => command === KEY_DOWN_COMMAND,
    )?.[1];

    expect(keyDownHandler).toBeTypeOf('function');

    const moveRightEvent = {
      key: 'ArrowRight',
      metaKey: false,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;
    const moveLeftEvent = {
      key: 'ArrowLeft',
      metaKey: false,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    expect(keyDownHandler?.(moveRightEvent)).toBe(true);
    expect(moveRightEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(mocks.node.selectNext).toHaveBeenCalledTimes(1);

    expect(keyDownHandler?.(moveLeftEvent)).toBe(true);
    expect(moveLeftEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(mocks.node.selectPrevious).toHaveBeenCalledTimes(1);
  });
});
