import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HeaderFooterActions } from '../components/HeaderFooterActions';
import { TranslationsProvider } from '../i18n';

const noop = vi.fn();

function renderActions() {
  render(
    <TranslationsProvider
      translations={{
        headerFooter: {
          settingsLabel: 'Configurações',
          pageCounter: 'Contador',
          pageCounterModes: {
            none: 'Nenhum',
            header: 'Cabeçalho',
            footer: 'Rodapé',
            both: 'Ambos',
          },
          headerSection: 'Seção de cabeçalho',
          footerSection: 'Seção de rodapé',
          copyToAllPages: 'Copiar para todas',
          clearThisPage: 'Limpar esta',
          clearAll: 'Limpar tudo',
        },
      }}
    >
      <HeaderFooterActions
        activePageId="page-1"
        pageCounterMode="none"
        onPageCounterModeChange={noop}
        onCopyHeaderToAll={noop}
        onCopyFooterToAll={noop}
        onClearHeader={noop}
        onClearFooter={noop}
        onClearAllHeaders={noop}
        onClearAllFooters={noop}
      />
    </TranslationsProvider>,
  );
}

describe('HeaderFooterActions', () => {
  it('renders localized header and footer menu labels', () => {
    renderActions();

    fireEvent.click(screen.getByLabelText('Configurações'));

    expect(screen.getByText('Contador')).toBeInTheDocument();
    expect(screen.getByText('Nenhum')).toBeInTheDocument();
    expect(screen.getByText('Cabeçalho')).toBeInTheDocument();
    expect(screen.getByText('Rodapé')).toBeInTheDocument();
    expect(screen.getByText('Ambos')).toBeInTheDocument();
    expect(screen.getByText('Seção de cabeçalho')).toBeInTheDocument();
    expect(screen.getByText('Seção de rodapé')).toBeInTheDocument();
    expect(screen.getAllByText('Copiar para todas')).toHaveLength(2);
    expect(screen.getAllByText('Limpar esta')).toHaveLength(2);
    expect(screen.getAllByText('Limpar tudo')).toHaveLength(2);
  });
});
