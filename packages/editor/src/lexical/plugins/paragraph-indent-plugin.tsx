import React, { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $isElementNode, $isParagraphNode, type ElementNode } from 'lexical';

const FIRST_LINE_INDENT_PX = 40;

function visitElements(node: ElementNode, callback: (element: ElementNode) => void): void {
  callback(node);

  for (const child of node.getChildren()) {
    if ($isElementNode(child)) {
      visitElements(child, callback);
    }
  }
}

/**
 * Applies Word-like first-line paragraph indentation in the DOM while leaving
 * Lexical's serialized paragraph indent levels intact.
 */
export const ParagraphIndentPlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const syncParagraphIndents = () => editor.getEditorState().read(() => {
      visitElements($getRoot(), node => {
        if (!$isParagraphNode(node)) {
          return;
        }

        const element = editor.getElementByKey(node.getKey());
        if (!(element instanceof HTMLElement)) {
          return;
        }

        const indent = node.getIndent();
        element.style.paddingInlineStart = '0px';
        element.style.textIndent = indent > 0 ? `${indent * FIRST_LINE_INDENT_PX}px` : '';
      });
    });

    syncParagraphIndents();

    return editor.registerUpdateListener(() => {
      syncParagraphIndents();
    });
  }, [editor]);

  return null;
};
