import { useCallback, useRef } from 'react';
import type { SerializedEditorState } from 'lexical';
import type { DocumentAction } from '../context/document-context';
import { computeBodyHeight } from '../constants/page-layout';
import {
  getTopLevelNodes,
  splitEditorState,
  splitBlockNode,
  mergeEditorStates,
  createEditorStateFromNodes,
} from '../utils/editor-state-utils';
import type { Lex4Document, PageState } from '../types/document';
import { createEmptyPage, createPageFromTemplate } from '../types/document';

/**
 * usePagination — Orchestrates content flow between pages.
 *
 * When a page body overflows, this hook:
 * 1. Measures which nodes fit within the body height
 * 2. Splits the editor state at the overflow point
 * 3. Moves overflow content to the next page (creating it if needed)
 * 4. Cascades forward through all subsequent pages
 *
 * When a page body underflows (content deleted), it:
 * 1. Checks if the next page has content that fits
 * 2. Pulls content back from the next page
 * 3. Removes empty trailing pages
 */
export function usePagination(
  document: Lex4Document,
  dispatch: React.Dispatch<DocumentAction>,
) {
  const reflowingRef = useRef(false);
  const pendingReflowRef = useRef(false);

  /**
   * Estimate how many top-level nodes fit within a given pixel height.
   *
   * Since we don't have DOM measurements at this point (the nodes may not
   * be rendered yet), we use a heuristic: assume each top-level paragraph
   * is approximately 24px (one line of text). This is imperfect but
   * provides a reasonable starting split point. The ResizeObserver in
   * PageBody will trigger another reflow if the estimate was wrong.
   */
  const estimateNodesFitting = useCallback(
    (
      state: SerializedEditorState | null,
      bodyHeight: number,
    ): number => {
      const nodes = getTopLevelNodes(state);
      if (nodes.length === 0) return 0;

      const estimatedLineHeight = 24;
      let usedHeight = 0;
      let fitCount = 0;

      for (const _node of nodes) {
        usedHeight += estimatedLineHeight;
        if (usedHeight > bodyHeight) break;
        fitCount++;
      }

      // At least one node must stay on the current page
      return Math.max(1, fitCount);
    },
    [],
  );

  /**
   * Handle overflow on a specific page.
   * Splits content and pushes overflow to the next page.
   */
  const handlePageOverflow = useCallback(
    (pageIndex: number) => {
      if (reflowingRef.current) {
        pendingReflowRef.current = true;
        return;
      }

      reflowingRef.current = true;

      try {
        const pages = document.pages;
        const page = pages[pageIndex];
        if (!page) return;

        const headerH = document.headerFooterEnabled ? page.headerHeight : 0;
        const footerH = document.headerFooterEnabled ? page.footerHeight : 0;
        const bodyHeight = computeBodyHeight(headerH, footerH);

        const nodes = getTopLevelNodes(page.bodyState);
        if (nodes.length <= 1) {
          // Single block overflow — attempt heuristic mid-block split on
          // the serialized node. The real DOM-based split in OverflowPlugin
          // will correct this on render if the estimate is off.
          if (nodes.length === 1) {
            const singleNode = nodes[0];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const children = (singleNode as any).children;
            if (children && children.length > 1) {
              const estimatedLineHeight = 24;
              const maxChildren = Math.max(1, Math.floor(bodyHeight / estimatedLineHeight));
              if (maxChildren < children.length) {
                const [keepBlock, overflowBlock] = splitBlockNode(singleNode, maxChildren);
                if (keepBlock && overflowBlock) {
                  const keepState = createEditorStateFromNodes([keepBlock]);
                  const overflowState = createEditorStateFromNodes([overflowBlock]);

                  const nextPage = pages[pageIndex + 1];
                  if (nextPage) {
                    const mergedBody = mergeEditorStates(overflowState, nextPage.bodyState);
                    dispatch({
                      type: 'SET_DOCUMENT',
                      document: {
                        ...document,
                        pages: pages.map((p, i) => {
                          if (i === pageIndex) return { ...p, bodyState: keepState };
                          if (i === pageIndex + 1) return { ...p, bodyState: mergedBody };
                          return p;
                        }),
                      },
                    });
                  } else {
                    const newPage: PageState = {
                      ...createPageFromTemplate({
                        headerState: document.defaultHeaderState,
                        footerState: document.defaultFooterState,
                        headerHeight: document.defaultHeaderHeight,
                        footerHeight: document.defaultFooterHeight,
                      }),
                      bodyState: overflowState,
                    };
                    dispatch({
                      type: 'SET_DOCUMENT',
                      document: {
                        ...document,
                        pages: [
                          ...pages.map((p, i) =>
                            i === pageIndex ? { ...p, bodyState: keepState } : p,
                          ),
                          newPage,
                        ],
                      },
                    });
                  }
                }
              }
            }
          }
          return;
        }

        const fitCount = estimateNodesFitting(page.bodyState, bodyHeight);
        if (fitCount >= nodes.length) return; // Everything fits

        const [keepState, overflowState] = splitEditorState(page.bodyState, fitCount);

        if (!overflowState) return; // Nothing to overflow

        // Get or create the next page
        const nextPage = pages[pageIndex + 1];
        if (nextPage) {
          // Merge overflow into the beginning of the next page
          const mergedBody = mergeEditorStates(overflowState, nextPage.bodyState);
          dispatch({
            type: 'SET_DOCUMENT',
            document: {
              ...document,
              pages: pages.map((p, i) => {
                if (i === pageIndex) return { ...p, bodyState: keepState };
                if (i === pageIndex + 1) return { ...p, bodyState: mergedBody };
                return p;
              }),
            },
          });
        } else {
          // Create a new page with overflow content
          const newPage: PageState = {
            ...createPageFromTemplate({
              headerState: document.defaultHeaderState,
              footerState: document.defaultFooterState,
              headerHeight: document.defaultHeaderHeight,
              footerHeight: document.defaultFooterHeight,
            }),
            bodyState: overflowState,
          };
          dispatch({
            type: 'SET_DOCUMENT',
            document: {
              ...document,
              pages: [
                ...pages.map((p, i) =>
                  i === pageIndex ? { ...p, bodyState: keepState } : p,
                ),
                newPage,
              ],
            },
          });
        }
      } finally {
        reflowingRef.current = false;

        if (pendingReflowRef.current) {
          pendingReflowRef.current = false;
          // Schedule another reflow on next tick
          setTimeout(() => handlePageOverflow(pageIndex), 0);
        }
      }
    },
    [document, dispatch, estimateNodesFitting],
  );

  /**
   * Handle underflow — try to pull content from the next page.
   */
  const handlePageUnderflow = useCallback(
    (pageIndex: number) => {
      if (reflowingRef.current) return;

      const pages = document.pages;
      const page = pages[pageIndex];
      const nextPage = pages[pageIndex + 1];

      if (!page || !nextPage) return;

      const nextNodes = getTopLevelNodes(nextPage.bodyState);
      if (nextNodes.length === 0) {
        // Next page is empty — remove it (unless it's the only page)
        if (pages.length > 1) {
          dispatch({
            type: 'SET_DOCUMENT',
            document: {
              ...document,
              pages: pages.filter((_, i) => i !== pageIndex + 1),
            },
          });
        }
        return;
      }

      // Try to pull the first node from the next page
      const headerH = document.headerFooterEnabled ? page.headerHeight : 0;
      const footerH = document.headerFooterEnabled ? page.footerHeight : 0;
      const bodyHeight = computeBodyHeight(headerH, footerH);

      const currentNodes = getTopLevelNodes(page.bodyState);
      const estimatedCurrentHeight = currentNodes.length * 24;
      const remainingSpace = bodyHeight - estimatedCurrentHeight;

      if (remainingSpace > 24) {
        // Pull the first node from next page
        const [pulled, remaining] = [nextNodes.slice(0, 1), nextNodes.slice(1)];

        const updatedCurrent = mergeEditorStates(
          page.bodyState,
          createEditorStateFromNodes(pulled),
        );
        const updatedNext =
          remaining.length > 0 ? createEditorStateFromNodes(remaining) : null;

        const newPages = pages.map((p, i) => {
          if (i === pageIndex) return { ...p, bodyState: updatedCurrent };
          if (i === pageIndex + 1) return { ...p, bodyState: updatedNext };
          return p;
        });

        // Remove empty trailing pages
        while (newPages.length > 1) {
          const last = newPages[newPages.length - 1];
          if (getTopLevelNodes(last.bodyState).length === 0) {
            newPages.pop();
          } else {
            break;
          }
        }

        dispatch({
          type: 'SET_DOCUMENT',
          document: { ...document, pages: newPages },
        });
      }
    },
    [document, dispatch],
  );

  /**
   * Full document reflow — recalculate all pages from scratch.
   * Used after toggle changes or major content operations.
   */
  const reflowAll = useCallback(() => {
    if (reflowingRef.current) return;
    reflowingRef.current = true;

    try {
      const pages = document.pages;

      // Collect all body content across all pages
      const allNodes = pages.flatMap(p => getTopLevelNodes(p.bodyState));
      if (allNodes.length === 0) {
        // Ensure at least one page
        if (pages.length !== 1) {
          dispatch({
            type: 'SET_DOCUMENT',
            document: {
              ...document,
              pages: [pages[0] ?? createEmptyPage()],
            },
          });
        }
        return;
      }

      // Distribute nodes across pages
      const newPages: PageState[] = [];
      let remainingNodes = [...allNodes];
      let pageIdx = 0;

      while (remainingNodes.length > 0) {
        const existingPage = pages[pageIdx];
        const headerH = document.headerFooterEnabled
          ? (existingPage?.headerHeight ?? 0)
          : 0;
        const footerH = document.headerFooterEnabled
          ? (existingPage?.footerHeight ?? 0)
          : 0;
        const bodyHeight = computeBodyHeight(headerH, footerH);
        const estimatedLineHeight = 24;
        const maxNodes = Math.max(1, Math.floor(bodyHeight / estimatedLineHeight));

        const pageNodes = remainingNodes.slice(0, maxNodes);
        remainingNodes = remainingNodes.slice(maxNodes);

        const basePage = existingPage ?? createPageFromTemplate({
          headerState: document.defaultHeaderState,
          footerState: document.defaultFooterState,
          headerHeight: document.defaultHeaderHeight,
          footerHeight: document.defaultFooterHeight,
        });
        newPages.push({
          ...basePage,
          bodyState: createEditorStateFromNodes(pageNodes),
        });

        pageIdx++;
      }

      dispatch({
        type: 'SET_DOCUMENT',
        document: { ...document, pages: newPages },
      });
    } finally {
      reflowingRef.current = false;
    }
  }, [document, dispatch]);

  return {
    handlePageOverflow,
    handlePageUnderflow,
    reflowAll,
  };
}
