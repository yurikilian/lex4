import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_LOW, FOCUS_COMMAND } from 'lexical';
import type { LexicalEditor } from 'lexical';
import { debug } from '../../utils/debug';

interface ActiveEditorPluginProps {
  onFocus: (editor: LexicalEditor) => void;
}

/**
 * ActiveEditorPlugin — Registers the editor in the document context on focus.
 *
 * This enables the toolbar to dispatch commands (bold, italic, etc.)
 * to whichever editor the user is currently editing.
 */
export const ActiveEditorPlugin: React.FC<ActiveEditorPluginProps> = ({ onFocus }) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      FOCUS_COMMAND,
      () => {
        debug('focus', `editor focused (ns=${editor.getKey()})`);
        onFocus(editor);
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, onFocus]);

  return null;
};
