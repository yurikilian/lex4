import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createRangeSelectionFromDom,
  $getRoot,
  $setSelection,
  COMMAND_PRIORITY_LOW,
  FOCUS_COMMAND,
} from 'lexical';
import type { LexicalEditor } from 'lexical';
import { useDocument } from '../../context/document-context';
import type { CaretPosition } from '../../types/history';
import { debug } from '../../utils/debug';

interface ActiveEditorPluginProps {
  pageId: string;
  region: CaretPosition['region'];
  onFocus?: (editor: LexicalEditor) => void;
}

function resolveTextOffset(root: HTMLElement, targetOffset: number): { node: Node; offset: number } {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let remaining = targetOffset;
  let currentNode = walker.nextNode();
  let lastTextNode: Node | null = null;

  while (currentNode) {
    const textLength = currentNode.textContent?.length ?? 0;
    if (remaining <= textLength) {
      return { node: currentNode, offset: remaining };
    }

    remaining -= textLength;
    lastTextNode = currentNode;
    currentNode = walker.nextNode();
  }

  if (lastTextNode) {
    return {
      node: lastTextNode,
      offset: lastTextNode.textContent?.length ?? 0,
    };
  }

  return {
    node: root,
    offset: root.childNodes.length,
  };
}

/**
 * ActiveEditorPlugin — Registers the editor in the document context on focus.
 *
 * This enables the toolbar to dispatch commands (bold, italic, etc.)
 * to whichever editor the user is currently editing.
 */
export const ActiveEditorPlugin: React.FC<ActiveEditorPluginProps> = ({
  pageId,
  region,
  onFocus,
}) => {
  const [editor] = useLexicalComposerContext();
  const {
    consumePendingCaretPosition,
    consumePendingFocusAtEnd,
    focusAtEndVersion,
    setActiveEditor,
    setActivePageId,
  } = useDocument();

  useEffect(() => {
    const caretPosition: CaretPosition = { pageId, region };
    const selectionToRestore = consumePendingCaretPosition(caretPosition);
    if (selectionToRestore === undefined) {
      return;
    }

    requestAnimationFrame(() => {
      setActivePageId(pageId);
      setActiveEditor(editor, caretPosition);
      editor.focus();
      if (!selectionToRestore) {
        return;
      }

      requestAnimationFrame(() => {
        const rootElement = editor.getRootElement();
        const domSelection = window.getSelection();
        if (!rootElement || !domSelection) {
          return;
        }

        const anchorPoint = resolveTextOffset(rootElement, selectionToRestore.anchorTextOffset);
        const focusPoint = resolveTextOffset(rootElement, selectionToRestore.focusTextOffset);
        const range = document.createRange();
        range.setStart(anchorPoint.node, anchorPoint.offset);
        range.setEnd(focusPoint.node, focusPoint.offset);

        domSelection.removeAllRanges();
        domSelection.addRange(range);

        editor.update(() => {
          const nextSelection = $createRangeSelectionFromDom(window.getSelection(), editor);
          if (nextSelection) {
            $setSelection(nextSelection);
          }
        });
      });
    });
  }, [consumePendingCaretPosition, editor, pageId, region, setActiveEditor, setActivePageId]);

  useEffect(() => {
    const caretPosition: CaretPosition = { pageId, region };
    if (!consumePendingFocusAtEnd(caretPosition)) {
      return;
    }

    requestAnimationFrame(() => {
      setActivePageId(pageId);
      setActiveEditor(editor, caretPosition);
      editor.focus(() => {
        editor.update(() => {
          $getRoot().selectEnd();
        });
      });
    });
  }, [
    consumePendingFocusAtEnd,
    editor,
    focusAtEndVersion,
    pageId,
    region,
    setActiveEditor,
    setActivePageId,
  ]);

  useEffect(() => {
    return editor.registerCommand(
      FOCUS_COMMAND,
      () => {
        debug('focus', `editor focused (ns=${editor.getKey()})`);
        setActivePageId(pageId);
        setActiveEditor(editor, { pageId, region });
        onFocus?.(editor);
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, onFocus, pageId, region, setActiveEditor, setActivePageId]);

  return null;
};
