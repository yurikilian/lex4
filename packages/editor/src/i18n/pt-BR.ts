import type { Lex4Translations } from './types';

export const PT_BR_TRANSLATIONS: Lex4Translations = {
  toolbar: {
    undo: 'Desfazer',
    redo: 'Refazer',
    bold: 'Negrito (Ctrl+B)',
    italic: 'Itálico (Ctrl+I)',
    underline: 'Sublinhado (Ctrl+U)',
    strikethrough: 'Tachado',
    alignLeft: 'Alinhar à Esquerda',
    alignCenter: 'Centralizar',
    alignRight: 'Alinhar à Direita',
    justify: 'Justificar',
    numberedList: 'Lista Numerada',
    bulletList: 'Lista com Marcadores',
    indent: 'Aumentar Recuo',
    outdent: 'Diminuir Recuo',
    openHistory: 'Abrir Histórico',
    closeHistory: 'Fechar Histórico',
  },

  history: {
    title: 'Histórico',
    subtitle: 'Histórico de sessão (últimas 100 ações)',
    empty: 'Nenhum histórico ainda.',
    clearHistory: 'Limpar Histórico',
    actions: {
      enabledHeadersFooters: 'Cabeçalhos e rodapés ativados',
      disabledHeadersFooters: 'Cabeçalhos e rodapés desativados',
      copiedHeaderToAll: 'Cabeçalho copiado para todas as páginas',
      copiedFooterToAll: 'Rodapé copiado para todas as páginas',
      clearedHeader: 'Cabeçalho limpo',
      clearedFooter: 'Rodapé limpo',
      clearedAllHeaders: 'Todos os cabeçalhos limpos',
      clearedAllFooters: 'Todos os rodapés limpos',
      pageCounterSet: 'Contador de páginas definido como {{value}}',
      boldApplied: 'Negrito aplicado',
      italicApplied: 'Itálico aplicado',
      underlineApplied: 'Sublinhado aplicado',
      strikethroughApplied: 'Tachado aplicado',
      alignedLeft: 'Alinhado à esquerda',
      alignedCenter: 'Centralizado',
      alignedRight: 'Alinhado à direita',
      justifiedText: 'Texto justificado',
      insertedNumberedList: 'Lista numerada inserida',
      insertedBulletList: 'Lista com marcadores inserida',
      indentedContent: 'Conteúdo recuado',
      outdentedContent: 'Recuo reduzido',
      fontChanged: 'Fonte alterada para {{value}}',
      fontSizeChanged: 'Tamanho da fonte alterado para {{value}}pt',
    },
  },

  variables: {
    title: 'Variáveis',
    available: '{{count}} disponíveis',
    refreshVariables: 'Atualizar variáveis',
    searchPlaceholder: 'Buscar variáveis...',
    noVariablesFound: 'Nenhuma variável encontrada',
    insertVariable: 'Inserir variável {{key}}',
    openPanel: 'Abrir Variáveis',
    closePanel: 'Fechar Variáveis',
  },

  header: {
    placeholder: 'Cabeçalho',
  },

  footer: {
    placeholder: 'Rodapé',
  },

  body: {
    placeholder: 'Comece a digitar...',
  },

  headerFooter: {
    label: 'Cabeçalhos e Rodapés',
  },

  sidebar: {
    close: 'Fechar barra lateral',
  },
};
