import { fireEvent, render, screen } from '@testing-library/react';
import { KEY_DOWN_COMMAND } from 'lexical';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VariableNode } from '../variables/variable-node';

const mocks = vi.hoisted(() => ({
  selection: {
    isSelected: false,
    current: null as unknown,
  },
  editor: {
    registerCommand: vi.fn(() => () => {}),
    update: vi.fn((callback: () => void) => callback()),
    focus: vi.fn((callback?: () => void) => callback?.()),
  },
  node: null as unknown as {
    getKey: () => string;
    selectPrevious: ReturnType<typeof vi.fn>;
    selectNext: ReturnType<typeof vi.fn>;
  },
  nodeSelection: {
    add: vi.fn(),
  },
  setSelection: vi.fn(),
}));

vi.mock('@lexical/react/LexicalComposerContext', () => ({
  useLexicalComposerContext: () => [mocks.editor],
}));

vi.mock('@lexical/react/useLexicalNodeSelection', () => ({
  useLexicalNodeSelection: () => [
    mocks.selection.isSelected,
    vi.fn(),
    vi.fn(),
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
    $createNodeSelection: () => mocks.nodeSelection,
    $getSelection: () => mocks.selection.current,
    $isNodeSelection: (selection: unknown) => selection === mocks.selection.current,
    $setSelection: mocks.setSelection,
  };
});

function renderVariableChip(style = '') {
  return render(
    VariableNode.prototype.decorate.call({
      __key: 'variable-node-key',
      __variableKey: 'customer.name',
      __format: 0,
      __style: style,
    } as VariableNode),
  );
}

describe('VariableChip', () => {
  beforeEach(() => {
    mocks.selection.isSelected = false;
    mocks.selection.current = null;
    vi.clearAllMocks();
    mocks.node = Object.assign(Object.create(VariableNode.prototype), {
      getKey: () => 'variable-node-key',
      selectPrevious: vi.fn(),
      selectNext: vi.fn(),
    });
  });

  it('selects the variable on mouse down', () => {
    renderVariableChip();

    fireEvent.mouseDown(screen.getByTestId('variable-chip-customer.name'));

    expect(mocks.editor.focus).toHaveBeenCalledTimes(1);
    expect(mocks.nodeSelection.add).toHaveBeenCalledWith('variable-node-key');
    expect(mocks.setSelection).toHaveBeenCalledWith(mocks.nodeSelection);
  });

  it('keeps an already-selected variable selected when clicked again', () => {
    mocks.selection.isSelected = true;

    renderVariableChip();

    fireEvent.mouseDown(screen.getByTestId('variable-chip-customer.name'));

    expect(mocks.editor.focus).not.toHaveBeenCalled();
    expect(mocks.setSelection).not.toHaveBeenCalled();
  });

  it('extends variable selection on shift+mouse down', () => {
    mocks.selection.current = {
      getNodes: () => [mocks.node],
    };

    renderVariableChip();

    fireEvent.mouseDown(screen.getByTestId('variable-chip-customer.name'), { shiftKey: true });

    expect(mocks.editor.focus).toHaveBeenCalledTimes(1);
    expect(mocks.nodeSelection.add).toHaveBeenNthCalledWith(1, 'variable-node-key');
    expect(mocks.nodeSelection.add).toHaveBeenNthCalledWith(2, 'variable-node-key');
    expect(mocks.setSelection).toHaveBeenCalledWith(mocks.nodeSelection);
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

  it('applies inline font weight styles from the stored variable style', () => {
    renderVariableChip('font-size: 22.5pt; font-weight: 700');

    expect(screen.getByTestId('variable-chip-customer.name')).toHaveStyle({
      fontSize: '22.5pt',
      fontWeight: '700',
    });
  });
});
