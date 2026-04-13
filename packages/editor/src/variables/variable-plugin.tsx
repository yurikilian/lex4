import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $insertNodes,
  COMMAND_PRIORITY_EDITOR,
} from 'lexical';
import { $createVariableNode } from './variable-node';
import { INSERT_VARIABLE_COMMAND } from './variable-commands';

/**
 * VariablePlugin — registers the INSERT_VARIABLE_COMMAND handler.
 *
 * When the command fires, a VariableNode is created and inserted
 * at the current selection position.
 */
export const VariablePlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_VARIABLE_COMMAND,
      (variableKey: string) => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;

          const variableNode = $createVariableNode(variableKey);
          $insertNodes([variableNode]);
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
};
