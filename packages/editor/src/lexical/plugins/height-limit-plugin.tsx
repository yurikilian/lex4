import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_CRITICAL, KEY_ENTER_COMMAND, PASTE_COMMAND } from 'lexical';
import { debug } from '../../utils/debug';

/**
 * HeightLimitPlugin — Prevents editing that would push content beyond
 * a maximum height. Instead of clipping overflow, this plugin reverts
 * any change that makes the editor's scrollHeight exceed maxHeight.
 *
 * Works by:
 * 1. Blocking Enter key when already at max height
 * 2. Saving editor state before each update, reverting if scrollHeight exceeds limit
 * 3. Truncating paste content that would overflow
 */
export function HeightLimitPlugin({ maxHeight, channel }: { maxHeight: number; channel: 'header' | 'footer' }) {
  const [editor] = useLexicalComposerContext();
  const lastGoodStateRef = useRef<string | null>(null);
  const isRevertingRef = useRef(false);

  useEffect(() => {
    // Save initial state as "last good"
    lastGoodStateRef.current = JSON.stringify(editor.getEditorState().toJSON());

    // Intercept Enter key when at max height
    const removeEnterCommand = editor.registerCommand(
      KEY_ENTER_COMMAND,
      () => {
        const root = editor.getRootElement();
        if (root && root.scrollHeight >= maxHeight) {
          debug(channel, `blocked Enter — scrollHeight ${root.scrollHeight}px >= max ${maxHeight}px`);
          return true; // Prevent the Enter
        }
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );

    // Intercept paste when at max height
    const removePasteCommand = editor.registerCommand(
      PASTE_COMMAND,
      () => {
        const root = editor.getRootElement();
        if (root && root.scrollHeight >= maxHeight) {
          debug(channel, `blocked paste — scrollHeight ${root.scrollHeight}px >= max ${maxHeight}px`);
          return true; // Prevent the paste
        }
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );

    // After each update, check if content exceeds max height and revert if so
    const removeUpdateListener = editor.registerUpdateListener(({ editorState, prevEditorState }) => {
      if (isRevertingRef.current) return;

      const root = editor.getRootElement();
      if (!root) return;
      const hadFocus = document.activeElement === root || root.contains(document.activeElement);
      // Use requestAnimationFrame to read DOM after paint
      requestAnimationFrame(() => {
        if (root.scrollHeight > maxHeight) {
          debug(channel, `reverting — scrollHeight ${root.scrollHeight}px > max ${maxHeight}px`);
          // The listener's prevEditorState can be an intermediate batched
          // update (not the last visible text). Prefer the DOM-confirmed last
          // good snapshot so rejecting a paste never trims valid suffix text.
          const restoreState =
            lastGoodStateRef.current || JSON.stringify(prevEditorState.toJSON());
          if (!restoreState) {
            return;
          }
          isRevertingRef.current = true;

          editor.setEditorState(editor.parseEditorState(restoreState));

          isRevertingRef.current = false;
          if (hadFocus) {
            // setEditorState may detach focus while rejecting an oversized
            // paste. Restore it on the next paint, after Lexical commits the
            // restored DOM and without disturbing ordinary typing updates.
            requestAnimationFrame(() => editor.focus());
          }
        } else {
          // Content fits — save as last good state
          lastGoodStateRef.current = JSON.stringify(editorState.toJSON());
        }
      });
    });

    return () => {
      removeEnterCommand();
      removePasteCommand();
      removeUpdateListener();
    };
  }, [editor, maxHeight, channel]);

  return null;
}
