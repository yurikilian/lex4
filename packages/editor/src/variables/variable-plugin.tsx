import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $createTextNode,
  $createRangeSelectionFromDom,
  $isNodeSelection,
  $isRangeSelection,
  $setSelection,
  $insertNodes,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_EDITOR,
  KEY_DOWN_COMMAND,
  mergeRegister,
} from 'lexical';
import { $createVariableNode } from './variable-node';
import { VariableCaretNode } from './variable-caret-node';
import { INSERT_VARIABLE_COMMAND } from './variable-commands';
import { $handleVariableArrowNavigation } from './variable-navigation';

/**
 * VariablePlugin — registers the INSERT_VARIABLE_COMMAND handler.
 *
 * When the command fires, a VariableNode is created and inserted
 * at the current selection position.
 */
export const VariablePlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const domSelectionClearTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        INSERT_VARIABLE_COMMAND,
        (variableKey: string) => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return false;

          const variableNode = $createVariableNode(variableKey);
          $insertNodes([variableNode]);
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        (event) => {
          if (domSelectionClearTimerRef.current !== null && typeof window !== 'undefined') {
            window.clearTimeout(domSelectionClearTimerRef.current);
            domSelectionClearTimerRef.current = null;
          }
          if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
            return false;
          }

          const direction = event.key === 'ArrowLeft'
            ? 'previous'
            : event.key === 'ArrowRight'
              ? 'next'
              : null;
          const currentSelection = $getSelection();
          if (
            direction !== null
            && $isRangeSelection(currentSelection)
            && typeof window !== 'undefined'
          ) {
            const domSelection = window.getSelection();
            if (domSelection && domSelection.rangeCount > 0) {
              const domRangeSelection = $createRangeSelectionFromDom(domSelection, editor);
              if (domRangeSelection) {
                $setSelection(domRangeSelection);
              }
            }
          }
          const handled = direction === null ? false : $handleVariableArrowNavigation(direction);
          if (direction === null || !handled) {
            return false;
          }
          event.preventDefault();
          if ($isNodeSelection($getSelection()) && typeof window !== 'undefined') {
            domSelectionClearTimerRef.current = window.setTimeout(() => {
              window.getSelection()?.removeAllRanges();
              domSelectionClearTimerRef.current = null;
            }, 0);
          }
          return true;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerNodeTransform(VariableCaretNode, (node) => {
        const text = node.getTextWithoutAnchor();
        if (text.length === 0) {
          return;
        }

        const replacement = $createTextNode(text)
          .setFormat(node.getFormat())
          .setStyle(node.getStyle());
        node.replace(replacement);
      }),
      () => {
        if (domSelectionClearTimerRef.current !== null && typeof window !== 'undefined') {
          window.clearTimeout(domSelectionClearTimerRef.current);
        }
      },
    );
  }, [editor]);

  return null;
};
