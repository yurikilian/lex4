import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  COMMAND_PRIORITY_HIGH,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_DOWN_COMMAND,
} from 'lexical';

interface PageBoundaryPluginProps {
  onBackspaceAtStart: () => void;
  onDeleteAtEnd: () => void;
  onMoveToPreviousPage: () => void;
  onMoveToNextPage: () => void;
}

interface CollapsedTextPosition {
  textOffset: number;
  totalTextLength: number;
}

function getCollapsedTextPosition(rootElement: HTMLElement | null): CollapsedTextPosition | null {
  const domSelection = window.getSelection();
  if (!rootElement || !domSelection || domSelection.rangeCount === 0 || !domSelection.isCollapsed) {
    return null;
  }

  const range = domSelection.getRangeAt(0);
  if (!rootElement.contains(range.startContainer)) {
    return null;
  }

  const offsetRange = document.createRange();
  offsetRange.setStart(rootElement, 0);
  offsetRange.setEnd(range.startContainer, range.startOffset);

  const contentRange = document.createRange();
  contentRange.selectNodeContents(rootElement);

  return {
    textOffset: offsetRange.toString().length,
    totalTextLength: contentRange.toString().length,
  };
}

export const PageBoundaryPlugin: React.FC<PageBoundaryPluginProps> = ({
  onBackspaceAtStart,
  onDeleteAtEnd,
  onMoveToPreviousPage,
  onMoveToNextPage,
}) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => editor.registerCommand(
    KEY_BACKSPACE_COMMAND,
    () => {
      const position = getCollapsedTextPosition(editor.getRootElement());
      if (!position || position.textOffset !== 0) {
        return false;
      }

      onBackspaceAtStart();
      return true;
    },
    COMMAND_PRIORITY_HIGH,
  ), [editor, onBackspaceAtStart]);

  useEffect(() => editor.registerCommand(
    KEY_DELETE_COMMAND,
    () => {
      const position = getCollapsedTextPosition(editor.getRootElement());
      if (!position || position.textOffset !== position.totalTextLength) {
        return false;
      }

      onDeleteAtEnd();
      return true;
    },
    COMMAND_PRIORITY_HIGH,
  ), [editor, onDeleteAtEnd]);

  useEffect(() => editor.registerCommand(
    KEY_DOWN_COMMAND,
    (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
        return false;
      }

      const position = getCollapsedTextPosition(editor.getRootElement());
      if (!position) {
        return false;
      }

      if ((event.key === 'ArrowLeft' || event.key === 'ArrowUp') && position.textOffset === 0) {
        event.preventDefault();
        onMoveToPreviousPage();
        return true;
      }

      if (
        (event.key === 'ArrowRight' || event.key === 'ArrowDown')
        && position.textOffset === position.totalTextLength
      ) {
        event.preventDefault();
        onMoveToNextPage();
        return true;
      }

      return false;
    },
    COMMAND_PRIORITY_HIGH,
  ), [editor, onMoveToNextPage, onMoveToPreviousPage]);

  return null;
};
