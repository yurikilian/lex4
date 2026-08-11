import { fireEvent, render, screen } from '@testing-library/react';
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

  it('applies inline font weight styles from the stored variable style', () => {
    renderVariableChip('font-size: 22.5pt; font-weight: 700');

    const chip = screen.getByTestId('variable-chip-customer.name');

    expect(chip).toHaveStyle({ fontWeight: '700' });
    // jsdom >= 26 normalises absolute length units in computed styles
    // (`getComputedStyle(el).fontSize` reports `30px` for `22.5pt`), so the
    // point value is asserted on the inline style declaration instead.
    expect(chip.style.fontSize).toBe('22.5pt');
  });
});
