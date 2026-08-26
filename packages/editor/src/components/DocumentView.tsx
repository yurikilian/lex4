import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { $getRoot } from 'lexical';
import type { SerializedEditorState, LexicalEditor } from 'lexical';

import { useDocument } from '../context/document-context';
import { useTranslations, interpolate } from '../i18n';
import { computeBodyHeight } from '../constants/page-layout';
import { usePagination } from '../hooks/use-pagination';
import { PageView } from './PageView';
import { createPageFromTemplate } from '../types/document';
import { debug, shortId } from '../utils/debug';
import { mergeEditorStates } from '../utils/editor-state-utils';

/**
 * DocumentView — Scrollable container rendering all pages vertically.
 *
 * Provides the page-layout visual with pages centered on a gray background
 * with gaps between pages. Handles overflow content from pages by
 * creating new pages or prepending to existing next pages.
 */
export const DocumentView: React.FC = () => {
  const {
    document,
    dispatch,
    editorRegistry,
    requestFocusAtEnd,
    runHistoryAction,
    setActiveEditor,
    setActivePageId,
  } = useDocument();
  const t = useTranslations();
  const { reflowAll } = usePagination(document, dispatch);
  const previousBodyHeightsRef = useRef<number[] | null>(null);
  const documentRef = useRef(document);
  const pendingPageBodyStatesRef = useRef(new Map<string, SerializedEditorState | null>());
  const underflowInFlightRef = useRef(new Set<string>());
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
  documentRef.current = document;

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

  const focusBodyEditor = useCallback(
    (pageId: string, boundary: 'start' | 'end') => {
      let attempts = 0;

      const focusWhenReady = () => {
        const editor = editorRegistry.get(pageId);
        if (!editor) {
          if (attempts < 4) {
            attempts += 1;
            requestAnimationFrame(focusWhenReady);
          }
          return;
        }

        const caretPosition = { pageId, region: 'body' as const };
        setActivePageId(pageId);
        setActiveEditor(editor as LexicalEditor, caretPosition);
        editor.focus(() => {
          editor.update(() => {
            if (boundary === 'start') {
              $getRoot().selectStart();
            } else {
              $getRoot().selectEnd();
            }
          });
        });
      };

      requestAnimationFrame(focusWhenReady);
    },
    [editorRegistry, setActiveEditor, setActivePageId],
  );

  const handlePageOverflow = useCallback(
    (
      sourcePageId: string,
      overflowContent: SerializedEditorState,
      cause: 'paste' | 'content',
    ) => {
      const currentDocument = documentRef.current;
      const pageIndex = currentDocument.pages.findIndex(page => page.id === sourcePageId);
      if (pageIndex < 0) {
        debug('page', `ignoring overflow from removed page ${shortId(sourcePageId)}`);
        return;
      }

      const nextPageIndex = pageIndex + 1;
      const overflowChildCount = overflowContent.root?.children?.length ?? 0;
      debug('page', `handlePageOverflow: pageId=${shortId(sourcePageId)} pageIndex=${pageIndex} overflowChildren=${overflowChildCount} totalPages=${currentDocument.pages.length}`);

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

      if (nextPageIndex < currentDocument.pages.length) {
        // Prepend overflow content to the next page's editor directly
        const nextPage = currentDocument.pages[nextPageIndex];
        const nextEditor = editorRegistry.get(nextPage.id);

        if (nextEditor) {
          pendingPageBodyStatesRef.current.delete(nextPage.id);
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
          const currentState = pendingPageBodyStatesRef.current.get(nextPage.id) ?? nextPage.bodyState;
          const mergedState = mergeEditorStates(overflowContent, currentState);
          pendingPageBodyStatesRef.current.set(nextPage.id, mergedState);
          debug('page', `editor not found in registry for page ${shortId(nextPage.id)} — merging into current document state`);
          runHistoryAction(
            {
              label: 'Overflow moved content to next page',
              source: 'overflow',
              region: 'document',
            },
            () => {
              dispatch({ type: 'UPDATE_PAGE_BODY', pageId: nextPage.id, bodyState: mergedState });
            },
          );
          if (pasteOverflowSequenceRef.current) {
            requestFocusAtEnd({ pageId: nextPage.id, region: 'body' });
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
    [defaultPageTemplate, dispatch, editorRegistry, requestFocusAtEnd, runHistoryAction],
  );

  /**
   * Rejoin the next page before measuring it again. The overflow plugin on
   * the current page then performs the exact DOM split, so a deleted line can
   * pull the continuation of a paragraph back by as many lines as fit.
   */
  const handlePageContentUnderflow = useCallback(
    (pageId: string) => {
      if (underflowInFlightRef.current.has(pageId)) {
        return;
      }

      const currentDocument = documentRef.current;
      const pageIndex = currentDocument.pages.findIndex(page => page.id === pageId);
      const page = currentDocument.pages[pageIndex];
      const nextPage = currentDocument.pages[pageIndex + 1];
      if (!page || !nextPage) {
        return;
      }

      const currentEditor = editorRegistry.get(page.id);
      const nextEditor = editorRegistry.get(nextPage.id);
      const currentState = currentEditor?.getEditorState().toJSON()
        ?? pendingPageBodyStatesRef.current.get(page.id)
        ?? page.bodyState;
      const nextState = nextEditor?.getEditorState().toJSON()
        ?? pendingPageBodyStatesRef.current.get(nextPage.id)
        ?? nextPage.bodyState;
      const nextChildren = nextState?.root?.children ?? [];
      if (nextChildren.length === 0) {
        if (pageIndex + 1 === currentDocument.pages.length - 1) {
          dispatch({ type: 'REMOVE_PAGE', pageId: nextPage.id });
        }
        return;
      }

      const mergedBody = mergeEditorStates(currentState, nextState);
      if (!mergedBody) {
        return;
      }

      underflowInFlightRef.current.add(pageId);
      debug('page', `underflow merge page=${shortId(page.id)} next=${shortId(nextPage.id)} children=${nextChildren.length}`);
      pendingPageBodyStatesRef.current.delete(page.id);
      pendingPageBodyStatesRef.current.delete(nextPage.id);
      dispatch({
        type: 'SET_DOCUMENT',
        document: {
          ...currentDocument,
          pages: currentDocument.pages.map(candidate => {
            if (candidate.id === page.id) {
              return { ...candidate, bodyState: mergedBody };
            }
            if (candidate.id === nextPage.id) {
              return { ...candidate, bodyState: null };
            }
            return candidate;
          }),
        },
      });

      requestAnimationFrame(() => {
        underflowInFlightRef.current.delete(pageId);
      });
    },
    [dispatch, editorRegistry],
  );

  const handleBackspaceAtPageStart = useCallback(
    (pageIndex: number, pageId: string) => {
      if (pageIndex <= 0) {
        return;
      }

      const previousPage = document.pages[pageIndex - 1];
      if (!previousPage) {
        return;
      }

      runHistoryAction(
        {
          label: `${t.historyLabels.deletedBackward} - ${interpolate(t.regions.page, { page: pageIndex + 1 })}`,
          source: 'body',
          pageId,
          region: 'body',
        },
        () => {
          handlePageContentUnderflow(previousPage.id);
        },
      );

      focusBodyEditor(previousPage.id, 'end');
    },
    [document.pages, focusBodyEditor, handlePageContentUnderflow, runHistoryAction],
  );

  const handleDeleteAtPageEnd = useCallback(
    (pageIndex: number, pageId: string) => {
      const currentPage = document.pages[pageIndex];
      const nextPage = document.pages[pageIndex + 1];
      if (!currentPage || !nextPage) {
        return;
      }

      runHistoryAction(
        {
          label: `${t.historyLabels.deletedForward} - ${interpolate(t.regions.page, { page: pageIndex + 1 })}`,
          source: 'body',
          pageId,
          region: 'body',
        },
        () => {
          handlePageContentUnderflow(currentPage.id);
        },
      );

      focusBodyEditor(currentPage.id, 'end');
    },
    [document.pages, focusBodyEditor, handlePageContentUnderflow, runHistoryAction],
  );

  const handleMoveToPreviousPage = useCallback(
    (pageIndex: number) => {
      if (pageIndex <= 0) {
        return;
      }

      const previousPage = document.pages[pageIndex - 1];
      if (!previousPage) {
        return;
      }

      focusBodyEditor(previousPage.id, 'end');
    },
    [document.pages, focusBodyEditor],
  );

  const handleMoveToNextPage = useCallback(
    (pageIndex: number) => {
      const nextPage = document.pages[pageIndex + 1];
      if (!nextPage) {
        return;
      }

      focusBodyEditor(nextPage.id, 'start');
    },
    [document.pages, focusBodyEditor],
  );

  return (
    <div
      className="lex4-document-view"
      data-testid="document-view"
      tabIndex={-1}
    >
      {document.pages.map((page, index) => (
        <PageView
          key={page.id}
          pageId={page.id}
          pageIndex={index}
          onOverflow={(content, cause) => handlePageOverflow(page.id, content, cause)}
          onUnderflow={() => handlePageContentUnderflow(page.id)}
          onBackspaceAtStart={handleBackspaceAtPageStart}
          onDeleteAtEnd={handleDeleteAtPageEnd}
          onMoveToPreviousPage={handleMoveToPreviousPage}
          onMoveToNextPage={handleMoveToNextPage}
        />
      ))}
    </div>
  );
};
