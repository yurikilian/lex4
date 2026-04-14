import type { EditorThemeClasses } from 'lexical';

/**
 * Lexical theme configuration — maps Lexical CSS class names
 * to Tailwind-compatible class strings for consistent styling.
 */
export const lexicalTheme: EditorThemeClasses = {
  root: 'lex4-root outline-none',
  paragraph: 'lex4-paragraph text-justify',
  heading: {
    h1: 'text-3xl font-bold mb-2',
    h2: 'text-2xl font-bold mb-2',
    h3: 'text-xl font-semibold mb-1',
    h4: 'text-lg font-semibold mb-1',
    h5: 'text-base font-medium mb-1',
  },
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    underlineStrikethrough: 'underline line-through',
  },
  list: {
    nested: {
      listitem: 'list-none',
    },
    ol: 'list-decimal ml-6',
    ul: 'list-disc ml-6',
    listitem: 'lex4-listitem',
    listitemChecked: 'lex4-listitem-checked',
    listitemUnchecked: 'lex4-listitem-unchecked',
  },
  quote: 'border-l-4 border-gray-300 pl-4 italic text-gray-600',
};
