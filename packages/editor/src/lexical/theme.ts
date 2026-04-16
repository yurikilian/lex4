import type { EditorThemeClasses } from 'lexical';

/**
 * Lexical theme configuration — maps Lexical CSS class names
 * to stable Lex4 class strings for consistent styling.
 */
export const lexicalTheme: EditorThemeClasses = {
  root: 'lex4-root',
  paragraph: 'lex4-paragraph',
  heading: {
    h1: 'lex4-heading lex4-heading-h1',
    h2: 'lex4-heading lex4-heading-h2',
    h3: 'lex4-heading lex4-heading-h3',
    h4: 'lex4-heading lex4-heading-h4',
    h5: 'lex4-heading lex4-heading-h5',
  },
  text: {
    bold: 'lex4-text-bold',
    italic: 'lex4-text-italic',
    underline: 'lex4-text-underline',
    strikethrough: 'lex4-text-strikethrough',
    underlineStrikethrough: 'lex4-text-underline lex4-text-strikethrough',
  },
  list: {
    nested: {
      listitem: 'lex4-listitem-nested',
    },
    ol: 'lex4-list lex4-list-ordered',
    ul: 'lex4-list lex4-list-unordered',
    listitem: 'lex4-listitem',
    listitemChecked: 'lex4-listitem-checked',
    listitemUnchecked: 'lex4-listitem-unchecked',
  },
  quote: 'lex4-quote',
};
