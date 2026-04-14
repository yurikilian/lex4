import type { InitialConfigType } from '@lexical/react/LexicalComposer';
import type { EditorThemeClasses, Klass, LexicalNode } from 'lexical';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';

import { lexicalTheme } from './theme';

export type EditorMode = 'body' | 'header' | 'footer';

const DEFAULT_NODES: Klass<LexicalNode>[] = [HeadingNode, QuoteNode, ListNode, ListItemNode];

/**
 * Creates a Lexical editor configuration for the given mode.
 *
 * Each mode gets its own namespace to avoid conflicts when
 * multiple Lexical editors coexist on the same page.
 *
 * @param extraNodes - Additional node classes contributed by extensions
 * @param themeOverrides - Theme class overrides from extensions
 */
export function createEditorConfig(
  mode: EditorMode,
  pageId?: string,
  extraNodes: Klass<LexicalNode>[] = [],
  themeOverrides: Partial<EditorThemeClasses> = {},
): InitialConfigType {
  const namespace = pageId ? `lex4-${mode}-${pageId}` : `lex4-${mode}`;

  return {
    namespace,
    theme: { ...lexicalTheme, ...themeOverrides },
    nodes: [...DEFAULT_NODES, ...extraNodes],
    onError: (error: Error) => {
      console.error(`[Lex4 ${mode} editor error]`, error);
    },
  };
}
