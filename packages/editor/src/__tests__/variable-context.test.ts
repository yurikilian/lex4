import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { VariableProvider, useVariables } from '../variables/variable-context';
import type { VariableDefinition } from '../variables/types';

function createWrapper(initialDefs: VariableDefinition[] = []) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(VariableProvider, { initialDefinitions: initialDefs }, children);
}

describe('VariableContext', () => {
  it('provides initial definitions', () => {
    const defs: VariableDefinition[] = [
      { key: 'customer.name', label: 'Customer Name' },
    ];

    const { result } = renderHook(() => useVariables(), {
      wrapper: createWrapper(defs),
    });

    expect(result.current.definitions).toHaveLength(1);
    expect(result.current.definitions[0].key).toBe('customer.name');
  });

  it('provides empty definitions by default', () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: createWrapper(),
    });

    expect(result.current.definitions).toEqual([]);
  });

  it('getDefinition returns matching definition', () => {
    const defs: VariableDefinition[] = [
      { key: 'customer.name', label: 'Customer Name' },
      { key: 'proposal.date', label: 'Proposal Date' },
    ];

    const { result } = renderHook(() => useVariables(), {
      wrapper: createWrapper(defs),
    });

    const found = result.current.getDefinition('proposal.date');
    expect(found?.label).toBe('Proposal Date');
  });

  it('getDefinition returns undefined for unknown key', () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: createWrapper([{ key: 'x', label: 'X' }]),
    });

    expect(result.current.getDefinition('unknown')).toBeUndefined();
  });

  it('refreshDefinitions updates definitions', () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: createWrapper([{ key: 'old', label: 'Old' }]),
    });

    act(() => {
      result.current.refreshDefinitions([
        { key: 'new.key', label: 'New Key' },
        { key: 'another', label: 'Another' },
      ]);
    });

    expect(result.current.definitions).toHaveLength(2);
    expect(result.current.definitions[0].key).toBe('new.key');
  });

  it('throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useVariables());
    }).toThrow('useVariables must be used within a VariableProvider');
  });
});
