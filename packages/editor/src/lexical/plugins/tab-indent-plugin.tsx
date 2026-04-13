import React, { useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_LOW, KEY_TAB_COMMAND } from 'lexical';
import { indentContent, outdentContent } from '../commands/list-commands';

/**
 * TabIndentPlugin — handles Tab and Shift+Tab for indentation shortcuts.
 *
 * List items use Lexical's native nesting behavior. Regular paragraphs use the
 * editor's first-line indent behavior.
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
