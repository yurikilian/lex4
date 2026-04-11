import React, { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_LOW } from 'lexical';
import { PASTE_COMMAND } from 'lexical';

interface PastePluginProps {
  onPasteComplete?: () => void;
}

/**
 * PastePlugin — normalizes paste behavior and triggers repagination
 * after paste completes.
 *
 * Listens for paste commands and fires a callback so the pagination
 * engine can reflow content.
 */
export const PastePlugin: React.FC<PastePluginProps> = ({ onPasteComplete }) => {
  const [editor] = useLexicalComposerContext();
  const callbackRef = useRef(onPasteComplete);
  callbackRef.current = onPasteComplete;

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      () => {
        // Let default paste handling execute first,
        // then trigger repagination on next tick
        requestAnimationFrame(() => {
          callbackRef.current?.();
        });
        return false; // Don't prevent default paste
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  return null;
};
