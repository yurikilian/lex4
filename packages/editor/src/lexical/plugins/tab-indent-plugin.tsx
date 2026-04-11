import React, { useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_LOW, KEY_TAB_COMMAND } from 'lexical';
import { indentContent, outdentContent } from '../commands/list-commands';

/**
 * TabIndentPlugin — handles Tab and Shift+Tab for list indentation.
 *
 * Tab = indent (up to 4 levels managed by Lexical's indent logic)
 * Shift+Tab = outdent
 */
export const TabIndentPlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext();

  const handleTab = useCallback(
    (event: KeyboardEvent) => {
      event.preventDefault();
      if (event.shiftKey) {
        outdentContent(editor);
      } else {
        indentContent(editor);
      }
      return true;
    },
    [editor],
  );

  React.useEffect(() => {
    return editor.registerCommand(KEY_TAB_COMMAND, handleTab, COMMAND_PRIORITY_LOW);
  }, [editor, handleTab]);

  return null;
};
