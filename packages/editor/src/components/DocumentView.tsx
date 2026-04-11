import React, { useCallback } from 'react';
import { useDocument } from '../context/document-context';
import { PageView } from './PageView';
import { createEmptyPage } from '../types/document';
import type { SerializedEditorState } from 'lexical';

/**
 * DocumentView — Scrollable container rendering all pages vertically.
 *
 * Provides the Word-like visual with pages centered on a gray background
 * with gaps between pages. Handles overflow content from pages by
 * creating new pages or prepending to existing next pages.
 */
export const DocumentView: React.FC = () => {
  const { document, dispatch } = useDocument();

  const handlePageOverflow = useCallback(
    (pageIndex: number, overflowContent: SerializedEditorState) => {
      const nextPageIndex = pageIndex + 1;

      if (nextPageIndex < document.pages.length) {
        // Prepend overflow content to the next page's body
        const nextPage = document.pages[nextPageIndex];
        const existingChildren = nextPage.bodyState?.root?.children ?? [];
        const overflowChildren = overflowContent.root?.children ?? [];

        const mergedState: SerializedEditorState = {
          root: {
            ...overflowContent.root,
            children: [...overflowChildren, ...existingChildren],
          },
        } as SerializedEditorState;

        dispatch({
          type: 'UPDATE_PAGE_BODY',
          pageId: nextPage.id,
          bodyState: mergedState,
        });
      } else {
        // Create a new page with the overflow content
        const newPage = createEmptyPage();
        newPage.bodyState = overflowContent;
        dispatch({ type: 'ADD_PAGE', page: newPage });
      }
    },
    [document.pages, dispatch],
  );

  return (
    <div
      className="lex4-document-view flex flex-col items-center gap-8 py-8 min-h-full"
      data-testid="document-view"
    >
      {document.pages.map((page, index) => (
        <PageView
          key={page.id}
          pageId={page.id}
          pageIndex={index}
          onOverflow={(content) => handlePageOverflow(index, content)}
        />
      ))}
    </div>
  );
};
