import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ExtensionProvider, useExtensions } from '../extensions/extension-context';
import type { Lex4Extension } from '../extensions';

function RootClassConsumer() {
  const { rootClassNames } = useExtensions();
  return <div data-testid="root-classes">{rootClassNames.join(' ')}</div>;
}

function createExtension(rootClassName: string): Lex4Extension {
  return {
    name: 'test-extension',
    rootClassName,
  };
}

describe('ExtensionProvider', () => {
  it('updates resolved extensions when an extension instance changes without changing its name', () => {
    const { rerender } = render(
      <ExtensionProvider extensions={[createExtension('state-a')]}>
        <RootClassConsumer />
      </ExtensionProvider>,
    );

    expect(screen.getByTestId('root-classes')).toHaveTextContent('state-a');

    rerender(
      <ExtensionProvider extensions={[createExtension('state-b')]}>
        <RootClassConsumer />
      </ExtensionProvider>,
    );

    expect(screen.getByTestId('root-classes')).toHaveTextContent('state-b');
  });
});
