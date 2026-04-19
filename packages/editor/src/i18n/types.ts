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
    newVariable: string;
    createVariableTitle: string;
    createVariableLabel: string;
    createVariableKey: string;
    createVariableGroup: string;
    createVariableType: string;
    createVariableSave: string;
    createVariableCancel: string;
    createVariableMissingFields: string;
    createVariableDuplicateKey: string;
  };

  header: {
    placeholder: string;
  };

  footer: {
    placeholder: string;
  };

  body: {
    placeholder: string;
  };

  /** Use {{current}} for current page, {{total}} for total pages */
  pageCounter: {
    format: string;
  };

  /** Region names used in history labels */
  regions: {
    body: string;
    header: string;
    footer: string;
    document: string;
    toolbar: string;
    overflow: string;
    history: string;
    /** Use {{page}} for the page number */
    page: string;
  };

  headerFooter: {
    label: string;
  };

  sidebar: {
    close: string;
  };

  /** History entry labels for editor actions (used in HistoryCapturePlugin & describeAction) */
  historyLabels: {
    typedText: string;
    pastedContent: string;
    insertedLineBreak: string;
    deletedBackward: string;
    deletedForward: string;
    formattedText: string;
    formattedParagraph: string;
    editedBody: string;
    editedHeader: string;
    editedFooter: string;
    clearedDocumentBody: string;
    resizedHeader: string;
    resizedFooter: string;
    addedPage: string;
    removedPage: string;
    documentReflow: string;
    updatedDocument: string;
  };
}
