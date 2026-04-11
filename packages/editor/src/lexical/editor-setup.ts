import type { InitialConfigType } from '@lexical/react/LexicalComposer';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';

import { lexicalTheme } from './theme';

export type EditorMode = 'body' | 'header' | 'footer';

/**
 * Creates a Lexical editor configuration for the given mode.
 *
 * Each mode gets its own namespace to avoid conflicts when
 * multiple Lexical editors coexist on the same page.
 */
export function createEditorConfig(
  mode: EditorMode,
  pageId?: string,
): InitialConfigType {
  const namespace = pageId ? `lex4-${mode}-${pageId}` : `lex4-${mode}`;

  return {
    namespace,
    theme: lexicalTheme,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
    onError: (error: Error) => {
      console.error(`[Lex4 ${mode} editor error]`, error);
    },
  };
}
