import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BlockTypePicker } from '../components/BlockTypePicker';
import { TranslationsProvider } from '../i18n';

describe('BlockTypePicker', () => {
  it('renders localized block type options and applies a heading selection', () => {
    const handleChange = vi.fn();

    render(
      <TranslationsProvider
        translations={{
          toolbar: {
            blockType: 'Tipo de bloco',
            paragraph: 'Parágrafo',
            heading1: 'Título 1',
            heading2: 'Título 2',
            heading3: 'Título 3',
            heading4: 'Título 4',
            heading5: 'Título 5',
            heading6: 'Título 6',
          },
        }}
      >
        <BlockTypePicker value="h2" onChange={handleChange} />
      </TranslationsProvider>,
    );

    expect(screen.getByTestId('block-type-selector')).toHaveTextContent('H2');

    fireEvent.click(screen.getByTestId('block-type-selector'));

    expect(screen.getByText('Parágrafo')).toBeInTheDocument();
    expect(screen.getByText('Título 1')).toBeInTheDocument();
    expect(screen.getByText('Título 6')).toBeInTheDocument();
    expect(screen.getByText('H1')).toBeInTheDocument();
    expect(screen.getByText('H6')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('block-type-option-h4'));

    expect(handleChange).toHaveBeenCalledWith('h4');
    expect(screen.queryByTestId('block-type-menu')).not.toBeInTheDocument();
  });
});
