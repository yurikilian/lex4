/**
 * Lex4Translations — All UI strings used by the editor.
 *
 * Consumers can pass `Partial<Lex4Translations>` to override
 * any subset of strings for localization purposes.
 */
export interface Lex4Translations {
  toolbar: {
    undo: string;
    redo: string;
    bold: string;
    italic: string;
    underline: string;
    strikethrough: string;
    alignLeft: string;
    alignCenter: string;
    alignRight: string;
    justify: string;
    numberedList: string;
    bulletList: string;
    indent: string;
    outdent: string;
    openHistory: string;
    closeHistory: string;
  };

  history: {
    title: string;
    subtitle: string;
    empty: string;
    clearHistory: string;
    actions: {
      enabledHeadersFooters: string;
      disabledHeadersFooters: string;
      copiedHeaderToAll: string;
      copiedFooterToAll: string;
      clearedHeader: string;
      clearedFooter: string;
      clearedAllHeaders: string;
      clearedAllFooters: string;
      /** Use {{value}} for the mode name */
      pageCounterSet: string;
      boldApplied: string;
      italicApplied: string;
      underlineApplied: string;
      strikethroughApplied: string;
      alignedLeft: string;
      alignedCenter: string;
      alignedRight: string;
      justifiedText: string;
      insertedNumberedList: string;
      insertedBulletList: string;
      indentedContent: string;
      outdentedContent: string;
      /** Use {{value}} for the font name */
      fontChanged: string;
      /** Use {{value}} for the size */
      fontSizeChanged: string;
    };
  };

  variables: {
    title: string;
    /** Use {{count}} for the number of available variables */
    available: string;
    refreshVariables: string;
    searchPlaceholder: string;
    noVariablesFound: string;
    /** Use {{key}} for the variable key */
    insertVariable: string;
    openPanel: string;
    closePanel: string;
  };

  header: {
    placeholder: string;
  };

  footer: {
    placeholder: string;
  };

  sidebar: {
    close: string;
  };
}
