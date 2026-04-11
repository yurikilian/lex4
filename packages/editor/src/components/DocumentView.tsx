import React, { useCallback } from 'react';
import { useDocument } from '../context/document-context';
import { PageView } from './PageView';
import { createEmptyPage } from '../types/document';
import type { SerializedEditorState } from 'lexical';
import { debug, shortId } from '../utils/debug';

/**
 * DocumentView — Scrollable container rendering all pages vertically.
 *
 * Provides the Word-like visual with pages centered on a gray background
 * with gaps between pages. Handles overflow content from pages by
 * creating new pages or prepending to existing next pages.
 */
export const DocumentView: React.FC = () => {
  const { document, dispatch, editorRegistry } = useDocument();

  const handlePageOverflow = useCallback(
    (pageIndex: number, overflowContent: SerializedEditorState) => {
      const nextPageIndex = pageIndex + 1;
      const overflowChildCount = overflowContent.root?.children?.length ?? 0;

      debug('page', `handlePageOverflow: pageIndex=${pageIndex} overflowChildren=${overflowChildCount} totalPages=${document.pages.length}`);

      if (nextPageIndex < document.pages.length) {
        // Prepend overflow content to the next page's editor directly
        const nextPage = document.pages[nextPageIndex];
        const nextEditor = editorRegistry.get(nextPage.id);

        if (nextEditor) {
          const currentState = nextEditor.getEditorState().toJSON();
          const existingChildren = currentState.root?.children ?? [];
          const overflowChildren = overflowContent.root?.children ?? [];

          debug('page', `prepending ${overflowChildren.length} nodes to existing page ${shortId(nextPage.id)} (had ${existingChildren.length} children)`);

          const mergedState: SerializedEditorState = {
            root: {
              ...currentState.root,
              children: [...overflowChildren, ...existingChildren],
            },
          } as SerializedEditorState;

          const newEditorState = nextEditor.parseEditorState(JSON.stringify(mergedState));
          nextEditor.setEditorState(newEditorState);
        } else {
          debug('page', `editor not found in registry for page ${shortId(nextPage.id)} — falling back to ADD_PAGE`);
          const newPage = createEmptyPage();
          newPage.bodyState = overflowContent;
          dispatch({ type: 'ADD_PAGE', afterIndex: pageIndex, page: newPage });
        }
      } else {
        // Create a new page with the overflow content as initial state
        const newPage = createEmptyPage();
        newPage.bodyState = overflowContent;
        debug('page', `creating new page ${shortId(newPage.id)} with ${overflowChildCount} overflow children`);
        dispatch({ type: 'ADD_PAGE', page: newPage });
      }
    },
    [document.pages, dispatch, editorRegistry],
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
