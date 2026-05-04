import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Lex4Editor } from '../components/Lex4Editor';
import type { Lex4EditorHandle } from '../types/editor-handle';
import { createEmptyDocument } from '../types/document';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;

function CallbackRefHarness() {
  const [handle, setHandle] = useState<Lex4EditorHandle | null>(null);

  return (
    <div>
      <span data-testid="handle-status">{handle ? 'ready' : 'pending'}</span>
      <Lex4Editor
        ref={setHandle}
        initialDocument={createEmptyDocument()}
      />
    </div>
  );
}

describe('Lex4Editor imperative handle', () => {
  it('supports storing the callback ref in parent state without triggering an update loop', () => {
    render(<CallbackRefHarness />);

    expect(screen.getByTestId('handle-status')).toHaveTextContent('ready');
    expect(screen.getByTestId('lex4-editor')).toBeInTheDocument();
  });
});
