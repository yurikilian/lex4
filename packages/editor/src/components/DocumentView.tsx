import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import type { SerializedEditorState } from 'lexical';

import { useDocument } from '../context/document-context';
import { computeBodyHeight } from '../constants/page-layout';
import { usePagination } from '../hooks/use-pagination';
import { PageView } from './PageView';
import { createPageFromTemplate } from '../types/document';
import { debug, shortId } from '../utils/debug';

/**
 * DocumentView — Scrollable container rendering all pages vertically.
 *
 * Provides the Word-like visual with pages centered on a gray background
 * with gaps between pages. Handles overflow content from pages by
 * creating new pages or prepending to existing next pages.
 */
export const DocumentView: React.FC = () => {
  const { document, dispatch, editorRegistry, requestFocusAtEnd, runHistoryAction } = useDocument();
  const { reflowAll } = usePagination(document, dispatch);
  const previousBodyHeightsRef = useRef<number[] | null>(null);
  const pasteOverflowSequenceRef = useRef(false);
  const pasteOverflowReleaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const defaultPageTemplate = useMemo(
    () => ({
      headerState: document.defaultHeaderState,
      footerState: document.defaultFooterState,
      headerHeight: document.defaultHeaderHeight,
      footerHeight: document.defaultFooterHeight,
    }),
    [
      document.defaultFooterHeight,
      document.defaultFooterState,
      document.defaultHeaderHeight,
      document.defaultHeaderState,
    ],
  );

  const bodyHeights = useMemo(
    () => document.pages.map(page => computeBodyHeight(
      document.headerFooterEnabled ? page.headerHeight : 0,
      document.headerFooterEnabled ? page.footerHeight : 0,
    )),
    [document.headerFooterEnabled, document.pages],
  );

  useEffect(() => {
    const previousBodyHeights = previousBodyHeightsRef.current;
    previousBodyHeightsRef.current = bodyHeights;

    if (!previousBodyHeights) {
      return;
    }

    const bodySpaceExpanded = bodyHeights.some((height, index) => {
      const previousHeight = previousBodyHeights[index];
      return previousHeight !== undefined && height > previousHeight;
    });

    if (bodySpaceExpanded) {
      debug('page', 'body space expanded — running full reflow');
      reflowAll();
    }
  }, [bodyHeights, reflowAll]);

  useEffect(
    () => () => {
      if (pasteOverflowReleaseTimerRef.current) {
        clearTimeout(pasteOverflowReleaseTimerRef.current);
      }
    },
    [],
  );

  const handlePageOverflow = useCallback(
    (
      pageIndex: number,
      overflowContent: SerializedEditorState,
      cause: 'paste' | 'content',
    ) => {
      const nextPageIndex = pageIndex + 1;
      const overflowChildCount = overflowContent.root?.children?.length ?? 0;
      debug('page', `handlePageOverflow: pageIndex=${pageIndex} overflowChildren=${overflowChildCount} totalPages=${document.pages.length}`);

      if (cause === 'paste') {
        pasteOverflowSequenceRef.current = true;
      }

      if (pasteOverflowSequenceRef.current) {
        if (pasteOverflowReleaseTimerRef.current) {
          clearTimeout(pasteOverflowReleaseTimerRef.current);
        }
        pasteOverflowReleaseTimerRef.current = setTimeout(() => {
          pasteOverflowSequenceRef.current = false;
          pasteOverflowReleaseTimerRef.current = null;
        }, 800);
      }

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
          if (pasteOverflowSequenceRef.current) {
            requestFocusAtEnd({ pageId: nextPage.id, region: 'body' });
          }
        } else {
          debug('page', `editor not found in registry for page ${shortId(nextPage.id)} — falling back to ADD_PAGE`);
          const newPage = createPageFromTemplate(defaultPageTemplate);
          newPage.bodyState = overflowContent;
          runHistoryAction(
            {
              label: 'Overflow created new page',
              source: 'overflow',
              region: 'document',
            },
            () => {
              dispatch({ type: 'ADD_PAGE', afterIndex: pageIndex, page: newPage });
            },
          );
          if (pasteOverflowSequenceRef.current) {
            requestFocusAtEnd({ pageId: newPage.id, region: 'body' });
          }
        }
      } else {
        // Create a new page with the overflow content as initial state
        const newPage = createPageFromTemplate(defaultPageTemplate);
        newPage.bodyState = overflowContent;
        debug('page', `creating new page ${shortId(newPage.id)} with ${overflowChildCount} overflow children`);
        runHistoryAction(
          {
            label: 'Overflow created new page',
            source: 'overflow',
            region: 'document',
          },
          () => {
            dispatch({ type: 'ADD_PAGE', page: newPage });
          },
        );
        if (pasteOverflowSequenceRef.current) {
          requestFocusAtEnd({ pageId: newPage.id, region: 'body' });
        }
      }
    },
    [defaultPageTemplate, document.pages, dispatch, editorRegistry, requestFocusAtEnd, runHistoryAction],
  );

  return (
    <div
      className="lex4-document-view flex flex-col items-center gap-8 py-8 min-h-full"
      data-testid="document-view"
      tabIndex={-1}
    >
      {document.pages.map((page, index) => (
        <PageView
          key={page.id}
          pageId={page.id}
          pageIndex={index}
          onOverflow={(content, cause) => handlePageOverflow(index, content, cause)}
        />
      ))}
    </div>
  );
};
