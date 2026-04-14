import type { Lex4Translations } from './types';

export const DEFAULT_TRANSLATIONS: Lex4Translations = {
  toolbar: {
    undo: 'Undo',
    redo: 'Redo',
    bold: 'Bold (Ctrl+B)',
    italic: 'Italic (Ctrl+I)',
    underline: 'Underline (Ctrl+U)',
    strikethrough: 'Strikethrough',
    alignLeft: 'Align Left',
    alignCenter: 'Align Center',
    alignRight: 'Align Right',
    justify: 'Justify',
    numberedList: 'Numbered List',
    bulletList: 'Bullet List',
    indent: 'Indent',
    outdent: 'Outdent',
    openHistory: 'Open History',
    closeHistory: 'Close History',
  },

  history: {
    title: 'History',
    subtitle: 'Word-style session history (last 100 actions)',
    empty: 'No history yet.',
    clearHistory: 'Clear History',
    actions: {
      enabledHeadersFooters: 'Enabled headers and footers',
      disabledHeadersFooters: 'Disabled headers and footers',
      copiedHeaderToAll: 'Copied header to all pages',
      copiedFooterToAll: 'Copied footer to all pages',
      clearedHeader: 'Cleared header',
      clearedFooter: 'Cleared footer',
      clearedAllHeaders: 'Cleared all headers',
      clearedAllFooters: 'Cleared all footers',
      pageCounterSet: 'Page counter set to {{value}}',
      boldApplied: 'Bold applied',
      italicApplied: 'Italic applied',
      underlineApplied: 'Underline applied',
      strikethroughApplied: 'Strikethrough applied',
      alignedLeft: 'Aligned left',
      alignedCenter: 'Aligned center',
      alignedRight: 'Aligned right',
      justifiedText: 'Justified text',
      insertedNumberedList: 'Inserted numbered list',
      insertedBulletList: 'Inserted bullet list',
      indentedContent: 'Indented content',
      outdentedContent: 'Outdented content',
      fontChanged: 'Font changed to {{value}}',
      fontSizeChanged: 'Font size changed to {{value}}pt',
    },
  },

  variables: {
    title: 'Variables',
    available: '{{count}} available',
    refreshVariables: 'Refresh variables',
    searchPlaceholder: 'Search variables...',
    noVariablesFound: 'No variables found',
    insertVariable: 'Insert variable {{key}}',
    openPanel: 'Open Variables',
    closePanel: 'Close Variables',
  },

  header: {
    placeholder: 'Header',
  },

  footer: {
    placeholder: 'Footer',
  },

  body: {
    placeholder: 'Start typing...',
  },

  headerFooter: {
    label: 'Headers & Footers',
  },

  sidebar: {
    close: 'Close sidebar',
  },
};
